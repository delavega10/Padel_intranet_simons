-- Samarbejdspartnere: kategorier og kontakter

CREATE TABLE public.collaboration_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.collaboration_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  website_url TEXT,
  notes TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX collaborations_category_idx ON public.collaborations (category_id, sort_order);

CREATE TRIGGER collaboration_categories_updated_at
  BEFORE UPDATE ON public.collaboration_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER collaborations_updated_at
  BEFORE UPDATE ON public.collaborations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.collaboration_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collab_categories_select"
  ON public.collaboration_categories FOR SELECT
  TO authenticated
  USING (public.is_approved());

CREATE POLICY "collab_categories_admin_insert"
  ON public.collaboration_categories FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "collab_categories_admin_update"
  ON public.collaboration_categories FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "collab_categories_admin_delete"
  ON public.collaboration_categories FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "collaborations_select"
  ON public.collaborations FOR SELECT
  TO authenticated
  USING (public.is_approved());

CREATE POLICY "collaborations_admin_insert"
  ON public.collaborations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "collaborations_admin_update"
  ON public.collaborations FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "collaborations_admin_delete"
  ON public.collaborations FOR DELETE
  TO authenticated
  USING (public.is_admin());
