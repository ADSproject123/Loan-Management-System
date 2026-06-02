alter table savings
  add column if not exists currency text not null default 'USD';

alter table loans
  add column if not exists currency text not null default 'USD';

alter table loan_repayments
  add column if not exists currency text not null default 'USD';

alter table capital_requests
  add column if not exists currency text not null default 'USD';
