import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { hash, compare } from 'bcryptjs';

// PATCH /api/auth/profile — update name, email, or password
// Also syncs email/name to Stripe if the user has a subscription
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { name, email, currentPassword, newPassword } = await request.json();

    // Fetch user + subscription (to get stripeCustomerId)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const updates: any = {};

    // ── Name ──────────────────────────────────────────────────────────────────
    if (name && name.trim() !== user.name) {
      updates.name = name.trim();
    }

    // ── Email ─────────────────────────────────────────────────────────────────
    const newEmail = email?.toLowerCase().trim();
    if (newEmail && newEmail !== user.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: newEmail },
      });
      if (emailExists) {
        return NextResponse.json(
          { error: 'Ya existe una cuenta con ese correo electrónico' },
          { status: 409 }
        );
      }
      updates.email = newEmail;
    }

    // ── Password ──────────────────────────────────────────────────────────────
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Debes ingresar tu contraseña actual para cambiarla' },
          { status: 400 }
        );
      }
      const isValid = await compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: 'La contraseña actual no es correcta' },
          { status: 400 }
        );
      }
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'La nueva contraseña debe tener al menos 6 caracteres' },
          { status: 400 }
        );
      }
      updates.password = await hash(newPassword, 12);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'No hay cambios para guardar' });
    }

    // 1. Save changes in our database
    const updated = await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    // 2. Sync to Stripe so billing portal & future invoices use the new email/name
    //    This is the KEY FIX: without this, Stripe keeps showing the old email
    const stripeCustomerId = (user as any).subscription?.stripeCustomerId;
    if (stripeCustomerId) {
      const stripeUpdates: any = {};
      if (updates.email) stripeUpdates.email = updates.email;
      if (updates.name)  stripeUpdates.name  = updates.name;

      if (Object.keys(stripeUpdates).length > 0) {
        try {
          await stripe.customers.update(stripeCustomerId, stripeUpdates);
        } catch (stripeErr) {
          // Non-fatal: DB was updated, just log the Stripe failure
          console.error('[profile] Stripe customer sync failed:', stripeErr);
        }
      }
    }

    return NextResponse.json({
      message: 'Perfil actualizado correctamente',
      user: { name: updated.name, email: updated.email },
    });
  } catch (error) {
    console.error('[profile] Update error:', error);
    return NextResponse.json({ error: 'Error al actualizar el perfil' }, { status: 500 });
  }
}
