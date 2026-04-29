import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import prisma from './prisma';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: { subscription: true },
        });

        if (!user) return null;

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          subscriptionStatus: user.subscription?.status || 'NONE',
          subscriptionPlan: user.subscription?.plan || 'FREE',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.subscriptionStatus = (user as any).subscriptionStatus;
        token.subscriptionPlan = (user as any).subscriptionPlan;
        token.lastChecked = Date.now();
      }

      // Refresh subscription status every 5 minutes
      const lastChecked = (token.lastChecked as number) || 0;
      if (Date.now() - lastChecked > 5 * 60 * 1000) {
        try {
          const sub = await prisma.subscription.findUnique({
            where: { userId: token.id as string },
          });
          token.subscriptionStatus = sub?.status || 'NONE';
          token.subscriptionPlan = sub?.plan || 'FREE';
          token.lastChecked = Date.now();
        } catch {
          // Keep existing values on error
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).subscriptionStatus = token.subscriptionStatus;
        (session.user as any).subscriptionPlan = token.subscriptionPlan;
      }
      return session;
    },
  },
};
