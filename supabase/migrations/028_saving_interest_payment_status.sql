-- Align saving interest payment status with paid / rejected workflow.

alter table saving_interest_payments
  alter column status drop default;

alter table saving_interest_payments
  alter column status type text using (
    case status::text
      when 'verified' then 'completed'
      when 'refunded' then 'rejected'
      else status::text
    end
  );

alter table saving_interest_payments
  alter column status set default 'pending';

alter table saving_interest_payments
  drop constraint if exists saving_interest_payments_status_check;

alter table saving_interest_payments
  add constraint saving_interest_payments_status_check
  check (status in ('pending', 'completed', 'rejected'));
