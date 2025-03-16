import {S3Event, S3Handler} from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { SendMessageCommand, SendMessageCommandInput, SQSClient } from "@aws-sdk/client-sqs";


const s3 = new S3Client({});
const sqs = new SQSClient({});

const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL!;

export const handler: S3Handler = async (event: S3Event): Promise<void> => {
    console.log('Received S3 event:', JSON.stringify(event, null, 2));

    try {
        for (const record of event.Records) {
            const bucket = record.s3.bucket.name;
            const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

            if (!key.startsWith('uploaded/')) {
                console.log(`Skipping file ${key} as it is not in the "uploaded" folder.`);
                continue;
            }

            try {
                const command = new GetObjectCommand({ Bucket: bucket, Key: key });
                const response = await s3.send(command);

                if (!response.Body) {
                    console.error(`No body returned for ${key}`);
                    continue;
                }

                const stream = response.Body as Readable;

                await new Promise((resolve, reject) => {
                    stream
                        .pipe(csvParser())
                        .on('data', async (data) => {
                            console.log('Parsed record:', data);
                            try {
                                console.log(`Sending message to SQS: ${JSON.stringify(data)}`);

                                const params: SendMessageCommandInput = {
                                    QueueUrl: SQS_QUEUE_URL,
                                    MessageBody: JSON.stringify(data),
                                };

                                console.log(`Sending message to SQS: ${JSON.stringify(params)}`);

                                const response = await sqs.send(new SendMessageCommand(params));

                                console.log(`Message successfully sent to SQS: ${JSON.stringify(data)}`);
                                console.log(`SQS Response: ${JSON.stringify(response)}`);

                            } catch (error) {
                                console.error("Error sending message to SQS:", error);
                                throw error; // Rethrow the error to ensure it's caught by the outer try-catch
                            }
                        })
                        .on('error', (error) => {
                            console.error(`Error parsing file ${key}:`, error);
                            reject(error);
                        })
                        .on('end', () => {
                            console.log(`Finished processing file ${key}`);
                            resolve(null);
                        });
                });
            } catch (error) {
                console.error(`Error processing file ${key}:`, error);
            }
        }
    } catch (error) {
        console.error("Error processing S3 event:", error);
    }
};
