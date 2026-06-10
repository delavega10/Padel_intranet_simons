-- Aktivitetslog for brugeradministration (skrives af edge functions via service role)

CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create_user', 'update_user', 'delete_user')),
  target_email TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX admin_audit_log_created_idx ON public.admin_audit_log (created_at DESC);
CREATE INDEX admin_audit_log_actor_idx ON public.admin_audit_log (actor_id);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Kun admin kan læse; ingen klient-skrivning (service role omgår RLS)
CREATE POLICY "audit_log_admin_select"
  ON public.admin_audit_log FOR SELECT
  TO authenticated
  USING (public.is_admin());
