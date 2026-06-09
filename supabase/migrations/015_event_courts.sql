-- Baner til firma events: antal eller hele hallen

ALTER TABLE public.company_events
  ADD COLUMN whole_hall BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN court_count INT;
