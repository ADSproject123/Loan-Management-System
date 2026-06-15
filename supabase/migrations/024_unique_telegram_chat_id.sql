-- One Telegram account can only be linked to one member.
-- First clear any existing duplicates, keeping the oldest row per chat_id.
update members
set telegram_chat_id = null
where id in (
  select id from (
    select id,
           row_number() over (partition by telegram_chat_id order by created_at) as rn
    from members
    where telegram_chat_id is not null
  ) ranked
  where rn > 1
);

create unique index if not exists members_telegram_chat_id_unique
  on members (telegram_chat_id)
  where telegram_chat_id is not null;
