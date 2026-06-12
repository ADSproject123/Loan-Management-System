-- Telegram OTP verification for sensitive member actions (loan repayment,
-- savings deposit, capital withdrawal, loan request). A 6-digit code is sent
-- to the member's linked Telegram chat; the hash is stored here and the
-- member must confirm it before the action is allowed server-side.

create table if not exists verification_codes (
  id uuid default uuid_generate_v4() primary key,
  member_id uuid references members(id) on delete cascade not null,
  action text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  verified_at timestamptz,
  created_at timestamptz default now()
);

-- Looked up by member + action on every send/verify/authorize call.
create index if not exists verification_codes_member_action_idx
  on verification_codes (member_id, action, created_at desc);

-- Service-role access only: no policies are defined on purpose, so anon and
-- authenticated clients can never read or forge codes.
alter table verification_codes enable row level security;
