alter table members
  add column if not exists suspension_reason text,
  add column if not exists suspended_at timestamptz;
