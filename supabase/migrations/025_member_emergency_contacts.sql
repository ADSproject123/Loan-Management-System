alter table members
  add column if not exists emergency_contacts jsonb not null default '[]'::jsonb;
