
import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const url = "libsql://buho-picks-buhopicks.aws-us-east-2.turso.io"
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzYxNDY2MDIsImlkIjoiMDE5ZDhhOTUtODYwMS03MDAzLTgzNjYtZDg3Njk5Mjk2MWE0IiwicmlkIjoiYTAzZDE0OTEtNDAzZi00MGFhLTg4MDMtYmQ0ZGRlOTNmN2NiIn0.-hb9GFVs18_Eml9xJYUi8gDRAdAFg0lvED5fbHj4wwtoN0p5XvHnn8t72VN_2BQhtuFNLG6sl0ehiVo0AGSUAg"

async function checkCloud() {
  const libsql = createClient({ url, authToken })
  const adapter = new PrismaLibSQL(libsql)
  const prisma = new PrismaClient({ adapter })

  const count = await prisma.footballMatch.count()
  console.log(`Matches in CLOUD (Turso): ${count}`)
  
  const tomorrow = new Date('2026-04-17T06:00:00Z')
  const tomorrowEnd = new Date('2026-04-18T06:00:00Z')
  
  const matches = await prisma.footballMatch.findMany({
    where: { date: { gte: tomorrow, lt: tomorrowEnd } },
    include: { picks: true }
  });
  
  console.log(`Tomorrow matches in CLOUD: ${matches.length}`);
  if (matches.length > 0) {
    console.log(`First match: ${matches[0].homeTeam} vs ${matches[0].awayTeam} with ${matches[0].picks.length} picks`);
  }
}

checkCloud()
