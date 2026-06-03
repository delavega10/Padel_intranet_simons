-- LunaLiga: kaptajner (admin vedligeholder listen)

CREATE TABLE public.luna_captains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  team TEXT,
  phone TEXT,
  email TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX luna_captains_sort_idx ON public.luna_captains (sort_order, name);

ALTER TABLE public.luna_captains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "luna_captains_select"
  ON public.luna_captains FOR SELECT
  TO authenticated
  USING (public.is_approved());

CREATE POLICY "luna_captains_admin_insert"
  ON public.luna_captains FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "luna_captains_admin_update"
  ON public.luna_captains FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "luna_captains_admin_delete"
  ON public.luna_captains FOR DELETE
  TO authenticated
  USING (public.is_admin());
