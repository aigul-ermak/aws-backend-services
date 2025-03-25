import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dotenv from 'dotenv';
dotenv.config();

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

        const corsOptions = {
            allowOrigins: [
                'https://d1lsm5asjne446.cloudfront.net',
                'http://localhost:3000'
            ],
            allowMethods: apigateway.Cors.ALL_METHODS,
            allowHeaders: [
                'Content-Type',
                'Authorization',
                'X-Amz-Date',
                'X-Api-Key',
                'X-Amz-Security-Token'
            ],
            allowCredentials: true
        };

        const api = new apigateway.RestApi(this, 'ImportApi', {
            restApiName: 'Import Service API',
            deployOptions: {
                stageName: 'prod',
            },
            defaultCorsPreflightOptions: corsOptions,
            defaultMethodOptions: {
                methodResponses: [
                    { statusCode: '200' },
                    { statusCode: '400' },
                    { statusCode: '500' }
                ]
            }
        });

        // auth
        const authorizerLambdaArn = process.env.BASIC_AUTHORIZER_LAMBDA_ARN!;

        const authorizerLambda = lambda.Function.fromFunctionArn(
            this,
            'ImportedBasicAuthorizerLambda',
            'arn:aws:lambda:us-east-1:111111111111:function:AuthorizationServiceStack-BasicAuthorizerLambdaXYZ'
        );

        const authorizer = new apigateway.TokenAuthorizer(this, 'ImportApiLambdaAuthorizer', {
            handler: authorizerLambda,
            identitySource: apigateway.IdentitySource.header('Authorization'),
        });

        const importResource = api.root.addResource('import');
        importResource.addMethod(
            'GET',
            new apigateway.LambdaIntegration(importProductsFileLambda),
            {
                requestParameters: {
                    'method.request.querystring.name': true,
                },
                authorizer,
                authorizationType: apigateway.AuthorizationType.CUSTOM,
            }
        );



        new cdk.CfnOutput(this, 'ImportAPIEndpoint', {
            value: api.url,
            description: 'API Gateway endpoint for import service',
        });

    }
}