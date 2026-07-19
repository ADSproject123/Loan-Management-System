-- Voice + file attachments for the admin <-> member chat (032). Kept as a
-- separate, additive migration rather than editing 032 in place, since 032
-- may or may not already be applied depending on environment — this ALTER is
-- safe either way (run 032 then 033, or 033 alone against an already-applied 032).

alter table admin_member_messages
  add column if not exists message_type text not null default 'text' check (message_type in ('text', 'voice', 'file')),
  add column if not exists media_url text,
  add column if not exists media_duration_seconds integer,
  add column if not exists media_filename text,
  add column if not exists media_mime_type text;

-- A voice/file message has no text body.
alter table admin_member_messages alter column body drop not null;
