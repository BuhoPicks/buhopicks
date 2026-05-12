import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hash, compare } from 'bcryptjs';

// PATCH /api/auth/profile — update name, email, or password
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { name, email, currentPassword, newPassword } = await request.json();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const updates: any = {};

    // Update name
    if (name && name.trim() !== user.name) {
      updates.name = name.trim();
    }

    // Update email — check it's not taken
    if (email && email.toLowerCase().trim() !== user.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (emailExists) {
        return NextResponse.json(
          { error: 'Ya existe una cuenta con ese correo electrónico' },
          { status: 409 }
        );
      }
      updates.email = email.toLowerCase().trim();
    }

    // Update password
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

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    return NextResponse.json({
      message: 'Perfil actualizado correctamente',
      user: { name: updated.name, email: updated.email },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Error al actualizar el perfil' }, { status: 500 });
  }
}
