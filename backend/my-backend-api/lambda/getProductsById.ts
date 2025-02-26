import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

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

    const productId = event.pathParameters?.productId;

    if (!productId) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS"
            },
            body: JSON.stringify({ message: "Missing productId" }),
        };
    }

    const products = [
        { id: "1", name: "Product A", price: 100 },
        { id: "2", name: "Product B", price: 200 },
        { id: "3", name: "Project C", price: 300 },
    ];

    const product = products.find(p => p.id === productId);

    if (!product) {
        return {
            statusCode: 404,
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS"
            },
            body: JSON.stringify({ message: "Product not found" }),
        };
    }

    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS"
        },
        body: JSON.stringify(product),
    };
};
