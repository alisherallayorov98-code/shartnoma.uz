import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    // Supabase stores auth token in a cookie named "sb-<ref>-auth-token"
    const hasAuth = req.cookies.getAll().some(c =>
      c.name.includes('auth-token') || c.name.startsWith('sb-')
    )
    if (!hasAuth) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
