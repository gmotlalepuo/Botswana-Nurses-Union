update public.service_applications
set monthly_deduction = null,
    updated_at = now()
where application_type = 'membership'
  and monthly_deduction is not null;
