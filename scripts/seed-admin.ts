/**
 * Script para crear la cuenta de Administrador de Búho Picks
 * 
 * Uso: npx ts-node scripts/seed-admin.ts
 * 
 * Variables de entorno necesarias:
 *   ADMIN_EMAIL    - Email del administrador
 *   ADMIN_PASSWORD - Contraseña del administrador  
 *   ADMIN_NAME     - Nombre del administrador
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Administrador';

  if (!email || !password) {
    console.error('❌ Debes definir ADMIN_EMAIL y ADMIN_PASSWORD en tu archivo .env');
    process.exit(1);
  }

  // Connect to Turso
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  let prisma: PrismaClient;

  if (url && authToken) {
    const libsql = createClient({ url, authToken });
    const adapter = new PrismaLibSQL(libsql);
    prisma = new PrismaClient({ adapter });
    console.log('📡 Conectado a Turso (producción)');
  } else {
    prisma = new PrismaClient();
    console.log('💾 Usando base de datos local');
  }

  try {
    const hashedPassword = await hash(password, 12);

    const admin = await prisma.user.upsert({
      where: { email: email.toLowerCase().trim() },
      update: {
        name,
        password: hashedPassword,
        role: 'ADMIN',
      },
      create: {
        email: email.toLowerCase().trim(),
        name,
        password: hashedPassword,
        role: 'ADMIN',
        subscription: {
          create: {
            plan: 'ANNUAL',
            status: 'ACTIVE',
          },
        },
      },
    });

    // Ensure admin has an active subscription
    await prisma.subscription.upsert({
      where: { userId: admin.id },
      update: { status: 'ACTIVE', plan: 'ANNUAL' },
      create: { userId: admin.id, status: 'ACTIVE', plan: 'ANNUAL' },
    });

    console.log('✅ Cuenta de administrador creada/actualizada:');
    console.log(`   📧 Email: ${admin.email}`);
    console.log(`   👤 Nombre: ${admin.name}`);
    console.log(`   🛡️  Rol: ADMIN`);
    console.log(`   💳 Suscripción: ACTIVE (ANNUAL)`);
  } catch (error) {
    console.error('❌ Error al crear admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
