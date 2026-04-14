import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const prismaClientSingleton = () => {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  // Si no hay variables de Turso (ej. durante el build de Vercel),
  // caemos de forma segura al cliente normal que valida contra DATABASE_URL (file:/tmp/dev.db)
  if (!url || !authToken) {
    console.warn("⚠️ TURSO variables missing, falling back to default Prisma client for build/dev");
    return new PrismaClient()
  }

  // Si hay variables, usamos Turso
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


