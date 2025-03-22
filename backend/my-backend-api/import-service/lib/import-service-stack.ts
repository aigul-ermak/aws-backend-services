import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';

interface ImportServiceStackProps extends cdk.StackProps {
    catalogItemsQueue: sqs.Queue;
}

export class ImportServiceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: ImportServiceStackProps) {
        super(scope, id, props);


        const bucket = s3.Bucket.fromBucketName(
            this,
            'ImportedS3Bucket',
            'nodejs-aws-shop-react-assets-task5'
        );


        const importFileParserLambda = new NodejsFunction(
            this,
            'ImportFileParserLambda',
            {
                runtime: lambda.Runtime.NODEJS_18_X,
                entry: 'import-service/lambda/importFileParser.ts',
                handler: 'handler',
                environment: {
                    SQS_QUEUE_URL: props.catalogItemsQueue.queueUrl,
                    BUCKET_NAME: bucket.bucketName,
                },
            }
        );

        importFileParserLambda.addToRolePolicy(
            new iam.PolicyStatement({
                actions: ['s3:GetObject'],
                resources: [`arn:aws:s3:::nodejs-aws-shop-react-assets-task5/uploaded/*`],
            })
        );

        importFileParserLambda.addToRolePolicy(
            new iam.PolicyStatement({
                actions: [
                    "sqs:SendMessage",
                    "sqs:GetQueueAttributes",
                    "sqs:ChangeMessageVisibility",
                ],
                resources: [props.catalogItemsQueue.queueArn],
            })
        );


        bucket.grantRead(importFileParserLambda);
        props.catalogItemsQueue.grantSendMessages(importFileParserLambda);


        bucket.addEventNotification(
            s3.EventType.OBJECT_CREATED,
            new s3n.LambdaDestination(importFileParserLambda),
            { prefix: 'uploaded/' }
        );

        const importProductsFileLambda = new NodejsFunction(
            this,
            'ImportProductsFileLambda',
            {
                runtime: lambda.Runtime.NODEJS_18_X,
                entry: 'import-service/lambda/importProductsFile.ts',
                handler: 'handler',
                environment: {
                    UPLOADED_BUCKET_NAME: bucket.bucketName,
                },
            }
        );

        bucket.grantPut(importProductsFileLambda);

        const api = new apigateway.RestApi(this, 'ImportApi', {
            restApiName: 'Import Service API',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
            },
        });

        const importResource = api.root.addResource('import');
        importResource.addMethod(
            'GET',
            new apigateway.LambdaIntegration(importProductsFileLambda),
            {
                requestParameters: {
                    'method.request.querystring.name': true,
                    'method.request.querystring.contentType': false,
                },
            }
        );

        new cdk.CfnOutput(this, 'ImportAPIEndpoint', {
            value: api.url,
            description: 'API Gateway endpoint for import service',
        });

    }
}