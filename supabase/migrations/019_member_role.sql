-- Member role within the cooperative, assigned by an admin on acceptance.
-- 'member' is the default for existing and newly registered members.
alter table members
  add column if not exists role text not null default 'member'
    check (role in ('founder', 'comember', 'member'));
