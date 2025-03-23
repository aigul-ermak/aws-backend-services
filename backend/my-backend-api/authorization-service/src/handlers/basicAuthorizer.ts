import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult, StatementEffect } from 'aws-lambda';
import * as dotenv from 'dotenv';

dotenv.config();

export const basicAuthorizer = async (
    event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
    console.log('Received event:', event);

    if (!event.authorizationToken) {
        throw new Error('Unauthorized'); // API Gateway returns 401 automatically
    }

    try {
        const encodedCredentials = event.authorizationToken.split(' ')[1];
        const buffer = Buffer.from(encodedCredentials, 'base64');
        const [username, password] = buffer.toString('utf-8').split(':');

        const storedPassword = process.env[username];

        if (!storedPassword || storedPassword !== password) {
            throw new Error('Forbidden');
        }

        return generatePolicy(username, event.methodArn, 'Allow');
    } catch (error) {
        console.error('Error:', error);
        throw new Error('Forbidden');
    }
};

const generatePolicy = (
    principalId: string,
    resource: string,
    effect: StatementEffect
): APIGatewayAuthorizerResult => ({
    principalId,
    policyDocument: {
        Version: '2012-10-17',
        Statement: [
            {
                Action: 'execute-api:Invoke',
                Effect: effect,
                Resource: resource,
            },
        ],
    },
});
