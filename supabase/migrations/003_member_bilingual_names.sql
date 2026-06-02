-- Bilingual member names (Khmer + English)
alter table members add column if not exists full_name_kh text;
alter table members add column if not exists full_name_en text;

update members
set
  full_name_kh = coalesce(full_name_kh, full_name),
  full_name_en = coalesce(full_name_en, full_name)
where full_name_kh is null or full_name_en is null;
