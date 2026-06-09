-- Telegram bot linkage: a one-time token issued at registration that maps the
-- person who presses "Start" in the bot back to their member row (telegram_chat_id).

alter table members add column if not exists telegram_connect_token text;

-- Token is looked up on every /start, so index it. Unique while present so two
-- members can never share a token; nulls are allowed (cleared after linking).
create unique index if not exists members_telegram_connect_token_idx
  on members (telegram_connect_token)
  where telegram_connect_token is not null;
