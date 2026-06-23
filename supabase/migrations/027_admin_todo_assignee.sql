-- Tildel admin to-do til Brian eller Lasse (eller anden admin)

ALTER TABLE public.admin_todos
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS admin_todos_assigned_to_idx ON public.admin_todos (assigned_to);
