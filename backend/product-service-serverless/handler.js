module.exports.handler = async (event) => {
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


    const products = [
        {id: "1", name: "Product ABC", price: 100},
        {id: "2", name: "Product B", price: 200},
        {id: "3", name: "Project C", price: 300},
    ];

    return {
        statusCode: 200,

        headers: {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS"

        },
        body: JSON.stringify(products),
    };
};