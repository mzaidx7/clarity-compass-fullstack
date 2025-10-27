import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = [
  '/dashboard',
  '/quick-risk',
  '/fused-risk',
  '/forecast',
  '/calendar',
  '/progress',
  '/settings',
  '/status',
];
const AUTH_ROUTES = ['/login'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect_to', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/quick-risk/:path*',
    '/fused-risk/:path*',
    '/forecast/:path*',
    '/calendar/:path*',
    '/progress/:path*',
    '/settings/:path*',
    '/status/:path*',
    '/login',
  ],
};
