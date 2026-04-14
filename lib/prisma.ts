import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client/web'

declare const globalThis: {
  prismaGlobal: PrismaClient | undefined;
} & typeof global;

let prismaInstance: PrismaClient | undefined = globalThis.prismaGlobal;

const getPrisma = (): PrismaClient => {
  if (prismaInstance) return prismaInstance;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    if (process.env.NODE_ENV !== 'production') {
      // In local dev without env vars, just fallback temporarily to avoid crashing
      prismaInstance = new PrismaClient();
      return prismaInstance;
    }
    throw new Error(`Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN. url: ${!!url}, token: ${!!authToken}`);
  }

  const libsql = createClient({ url, authToken });
  const adapter = new PrismaLibSql(libsql);
  prismaInstance = new PrismaClient({ adapter });
  
  if (process.env.NODE_ENV !== 'production') {
    globalThis.prismaGlobal = prismaInstance;
  }
  
  return prismaInstance;
};

// Use a Proxy to completely defer initialization until the very first query!
const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    const client = getPrisma();
    return Reflect.get(client, prop);
  }
});

export default prisma;


