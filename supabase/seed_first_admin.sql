-- Kør EFTER du har oprettet din første bruger i Supabase Auth
-- Erstat e-mailen med din egen

UPDATE public.profiles
SET approved = true, role = 'admin'
WHERE email = 'admin@padelklub.dk';
