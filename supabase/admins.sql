-- ═══════════════════════════════════════════════════════════════════════════
-- Admins table — replaces ADMIN_EMAILS env var
-- Run once in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now() not null
);

-- Only service_role can read/write (admin API uses service role key)
alter table admins enable row level security;
create policy "admins_deny_all" on admins for all using (false);

-- ─── Add your admin users ────────────────────────────────────────────────────
-- After creating this table, insert admin user IDs:
--
-- insert into admins (user_id)
-- select id from auth.users where email = 'admin@shartnoma.uz'
-- on conflict do nothing;
--
-- insert into admins (user_id)
-- select id from auth.users where email = 'alisherallayorov98@gmail.com'
-- on conflict do nothing;
