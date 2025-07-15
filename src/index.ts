import 'dotenv/config';
import { saveTokens } from './utils/oauthUtilities';

/**
 * Lambda handler for refreshing OAuth tokens.
 * Expects event.account (string), which should be the QBO account identifier (e.g., 'dev'),
 * not the AWS account ID. If not provided, defaults to 'dev'.
 */
export const handler = async (event: any = {}): Promise<any> => {
  const account = event.account || 'dev';
  try {
    await saveTokens(account);
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'success', account }),
    };
  } catch (error) {
    console.error('Error refreshing OAuth tokens:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ status: 'error', error: (error as Error).message }),
    };
  }
};

/**
 * Main function to refresh OAuth tokens for configured accounts.
 * This will be called on a schedule (e.g., every 45 minutes) to keep tokens fresh.
 */
async function refreshTokens() {
  try {
    console.log('Starting OAuth token refresh...');
    // Refresh tokens for each account
    await saveTokens('demo');
    console.log('OAuth token refresh completed successfully');
  } catch (error) {
    console.error('Error refreshing OAuth tokens:', error);
    process.exit(1);
  }
}

// If this file is run directly, execute the token refresh
if (require.main === module) {
  refreshTokens();
}

export { refreshTokens }; 