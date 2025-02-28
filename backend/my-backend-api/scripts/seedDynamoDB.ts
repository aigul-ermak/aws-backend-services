import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

const products = [
    { id: uuidv4(), title: "Laptop", description: "High performance laptop", price: 1200 },
    { id: uuidv4(), title: "Phone", description: "Latest smartphone", price: 800 },
    { id: uuidv4(), title: "Headphones", description: "Noise-canceling headphones", price: 250 }
];

const stocks = products.map(product => ({
    product_id: product.id,
    count: Math.floor(Math.random() * 50) + 1
}));

const insertData = async () => {
    for (const product of products) {
        await docClient.send(new PutCommand({
            TableName: "AWS_products",
            Item: product
        }));
        console.log(`Inserted product: ${product.title}`);
    }

    for (const stock of stocks) {
        await docClient.send(new PutCommand({
            TableName: "AWS_stocks",
            Item: stock
        }));
        console.log(`Inserted stock for product_id: ${stock.product_id}`);
    }
};

insertData()
    .then(() => console.log("Seeding complete!"))
    .catch(console.error);
