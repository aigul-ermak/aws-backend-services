import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDB, PRODUCTS_TABLE, STOCKS_TABLE } from "./utils/dynamodbClient";

interface Product {
    id: string;
    title: string;
    description?: string;
    price: number;
}

interface Stock {
    product_id: string;
    count: number;
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

    try {
        // Fetch products and stocks from DynamoDB
        const productsData = await dynamoDB.send(new ScanCommand({ TableName: PRODUCTS_TABLE }));
        const stocksData = await dynamoDB.send(new ScanCommand({ TableName: STOCKS_TABLE }));

        // Ensure TypeScript understands the expected structure
        const products: Product[] = (productsData.Items as Product[]) || [];
        const stocks: Stock[] = (stocksData.Items as Stock[]) || [];

        // Merge products and stocks by product_id
        const mergedProducts: (Product & { count: number })[] = products.map((product) => ({
            ...product,
            count: stocks.find((stock: Stock) => stock.product_id === product.id)?.count || 0,
        }));

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS"
            },
            body: JSON.stringify(mergedProducts),
        };
    } catch (error) {
        console.error("Error fetching products:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" }),
        };
    }
};
