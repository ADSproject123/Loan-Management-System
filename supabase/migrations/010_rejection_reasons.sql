alter table loans
  add column if not exists rejection_reason text,
  add column if not exists rejected_at timestamptz;

alter table capital_requests
  add column if not exists rejection_reason text;
