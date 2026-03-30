-- ═══════════════════════════════════════════════════════════════════════════
-- Feedback / Suggestions table
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists feedback (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  user_email      text,
  category        text not null check (category in ('bug', 'taklif', 'savol', 'boshqa')),
  title           text not null,
  message         text not null,
  status          text not null default 'new' check (status in ('new', 'seen', 'done')),
  created_at      timestamptz not null default now()
);

alter table feedback enable row level security;

drop policy if exists "feedback_insert" on feedback;
drop policy if exists "feedback_select" on feedback;

-- Users can submit feedback
create policy "feedback_insert" on feedback
  for insert with check (user_id = auth.uid());

-- Users can see their own feedback
create policy "feedback_select" on feedback
  for select using (user_id = auth.uid());
