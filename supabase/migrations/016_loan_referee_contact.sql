alter table loans
  add column if not exists referee_name text,
  add column if not exists referee_phone text,
  add column if not exists referee_email text;
