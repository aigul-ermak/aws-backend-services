import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import * as dotenv from 'dotenv';

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
                [process.env.GITHUB_ACCOUNT_LOGIN!]: process.env.TEST_PASSWORD!,
            },
        });

        new cdk.CfnOutput(this, 'BasicAuthorizerLambdaArn', {
            value: this.basicAuthorizerLambda.functionArn,
        });
    }
}
