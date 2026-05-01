import 'dotenv/config';
import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const prismaClientSingleton = () => {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.warn("⚠️ TURSO variables missing, falling back to LOCAL SQLite: " + process.env.DATABASE_URL);
    return new PrismaClient()
  }

  console.log("🌐 Connecting to TURSO Database: " + url);
  const libsql = createClient({ url, authToken })
  const adapter = new PrismaLibSQL(libsql)
  return new PrismaClient({ adapter })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma


