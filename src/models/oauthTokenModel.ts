import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const TABLE_NAME = process.env.AWS_DYNAMODB_TABLE;

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export async function saveToken({ account, datetime, auth_token, refresh_token }: { account: string, datetime: string, auth_token: string, refresh_token: string }) {
  try {
    await ddbDocClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: { account, datetime, auth_token, refresh_token },
    }));
    return true;
  } catch (err) {
    // TODO: Integrate error email alert
    console.error('DynamoDB saveToken error:', err);
    throw err;
  }
}

export async function getToken(account: string, datetime: string) {
  try {
    const result = await ddbDocClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { account, datetime },
    }));
    return result.Item;
  } catch (err) {
    // TODO: Integrate error email alert
    console.error('DynamoDB getToken error:', err);
    throw err;
  }
}

export async function deleteToken(account: string, datetime: string) {
  try {
    await ddbDocClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { account, datetime },
    }));
    return true;
  } catch (err) {
    // TODO: Integrate error email alert
    console.error('DynamoDB deleteToken error:', err);
    throw err;
  }
}

export async function getLatestToken(account: string) {
  try {
    console.log('[getLatestToken] account param:', account);
    const result = await ddbDocClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'account = :account',
      ExpressionAttributeValues: {
        ':account': account,
      },
      ScanIndexForward: false, // descending order
      Limit: 1,
    }));
    console.log('[getLatestToken] DDB query result:', JSON.stringify(result));
    return result.Items && result.Items[0];
  } catch (err) {
    // TODO: Integrate error email alert
    console.error('DynamoDB getLatestToken error:', err);
    throw err;
  }
}

export async function updateToken({ account, datetime, auth_token, refresh_token }: { account: string, datetime: string, auth_token: string, refresh_token: string }) {
  try {
    await ddbDocClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { account, datetime },
      UpdateExpression: 'SET auth_token = :auth_token, refresh_token = :refresh_token',
      ExpressionAttributeValues: {
        ':auth_token': auth_token,
        ':refresh_token': refresh_token,
      },
    }));
    return true;
  } catch (err) {
    // TODO: Integrate error email alert
    console.error('DynamoDB updateToken error:', err);
    throw err;
  }
}
