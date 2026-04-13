import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return false
  const db = getAdminDb()
  const { data: { user } } = await db.auth.getUser(token)
  if (!user) return false
  const { data } = await db.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
  return !!data
}

// GET: list sessions or get messages for a session
export async function GET(req: NextRequest) {
  if (!await verifyAdmin(req)) return NextResponse.json({ error: "Ruxsat yo'q" }, { status: 403 })

  const db = getAdminDb()
  const sessionId = req.nextUrl.searchParams.get('sessionId')

  if (sessionId) {
    // Get messages for a specific session
    const { data: messages } = await db
      .from('support_messages')
      .select('id,role,content,created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
    return NextResponse.json({ messages: messages || [] })
  }

  // List all sessions
  const { data: sessions } = await db
    .from('support_sessions')
    .select('id,user_email,org_name,plan,status,created_at,updated_at')
    .order('updated_at', { ascending: false })
    .limit(200)

  return NextResponse.json({ sessions: sessions || [] })
}
