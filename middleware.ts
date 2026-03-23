import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Auth check is handled client-side in dashboard/context.tsx
// Supabase uses localStorage (not cookies) with the standard JS client
export function middleware(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
