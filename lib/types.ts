// ─── Shared types for Shartnoma.uz dashboard ─────────────────────────────────

export type Org = {
  id: string; name: string; inn: string; director_name: string
  bank_name: string; bank_account: string; mfo: string; address: string
  stamp_url?: string; signature_url?: string
  phone?: string; oked?: string; viloyat?: string; tuman?: string
  qqsreg?: string; qqs_stavka?: string
  director_pinfl?: string; chief_accountant?: string
  sender_pinfl?: string; sender_name?: string
}

export type BankAccount = {
  id: string; organization_id: string; bank_name: string
  account_number: string; mfo: string; is_default: boolean
}

export type Counterparty = {
  id: string; name: string; inn: string; director_name: string
  bank_name: string; bank_account: string; mfo: string; address: string
  phone?: string; qqsreg?: string
}

export type SpecItem = {
  nomi: string; birlik: string; miqdori: number; narxi: number
  qqs_foiz: string   // 'siz' | '0' | '12' | '15'
  qqs_summa: number
  summa: number      // narx*miqdor + qqs_summa
}

export type Contract = {
  id: string; contract_number: string; contract_date: string
  contract_type: string; amount: number; status: string
  organization_id: string; counterparty_id: string
  organizations?: Org; counterparties?: Counterparty; created_at: string
  content?: string; city?: string; product_name?: string
  spec_items?: SpecItem[]; qqs_enabled?: boolean; qqs_rate?: number
  signed_us?: boolean; signed_cp?: boolean
}

export type Specification = {
  id: string
  organization_id: string
  contract_id: string | null
  spec_number: string
  items: SpecItem[]
  notes: string
  created_at: string
  contracts?: {
    contract_number: string; contract_date: string
    contract_type?: string; counterparty_id?: string
    counterparties?: { name: string }
  }
}

export type Subscription = {
  id: string; organization_id: string; plan: string
  contracts_used: number; period_end: string; is_active: boolean
}
