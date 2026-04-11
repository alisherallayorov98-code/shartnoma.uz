-- Support chat sessions
create table if not exists support_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade,
  user_email  text,
  org_name    text,
  org_id      uuid,
  plan        text default 'free',
  status      text default 'open',   -- open | closed
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Support messages
create table if not exists support_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references support_sessions on delete cascade,
  role        text not null,         -- 'user' | 'assistant'
  content     text not null,
  created_at  timestamptz default now()
);

-- Indexes
create index if not exists support_sessions_user_id_idx on support_sessions(user_id);
create index if not exists support_messages_session_id_idx on support_messages(session_id);

-- RLS
alter table support_sessions enable row level security;
alter table support_messages  enable row level security;

-- User can only see their own sessions
create policy "user_own_sessions" on support_sessions
  for all using (auth.uid() = user_id);

create policy "user_own_messages" on support_messages
  for all using (
    session_id in (select id from support_sessions where user_id = auth.uid())
  );
