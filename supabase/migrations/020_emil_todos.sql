-- Emil: privat opgaveliste (admin opretter, kun Emil + admin kan se)

CREATE OR REPLACE FUNCTION public.is_emil()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND approved = true
      AND (
        lower(split_part(email, '@', 1)) = 'emil'
        OR lower(trim(full_name)) = 'emil'
        OR lower(trim(full_name)) LIKE 'emil %'
      )
  );
$$;

CREATE TABLE public.emil_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  completed BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX emil_todos_completed_idx ON public.emil_todos (completed, created_at DESC);

CREATE TRIGGER emil_todos_updated_at
  BEFORE UPDATE ON public.emil_todos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.emil_todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "emil_todos_select"
  ON public.emil_todos FOR SELECT
  TO authenticated
  USING (public.is_admin() OR public.is_emil());

CREATE POLICY "emil_todos_insert"
  ON public.emil_todos FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() AND created_by = auth.uid());

CREATE POLICY "emil_todos_update"
  ON public.emil_todos FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR public.is_emil())
  WITH CHECK (public.is_admin() OR public.is_emil());

CREATE POLICY "emil_todos_delete"
  ON public.emil_todos FOR DELETE
  TO authenticated
  USING (public.is_admin());
