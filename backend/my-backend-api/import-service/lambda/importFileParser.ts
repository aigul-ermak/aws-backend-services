import { S3Event, S3Handler } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import csvParser from "csv-parser";
import { Readable } from "stream";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

const s3 = new S3Client({});
const sqs = new SQSClient({});
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL!;

export const handler: S3Handler = async (event: S3Event): Promise<void> => {
    console.log("Received S3 event:", JSON.stringify(event, null, 2));

    try {
        for (const record of event.Records) {
            const bucket = record.s3.bucket.name;
            const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

            if (!key.startsWith("uploaded/")) {
                console.log(`Skipping file ${key} as it is not in the "uploaded" folder.`);
                continue;
            }

            console.log(`📂 Processing file: ${key}`);

            try {
                const command = new GetObjectCommand({ Bucket: bucket, Key: key });
                const response = await s3.send(command);

                if (!response.Body) {
                    console.error(`No body returned for ${key}`);
                    continue;
                }

                const stream = response.Body as Readable;
                const parsedRecords: any[] = [];

                await new Promise((resolve, reject) => {
                    stream
                        .pipe(csvParser())
                        .on("data", (data) => {
                            console.log(`🔍 Parsed record: ${JSON.stringify(data)}`);
                            parsedRecords.push({
                                bucket: bucket,
                                key: key,
                                record: {
                                    // id: data.id,
                                    title: data.title,
                                    description: data.description,
                                    price: data.price,
                                    count: data.count ?? 0,
                                },
                            });
                        })
                        .on("error", (error) => {
                            console.error(`Error parsing file ${key}:`, error);
                            reject(error);
                        })
                        .on("end", () => {
                            console.log(`✅ Finished parsing file: ${key}`);
                            resolve(null);
                        });
                });

                // ✅ Now send all records to SQS in parallel
                await Promise.all(
                    parsedRecords.map(async (record) => {
                        try {
                            console.log(`📤 Sending message to SQS: ${JSON.stringify(record)}`);

                            const response = await sqs.send(
                                new SendMessageCommand({
                                    QueueUrl: SQS_QUEUE_URL,
                                    MessageBody: JSON.stringify(record),
                                })
                            );

                            console.log(`Successfully sent message to SQS. MessageId: ${response.MessageId}`);
                        } catch (error) {
                            console.error("Error sending message to SQS:", error);
                        }
                    })
                );

            } catch (error) {
                console.error(`Error processing file ${key}:`, error);
            }
        }
    } catch (error) {
        console.error("Error processing S3 event:", error);
    }
};
