import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';


export class MyBackendApiStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const productsTable = dynamodb.Table.fromTableName(this, 'AWSProductsTable', 'AWS_products');
        const stocksTable = dynamodb.Table.fromTableName(this, 'AWSStocksTable', 'AWS_stocks');

        const catalogItemsQueue = new sqs.Queue(this, 'CatalogItemsQueue', {
            queueName: 'catalogItemsQueue',
            visibilityTimeout: cdk.Duration.seconds(30),
        });

        const createProductTopic = new sns.Topic(this, 'CreateProductTopic', {
            topicName: 'createProductTopic',
        });

        createProductTopic.addSubscription(
            new snsSubscriptions.EmailSubscription('your-email@example.com')
        );

        const catalogBatchProcessLambda = new NodejsFunction(this, 'CatalogBatchProcessLambda', {
            runtime: lambda.Runtime.NODEJS_18_X,
            entry: 'product-service/lambda/catalogBatchProcess.ts',
            handler: 'handler',
            environment: {
                PRODUCTS_TABLE_NAME: productsTable.tableName,
                STOCKS_TABLE_NAME: stocksTable.tableName,
                SNS_TOPIC_ARN: createProductTopic.topicArn,
            },
        });

        productsTable.grantReadWriteData(catalogBatchProcessLambda);
        stocksTable.grantReadWriteData(catalogBatchProcessLambda);
        createProductTopic.grantPublish(catalogBatchProcessLambda);

        catalogBatchProcessLambda.addEventSource(
            new lambdaEventSources.SqsEventSource(catalogItemsQueue, {
                batchSize: 5, // Process 5 messages at a time
            })
        );

        new cdk.CfnOutput(this, 'CatalogItemsQueueUrl', {
            value: catalogItemsQueue.queueUrl,
        });

        new cdk.CfnOutput(this, 'CreateProductTopicArn', {
            value: createProductTopic.topicArn,
        });

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

        // Lambda Function to Get Product by ID
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


        // API Gateway with CORS Enabled
        // const api = new apigateway.RestApi(this, 'ProductServiceApi', {
        //     restApiName: 'Product Service',
        //     defaultCorsPreflightOptions: {
        //         allowOrigins: apigateway.Cors.ALL_ORIGINS, // Allow all origins
        //         allowMethods: apigateway.Cors.ALL_METHODS, // Allow all HTTP methods
        //         allowHeaders: ['Content-Type'], // Allow specific headers
        //     },
        // });

        // /products endpoint (GET -> getProductsListLambda)
        const products = api.root.addResource('products');
        products.addMethod('GET', new apigateway.LambdaIntegration(getProductsListLambda));
        products.addMethod('POST', new apigateway.LambdaIntegration(createProductLambda));


        // /products/{productId} endpoint (GET -> getProductsByIdLambda)
        const productById = products.addResource('{productId}');
        productById.addMethod('GET', new apigateway.LambdaIntegration(getProductsByIdLambda));
    }
}
