-- Read-only admin support role: can log into the admin dashboard and view
-- everything, but cannot create/update/delete anything. Enforcement happens
-- in src/app/actions/admin.ts and adminMessages.ts (requireFullAdmin), not
-- via RLS - admin pages read through the service-role client, which bypasses
-- RLS entirely, so a database-level restriction here would not be sufficient
-- on its own.
alter table members
  add column if not exists admin_access_level text
    check (admin_access_level in ('full', 'read_only'));

update members set admin_access_level = 'full' where is_admin = true;
