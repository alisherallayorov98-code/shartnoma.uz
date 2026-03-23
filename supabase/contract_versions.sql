-- ═══════════════════════════════════════════════════════════════════════════
-- Contract Versions — saves a snapshot on every contract update
-- Run once in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists contract_versions (
  id           uuid primary key default gen_random_uuid(),
  contract_id  uuid not null references contracts(id) on delete cascade,
  version      int  not null,
  content      text,
  amount       numeric,
  status       text,
  saved_by     uuid references auth.users(id) on delete set null,
  created_at   timestamptz default now() not null
);

create index if not exists cv_contract on contract_versions(contract_id, version desc);

alter table contract_versions enable row level security;

-- Users can see versions of their own contracts
create policy "cv_select" on contract_versions for select using (
  contract_id in (select id from contracts where user_id = auth.uid())
);
create policy "cv_insert" on contract_versions for insert with check (
  contract_id in (select id from contracts where user_id = auth.uid())
);
-- No update/delete — versions are immutable
