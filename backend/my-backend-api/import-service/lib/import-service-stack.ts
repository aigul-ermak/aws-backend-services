import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';

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
                },
            }
        );

        bucket.grantRead(importFileParserLambda);
        bucket.addEventNotification(
            s3.EventType.OBJECT_CREATED,
            new s3n.LambdaDestination(importFileParserLambda),
            { prefix: 'uploaded/' }
        );


        props.catalogItemsQueue.grantSendMessages(importFileParserLambda);

    }
}