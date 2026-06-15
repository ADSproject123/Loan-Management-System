alter table loans
  add column if not exists referee_name_kh text,
  add column if not exists referee_name_en text;

update loans
set referee_name_en = referee_name
where referee_name is not null
  and referee_name_en is null;
