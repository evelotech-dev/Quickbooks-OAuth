import dotenv from 'dotenv';
import OAuthClient from 'intuit-oauth';
import { getToken, saveToken, getLatestToken, updateToken } from '../models/oauthTokenModel';
import errorHandle from './errorHandler';

dotenv.config();

/**
 * Represents a stored OAuth token record.
 */
interface TokenRecord {
  auth_token: string;
  refresh_token: string;
  [key: string]: any;
}

/**
 * Construct a configured Intuit OAuth client.
 */
export async function getBaseClient(): Promise<OAuthClient> {
  const clientId = process.env.QB_CLIENT_ID!;
  const clientSecret = process.env.QB_CLIENT_SECRET!;
  const environment = process.env.QB_ENV as 'sandbox' | 'production';
  const redirectUri = process.env.QB_REDIRECT_URL!;

  return new OAuthClient({
    clientId,
    clientSecret,
    environment,
    redirectUri,
  });
}

/**
 * Retrieve stored tokens for the given account.
 * Throws if tokens are missing.
 */
export async function getStoredTokens(account: string): Promise<TokenRecord[]> {
  const tokenObj = await getLatestToken(account) as TokenRecord | undefined;
  if (!tokenObj || !tokenObj.auth_token || !tokenObj.refresh_token) {
    console.error('TOKEN ERROR', tokenObj);
    throw new Error('TOKEN MISSING');
  }
  return [tokenObj];
}

/**
 * Initialize OAuth client with stored tokens.
 */
export async function oauthService(account: string): Promise<OAuthClient> {
  const oauthClient = await getBaseClient();
  const tokenObj = await errorHandle(
    getStoredTokens,
    'getStoredTokens',
    'QBO GET ACCESS TOKENS FAILED',
    account,
  );

  oauthClient.token.refresh_token = tokenObj[0].refresh_token;
  oauthClient.token.access_token = tokenObj[0].auth_token;
  return oauthClient;
}

/**
 * Get the QuickBooks API base URL for the given client environment.
 */
export async function getApiUrl(oauthClient: OAuthClient): Promise<string> {
  const env = process.env.QB_ENV;
  return env === 'sandbox'
    ? 'https://sandbox-accounts.platform.intuit.com'
    : 'https://accounts.platform.intuit.com';
}

/**
 * Persist a new refresh token and access token to the database.
 */
export async function writeStoredRefreshToken(
  newRefreshToken: string,
  accessToken: string,
  account: string,
): Promise<boolean> {
  try {
    // Fetch the latest token to get the correct datetime
    const latest = await getLatestToken(account);
    if (!latest || !latest.datetime) {
      throw new Error('No existing token found to update');
    }
    await updateToken({
      account,
      datetime: latest.datetime,
      auth_token: accessToken,
      refresh_token: newRefreshToken,
    });
    return true;
  } catch (err: unknown) {
    console.error('WRITE TOKENS ERROR', err);
    return false;
  }
}

/**
 * Refresh tokens using Intuit OAuth and save updated tokens.
 */
export async function saveTokens(account: string): Promise<OAuthClient> {
  const oauthClient = await getBaseClient();
  console.log('OAUTH ACCT', account);

  const tokenObj = await errorHandle(
    getStoredTokens,
    'getStoredTokens',
    'QBO GET STORED TOKENS FAILED',
    account,
  );

  const tokenResp = await oauthClient.refreshUsingToken(
    tokenObj[0].refresh_token,
  );
  console.log(
    'REFRESHED OAUTH TOKEN RESP --------------------------',
    account,
    tokenResp,
  );

  const tokenData = tokenResp.getJson();
  const newRefreshToken = tokenData.refresh_token as string;
  const accessToken = tokenData.access_token as string;
  
  // Update the oauthClient with the new tokens
  oauthClient.token.refresh_token = newRefreshToken;
  oauthClient.token.access_token = accessToken;
  
  await writeStoredRefreshToken(newRefreshToken, accessToken, account);
  return oauthClient;
}
