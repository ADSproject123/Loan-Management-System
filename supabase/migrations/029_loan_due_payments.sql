-- Track monthly loan installment payment status per loan.

create table loan_due_payments (
  id uuid default uuid_generate_v4() primary key,
  loan_id uuid references loans(id) on delete cascade not null,
  member_id uuid references members(id) on delete cascade not null,
  period_year int not null,
  period_month int not null check (period_month between 1 and 12),
  schedule_month int not null,
  amount decimal(12, 2) not null,
  interest_amount decimal(12, 2) not null,
  currency text not null default 'USD',
  due_date date not null,
  status text not null default 'pending'
    check (status in ('pending', 'completed')),
  verified_by uuid references members(id),
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (loan_id, period_year, period_month)
);

alter table loan_due_payments enable row level security;

create policy "Members can view their own loan due payments" on loan_due_payments
  for select using (
    member_id in (select id from members where auth_user_id = auth.uid())
  );

create policy "Admins can manage loan due payments" on loan_due_payments
  for all using (public.is_admin()) with check (public.is_admin());

create trigger update_loan_due_payments_updated_at
  before update on loan_due_payments
  for each row execute function update_updated_at();
