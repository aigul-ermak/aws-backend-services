export const handler = async (event: any) => {
    const products = [
        {id: "1", name: "Product A", price: 100},
        {id: "2", name: "Product B", price: 200},
        {id: "3", name: "Product C", price: 300},
    ];

    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "https://www.example.com",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
        },
        body: JSON.stringify(products),
    };
};
