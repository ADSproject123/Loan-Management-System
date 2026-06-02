update savings
set status = 'completed'
where status = 'pending'
  and (verified_at is not null or verified_by is not null);
