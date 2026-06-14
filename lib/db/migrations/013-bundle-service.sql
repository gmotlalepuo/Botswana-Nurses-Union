alter type public.bonu_application_type add value if not exists 'bundle';

notify pgrst, 'reload schema';
