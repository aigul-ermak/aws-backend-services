import { SQSEvent } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const sns = new SNSClient({});
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN!;

export const handler = async (event: SQSEvent) => {
    console.log('Processing batch:', JSON.stringify(event, null, 2));

    for (const record of event.Records) {
        const productData = JSON.parse(record.body);
        console.log('Processing product:', productData);

        // Send SNS notification
        try {
            await sns.send(
                new PublishCommand({
                    TopicArn: SNS_TOPIC_ARN,
                    Message: JSON.stringify(productData),
                    Subject: 'New Product Created',
                })
            );
            console.log(`Published to SNS: ${JSON.stringify(productData)}`);
        } catch (error) {
            console.error('Failed to send SNS message:', error);
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Batch processed successfully' }),
    };
};
