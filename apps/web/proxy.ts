import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(req: NextRequest) {
    const isLandingPage = req.nextUrl.pathname === '/';
    const isDashboard = req.nextUrl.pathname.startsWith('/dashboard');

    const hasSessionCookie = Boolean(
        req.cookies.get('next-auth.session-token') || 
        req.cookies.get('__Secure-next-auth.session-token')
    );

    // Fast path for guest users on landing page (0ms response time)
    if (isLandingPage && !hasSessionCookie) {
        return NextResponse.next();
    }

    // Fast path for guest users trying to access dashboard
    if (isDashboard && !hasSessionCookie) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    const secret = process.env.NEXTAUTH_SECRET || 'chatapp-secret-key-12345';
    const token = await getToken({ req, secret });

    // logged in → redirect away from landing
    if (token && isLandingPage) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // not logged in → redirect away from dashboard
    if (!token && isDashboard) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/dashboard/:path*'],
};