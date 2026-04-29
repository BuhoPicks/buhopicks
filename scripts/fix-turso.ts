import * as dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@libsql/client';

async function fixTursoSchema() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error('Missing Turso credentials');
    return;
  }

  const client = createClient({ url, authToken });

  console.log('Syncing Turso schema...');

  try {
    // Add columns if they don't exist
    await client.execute("ALTER TABLE Subscription ADD COLUMN stripeSubscriptionId TEXT;").catch(() => console.log('stripeSubscriptionId already exists or error.'));
    await client.execute("ALTER TABLE Subscription ADD COLUMN stripeCustomerId TEXT;").catch(() => console.log('stripeCustomerId already exists or error.'));
    
    console.log('✅ Turso schema updated');
  } catch (e) {
    console.error('Error updating Turso:', e);
  }
}

fixTursoSchema();
