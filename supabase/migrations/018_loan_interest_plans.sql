-- Named loan interest plans that admins can assign to specific members.
create table if not exists loan_interest_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  monthly_rate decimal(5, 2) not null
    check (monthly_rate >= 0 and monthly_rate <= 100),
  description text,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table loan_interest_plans enable row level security;

alter table members
  add column if not exists loan_interest_plan_id uuid references loan_interest_plans(id) on delete set null;

alter table members drop column if exists custom_monthly_loan_interest_rate;

create index if not exists members_loan_interest_plan_id_idx
  on members (loan_interest_plan_id)
  where loan_interest_plan_id is not null;
