-- Add is_default column to bank_accounts (was missing, causing console errors)
alter table bank_accounts add column if not exists is_default boolean default false;

-- Ensure order-by works correctly
create index if not exists bank_accounts_is_default_idx on bank_accounts (organization_id, is_default desc);
