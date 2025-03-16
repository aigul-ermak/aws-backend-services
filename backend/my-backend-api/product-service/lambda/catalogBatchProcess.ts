import { SQSEvent } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const sns = new SNSClient({});

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE_NAME!;
const STOCKS_TABLE = process.env.STOCKS_TABLE_NAME!;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN!;

export const handler = async (event: SQSEvent) => {
    console.log("Processing batch:", JSON.stringify(event, null, 2));


    await Promise.all(
        event.Records.map(async (record) => {
            const product = JSON.parse(record.body);


            if (!product.id || !product.title || !product.price) {
                console.error("Invalid product data:", product);
                return;
            }

            try {
                await docClient.send(
                    new TransactWriteCommand({
                        TransactItems: [
                            {
                                Put: {
                                    TableName: PRODUCTS_TABLE,
                                    Item: {
                                        id: product.id,
                                        title: product.title,
                                        description: product.description || "",
                                        price: product.price,
                                    },
                                },
                            },
                            {
                                Put: {
                                    TableName: STOCKS_TABLE,
                                    Item: {
                                        product_id: product.id,
                                        count: product.count ?? 0,
                                    },
                                },
                            },
                        ],
                    })
                );

                console.log(`✅ Inserted product: ${product.title}`);


                await sns.send(
                    new PublishCommand({
                        TopicArn: SNS_TOPIC_ARN,
                        Message: JSON.stringify({
                            id: product.id,
                            title: product.title,
                            price: product.price,
                            stock: product.count ?? 0,
                        }),
                        Subject: `🆕 New Product Created: ${product.title}`,
                    })
                );

                console.log(`Published to SNS: ${product.title}`);
            } catch (error) {
                console.error(`Error processing product ${product.title}:`, error);
            }
        })
    );

    console.log("Batch processing completed.");
};
