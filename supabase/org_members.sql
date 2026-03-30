-- ═══════════════════════════════════════════════════════════════════════════
-- Org Members — multi-user organization access
-- Allows company owner to invite accountants/staff, they can leave/rejoin
-- without losing org data
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists org_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete cascade,
  invited_email   text,
  role            text not null default 'member' check (role in ('owner', 'member')),
  status          text not null default 'pending' check (status in ('pending', 'active')),
  created_at      timestamptz not null default now(),
  constraint org_members_user_or_email check (user_id is not null or invited_email is not null)
);

-- Unique: one member per org per user
create unique index if not exists org_members_org_user
  on org_members(organization_id, user_id) where user_id is not null;

-- Unique: one pending invite per email per org
create unique index if not exists org_members_org_email
  on org_members(organization_id, invited_email) where invited_email is not null and user_id is null;

alter table org_members enable row level security;

drop policy if exists "org_members_select"  on org_members;
drop policy if exists "org_members_insert"  on org_members;
drop policy if exists "org_members_update"  on org_members;
drop policy if exists "org_members_delete"  on org_members;

-- Org owner can see all members; member can see their own record
create policy "org_members_select" on org_members for select using (
  organization_id in (select id from organizations where user_id = auth.uid())
  or user_id = auth.uid()
);

-- Only org owner can add members
create policy "org_members_insert" on org_members for insert with check (
  organization_id in (select id from organizations where user_id = auth.uid())
);

-- Invited user can accept (update status to active + set their user_id); owner can update roles
create policy "org_members_update" on org_members for update using (
  organization_id in (select id from organizations where user_id = auth.uid())
  or user_id = auth.uid()
  or (status = 'pending' and invited_email = auth.email())
);

-- Only org owner can remove members
create policy "org_members_delete" on org_members for delete using (
  organization_id in (select id from organizations where user_id = auth.uid())
);

-- ── Migrate existing org owners as members ────────────────────────────────
-- After running this script, existing owners become members with role=owner
insert into org_members (organization_id, user_id, role, status)
select id, user_id, 'owner', 'active' from organizations
on conflict do nothing;

-- ── Update organizations RLS to allow member access ───────────────────────
-- Members can see orgs they belong to (in addition to orgs they own)
drop policy if exists "orgs_select" on organizations;
create policy "orgs_select" on organizations for select using (
  user_id = auth.uid()
  or id in (
    select organization_id from org_members
    where user_id = auth.uid() and status = 'active'
  )
);

-- ── Update child table RLS for shared org access ─────────────────────────
-- Helper: accessible org IDs for current user
-- (both owned orgs and member orgs)

-- contracts
drop policy if exists "contracts_select" on contracts;
create policy "contracts_select" on contracts for select using (
  organization_id in (
    select id from organizations where user_id = auth.uid()
    union
    select organization_id from org_members where user_id = auth.uid() and status = 'active'
  )
);
drop policy if exists "contracts_insert" on contracts;
create policy "contracts_insert" on contracts for insert with check (
  user_id = auth.uid()
  and organization_id in (
    select id from organizations where user_id = auth.uid()
    union
    select organization_id from org_members where user_id = auth.uid() and status = 'active'
  )
);
drop policy if exists "contracts_update" on contracts;
create policy "contracts_update" on contracts for update using (
  organization_id in (
    select id from organizations where user_id = auth.uid()
    union
    select organization_id from org_members where user_id = auth.uid() and status = 'active'
  )
);
drop policy if exists "contracts_delete" on contracts;
create policy "contracts_delete" on contracts for delete using (
  organization_id in (
    select id from organizations where user_id = auth.uid()
    union
    select organization_id from org_members where user_id = auth.uid() and status = 'active'
  )
);

-- bank_accounts
drop policy if exists "banks_select" on bank_accounts;
create policy "banks_select" on bank_accounts for select using (
  organization_id in (
    select id from organizations where user_id = auth.uid()
    union
    select organization_id from org_members where user_id = auth.uid() and status = 'active'
  )
);

-- employees
drop policy if exists "employees_select" on employees;
create policy "employees_select" on employees for select using (
  organization_id in (
    select id from organizations where user_id = auth.uid()
    union
    select organization_id from org_members where user_id = auth.uid() and status = 'active'
  )
);
drop policy if exists "employees_insert" on employees;
create policy "employees_insert" on employees for insert with check (
  organization_id in (
    select id from organizations where user_id = auth.uid()
    union
    select organization_id from org_members where user_id = auth.uid() and status = 'active'
  )
);
drop policy if exists "employees_update" on employees;
create policy "employees_update" on employees for update using (
  organization_id in (
    select id from organizations where user_id = auth.uid()
    union
    select organization_id from org_members where user_id = auth.uid() and status = 'active'
  )
);
drop policy if exists "employees_delete" on employees;
create policy "employees_delete" on employees for delete using (
  organization_id in (
    select id from organizations where user_id = auth.uid()
    union
    select organization_id from org_members where user_id = auth.uid() and status = 'active'
  )
);

-- specifications
drop policy if exists "specs_select" on specifications;
create policy "specs_select" on specifications for select using (
  organization_id in (
    select id from organizations where user_id = auth.uid()
    union
    select organization_id from org_members where user_id = auth.uid() and status = 'active'
  )
);
drop policy if exists "specs_insert" on specifications;
create policy "specs_insert" on specifications for insert with check (
  organization_id in (
    select id from organizations where user_id = auth.uid()
    union
    select organization_id from org_members where user_id = auth.uid() and status = 'active'
  )
);
drop policy if exists "specs_update" on specifications;
create policy "specs_update" on specifications for update using (
  organization_id in (
    select id from organizations where user_id = auth.uid()
    union
    select organization_id from org_members where user_id = auth.uid() and status = 'active'
  )
);
drop policy if exists "specs_delete" on specifications;
create policy "specs_delete" on specifications for delete using (
  organization_id in (
    select id from organizations where user_id = auth.uid()
    union
    select organization_id from org_members where user_id = auth.uid() and status = 'active'
  )
);

-- custom_templates
drop policy if exists "tpl_select" on custom_templates;
create policy "tpl_select" on custom_templates for select using (
  organization_id in (
    select id from organizations where user_id = auth.uid()
    union
    select organization_id from org_members where user_id = auth.uid() and status = 'active'
  )
);
drop policy if exists "tpl_insert" on custom_templates;
create policy "tpl_insert" on custom_templates for insert with check (
  organization_id in (
    select id from organizations where user_id = auth.uid()
    union
    select organization_id from org_members where user_id = auth.uid() and status = 'active'
  )
);
drop policy if exists "tpl_update" on custom_templates;
create policy "tpl_update" on custom_templates for update using (
  organization_id in (
    select id from organizations where user_id = auth.uid()
    union
    select organization_id from org_members where user_id = auth.uid() and status = 'active'
  )
);
drop policy if exists "tpl_delete" on custom_templates;
create policy "tpl_delete" on custom_templates for delete using (
  organization_id in (
    select id from organizations where user_id = auth.uid()
    union
    select organization_id from org_members where user_id = auth.uid() and status = 'active'
  )
);

-- ai_documents
drop policy if exists "ai_docs_select" on ai_documents;
create policy "ai_docs_select" on ai_documents for select using (
  organization_id in (
    select id from organizations where user_id = auth.uid()
    union
    select organization_id from org_members where user_id = auth.uid() and status = 'active'
  )
);
drop policy if exists "ai_docs_insert" on ai_documents;
create policy "ai_docs_insert" on ai_documents for insert with check (
  organization_id in (
    select id from organizations where user_id = auth.uid()
    union
    select organization_id from org_members where user_id = auth.uid() and status = 'active'
  )
);
drop policy if exists "ai_docs_update" on ai_documents;
create policy "ai_docs_update" on ai_documents for update using (
  organization_id in (
    select id from organizations where user_id = auth.uid()
    union
    select organization_id from org_members where user_id = auth.uid() and status = 'active'
  )
);
drop policy if exists "ai_docs_delete" on ai_documents;
create policy "ai_docs_delete" on ai_documents for delete using (
  organization_id in (
    select id from organizations where user_id = auth.uid()
    union
    select organization_id from org_members where user_id = auth.uid() and status = 'active'
  )
);
