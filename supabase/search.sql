-- ═══════════════════════════════════════════════════════════════════════════
-- Full-text search index for contracts
-- Run once in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Add a generated tsvector column for fast full-text search
alter table contracts
  add column if not exists search_vector tsvector
    generated always as (
      to_tsvector('simple',
        coalesce(contract_number, '') || ' ' ||
        coalesce(contract_type, '') || ' ' ||
        coalesce(product_name, '') || ' ' ||
        coalesce(status, '') || ' ' ||
        coalesce(content, '')
      )
    ) stored;

create index if not exists contracts_search_idx on contracts using gin(search_vector);

-- ─── Search function (called from API route) ─────────────────────────────────
create or replace function search_contracts(
  p_user_id uuid,
  p_query    text,
  p_limit    int default 50
)
returns setof contracts
language sql
stable
as $$
  select * from contracts
  where user_id = p_user_id
    and search_vector @@ plainto_tsquery('simple', p_query)
  order by created_at desc
  limit p_limit;
$$;
