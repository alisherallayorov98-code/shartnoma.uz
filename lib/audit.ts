import { supabase } from './supabase'

type AuditAction = 'create' | 'update' | 'delete'

export async function logAudit(
  action: AuditAction,
  tableName: string,
  recordId: string,
  meta: Record<string, unknown> = {}
) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  await supabase.from('audit_logs').insert({
    user_id: session.user.id,
    action,
    table_name: tableName,
    record_id: recordId,
    meta,
  })
}
