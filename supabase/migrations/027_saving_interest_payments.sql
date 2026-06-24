-- Track monthly saving interest payout status per member.

create table saving_interest_payments (
  id uuid default uuid_generate_v4() primary key,
  member_id uuid references members(id) on delete cascade not null,
  period_year int not null,
  period_month int not null check (period_month between 1 and 12),
  amount decimal(12, 2) not null,
  currency text not null default 'USD',
  interest_date date not null,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'rejected')),
  verified_by uuid references members(id),
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (member_id, period_year, period_month)
);

alter table saving_interest_payments enable row level security;

create policy "Members can view their own saving interest payments" on saving_interest_payments
  for select using (
    member_id in (select id from members where auth_user_id = auth.uid())
  );

create policy "Admins can manage saving interest payments" on saving_interest_payments
  for all using (public.is_admin()) with check (public.is_admin());

create trigger update_saving_interest_payments_updated_at
  before update on saving_interest_payments
  for each row execute function update_updated_at();
