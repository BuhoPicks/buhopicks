/**
 * Run the NEW football engine locally against the production Turso DB.
 * This ensures the database gets picks with proper descriptions
 * like "Over 8.5 Corners" instead of "múltiples tiros de esquina".
 */
import { runDailyFootballSync } from './lib/footballEngine';

async function main() {
  console.log('🚀 Running NEW football engine v3 locally against Turso DB...');
  console.log('📡 TURSO_DATABASE_URL:', process.env.TURSO_DATABASE_URL ? 'SET ✅' : 'NOT SET ❌');
  
  const result = await runDailyFootballSync();
  console.log('📊 Result:', JSON.stringify(result, null, 2));
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
