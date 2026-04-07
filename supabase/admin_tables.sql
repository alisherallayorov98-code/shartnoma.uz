-- =====================================================
-- Admin panel uchun yangi jadvallar
-- =====================================================

-- 1. system_templates: admin tomonidan tahrirlash mumkin bo'lgan shartnoma shablonlari
create table if not exists system_templates (
  id uuid primary key default gen_random_uuid(),
  type text not null,        -- oldi_sotdi, xizmat, ijara...
  language text not null default 'uz',  -- uz, oz, ru
  name text not null,
  content text not null default '',
  updated_at timestamptz not null default now()
);

create unique index if not exists system_templates_type_lang
  on system_templates(type, language);

alter table system_templates enable row level security;
-- Faqat service_role o'qiy/yoza oladi
create policy "service_role_system_templates" on system_templates
  using (auth.role() = 'service_role');


-- 2. system_settings: tizim sozlamalari (key-value)
create table if not exists system_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table system_settings enable row level security;

-- Barcha foydalanuvchilar o'qiy oladi (maintenance_mode, announcement uchun)
create policy "anyone_read_settings" on system_settings
  for select using (true);

-- Faqat service_role yoza oladi
create policy "service_role_write_settings" on system_settings
  for all using (auth.role() = 'service_role');

-- Default sozlamalar
insert into system_settings (key, value) values
  ('free_contract_limit', '5'),
  ('standard_contract_limit', '999999'),
  ('ai_pro_contract_limit', '999999'),
  ('maintenance_mode', 'false'),
  ('announcement', ''),
  ('announcement_color', 'blue'),
  ('standard_price', '99000'),
  ('ai_pro_price', '199000')
on conflict (key) do nothing;


-- 3. site_content: admin tomonidan boshqariladigan kontent (rasmlar, videolar, matnlar)
create table if not exists site_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  type text not null default 'text',  -- text, image, video
  value text not null default '',
  file_url text,
  updated_at timestamptz not null default now()
);

alter table site_content enable row level security;

-- Barcha foydalanuvchilar o'qiy oladi
create policy "anyone_read_content" on site_content
  for select using (true);

-- Faqat service_role yoza oladi
create policy "service_role_write_content" on site_content
  for all using (auth.role() = 'service_role');

-- Default kontent kalitlari
insert into site_content (key, label, type, value) values
  ('hero_title', 'Bosh sahifa — asosiy sarlavha', 'text', 'Biznesingiz hujjatlarini avtomatlashtiring'),
  ('hero_subtitle', 'Bosh sahifa — tavsif', 'text', 'Shartnomalar, kadrlar, buxgalteriya — barchasi bitta joyda'),
  ('hero_image', 'Bosh sahifa — asosiy rasm', 'image', ''),
  ('about_video', 'Haqida — video', 'video', ''),
  ('features_title', 'Imkoniyatlar — sarlavha', 'text', 'Nega Kabinetim.uz?'),
  ('cta_title', 'Chaqiruv — sarlavha', 'text', 'Hoziroq boshlang'),
  ('cta_subtitle', 'Chaqiruv — tavsif', 'text', 'Bepul ro\'yxatdan o\'ting')
on conflict (key) do nothing;
