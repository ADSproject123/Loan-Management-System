-- Loan term as an explicit date range chosen by the member, instead of only a
-- month count. term_months is still kept (derived from the range) so existing
-- payment estimates and reports continue to work.

alter table loans add column if not exists start_date date;
alter table loans add column if not exists end_date date;
