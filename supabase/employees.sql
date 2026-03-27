-- ═══════════════════════════════════════════════════════════════════════════
-- Employees (Xodimlar) table for Shartnoma.uz
-- Run this in Supabase SQL Editor (once)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Create table ─────────────────────────────────────────────────────────────
create table if not exists employees (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  ism             text not null,
  jshshir         text,
  passport        text,
  lavozim         text,
  bolim           text,
  maosh           text,
  ish_boshi       date,
  status          text default 'active',  -- 'active' | 'fired'
  tel             text,
  created_at      timestamptz default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists employees_org_idx on employees(organization_id);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table employees enable row level security;

drop policy if exists "employees_select" on employees;
drop policy if exists "employees_insert" on employees;
drop policy if exists "employees_update" on employees;
drop policy if exists "employees_delete" on employees;

create policy "employees_select" on employees
  for select using (
    organization_id in (select id from organizations where user_id = auth.uid())
  );

create policy "employees_insert" on employees
  for insert with check (
    organization_id in (select id from organizations where user_id = auth.uid())
  );

create policy "employees_update" on employees
  for update using (
    organization_id in (select id from organizations where user_id = auth.uid())
  );

create policy "employees_delete" on employees
  for delete using (
    organization_id in (select id from organizations where user_id = auth.uid())
  );
