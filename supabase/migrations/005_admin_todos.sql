-- Privat admin to-do liste (kun synlig for admin via RLS)

CREATE TYPE public.admin_todo_priority AS ENUM ('lav', 'mellem', 'hoj');

CREATE TABLE public.admin_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority public.admin_todo_priority NOT NULL DEFAULT 'mellem',
  completed BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX admin_todos_priority_idx ON public.admin_todos (completed, priority, created_at DESC);

CREATE TRIGGER admin_todos_updated_at
  BEFORE UPDATE ON public.admin_todos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.admin_todos ENABLE ROW LEVEL SECURITY;

-- Kun admin: ingen adgang for øvrige roller
CREATE POLICY "admin_todos_select"
  ON public.admin_todos FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "admin_todos_insert"
  ON public.admin_todos FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() AND created_by = auth.uid());

CREATE POLICY "admin_todos_update"
  ON public.admin_todos FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_todos_delete"
  ON public.admin_todos FOR DELETE
  TO authenticated
  USING (public.is_admin());
