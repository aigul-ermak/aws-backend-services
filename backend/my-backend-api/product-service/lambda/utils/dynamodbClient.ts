import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";


const client = new DynamoDBClient({
    region: "us-east-1",
});

// Export a reusable DynamoDB client
export const dynamoDB = DynamoDBDocumentClient.from(client);

// Export table names directly
export const PRODUCTS_TABLE = "AWS_products";
export const STOCKS_TABLE = "AWS_stocks";
