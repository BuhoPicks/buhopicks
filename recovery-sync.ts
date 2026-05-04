import 'dotenv/config';
import { revalidatePath } from 'next/cache';
import { runDailyFootballSync } from './lib/footballEngine';
import { runDailyTennisSync } from './lib/tennisEngine';
import { runDailyEsportsSync } from './lib/esportsEngine';
import { runDailyHorseRacingSync } from './lib/horseRacingEngine';
import prisma from './lib/prisma';

async function main() {
  console.log('🚀 Starting TOTAL RECOVERY SYNC...');
  
  try {
    // 1. Wipe stale data (anything before May 1st)
    const cutoff = new Date('2026-05-01T00:00:00Z');
    await prisma.footballMatch.deleteMany({ where: { date: { lt: cutoff } } });
    await prisma.tennisMatch.deleteMany({ where: { date: { lt: cutoff } } });
    console.log('🧹 Stale data wiped.');

    // 2. Run syncs
    await runDailyFootballSync();
    await runDailyTennisSync();
    await runDailyEsportsSync();
    await runDailyHorseRacingSync();

    console.log('✅ Sync and Cleanup completed.');
  } catch (error) {
    console.error('❌ Sync Failed:', error);
    process.exit(1);
  }
}

main().finally(() => prisma.$disconnect());
