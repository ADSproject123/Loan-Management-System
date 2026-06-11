-- Target a loan interest plan at a specific member role.
-- NULL means the plan applies to all roles.
alter table loan_interest_plans
  add column if not exists applies_to_role text
    check (applies_to_role in ('founder', 'comember', 'member'));
