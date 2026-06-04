-- Remove global loan interest settings and per-loan interest_rate.
drop table if exists loan_settings;

alter table loans drop column if exists interest_rate;
