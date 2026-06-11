-- Optional per-member loan interest rate (overrides global default for new loans).
alter table members
  add column if not exists custom_monthly_loan_interest_rate decimal(5, 2)
    check (custom_monthly_loan_interest_rate >= 0 and custom_monthly_loan_interest_rate <= 100);
