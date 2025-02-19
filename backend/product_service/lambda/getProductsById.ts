export const handler = async (event: any) => {
    const products = [
        { id: "1", name: "Product A", price: 100 },
        { id: "2", name: "Product B", price: 200 },
        { id: "3", name: "Product C", price: 300 },
    ];

    // Extract productId from the API Gateway request path parameters
    const productId = event.pathParameters?.productId;

    // Find the product by ID
    const product = products.find(p => p.id === productId);

    if (!product) {
        return {
            statusCode: 404,
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            body: JSON.stringify({ message: "Product not found" }),
        };
    }

    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
        body: JSON.stringify(product),
    };
};
