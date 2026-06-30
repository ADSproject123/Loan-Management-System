-- Persistent conversation state for the Telegram bot.
--
-- The webhook handles multi-step flows (uploading a payment proof after
-- /paysaving|/payloan, and the multi-step /requestloan wizard). State used to
-- live in module-level in-memory Maps, which silently breaks on serverless:
-- each webhook POST can land on a different (or cold) instance, so the follow-up
-- message finds an empty Map and the payment/request is dropped. Persisting the
-- state here keeps every flow working regardless of which instance serves the
-- request.
--
-- One row per (chat_id, flow). `flow` namespaces the independent conversations
-- ('payment' vs 'loan_request') so they never clobber each other.

create table if not exists telegram_conversation_state (
  chat_id text not null,
  flow text not null,
  state jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (chat_id, flow)
);

-- Lets a periodic cleanup job prune abandoned conversations by age.
create index if not exists telegram_conversation_state_updated_at_idx
  on telegram_conversation_state (updated_at);

-- Service-role access only: no policies are defined on purpose, so anon and
-- authenticated clients can never read or tamper with in-flight conversations.
alter table telegram_conversation_state enable row level security;
