import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult, StatementEffect } from 'aws-lambda';


export const basicAuthorizer = async (
    event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
    console.log('Received event:', event);


    if (!event.authorizationToken) {
        console.warn("No Authorization token provided.");
        throw new Error('Unauthorized');
    }

    try {
        const encodedCredentials = event.authorizationToken.split(' ')[1];
        const buffer = Buffer.from(encodedCredentials, 'base64');
        const [username, password] = buffer.toString('utf-8').split(':');


        const credentialsEnv = process.env.AUTH_CREDENTIALS || '';
        const [validUser, validPass] = credentialsEnv.split('=');

        if (username !== validUser || password !== validPass) {
            console.warn(`Invalid credentials for user: ${username}`);
            throw new Error('Forbidden'); // → Triggers 403
        }

        console.log(`✅ Authenticated user: ${username}`);
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
