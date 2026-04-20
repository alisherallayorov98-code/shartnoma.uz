-- ============================================================
-- Shartnoma.uz / Kabinetim.uz — Full Schema
-- Apply to self-hosted Supabase PostgreSQL
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ─────────────────────────────────────────────────────────────
-- 1. profiles
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name      text,
  last_name       text,
  phone           text,
  full_name       text,
  company_name    text,
  company_inn     text,
  company_director text,
  company_bank    text,
  company_account text,
  company_mfo     text,
  company_address text,
  lavozim         text,
  avatar_url      text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, created_at, updated_at)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 2. organizations
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organizations (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name                text,
  inn                 text,
  director_name       text,
  bank_name           text,
  bank_account        text,
  mfo                 text,
  address             text,
  phone               text,
  oked                text,
  viloyat             text,
  tuman               text,
  qqsreg              text,
  qqs_stavka          text,
  director_pinfl      text,
  chief_accountant    text,
  sender_pinfl        text,
  sender_name         text,
  admin_note          text,
  ustav_kapital       text,
  full_name           text,
  status              text,
  status_text         text,
  oked_name           text,
  reg_date            text,
  reg_number          text,
  opf_name            text,
  business_structure  text,
  tax_mode            text,
  taxpayer_type       integer,
  soato               text,
  soogu               text,
  postcode            text,
  soliq_synced_at     timestamptz,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organizations_user_id ON public.organizations(user_id);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orgs_select" ON public.organizations;
DROP POLICY IF EXISTS "orgs_insert" ON public.organizations;
DROP POLICY IF EXISTS "orgs_update" ON public.organizations;
DROP POLICY IF EXISTS "orgs_delete" ON public.organizations;
CREATE POLICY "orgs_select" ON public.organizations FOR SELECT USING (
  user_id = auth.uid()
  OR id IN (SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active')
);
CREATE POLICY "orgs_insert" ON public.organizations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "orgs_update" ON public.organizations FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "orgs_delete" ON public.organizations FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 3. org_members
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_members (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email   text,
  role            text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT org_members_user_or_email CHECK (user_id IS NOT NULL OR invited_email IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS org_members_org_user
  ON public.org_members(organization_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS org_members_org_email
  ON public.org_members(organization_id, invited_email) WHERE invited_email IS NOT NULL AND user_id IS NULL;

ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_members_select" ON public.org_members;
DROP POLICY IF EXISTS "org_members_insert" ON public.org_members;
DROP POLICY IF EXISTS "org_members_update" ON public.org_members;
DROP POLICY IF EXISTS "org_members_delete" ON public.org_members;
CREATE POLICY "org_members_select" ON public.org_members FOR SELECT USING (
  organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid())
  OR user_id = auth.uid()
);
CREATE POLICY "org_members_insert" ON public.org_members FOR INSERT WITH CHECK (
  organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid())
);
CREATE POLICY "org_members_update" ON public.org_members FOR UPDATE USING (
  organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid())
  OR user_id = auth.uid()
  OR (status = 'pending' AND invited_email = auth.email())
);
CREATE POLICY "org_members_delete" ON public.org_members FOR DELETE USING (
  organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid())
);

-- ─────────────────────────────────────────────────────────────
-- 4. counterparties
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.counterparties (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text,
  inn         text,
  address     text,
  director    text,
  bank_account text,
  mfo         text,
  phone       text,
  oked        text,
  stir        text,
  jshshir     text,
  reg_date    text,
  opf         text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS counterparties_user_id ON public.counterparties(user_id);

ALTER TABLE public.counterparties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cp_select" ON public.counterparties;
DROP POLICY IF EXISTS "cp_insert" ON public.counterparties;
DROP POLICY IF EXISTS "cp_update" ON public.counterparties;
DROP POLICY IF EXISTS "cp_delete" ON public.counterparties;
CREATE POLICY "cp_select" ON public.counterparties FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "cp_insert" ON public.counterparties FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "cp_update" ON public.counterparties FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "cp_delete" ON public.counterparties FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 5. bank_accounts
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name       text,
  account_number  text,
  mfo             text,
  is_default      boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS bank_accounts_is_default_idx ON public.bank_accounts (organization_id, is_default DESC);

ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "banks_select" ON public.bank_accounts;
DROP POLICY IF EXISTS "banks_insert" ON public.bank_accounts;
DROP POLICY IF EXISTS "banks_update" ON public.bank_accounts;
DROP POLICY IF EXISTS "banks_delete" ON public.bank_accounts;
CREATE POLICY "banks_select" ON public.bank_accounts FOR SELECT USING (
  user_id = auth.uid()
  OR organization_id IN (SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active')
);
CREATE POLICY "banks_insert" ON public.bank_accounts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "banks_update" ON public.bank_accounts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "banks_delete" ON public.bank_accounts FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 6. subscriptions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan            text,
  started_at      timestamptz,
  expires_at      timestamptz,
  payment_id      text,
  auto_renew      boolean DEFAULT false,
  contract_count  integer DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subs_select" ON public.subscriptions;
DROP POLICY IF EXISTS "subs_insert" ON public.subscriptions;
DROP POLICY IF EXISTS "subs_update" ON public.subscriptions;
DROP POLICY IF EXISTS "subs_delete" ON public.subscriptions;
CREATE POLICY "subs_select" ON public.subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "subs_insert" ON public.subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "subs_update" ON public.subscriptions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "subs_delete" ON public.subscriptions FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 7. demo_access
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.demo_access (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  activated_at timestamptz,
  expires_at   timestamptz,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.demo_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demo_select" ON public.demo_access FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "demo_insert" ON public.demo_access FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "demo_update" ON public.demo_access FOR UPDATE USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 8. payments
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount     numeric,
  currency   text DEFAULT 'UZS',
  provider   text,
  status     text DEFAULT 'pending',
  plan       text,
  months     integer DEFAULT 1,
  meta       jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select" ON public.payments FOR SELECT USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 9. contracts
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contracts (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  counterparty_id uuid REFERENCES public.counterparties(id) ON DELETE SET NULL,
  contract_number text,
  contract_date   date,
  contract_type   text,
  amount          numeric,
  currency        text DEFAULT 'UZS',
  end_date        date,
  status          text DEFAULT 'draft',
  description     text,
  content         text,
  city            text,
  product_name    text,
  spec_items      jsonb DEFAULT '[]'::jsonb,
  qqs_enabled     boolean DEFAULT false,
  qqs_rate        integer DEFAULT 12,
  extra_data      jsonb DEFAULT '{}'::jsonb,
  search_vector   tsvector,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contracts_user_id ON public.contracts(user_id);
CREATE INDEX IF NOT EXISTS contracts_org_id ON public.contracts(organization_id);
CREATE INDEX IF NOT EXISTS contracts_search_vector ON public.contracts USING GIN(search_vector);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contracts_select" ON public.contracts;
DROP POLICY IF EXISTS "contracts_insert" ON public.contracts;
DROP POLICY IF EXISTS "contracts_update" ON public.contracts;
DROP POLICY IF EXISTS "contracts_delete" ON public.contracts;
CREATE POLICY "contracts_select" ON public.contracts FOR SELECT USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
  )
);
CREATE POLICY "contracts_insert" ON public.contracts FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
  )
);
CREATE POLICY "contracts_update" ON public.contracts FOR UPDATE USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
  )
);
CREATE POLICY "contracts_delete" ON public.contracts FOR DELETE USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- ─────────────────────────────────────────────────────────────
-- 10. contract_versions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_versions (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id  uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  version      int NOT NULL,
  content      text,
  amount       numeric,
  status       text,
  saved_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS cv_contract ON public.contract_versions(contract_id, version DESC);

ALTER TABLE public.contract_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cv_select" ON public.contract_versions FOR SELECT USING (
  contract_id IN (SELECT id FROM public.contracts WHERE user_id = auth.uid())
);
CREATE POLICY "cv_insert" ON public.contract_versions FOR INSERT WITH CHECK (
  contract_id IN (SELECT id FROM public.contracts WHERE user_id = auth.uid())
);

-- ─────────────────────────────────────────────────────────────
-- 11. specifications
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.specifications (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  contract_id     uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  items           jsonb DEFAULT '[]'::jsonb,
  total_amount    numeric DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.specifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "specs_select" ON public.specifications;
DROP POLICY IF EXISTS "specs_insert" ON public.specifications;
DROP POLICY IF EXISTS "specs_update" ON public.specifications;
DROP POLICY IF EXISTS "specs_delete" ON public.specifications;
CREATE POLICY "specs_select" ON public.specifications FOR SELECT USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
  )
);
CREATE POLICY "specs_insert" ON public.specifications FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
  )
);
CREATE POLICY "specs_update" ON public.specifications FOR UPDATE USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
  )
);
CREATE POLICY "specs_delete" ON public.specifications FOR DELETE USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- ─────────────────────────────────────────────────────────────
-- 12. contract_templates
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_templates (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text,
  type       text,
  language   text DEFAULT 'uz',
  content    text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ct_select" ON public.contract_templates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "ct_insert" ON public.contract_templates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "ct_update" ON public.contract_templates FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "ct_delete" ON public.contract_templates FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 13. custom_templates
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.custom_templates (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            text,
  type            text,
  language        text DEFAULT 'uz',
  content         text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.custom_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tpl_select" ON public.custom_templates;
DROP POLICY IF EXISTS "tpl_insert" ON public.custom_templates;
DROP POLICY IF EXISTS "tpl_update" ON public.custom_templates;
DROP POLICY IF EXISTS "tpl_delete" ON public.custom_templates;
CREATE POLICY "tpl_select" ON public.custom_templates FOR SELECT USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
  )
);
CREATE POLICY "tpl_insert" ON public.custom_templates FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
  )
);
CREATE POLICY "tpl_update" ON public.custom_templates FOR UPDATE USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
  )
);
CREATE POLICY "tpl_delete" ON public.custom_templates FOR DELETE USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- ─────────────────────────────────────────────────────────────
-- 14. employees
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.employees (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  ism             text NOT NULL,
  jshshir         text,
  passport        text,
  lavozim         text,
  bolim           text,
  maosh           text,
  ish_boshi       date,
  status          text DEFAULT 'active',
  tel             text,
  tugilgan_sana   date,
  manzil          text,
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS tugilgan_sana date;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS manzil        text;

CREATE INDEX IF NOT EXISTS employees_org_idx ON public.employees(organization_id);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "employees_select" ON public.employees;
DROP POLICY IF EXISTS "employees_insert" ON public.employees;
DROP POLICY IF EXISTS "employees_update" ON public.employees;
DROP POLICY IF EXISTS "employees_delete" ON public.employees;
CREATE POLICY "employees_select" ON public.employees FOR SELECT USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
  )
);
CREATE POLICY "employees_insert" ON public.employees FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
  )
);
CREATE POLICY "employees_update" ON public.employees FOR UPDATE USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
  )
);
CREATE POLICY "employees_delete" ON public.employees FOR DELETE USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- ─────────────────────────────────────────────────────────────
-- 15. tasischilar
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasischilar (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  full_name   text NOT NULL,
  ulush       numeric(6,2) NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.tasischilar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasischilar_select" ON public.tasischilar;
DROP POLICY IF EXISTS "tasischilar_insert" ON public.tasischilar;
DROP POLICY IF EXISTS "tasischilar_delete" ON public.tasischilar;
CREATE POLICY "tasischilar_select" ON public.tasischilar FOR SELECT USING (
  org_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid())
);
CREATE POLICY "tasischilar_insert" ON public.tasischilar FOR INSERT WITH CHECK (
  org_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid())
);
CREATE POLICY "tasischilar_delete" ON public.tasischilar FOR DELETE USING (
  org_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid())
);

-- ─────────────────────────────────────────────────────────────
-- 16. ai_documents
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_documents (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  section         text NOT NULL,
  feature_key     text NOT NULL,
  title           text NOT NULL,
  content         text NOT NULL,
  meta            jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS ai_documents_org_section ON public.ai_documents(organization_id, section);

ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_documents_all" ON public.ai_documents;
DROP POLICY IF EXISTS "ai_docs_select" ON public.ai_documents;
DROP POLICY IF EXISTS "ai_docs_insert" ON public.ai_documents;
DROP POLICY IF EXISTS "ai_docs_update" ON public.ai_documents;
DROP POLICY IF EXISTS "ai_docs_delete" ON public.ai_documents;
CREATE POLICY "ai_docs_select" ON public.ai_documents FOR SELECT USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
  )
);
CREATE POLICY "ai_docs_insert" ON public.ai_documents FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
  )
);
CREATE POLICY "ai_docs_update" ON public.ai_documents FOR UPDATE USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
  )
);
CREATE POLICY "ai_docs_delete" ON public.ai_documents FOR DELETE USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE user_id = auth.uid()
    UNION
    SELECT organization_id FROM public.org_members WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- ─────────────────────────────────────────────────────────────
-- 17. org_documents
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_documents (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  type            text,
  content         text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.org_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_docs_select" ON public.org_documents FOR SELECT USING (
  organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid())
);
CREATE POLICY "org_docs_insert" ON public.org_documents FOR INSERT WITH CHECK (
  organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid())
);
CREATE POLICY "org_docs_update" ON public.org_documents FOR UPDATE USING (
  organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid())
);
CREATE POLICY "org_docs_delete" ON public.org_documents FOR DELETE USING (
  organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid())
);

-- ─────────────────────────────────────────────────────────────
-- 18. admins
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admins (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins_deny_all" ON public.admins;
CREATE POLICY "admins_deny_all" ON public.admins FOR ALL USING (false);

-- ─────────────────────────────────────────────────────────────
-- 19. audit_logs
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action      text NOT NULL,
  table_name  text NOT NULL,
  record_id   uuid,
  meta        jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS audit_logs_user   ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_record ON public.audit_logs(table_name, record_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_own_select" ON public.audit_logs FOR SELECT USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 20. system_settings
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_settings (
  key        text PRIMARY KEY,
  value      text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone_read_settings" ON public.system_settings;
DROP POLICY IF EXISTS "service_role_write_settings" ON public.system_settings;
CREATE POLICY "anyone_read_settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "service_role_write_settings" ON public.system_settings FOR ALL USING (auth.role() = 'service_role');

INSERT INTO public.system_settings (key, value) VALUES
  ('free_contract_limit', '5'),
  ('standard_contract_limit', '999999'),
  ('ai_pro_contract_limit', '999999'),
  ('maintenance_mode', 'false'),
  ('announcement', ''),
  ('announcement_color', 'blue'),
  ('standard_price', '99000'),
  ('ai_pro_price', '199000')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 21. system_templates
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_templates (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type       text NOT NULL,
  language   text NOT NULL DEFAULT 'uz',
  name       text NOT NULL,
  content    text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS system_templates_type_lang ON public.system_templates(type, language);

ALTER TABLE public.system_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_system_templates" ON public.system_templates;
CREATE POLICY "service_role_system_templates" ON public.system_templates USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────
-- 22. site_content
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_content (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key        text NOT NULL UNIQUE,
  label      text NOT NULL,
  type       text NOT NULL DEFAULT 'text',
  value      text NOT NULL DEFAULT '',
  file_url   text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone_read_content" ON public.site_content;
DROP POLICY IF EXISTS "service_role_write_content" ON public.site_content;
CREATE POLICY "anyone_read_content" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "service_role_write_content" ON public.site_content FOR ALL USING (auth.role() = 'service_role');

INSERT INTO public.site_content (key, label, type, value) VALUES
  ('hero_title', 'Bosh sahifa — asosiy sarlavha', 'text', 'Biznesingiz hujjatlarini avtomatlashtiring'),
  ('hero_subtitle', 'Bosh sahifa — tavsif', 'text', 'Shartnomalar, kadrlar, buxgalteriya — barchasi bitta joyda'),
  ('hero_image', 'Bosh sahifa — asosiy rasm', 'image', ''),
  ('about_video', 'Haqida — video', 'video', ''),
  ('features_title', 'Imkoniyatlar — sarlavha', 'text', 'Nega Kabinetim.uz?'),
  ('cta_title', 'Chaqiruv — sarlavha', 'text', 'Hoziroq boshlang'),
  ('cta_subtitle', 'Chaqiruv — tavsif', 'text', 'Bepul ro''yxatdan o''ting')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 23. announcements
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        text,
  body         text,
  message      text,
  type         text DEFAULT 'yangilik',
  color        text DEFAULT 'blue',
  link_url     text,
  link_text    text,
  is_published boolean DEFAULT false,
  target_plan  text,
  expires_at   timestamptz,
  created_at   timestamptz DEFAULT now()
);
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS body         text;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS type         text DEFAULT 'yangilik';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS link_url     text;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS link_text    text;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "announcements_read" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "announcements_write" ON public.announcements FOR ALL USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────
-- 24. announcement_reads
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id uuid REFERENCES public.announcements(id) ON DELETE CASCADE,
  read_at         timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS announcement_reads_unique
  ON public.announcement_reads(user_id, announcement_id);

ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reads_select" ON public.announcement_reads FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "reads_insert" ON public.announcement_reads FOR INSERT WITH CHECK (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 25. feedback
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feedback (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message    text,
  type       text DEFAULT 'general',
  status     text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feedback_insert" ON public.feedback FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "feedback_select" ON public.feedback FOR SELECT USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- 26. support_sessions + support_messages
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_sessions (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text,
  org_name   text,
  org_id     uuid,
  plan       text DEFAULT 'free',
  status     text DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid REFERENCES public.support_sessions(id) ON DELETE CASCADE,
  role       text NOT NULL,
  content    text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_sessions_user_id_idx ON public.support_sessions(user_id);
CREATE INDEX IF NOT EXISTS support_messages_session_id_idx ON public.support_messages(session_id);

ALTER TABLE public.support_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages  ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_sessions" ON public.support_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "user_own_messages" ON public.support_messages FOR ALL USING (
  session_id IN (SELECT id FROM public.support_sessions WHERE user_id = auth.uid())
);

-- ─────────────────────────────────────────────────────────────
-- 27. global_companies
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.global_companies (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  inn        text UNIQUE,
  name       text,
  director   text,
  address    text,
  raw_data   jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.global_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "global_companies_read" ON public.global_companies FOR SELECT USING (true);
CREATE POLICY "global_companies_write" ON public.global_companies FOR ALL USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────
-- Grant permissions
-- ─────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
