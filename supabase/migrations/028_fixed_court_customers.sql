-- Faste baner: kunder med faste/tilbagevendende banebookinger
-- Samme struktur som LunaLiga-kaptajner, men uden spillersæt-tilbud til kunder

CREATE TABLE public.fixed_court_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  team TEXT,
  phone TEXT,
  email TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  booking_dates_comment TEXT NOT NULL DEFAULT '',
  invoice_sent BOOLEAN NOT NULL DEFAULT false,
  matchi_booking_confirmed BOOLEAN NOT NULL DEFAULT false,
  tracking_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX fixed_court_customers_sort_idx ON public.fixed_court_customers (sort_order, name);

ALTER TABLE public.fixed_court_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fixed_court_customers_select"
  ON public.fixed_court_customers FOR SELECT
  TO authenticated
  USING (public.is_approved());

CREATE POLICY "fixed_court_customers_admin_insert"
  ON public.fixed_court_customers FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Alle godkendte kan opdatere tracking; kun admin opretter/sletter kunder
CREATE POLICY "fixed_court_customers_update_tracking"
  ON public.fixed_court_customers FOR UPDATE
  TO authenticated
  USING (public.is_approved())
  WITH CHECK (public.is_approved());

CREATE POLICY "fixed_court_customers_admin_delete"
  ON public.fixed_court_customers FOR DELETE
  TO authenticated
  USING (public.is_admin());
