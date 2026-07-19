-- Two-way admin <-> member chat, mirrored over the existing Telegram bot.
--
-- NOTE: unrelated to the `notifications` table (one-way, templated, no
-- sender attribution or thread grouping) — this is a genuine conversation
-- log, not a notification feed. Do not conflate the two.

create type message_sender_type as enum ('admin', 'member');

create table admin_member_messages (
  id uuid default uuid_generate_v4() primary key,
  member_id uuid references members(id) on delete cascade not null,
  sender_type message_sender_type not null,
  sender_admin_id uuid references members(id),
  body text not null,
  read_by_admin boolean not null default false,
  created_at timestamptz default now()
);

create index admin_member_messages_member_id_idx
  on admin_member_messages (member_id, created_at);

-- Service-role access only, same as telegram_conversation_state (030).
alter table admin_member_messages enable row level security;
