update public.notifications
set message = regexp_replace(
  message,
  '^Your complaint (.+) was submitted to the CSR team\.$',
  'Complaint \1 was submitted to the CSR team.',
  'i'
)
where message ~* '^Your complaint .+ was submitted to the CSR team\.$';

update public.notifications
set message = regexp_replace(
  message,
  '^Your combined membership payment (.+) was received\.$',
  'Combined membership payment \1 was received.',
  'i'
)
where message ~* '^Your combined membership payment .+ was received\.$';

update public.notifications
set message = regexp_replace(
  message,
  '\. Your order is marked as paid\.$',
  '. Merchandise order status is paid.',
  'i'
)
where message ~* '\. Your order is marked as paid\.$';
