import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class MyBackendApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda Function to List Products
    const getProductsListLambda = new lambda.Function(this, 'GetProductsListLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'getProductsList.handler',
    });

    // Lambda Function to Get Product by ID
    const getProductsByIdLambda = new lambda.Function(this, 'GetProductsByIdLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'getProductsById.handler',
    });

    // API Gateway with CORS Enabled
    const api = new apigateway.RestApi(this, 'ProductServiceApi', {
      restApiName: 'Product Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // Allow all origins
        allowMethods: apigateway.Cors.ALL_METHODS, // Allow all HTTP methods
        allowHeaders: ['Content-Type'], // Allow specific headers
      },
    });

    // /products endpoint (GET -> getProductsListLambda)
    const products = api.root.addResource('products');
    products.addMethod('GET', new apigateway.LambdaIntegration(getProductsListLambda));

    // /products/{productId} endpoint (GET -> getProductsByIdLambda)
    const productById = products.addResource('{productId}');
    productById.addMethod('GET', new apigateway.LambdaIntegration(getProductsByIdLambda));
  }
}
