-- AI Documents table — run once in Supabase SQL editor
-- Stores kadrlar / buxgalter / kotiba AI-generated documents

create table if not exists ai_documents (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade not null,
  section         text not null,   -- 'kadrlar' | 'buxgalter' | 'kotiba'
  feature_key     text not null,   -- 'mehnat_shartnoma' | 'buyruq' | 'dalolatnoma' | ...
  title           text not null,
  content         text not null,
  meta            jsonb default '{}'::jsonb,
  created_at      timestamptz default now() not null
);

create index if not exists ai_documents_org_section
  on ai_documents(organization_id, section);

alter table ai_documents enable row level security;

-- Allow all operations for authenticated users (scoped by org ownership in app)
create policy "ai_documents_all" on ai_documents
  for all using (true) with check (true);
