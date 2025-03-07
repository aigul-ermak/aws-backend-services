import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class ImportServiceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);


        const bucket = s3.Bucket.fromBucketName(
            this,
            'ImportedS3Bucket',
            'nodejs-aws-shop-react-assets-task5'
        );


        const importProductsFileLambda = new NodejsFunction(
            this,
            'ImportProductsFileLambda',
            {
                runtime: lambda.Runtime.NODEJS_18_X,
                entry: 'import-service/lambda/importProductsFile.ts',
                handler: 'handler',
                bundling: {
                    minify: true,
                    sourceMap: false,
                },
                environment: {
                    UPLOADED_BUCKET_NAME: bucket.bucketName,
                },
            }
        );
        bucket.grantPut(importProductsFileLambda); // Grant S3 PutObject permission


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
                },
            }
        );
        new cdk.CfnOutput(this, 'ImportAPIEndpoint', {
            value: api.url,
            description: 'API Gateway endpoint for import service',
        });


        const importFileParserLambda = new NodejsFunction(
            this,
            'ImportFileParserLambda',
            {
                runtime: lambda.Runtime.NODEJS_18_X,
                entry: 'import-service/lambda/importFileParser.ts',
                handler: 'handler',
                bundling: {
                    minify: true,
                    sourceMap: false,
                },
            }
        );
        bucket.grantRead(importFileParserLambda);


        bucket.addEventNotification(
            s3.EventType.OBJECT_CREATED,
            new s3n.LambdaDestination(importFileParserLambda),
            { prefix: 'uploaded/' }
        );
    }
}