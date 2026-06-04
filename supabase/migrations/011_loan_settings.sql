-- Global loan interest rate (monthly %), managed by admins.
create table loan_settings (
  id smallint primary key default 1 check (id = 1),
  monthly_interest_rate decimal(5, 2) not null default 2.00
    check (monthly_interest_rate >= 0 and monthly_interest_rate <= 100),
  updated_at timestamptz default now(),
  updated_by uuid references members(id)
);

insert into loan_settings (id, monthly_interest_rate) values (1, 2.00);

alter table loan_settings enable row level security;
