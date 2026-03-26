-- ═══════════════════════════════════════════════════════════════════════════
-- Ta'sischilar (Founders) table for Shartnoma.uz
-- Run this in Supabase SQL Editor (once)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Create table ─────────────────────────────────────────────────────────────
create table if not exists tasischilar (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references organizations(id) on delete cascade not null,
  full_name   text not null,
  ulush       numeric(6,2) not null default 0,
  created_at  timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table tasischilar enable row level security;

drop policy if exists "tasischilar_select" on tasischilar;
drop policy if exists "tasischilar_insert" on tasischilar;
drop policy if exists "tasischilar_delete" on tasischilar;

create policy "tasischilar_select" on tasischilar
  for select using (
    org_id in (select id from organizations where user_id = auth.uid())
  );

create policy "tasischilar_insert" on tasischilar
  for insert with check (
    org_id in (select id from organizations where user_id = auth.uid())
  );

create policy "tasischilar_delete" on tasischilar
  for delete using (
    org_id in (select id from organizations where user_id = auth.uid())
  );
