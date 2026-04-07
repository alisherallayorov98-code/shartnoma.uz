-- Media storage bucket (rasm va video yuklash uchun)
-- Supabase Dashboard → Storage da qo'lda yaratish kerak:
-- Bucket nomi: media
-- Public: true (rasmlar ochiq ko'rinishi uchun)

-- Yoki quyidagi SQL orqali:
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Barcha foydalanuvchilar o'qiy oladi
create policy "anyone_read_media" on storage.objects
  for select using (bucket_id = 'media');

-- Faqat autentifikatsiyalangan foydalanuvchilar yuklaydi
create policy "auth_upload_media" on storage.objects
  for insert with check (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Faqat autentifikatsiyalangan foydalanuvchilar o'chiradi
create policy "auth_delete_media" on storage.objects
  for delete using (bucket_id = 'media' AND auth.role() = 'authenticated');
