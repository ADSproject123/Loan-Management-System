alter table members
  add column if not exists referee_name_kh text,
  add column if not exists referee_name_en text,
  add column if not exists referee_phone text;
