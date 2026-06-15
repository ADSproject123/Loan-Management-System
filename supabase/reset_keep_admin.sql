-- ============================================================
-- RESET SCRIPT — wipes everything, keeps only the admin.
-- Run in the Supabase SQL Editor (Dashboard → SQL Editor → Run).
-- ============================================================

-- 1. Null out referee links so FK doesn't block member deletes.
update members
set referee_id = null
where referee_id in (select id from members where is_admin = false);

-- 2. Delete all non-admin members (cascades to savings, loans,
--    loan_repayments, capital_requests, report_requests,
--    notifications, verification_codes).
delete from members where is_admin = false;

-- 3. Delete ALL auth users except the admin's auth user.
--    This catches orphaned auth users (e.g. the email you tried to
--    re-register with) that have no matching members row.
delete from auth.users
where id not in (
  select auth_user_id
  from members
  where is_admin = true
    and auth_user_id is not null 
);
