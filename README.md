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

### Initial Token Seeding

Before the service can begin managing and refreshing tokens, you must obtain fresh QuickBooks OAuth tokens and seed them into the DynamoDB table. This is required to initialize persistence and allow the service to perform token refresh operations.

You can use the provided script to seed the initial tokens: `scripts/seedToken.ts`.

Ensure you have valid access and refresh tokens from the QuickBooks OAuth flow before running the script.

You can get fresh tokens from the QBO developers platform--[OAuth 2.0 Playground](https://help.developer.intuit.com/s/article/Configuring-the-Oauth-2-0-Playground-for-QuickBooks-Online)
.
```bash
npm run seed
```


### Manual Token Refresh
```bash
npm start
```