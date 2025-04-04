import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {PutCommand, TransactWriteCommand} from "@aws-sdk/lib-dynamodb";
import { dynamoDB, PRODUCTS_TABLE, STOCKS_TABLE } from "./utils/dynamodbClient";
import {Product} from "./utils/interfaces/product.interface";
import {Stock} from "./utils/interfaces/stock.interface";
import { v4 as uuidv4 } from "uuid";




export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    console.log("CREATE PRODUCT LAMBDA: Incoming request with event:", JSON.stringify(event, null, 2));

    // Handle CORS for OPTIONS request
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
            },
            body: "",
        };
    }

    try {
        // Parse the request body
        const body = JSON.parse(event.body || "{}");


        // Validate required fields
        if (!body.title || !body.price) {
            return {
                statusCode: 400,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                },
                body: JSON.stringify({ message: "Missing required fields: id, title, or price" }),
            };
        }

        const productId = uuidv4();

        console.log(`Generated product ID: ${productId}`);
        // Create the product object
        const product: Product = {
            id: productId,
            title: body.title,
            description: body.description || "",
            price: body.price,
        };

        // Insert the product into the Products table
        await dynamoDB.send(
            new PutCommand({
                TableName: PRODUCTS_TABLE,
                Item: product,
            })
        );

        // Create the stock object (default count to 0)
        const stock: Stock = {
            product_id: productId,
            count: Number(body.count) || 0,
        };

        console.log("Saving product:", JSON.stringify(product, null, 2));
        console.log("Saving stock:", JSON.stringify(stock, null, 2));

        await dynamoDB.send(
            new TransactWriteCommand({
                TransactItems: [
                    {
                        Put: {
                            TableName: PRODUCTS_TABLE,
                            Item: product,
                        },
                    },
                    {
                        Put: {
                            TableName: STOCKS_TABLE,
                            Item: stock,
                        },
                    },
                ],
            })
        );


        // Return success response
        return {
            statusCode: 201,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
            },
            body: JSON.stringify({ message: "Product created successfully", product }),
        };
    } catch (error) {
        console.error("Error creating product:", error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
            },
            body: JSON.stringify({ message: "Internal Server Error" }),
        };
    }
};