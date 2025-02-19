import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ProductServiceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const getProductsListLambda = new lambda.Function(this, 'GetProductsListLambda', {
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'getProductsList.handler',
        });

        const getProductsByIdLambda = new lambda.Function(this, 'GetProductsByIdLambda', {
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'getProductsById.handler',
        });

        // API Gateway
        const api = new apigateway.RestApi(this, 'ProductServiceApi', {
            restApiName: 'Product Service',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS, // Allow all origins
                allowMethods: apigateway.Cors.ALL_METHODS, // Allow all HTTP methods
                allowHeaders: ['Content-Type'], // Allow specific headers
            },
        });

        // Add resources and methods
        const products = api.root.addResource('products');
        products.addMethod('GET', new apigateway.LambdaIntegration(getProductsListLambda));

        const productById = products.addResource('{productId}');
        productById.addMethod('GET', new apigateway.LambdaIntegration(getProductsByIdLambda));
    }
}
