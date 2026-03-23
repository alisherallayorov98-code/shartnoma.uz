-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security Policies for Shartnoma.uz
-- Run this entire file in Supabase SQL Editor (once)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── organizations ────────────────────────────────────────────────────────────
alter table organizations enable row level security;

drop policy if exists "orgs_select"  on organizations;
drop policy if exists "orgs_insert"  on organizations;
drop policy if exists "orgs_update"  on organizations;
drop policy if exists "orgs_delete"  on organizations;

create policy "orgs_select" on organizations for select using (user_id = auth.uid());
create policy "orgs_insert" on organizations for insert with check (user_id = auth.uid());
create policy "orgs_update" on organizations for update using (user_id = auth.uid());
create policy "orgs_delete" on organizations for delete using (user_id = auth.uid());

-- ── subscriptions ────────────────────────────────────────────────────────────
alter table subscriptions enable row level security;

drop policy if exists "subs_select" on subscriptions;
drop policy if exists "subs_insert" on subscriptions;
drop policy if exists "subs_update" on subscriptions;
drop policy if exists "subs_delete" on subscriptions;

create policy "subs_select" on subscriptions for select using (user_id = auth.uid());
create policy "subs_insert" on subscriptions for insert with check (user_id = auth.uid());
create policy "subs_update" on subscriptions for update using (user_id = auth.uid());
create policy "subs_delete" on subscriptions for delete using (user_id = auth.uid());

-- ── bank_accounts ─────────────────────────────────────────────────────────────
alter table bank_accounts enable row level security;

drop policy if exists "banks_select" on bank_accounts;
drop policy if exists "banks_insert" on bank_accounts;
drop policy if exists "banks_update" on bank_accounts;
drop policy if exists "banks_delete" on bank_accounts;

create policy "banks_select" on bank_accounts for select using (user_id = auth.uid());
create policy "banks_insert" on bank_accounts for insert with check (user_id = auth.uid());
create policy "banks_update" on bank_accounts for update using (user_id = auth.uid());
create policy "banks_delete" on bank_accounts for delete using (user_id = auth.uid());

-- ── counterparties ───────────────────────────────────────────────────────────
alter table counterparties enable row level security;

drop policy if exists "cp_select" on counterparties;
drop policy if exists "cp_insert" on counterparties;
drop policy if exists "cp_update" on counterparties;
drop policy if exists "cp_delete" on counterparties;

create policy "cp_select" on counterparties for select using (user_id = auth.uid());
create policy "cp_insert" on counterparties for insert with check (user_id = auth.uid());
create policy "cp_update" on counterparties for update using (user_id = auth.uid());
create policy "cp_delete" on counterparties for delete using (user_id = auth.uid());

-- ── contracts ────────────────────────────────────────────────────────────────
alter table contracts enable row level security;

drop policy if exists "contracts_select" on contracts;
drop policy if exists "contracts_insert" on contracts;
drop policy if exists "contracts_update" on contracts;
drop policy if exists "contracts_delete" on contracts;

create policy "contracts_select" on contracts for select using (user_id = auth.uid());
create policy "contracts_insert" on contracts for insert with check (user_id = auth.uid());
create policy "contracts_update" on contracts for update using (user_id = auth.uid());
create policy "contracts_delete" on contracts for delete using (user_id = auth.uid());

-- ── profiles ─────────────────────────────────────────────────────────────────
alter table profiles enable row level security;

drop policy if exists "profiles_select" on profiles;
drop policy if exists "profiles_insert" on profiles;
drop policy if exists "profiles_update" on profiles;

create policy "profiles_select" on profiles for select using (id = auth.uid());
create policy "profiles_insert" on profiles for insert with check (id = auth.uid());
create policy "profiles_update" on profiles for update using (id = auth.uid());

-- ── specifications ───────────────────────────────────────────────────────────
-- specifications only has organization_id (no user_id), so we join via organizations
alter table specifications enable row level security;

drop policy if exists "specs_select" on specifications;
drop policy if exists "specs_insert" on specifications;
drop policy if exists "specs_update" on specifications;
drop policy if exists "specs_delete" on specifications;

create policy "specs_select" on specifications for select using (
  organization_id in (select id from organizations where user_id = auth.uid())
);
create policy "specs_insert" on specifications for insert with check (
  organization_id in (select id from organizations where user_id = auth.uid())
);
create policy "specs_update" on specifications for update using (
  organization_id in (select id from organizations where user_id = auth.uid())
);
create policy "specs_delete" on specifications for delete using (
  organization_id in (select id from organizations where user_id = auth.uid())
);

-- ── custom_templates ─────────────────────────────────────────────────────────
alter table custom_templates enable row level security;

drop policy if exists "tpl_select" on custom_templates;
drop policy if exists "tpl_insert" on custom_templates;
drop policy if exists "tpl_update" on custom_templates;
drop policy if exists "tpl_delete" on custom_templates;

create policy "tpl_select" on custom_templates for select using (
  organization_id in (select id from organizations where user_id = auth.uid())
);
create policy "tpl_insert" on custom_templates for insert with check (
  organization_id in (select id from organizations where user_id = auth.uid())
);
create policy "tpl_update" on custom_templates for update using (
  organization_id in (select id from organizations where user_id = auth.uid())
);
create policy "tpl_delete" on custom_templates for delete using (
  organization_id in (select id from organizations where user_id = auth.uid())
);

-- ── ai_documents ─────────────────────────────────────────────────────────────
-- Replace the open "for all using (true)" policy from ai_documents.sql
drop policy if exists "ai_documents_all" on ai_documents;

drop policy if exists "ai_docs_select" on ai_documents;
drop policy if exists "ai_docs_insert" on ai_documents;
drop policy if exists "ai_docs_update" on ai_documents;
drop policy if exists "ai_docs_delete" on ai_documents;

create policy "ai_docs_select" on ai_documents for select using (
  organization_id in (select id from organizations where user_id = auth.uid())
);
create policy "ai_docs_insert" on ai_documents for insert with check (
  organization_id in (select id from organizations where user_id = auth.uid())
);
create policy "ai_docs_update" on ai_documents for update using (
  organization_id in (select id from organizations where user_id = auth.uid())
);
create policy "ai_docs_delete" on ai_documents for delete using (
  organization_id in (select id from organizations where user_id = auth.uid())
);
