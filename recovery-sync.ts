import 'dotenv/config';
import { runDailyFootballSync } from './lib/footballEngine';
import { runDailyTennisSync } from './lib/tennisEngine';
import prisma from './lib/prisma';

async function main() {
  console.log('🚀 Starting TOTAL RECOVERY SYNC (Tennis + Football)...');
  
  try {
    // 1. Wipe stale data (anything before cutoff)
    const cutoff = new Date('2026-05-01T00:00:00Z');
    await prisma.footballMatch.deleteMany({ where: { date: { lt: cutoff } } });
    await prisma.tennisMatch.deleteMany({ where: { date: { lt: cutoff } } });
    console.log('🧹 Stale data wiped.');

    // 2. Run active syncs only (eSports and Horse Racing removed)
    await runDailyTennisSync();
    await runDailyFootballSync();

    console.log('✅ Recovery Sync completed.');
  } catch (error) {
    console.error('❌ Sync Failed:', error);
    process.exit(1);
  }
}

main().finally(() => prisma.$disconnect());
