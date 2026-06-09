-- Matchi-banebooking per firma event

ALTER TABLE public.company_events
  ADD COLUMN matchi_booked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN booked_court_numbers INT[] NOT NULL DEFAULT '{}';
