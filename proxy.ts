import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/pricing'];
const ALWAYS_ALLOW = ['/api/auth', '/api/stripe/webhook', '/_next', '/favicon', '/logo.png', '/stadium-bg.png', '/hero-bg.png'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static files and specific API routes
  if (ALWAYS_ALLOW.some(p => pathname.startsWith(p)) || pathname.includes('.')) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Not logged in → only public paths allowed
  if (!token) {
    if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Logged in: redirect away from auth pages
  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Admin has full access
  if (token.role === 'ADMIN') {
    return NextResponse.next();
  }

  // Non-admin trying to access /admin → block
  if (pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // User without active subscription → pricing or account only
  if (token.subscriptionStatus !== 'ACTIVE') {
    if (pathname === '/pricing' || pathname === '/account' || pathname.startsWith('/api/stripe')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
