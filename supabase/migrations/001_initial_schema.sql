-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ENUM types
create type member_status as enum ('pending', 'active', 'suspended', 'withdrawn');
create type loan_status as enum ('pending', 'under_review', 'approved', 'active', 'completed', 'rejected');
create type capital_request_status as enum ('pending', 'approved', 'rejected');
create type saving_status as enum ('pending', 'verified', 'completed');

-- Members table
create table members (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  email text unique not null,
  phone text,
  id_number text,
  resident_book_number text,
  address text,
  status member_status default 'pending',
  auth_user_id uuid references auth.users(id) on delete cascade,
  referee_id uuid references members(id),
  referee_verified boolean default false,
  id_document_url text,
  resident_book_url text,
  joined_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Savings table
create table savings (
  id uuid default uuid_generate_v4() primary key,
  member_id uuid references members(id) on delete cascade not null,
  amount decimal(12,2) not null,
  saving_date date not null default current_date,
  qr_code_ref text,
  evidence_url text,
  status saving_status default 'pending',
  notes text,
  verified_by uuid references members(id),
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Loans table
create table loans (
  id uuid default uuid_generate_v4() primary key,
  member_id uuid references members(id) on delete cascade not null,
  amount decimal(12,2) not null,
  purpose text,
  term_months integer,
  interest_rate decimal(5,2),
  status loan_status default 'pending',
  referee_id uuid references members(id),
  referee_verified boolean default false,
  support_document_url text,
  hard_copy_submitted boolean default false,
  thumbprint_submitted boolean default false,
  approved_by uuid references members(id),
  approved_at timestamptz,
  disbursed_at timestamptz,
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Loan repayments table
create table loan_repayments (
  id uuid default uuid_generate_v4() primary key,
  loan_id uuid references loans(id) on delete cascade not null,
  member_id uuid references members(id) on delete cascade not null,
  amount decimal(12,2) not null,
  payment_date date not null default current_date,
  qr_code_ref text,
  evidence_url text,
  status saving_status default 'pending',
  verified_by uuid references members(id),
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Capital requests table
create table capital_requests (
  id uuid default uuid_generate_v4() primary key,
  member_id uuid references members(id) on delete cascade not null,
  amount decimal(12,2) not null,
  reason text,
  action_after capital_request_status,
  continue_saving boolean,
  remove_membership boolean default false,
  status capital_request_status default 'pending',
  notification_date date,
  approved_by uuid references members(id),
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Reports requests table
create table report_requests (
  id uuid default uuid_generate_v4() primary key,
  member_id uuid references members(id) on delete cascade not null,
  report_type text not null check (report_type in ('saving', 'loan')),
  period_from date not null,
  period_to date not null,
  sent_to_telegram boolean default false,
  telegram_sent_at timestamptz,
  created_at timestamptz default now()
);

-- Notifications table
create table notifications (
  id uuid default uuid_generate_v4() primary key,
  member_id uuid references members(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'info',
  read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table members enable row level security;
alter table savings enable row level security;
alter table loans enable row level security;
alter table loan_repayments enable row level security;
alter table capital_requests enable row level security;
alter table report_requests enable row level security;
alter table notifications enable row level security;

-- RLS Policies
create policy "Members can view their own data" on members
  for select using (auth.uid() = auth_user_id);

create policy "Members can update their own data" on members
  for update using (auth.uid() = auth_user_id);

create policy "Members can view their own savings" on savings
  for all using (member_id in (select id from members where auth_user_id = auth.uid()));

create policy "Members can view their own loans" on loans
  for all using (member_id in (select id from members where auth_user_id = auth.uid()));

create policy "Members can view their own repayments" on loan_repayments
  for all using (member_id in (select id from members where auth_user_id = auth.uid()));

create policy "Members can manage their capital requests" on capital_requests
  for all using (member_id in (select id from members where auth_user_id = auth.uid()));

create policy "Members can manage their report requests" on report_requests
  for all using (member_id in (select id from members where auth_user_id = auth.uid()));

create policy "Members can view their notifications" on notifications
  for all using (member_id in (select id from members where auth_user_id = auth.uid()));

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_members_updated_at before update on members
  for each row execute function update_updated_at();
create trigger update_savings_updated_at before update on savings
  for each row execute function update_updated_at();
create trigger update_loans_updated_at before update on loans
  for each row execute function update_updated_at();
create trigger update_loan_repayments_updated_at before update on loan_repayments
  for each row execute function update_updated_at();
create trigger update_capital_requests_updated_at before update on capital_requests
  for each row execute function update_updated_at();
