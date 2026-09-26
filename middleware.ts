import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { MEMBER_SESSION_COOKIE, verifyMemberSessionToken } from './lib/member-auth'

const { auth } = NextAuth(authConfig)

// Public routes that don't require any authentication
const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/offline', '/member-login', '/member']

// Route prefixes for the member-facing tier. These are NOT gated by the staff
// (NextAuth) session — members never have one. '/member/dashboard' is instead
// gated below by its own member_session cookie.
const memberPortalPrefixes = ['/member', '/attendance/']

export default auth(async (req) => {
  const { pathname } = req.nextUrl

  // Allow public routes
  if (publicRoutes.some((route) => pathname === route)) {
    return NextResponse.next()
  }

  // Allow API routes + NextAuth + static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Member-facing portal: guarded by its own signed cookie, never by the staff session.
  // (Previously these paths fell through to the staff-only check below, which meant a
  // real member with no staff account was redirected straight to /login — the whole
  // member tier, including self check-in/check-out, was unreachable.)
  if (memberPortalPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    if (pathname.startsWith('/member/dashboard')) {
      const token = req.cookies.get(MEMBER_SESSION_COOKIE)?.value
      const memberSession = await verifyMemberSessionToken(token)
      if (!memberSession) {
        return NextResponse.redirect(new URL('/member-login', req.url))
      }
    }
    return NextResponse.next()
  }

  const session = req.auth
  const role = session?.user?.role as string | undefined

  // Not authenticated → redirect to login
  if (!session?.user) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin routes — only super_admin
  if (pathname.startsWith('/admin') && role !== 'super_admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Dashboard routes — redirect super_admin to admin panel
  if (pathname.startsWith('/dashboard') && role === 'super_admin') {
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
