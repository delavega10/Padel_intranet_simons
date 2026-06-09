-- Marketing-tilbehør til firma events: logo, bestillinger, økonomi (admin)

CREATE TYPE public.marketing_product_type AS ENUM (
  'banner',
  'rollup',
  'vandflasker',
  'traeningstoej',
  'kasket_tshirt',
  'poser',
  'flyers',
  'baner_udsmykning',
  'andet'
);

CREATE TYPE public.marketing_order_status AS ENUM (
  'forespurgt',
  'godkendt',
  'bestilt',
  'i_produktion',
  'leveret',
  'annulleret'
);

CREATE TABLE public.company_event_marketing (
  event_id UUID PRIMARY KEY REFERENCES public.company_events(id) ON DELETE CASCADE,
  logo_url TEXT,
  logo_path TEXT,
  logo_filename TEXT,
  brand_colors TEXT,
  logo_placement_notes TEXT,
  design_approved BOOLEAN NOT NULL DEFAULT false,
  design_approved_by TEXT,
  design_approved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.company_event_marketing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.company_events(id) ON DELETE CASCADE,
  product_type public.marketing_product_type NOT NULL DEFAULT 'andet',
  package_name TEXT,
  item_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  size_specs TEXT,
  material TEXT,
  print_method TEXT,
  color_specs TEXT,
  design_notes TEXT,
  status public.marketing_order_status NOT NULL DEFAULT 'forespurgt',
  supplier_name TEXT,
  order_date DATE,
  expected_delivery DATE,
  delivered_date DATE,
  notes TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.company_event_marketing_item_finance (
  item_id UUID PRIMARY KEY REFERENCES public.company_event_marketing_items(id) ON DELETE CASCADE,
  unit_price NUMERIC(12, 2),
  total_price NUMERIC(12, 2),
  invoice_sent BOOLEAN NOT NULL DEFAULT false,
  invoice_paid BOOLEAN NOT NULL DEFAULT false,
  financial_notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX company_event_marketing_items_event_idx
  ON public.company_event_marketing_items (event_id, sort_order);

CREATE TRIGGER company_event_marketing_updated_at
  BEFORE UPDATE ON public.company_event_marketing
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER company_event_marketing_items_updated_at
  BEFORE UPDATE ON public.company_event_marketing_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER company_event_marketing_item_finance_updated_at
  BEFORE UPDATE ON public.company_event_marketing_item_finance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.company_event_marketing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_event_marketing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_event_marketing_item_finance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_marketing_select"
  ON public.company_event_marketing FOR SELECT TO authenticated
  USING (public.is_approved());

CREATE POLICY "event_marketing_admin_write"
  ON public.company_event_marketing FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "event_marketing_items_select"
  ON public.company_event_marketing_items FOR SELECT TO authenticated
  USING (public.is_approved());

CREATE POLICY "event_marketing_items_admin_write"
  ON public.company_event_marketing_items FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "event_marketing_item_finance_admin_all"
  ON public.company_event_marketing_item_finance FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Logo-filer
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-marketing-logos', 'event-marketing-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "event_marketing_logos_read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'event-marketing-logos' AND public.is_approved());

CREATE POLICY "event_marketing_logos_admin_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-marketing-logos' AND public.is_admin());

CREATE POLICY "event_marketing_logos_admin_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'event-marketing-logos' AND public.is_admin());
