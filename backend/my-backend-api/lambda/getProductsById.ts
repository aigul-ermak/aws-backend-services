import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDB, PRODUCTS_TABLE } from "./utils/dynamodbClient";

interface Product {
    id: string;
    title: string;
    description?: string;
    price: number;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS"
            },
            body: ""
        };
    }

    const productId: string | undefined = event.pathParameters?.productId;

    if (!productId) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS"
            },
            body: JSON.stringify({ message: "Missing productId" }),
        };
    }

    try {
        console.log(`Fetching product with ID: ${productId}`);

        const getCommand = new GetCommand({
            TableName: PRODUCTS_TABLE,
            Key: { id: productId },
        });

        const { Item } = await dynamoDB.send(getCommand);

        if (!Item) {
            return {
                statusCode: 404,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS"
                },
                body: JSON.stringify({ message: "Product not found" }),
            };
        }

        const product: Product = Item as Product;

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS"
            },
            body: JSON.stringify(product),
        };
    } catch (error) {
        console.error("Error fetching product:", error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
            },
            body: JSON.stringify({ message: "Internal Server Error" }),
        };
    }
};
