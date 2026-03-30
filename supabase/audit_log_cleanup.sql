-- ═══════════════════════════════════════════════════════════════════════════
-- Audit Log Cleanup — keeps only last 90 days of audit logs
-- Run in Supabase SQL Editor, then optionally schedule with pg_cron
-- ═══════════════════════════════════════════════════════════════════════════

-- Function: delete audit logs older than N days
create or replace function cleanup_audit_logs(keep_days int default 90)
returns void language plpgsql security definer as $$
begin
  delete from audit_logs
  where created_at < now() - (keep_days || ' days')::interval;
end;
$$;

-- Run once immediately to clean existing old records
select cleanup_audit_logs(90);

-- ── Optional: schedule with pg_cron (run once per day at 02:00) ───────────
-- Enable pg_cron extension first: Extensions → pg_cron
--
-- select cron.schedule(
--   'cleanup-audit-logs-daily',
--   '0 2 * * *',
--   $$ select cleanup_audit_logs(90); $$
-- );
