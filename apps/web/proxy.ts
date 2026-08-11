import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(req: NextRequest) {
    const secret = process.env.NEXTAUTH_SECRET || 'chatapp-secret-key-12345';
    const token = await getToken({ req, secret });

    const isLandingPage = req.nextUrl.pathname === '/';
    const isDashboard = req.nextUrl.pathname.startsWith('/dashboard');

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