import 'dotenv/config';
import prisma from './lib/prisma';

async function cleanup() {
  console.log('🧹 Cleaning up old matches (last 30 days)...');
  // Delete all football and tennis matches before May 1st
  const cutoff = new Date('2026-05-01T00:00:00Z');
  
  const f = await prisma.footballMatch.deleteMany({ where: { date: { lt: cutoff } } });
  const t = await prisma.tennisMatch.deleteMany({ where: { date: { lt: cutoff } } });
  
  console.log(`✅ Deleted ${f.count} football and ${t.count} tennis matches.`);
}

cleanup().catch(console.error).finally(() => prisma.$disconnect());
