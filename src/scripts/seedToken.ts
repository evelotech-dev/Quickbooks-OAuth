// Usage: npx ts-node src/scripts/seedToken.ts <account> <auth_token> <refresh_token>
import 'dotenv/config';
import { saveToken } from '../models/oauthTokenModel';

async function main() {
  const [account, auth_token, refresh_token] = process.argv.slice(2);
  if (!account || !auth_token || !refresh_token) {
    console.error('Usage: npx ts-node src/scripts/seedToken.ts <account> <auth_token> <refresh_token>');
    process.exit(1);
  }
  const datetime = new Date().toISOString();
  try {
    await saveToken({ account, datetime, auth_token, refresh_token });
    console.log('Token seeded successfully:', { account, datetime });
  } catch (err) {
    console.error('Error seeding token:', err);
    process.exit(1);
  }
}

main(); 