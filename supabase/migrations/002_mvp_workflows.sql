-- MVP workflow support: admin role, Telegram linkage, storage buckets, and RLS policies.

alter table members add column if not exists is_admin boolean not null default false;
alter table members add column if not exists telegram_chat_id text;

alter table report_requests add column if not exists status text not null default 'pending'
  check (status in ('pending', 'sent', 'failed'));

insert into storage.buckets (id, name, public)
values
  ('member-documents', 'member-documents', false),
  ('payment-evidence', 'payment-evidence', false),
  ('loan-documents', 'loan-documents', false)
on conflict (id) do update set public = excluded.public;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from members
    where auth_user_id = auth.uid()
      and is_admin = true
      and status = 'active'
  );
$$;

create policy "Members can create their own profile" on members
  for insert with check (auth.uid() = auth_user_id);

create policy "Members can find active referees by email" on members
  for select using (status = 'active');

create policy "Admins can manage members" on members
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins can manage savings" on savings
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins can manage loans" on loans
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins can manage repayments" on loan_repayments
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins can manage capital requests" on capital_requests
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins can manage report requests" on report_requests
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admins can manage notifications" on notifications
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Users can upload member documents" on storage.objects
  for insert with check (
    bucket_id = 'member-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read their member documents" on storage.objects
  for select using (
    bucket_id = 'member-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can upload payment evidence" on storage.objects
  for insert with check (
    bucket_id = 'payment-evidence'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read their payment evidence" on storage.objects
  for select using (
    bucket_id = 'payment-evidence'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can upload loan documents" on storage.objects
  for insert with check (
    bucket_id = 'loan-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read their loan documents" on storage.objects
  for select using (
    bucket_id = 'loan-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Admins can read workflow files" on storage.objects
  for select using (
    bucket_id in ('member-documents', 'payment-evidence', 'loan-documents')
    and public.is_admin()
  );
