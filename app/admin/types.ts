export type Client = {
  id: string; name: string; inn: string; address: string
  created_at: string; user_id: string; user_email: string
  admin_note: string; last_login: string; last_contract: string
  sub_id?: string; plan: string; period_end?: string
  is_active?: boolean; contracts_used?: number
  contracts_count: number; demo_expires?: string; demo_active?: boolean
}

export type DemoRow = {
  id: string; organization_id: string; expires_at: string
  note: string; is_active: boolean; created_at: string
  org_name?: string; org_inn?: string
}

export type Payment = {
  id: string; organization_id: string; amount: number
  currency: string; plan: string; note: string; created_at: string
  organizations?: { name: string; inn: string }
  org_name?: string; org_inn?: string
}

export type NewUser = {
  id: string; email: string; created_at: string; last_sign_in_at: string
}

export type Feedback = {
  id: string; user_email: string; category: string; title: string
  message: string; status: string; created_at: string
}

export type SysTemplate = {
  id: string; type: string; language: string; name: string; content: string; updated_at: string
}

export type SiteContent = {
  id: string; key: string; label: string; type: string; value: string; file_url: string | null; updated_at: string
}

export type Announcement = {
  id: string; title: string; body: string; type: string; is_published: boolean
  link_url: string | null; link_text: string | null; created_at: string
}

export type GlobalCompany = {
  id: string; inn: string; name: string; director: string | null; address: string | null
  mfo: string | null; bank_name: string | null; account: string | null; phone: string | null
  source: string; updated_at: string
}
