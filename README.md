# QBO Auth

QuickBooks OAuth token management service for shared hosting environments.

## Purpose

This service handles the refresh and management of QuickBooks OAuth tokens. It was extracted from the shopify-incoming app to provide a dedicated service for token management.

## Features

- OAuth token refresh for QuickBooks API
- Token persistence in DynamoDB table
- Scheduled token refresh (via cron job)
- Error handling and logging

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   - DynamoDB connection details
   - QuickBooks OAuth credentials
   - Other configuration settings

3. Build the application:
   ```bash
   npm run build
   ```

## Usage

### Manual Token Refresh
```bash
npm start
```

### Development Mode
```bash
npm run dev
```

### Scheduled Token Refresh
Set up a cron job to run the token refresh every 45 minutes:
```bash
*/45 * * * * cd /path/to/qbo-auth && npm start
```

## Database Schema

The service uses a DynamoDB table (e.g., `qbo_oauth_tokens`) with the following structure:
- `id` - Primary key
- `account` - Account identifier
- `access_token` - Current access token
- `refresh_token` - Current refresh token
- `updated_on` - Last update timestamp

## Dependencies

- `intuit-oauth` - QuickBooks OAuth client
- `aws-sdk` - AWS SDK for DynamoDB
- `dotenv` - Environment variable management
- `moment` - Date/time utilities 