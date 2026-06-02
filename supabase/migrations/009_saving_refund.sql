alter type saving_status add value if not exists 'refunded';

alter table savings
  add column if not exists refund_reason text,
  add column if not exists refunded_at timestamptz,
  add column if not exists refunded_by uuid references members(id);
