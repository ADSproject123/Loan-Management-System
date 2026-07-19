-- Loan referee (guarantor) approval workflow for the Telegram bot.
--
-- NOTE: unrelated to the existing loans.referee_id / referee_verified / referee_name*
-- columns — those back an older, free-text guarantor-contact-info feature used only
-- by the web loan-request form. Do not conflate the two.
--
-- A loan sits in 'awaiting_referee' while one or more chosen referees decide whether
-- to accept (online or physically) or decline. Any decline rejects the loan; full
-- acceptance moves it to 'under_review' exactly like today's flow.
--
-- Enum value add is isolated in this file with no data statements referencing it —
-- Postgres forbids using a freshly added enum value in the same migration that added
-- it (same precedent as 009_saving_refund.sql's `add value if not exists 'refunded'`).
alter type loan_status add value if not exists 'awaiting_referee';

create type loan_referee_status as enum ('pending', 'accepted_online', 'accepted_physical', 'declined');

create table loan_referees (
  id uuid default uuid_generate_v4() primary key,
  loan_id uuid references loans(id) on delete cascade not null,
  referee_member_id uuid references members(id) not null,
  status loan_referee_status not null default 'pending',
  responded_at timestamptz,
  created_at timestamptz default now(),
  unique (loan_id, referee_member_id)
);

-- Service-role access only: no policies defined on purpose, same as
-- telegram_conversation_state (030) and other bot-internal tables.
alter table loan_referees enable row level security;
