import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as iam from 'aws-cdk-lib/aws-iam';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export class AuthorizationServiceStack extends cdk.Stack {
    public readonly basicAuthorizerLambda: lambda.Function;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.basicAuthorizerLambda = new lambda.Function(this, 'BasicAuthorizerLambda', {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'basicAuthorizer.basicAuthorizer',
            code: lambda.Code.fromAsset(path.join(__dirname, '../src/handlers')),
            environment: {
                AUTH_CREDENTIALS: process.env.AUTH_CREDENTIALS!,
            },
        });

        this.basicAuthorizerLambda.addToRolePolicy(new iam.PolicyStatement({
            actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents'
            ],
            resources: ['*'],
        }));

        new cdk.CfnOutput(this, 'BasicAuthorizerLambdaArn', {
            value: this.basicAuthorizerLambda.functionArn,
        });
    }
}
