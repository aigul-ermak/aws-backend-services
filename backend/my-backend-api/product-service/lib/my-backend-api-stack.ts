import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';


export class MyBackendApiStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const productsTable = dynamodb.Table.fromTableName(this, 'AWSProductsTable', 'AWS_products');
        const stocksTable = dynamodb.Table.fromTableName(this, 'AWSStocksTable', 'AWS_stocks');

        // Lambda Function to List Products
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
            entry: 'product-service/lambda/createProduct.ts', // Path to your Lambda function code
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
        products.addMethod('POST', new apigateway.LambdaIntegration(createProductLambda));


        // /products/{productId} endpoint (GET -> getProductsByIdLambda)
        const productById = products.addResource('{productId}');
        productById.addMethod('GET', new apigateway.LambdaIntegration(getProductsByIdLambda));
    }
}
