import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import {dynamoDB, PRODUCTS_TABLE, STOCKS_TABLE} from "./utils/dynamodbClient";
import {Product} from "./utils/interfaces/product.interface";
import {Stock} from "./utils/interfaces/stock.interface";



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

        const stockCommand = new GetCommand({
            TableName: STOCKS_TABLE,
            Key: { product_id: productId },
        });

        const { Item: stockItem } = await dynamoDB.send(stockCommand);
        const stock: Stock = stockItem as Stock;

        const mergedProduct = {
            ...product,
            count: stock ? stock.count : 0,
        };

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS"
            },
            body: JSON.stringify(mergedProduct),
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
