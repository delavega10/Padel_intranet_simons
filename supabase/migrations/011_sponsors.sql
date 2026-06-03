-- Sponsorer: navn, logo-URL og sponsorat udløb

CREATE TABLE public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website_url TEXT,
  expires_at DATE NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX sponsors_expires_idx ON public.sponsors (expires_at, sort_order);

CREATE TRIGGER sponsors_updated_at
  BEFORE UPDATE ON public.sponsors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sponsors_select"
  ON public.sponsors FOR SELECT
  TO authenticated
  USING (public.is_approved());

CREATE POLICY "sponsors_admin_insert"
  ON public.sponsors FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "sponsors_admin_update"
  ON public.sponsors FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "sponsors_admin_delete"
  ON public.sponsors FOR DELETE
  TO authenticated
  USING (public.is_admin());
