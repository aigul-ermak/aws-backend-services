import { S3Handler, S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import {SendMessageCommand, SQSClient} from "@aws-sdk/client-sqs";

const s3 = new S3Client({});
const sqs = new SQSClient({});

const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL!;

export const handler: S3Handler = async (event: S3Event) => {
    console.log('Received S3 event:', JSON.stringify(event, null, 2));

    for (const record of event.Records) {
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

        if (!key.startsWith('uploaded/')) {
            console.log(`Skipping file ${key} as it is not in the "uploaded" folder.`);
            continue;
        }

        try {
            const command = new GetObjectCommand({
                Bucket: bucket,
                Key: key,
            });


            const response = await s3.send(command);


            if (!response.Body) {
                console.error(`No body returned for ${key}`);
                continue;
            }

            const stream = response.Body as Readable;
            const records: any[] = [];
            await new Promise((resolve, reject) => {
                stream
                    .pipe(csvParser())
                    .on('data', async (data) => {
                        console.log('Parsed record:', data);

                        try {
                            await sqs.send(
                                new SendMessageCommand({
                                    QueueUrl: SQS_QUEUE_URL,
                                    MessageBody: JSON.stringify(data),
                                })
                            );
                            console.log(`Sent to SQS: ${JSON.stringify(data)}`);
                        } catch (error) {
                            console.error('Error sending message to SQS:', error);
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
};