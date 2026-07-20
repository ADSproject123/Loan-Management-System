-- Referees who accept online must now sign the loan contract themselves
-- before it's sent to the requester. See src/lib/loanReferee.ts.
alter table loan_referees
  add column if not exists signed_document_url text;
