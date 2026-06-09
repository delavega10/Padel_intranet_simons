-- Firma events: koordinering (alle) + økonomi (kun admin)

CREATE TYPE public.company_event_status AS ENUM (
  'planlaegning',
  'bekraeftet',
  'afholdt',
  'aflyst'
);

CREATE TYPE public.event_supplier_category AS ENUM (
  'mad',
  'drikke',
  'praemier',
  'andet'
);

CREATE TABLE public.company_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  location TEXT,
  description TEXT,
  status public.company_event_status NOT NULL DEFAULT 'planlaegning',
  host_company TEXT,
  host_contact_name TEXT,
  host_contact_phone TEXT,
  host_contact_email TEXT,
  public_notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.company_event_finance (
  event_id UUID PRIMARY KEY REFERENCES public.company_events(id) ON DELETE CASCADE,
  host_agreed_price NUMERIC(12, 2),
  host_invoice_sent BOOLEAN NOT NULL DEFAULT false,
  host_invoice_paid BOOLEAN NOT NULL DEFAULT false,
  total_budget NUMERIC(12, 2),
  total_cost NUMERIC(12, 2),
  financial_notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.company_event_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.company_events(id) ON DELETE CASCADE,
  category public.event_supplier_category NOT NULL DEFAULT 'andet',
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  description TEXT,
  notes TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.company_event_supplier_finance (
  supplier_id UUID PRIMARY KEY REFERENCES public.company_event_suppliers(id) ON DELETE CASCADE,
  agreed_price NUMERIC(12, 2),
  invoice_sent BOOLEAN NOT NULL DEFAULT false,
  invoice_paid BOOLEAN NOT NULL DEFAULT false,
  financial_notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.company_event_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.company_events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX company_events_date_idx ON public.company_events (event_date);
CREATE INDEX company_event_suppliers_event_idx ON public.company_event_suppliers (event_id, sort_order);
CREATE INDEX company_event_todos_event_idx ON public.company_event_todos (event_id, sort_order);

CREATE TRIGGER company_events_updated_at
  BEFORE UPDATE ON public.company_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER company_event_suppliers_updated_at
  BEFORE UPDATE ON public.company_event_suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER company_event_todos_updated_at
  BEFORE UPDATE ON public.company_event_todos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER company_event_finance_updated_at
  BEFORE UPDATE ON public.company_event_finance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER company_event_supplier_finance_updated_at
  BEFORE UPDATE ON public.company_event_supplier_finance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.company_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_event_finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_event_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_event_supplier_finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_event_todos ENABLE ROW LEVEL SECURITY;

-- Events: alle godkendte kan se, kun admin redigerer
CREATE POLICY "company_events_select"
  ON public.company_events FOR SELECT TO authenticated
  USING (public.is_approved());

CREATE POLICY "company_events_admin_insert"
  ON public.company_events FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "company_events_admin_update"
  ON public.company_events FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "company_events_admin_delete"
  ON public.company_events FOR DELETE TO authenticated
  USING (public.is_admin());

-- Økonomi: kun admin
CREATE POLICY "company_event_finance_admin_all"
  ON public.company_event_finance FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "company_event_supplier_finance_admin_all"
  ON public.company_event_supplier_finance FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Leverandører: alle ser, admin redigerer
CREATE POLICY "company_event_suppliers_select"
  ON public.company_event_suppliers FOR SELECT TO authenticated
  USING (public.is_approved());

CREATE POLICY "company_event_suppliers_admin_insert"
  ON public.company_event_suppliers FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "company_event_suppliers_admin_update"
  ON public.company_event_suppliers FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "company_event_suppliers_admin_delete"
  ON public.company_event_suppliers FOR DELETE TO authenticated
  USING (public.is_admin());

-- Todos: alle ser og kan afkrydse, admin opretter/sletter
CREATE POLICY "company_event_todos_select"
  ON public.company_event_todos FOR SELECT TO authenticated
  USING (public.is_approved());

CREATE POLICY "company_event_todos_admin_insert"
  ON public.company_event_todos FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "company_event_todos_update"
  ON public.company_event_todos FOR UPDATE TO authenticated
  USING (public.is_approved()) WITH CHECK (public.is_approved());

CREATE POLICY "company_event_todos_admin_delete"
  ON public.company_event_todos FOR DELETE TO authenticated
  USING (public.is_admin());
