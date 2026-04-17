
import prisma from './lib/prisma';
async function checkDB() {
  const mxOffset = -6 * 60 * 60 * 1000;
  const now = new Date();
  const mxTime = new Date(now.getTime() + mxOffset);
  const baseUTC = new Date(Date.UTC(mxTime.getUTCFullYear(), mxTime.getUTCMonth(), mxTime.getUTCDate()));
  const start = new Date(baseUTC.getTime() - mxOffset);
  const end = new Date(start.getTime() + 86400000);

  console.log('Searching matches between:', start.toISOString(), 'and', end.toISOString());
  
  const fCount = await prisma.footballMatch.count({ where: { date: { gte: start, lt: end } } });
  const tCount = await prisma.tennisMatch.count({ where: { date: { gte: start, lt: end } } });
  
  console.log('Football matches today:', fCount);
  console.log('Tennis matches today:', tCount);
  
  if (fCount === 0) {
    const totalF = await prisma.footballMatch.count();
    console.log('Total football matches in DB:', totalF);
    const firstF = await prisma.footballMatch.findFirst({ orderBy: { date: 'asc' } });
    console.log('Earliest football match:', firstF?.date);
  }
}
checkDB();
