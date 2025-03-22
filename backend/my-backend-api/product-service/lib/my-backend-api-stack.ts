import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as iam from 'aws-cdk-lib/aws-iam';

export class MyBackendApiStack extends cdk.Stack {
    public readonly catalogItemsQueue: sqs.Queue;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const productsTable = dynamodb.Table.fromTableName(this, 'AWSProductsTable', 'AWS_products');
        const stocksTable = dynamodb.Table.fromTableName(this, 'AWSStocksTable', 'AWS_stocks');

        const catalogItemsDLQ = new sqs.Queue(this, 'CatalogItemsDLQ', {
            queueName: 'catalogItemsDLQ',
            retentionPeriod: cdk.Duration.days(14),
        });


        this.catalogItemsQueue = new sqs.Queue(this, 'CatalogItemsQueue', {
            queueName: 'catalogItemsQueue',
            visibilityTimeout: cdk.Duration.seconds(30),
            deadLetterQueue: {
                queue: catalogItemsDLQ,
                maxReceiveCount: 5,
            },
        });

        new cdk.CfnOutput(this, 'CatalogItemsQueueUrl', {
            value: this.catalogItemsQueue.queueUrl,
        });


        const createProductTopic = new sns.Topic(this, 'CreateProductTopic', {
            topicName: 'createProductTopic',
        });


        createProductTopic.addSubscription(
            new snsSubscriptions.EmailSubscription('backend.aigul@gmail.com')
        );

        new cdk.CfnOutput(this, 'CreateProductTopicArn', {
            value: createProductTopic.topicArn,
        });


        const catalogBatchProcessLambda = new NodejsFunction(this, 'CatalogBatchProcessLambda', {
            runtime: lambda.Runtime.NODEJS_18_X,
            entry: 'product-service/lambda/catalogBatchProcess.ts',
            handler: 'handler',
            timeout: cdk.Duration.seconds(10),
            environment: {
                PRODUCTS_TABLE_NAME: productsTable.tableName,
                STOCKS_TABLE_NAME: stocksTable.tableName,
                SNS_TOPIC_ARN: createProductTopic.topicArn,
            },
        });


        productsTable.grantReadWriteData(catalogBatchProcessLambda);
        stocksTable.grantReadWriteData(catalogBatchProcessLambda);
        createProductTopic.grantPublish(catalogBatchProcessLambda);

        catalogBatchProcessLambda.addToRolePolicy(
            new iam.PolicyStatement({
                actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:GetQueueAttributes',  'sqs:ChangeMessageVisibility'],
                resources: [this.catalogItemsQueue.queueArn],
            })
        );

        catalogBatchProcessLambda.addToRolePolicy(
            new iam.PolicyStatement({
                actions: ['sns:Publish'],
                resources: [createProductTopic.topicArn],
            })
        );


        catalogBatchProcessLambda.addEventSource(
            new lambdaEventSources.SqsEventSource(this.catalogItemsQueue, {
                batchSize: 5,
                reportBatchItemFailures: true,
            })
        );

        createProductTopic.grantPublish(catalogBatchProcessLambda);


        const api = new apigateway.RestApi(this, 'ProductServiceApi', {
            restApiName: 'Product Service',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowHeaders: ['Content-Type'],
            },
        });

        const getProductsListLambda = new lambda.Function(this, 'GetProductsListLambda', {
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('product-service/lambda'),
            handler: 'getProductsList.handler',
            environment: {
                PRODUCTS_TABLE_NAME: productsTable.tableName,
                STOCKS_TABLE_NAME: stocksTable.tableName,
            },
        });

        const getProductsByIdLambda = new lambda.Function(this, 'GetProductsByIdLambda', {
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('product-service/lambda'),
            handler: 'getProductsById.handler',
            environment: {
                PRODUCTS_TABLE_NAME: productsTable.tableName,
                STOCKS_TABLE_NAME: stocksTable.tableName,
            },
        });

        const createProductLambda = new NodejsFunction(this, 'CreateProductLambda', {
            runtime: lambda.Runtime.NODEJS_18_X,
            entry: 'product-service/lambda/createProduct.ts',
            handler: 'handler',
            environment: {
                PRODUCTS_TABLE_NAME: productsTable.tableName,
                STOCKS_TABLE_NAME: stocksTable.tableName,
            },
        });

        productsTable.grantReadWriteData(createProductLambda);
        stocksTable.grantReadWriteData(createProductLambda);
        productsTable.grantReadData(getProductsListLambda);
        stocksTable.grantReadData(getProductsListLambda);
        productsTable.grantReadData(getProductsByIdLambda);

        const products = api.root.addResource('products');
        products.addMethod('GET', new apigateway.LambdaIntegration(getProductsListLambda));
        products.addMethod('POST', new apigateway.LambdaIntegration(createProductLambda));

        const productById = products.addResource('{productId}');
        productById.addMethod('GET', new apigateway.LambdaIntegration(getProductsByIdLambda));
    }
}
