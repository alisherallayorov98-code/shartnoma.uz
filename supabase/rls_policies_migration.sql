-- RLS Policies Migration
-- Fixes 400/406 errors for bank_accounts, demo_access, announcements

-- ============================================================
-- bank_accounts
-- ============================================================
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bank_accounts_select" ON public.bank_accounts;
CREATE POLICY "bank_accounts_select" ON public.bank_accounts
  FOR SELECT USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "bank_accounts_insert" ON public.bank_accounts;
CREATE POLICY "bank_accounts_insert" ON public.bank_accounts
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT id FROM public.organizations WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "bank_accounts_update" ON public.bank_accounts;
CREATE POLICY "bank_accounts_update" ON public.bank_accounts
  FOR UPDATE USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "bank_accounts_delete" ON public.bank_accounts;
CREATE POLICY "bank_accounts_delete" ON public.bank_accounts
  FOR DELETE USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- demo_access
-- ============================================================
ALTER TABLE public.demo_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "demo_access_select" ON public.demo_access;
CREATE POLICY "demo_access_select" ON public.demo_access
  FOR SELECT USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

-- ============================================================
-- announcements (public read for all authenticated users)
-- ============================================================
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcements_select" ON public.announcements;
CREATE POLICY "announcements_select" ON public.announcements
  FOR SELECT USING (is_published = true AND auth.role() = 'authenticated');

-- ============================================================
-- announcement_reads
-- ============================================================
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcement_reads_select" ON public.announcement_reads;
CREATE POLICY "announcement_reads_select" ON public.announcement_reads
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "announcement_reads_insert" ON public.announcement_reads;
CREATE POLICY "announcement_reads_insert" ON public.announcement_reads
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "announcement_reads_upsert" ON public.announcement_reads;
CREATE POLICY "announcement_reads_upsert" ON public.announcement_reads
  FOR UPDATE USING (user_id = auth.uid());
