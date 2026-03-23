-- ═══════════════════════════════════════════════════════════════════════════
-- Audit Log table — tracks create/update/delete on key tables
-- Run once in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists audit_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete set null,
  action       text not null,          -- 'create' | 'update' | 'delete'
  table_name   text not null,          -- 'contracts' | 'counterparties' | etc.
  record_id    uuid,                   -- id of the affected record
  meta         jsonb default '{}'::jsonb,  -- e.g. contract_number, contract_type
  created_at   timestamptz default now() not null
);

create index if not exists audit_logs_user    on audit_logs(user_id, created_at desc);
create index if not exists audit_logs_record  on audit_logs(table_name, record_id);

-- Users can only read their own audit logs; inserts go through service role or API
alter table audit_logs enable row level security;

create policy "audit_own_select" on audit_logs for select using (user_id = auth.uid());
-- No direct insert/update/delete from client — done via API route
