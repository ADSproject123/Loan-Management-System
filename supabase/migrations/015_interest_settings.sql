-- Global interest rates managed by admins.
create table interest_settings (
  id smallint primary key default 1 check (id = 1),
  monthly_saving_interest_rate decimal(5, 2) not null default 3.00
    check (monthly_saving_interest_rate >= 0 and monthly_saving_interest_rate <= 100),
  monthly_loan_interest_rate decimal(5, 2) not null default 2.00
    check (monthly_loan_interest_rate >= 0 and monthly_loan_interest_rate <= 100),
  updated_at timestamptz default now(),
  updated_by uuid references members(id)
);

insert into interest_settings (id) values (1);

alter table interest_settings enable row level security;

alter table loans
  add column if not exists monthly_interest_rate decimal(5, 2)
    check (monthly_interest_rate >= 0 and monthly_interest_rate <= 100);
