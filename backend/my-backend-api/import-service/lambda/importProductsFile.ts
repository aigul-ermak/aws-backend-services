import { S3Event,  APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET_NAME = "nodejs-aws-shop-react-assets-task5";

const s3 = new S3Client({ region: REGION });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const fileName = event.queryStringParameters?.name;
        if (!fileName) {
            console.error("No file name provided in query parameters.");
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "File name is required" }),
            };
        }
        console.log("File name received:", fileName);

        const objectKey = `uploaded/${fileName}`;
        const contentType = event.queryStringParameters?.contentType || 'application/octet-stream';

        console.log("S3 object key:", objectKey);
        console.log("Content type set to:", contentType);

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: objectKey,
            ContentType: contentType,
        });
        console.log("Created PutObjectCommand:", command);
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/plain' },
            body: signedUrl,
        };
    } catch (error) {
        console.error("Error generating signed URL:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" }),
        };
    }
};
