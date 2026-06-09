-- Flere tilkøb per leverandør og marketing-linje

CREATE TABLE public.company_event_supplier_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.company_event_suppliers(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  price NUMERIC(12, 2),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.company_event_marketing_item_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.company_event_marketing_items(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  price NUMERIC(12, 2),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX company_event_supplier_addons_supplier_idx
  ON public.company_event_supplier_addons (supplier_id, sort_order);

CREATE INDEX company_event_marketing_item_addons_item_idx
  ON public.company_event_marketing_item_addons (item_id, sort_order);

-- Migrér eksisterende enkelt-tilkøb
INSERT INTO public.company_event_supplier_addons (supplier_id, description, price, sort_order)
SELECT supplier_id, COALESCE(addon_description, 'Tilkøb'), addon_price, 0
FROM public.company_event_supplier_finance
WHERE addon_description IS NOT NULL OR addon_price IS NOT NULL;

INSERT INTO public.company_event_marketing_item_addons (item_id, description, price, sort_order)
SELECT item_id, COALESCE(addon_description, 'Tilkøb'), addon_price, 0
FROM public.company_event_marketing_item_finance
WHERE addon_description IS NOT NULL OR addon_price IS NOT NULL;

ALTER TABLE public.company_event_supplier_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_event_marketing_item_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_event_supplier_addons_admin_all"
  ON public.company_event_supplier_addons FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "company_event_marketing_item_addons_admin_all"
  ON public.company_event_marketing_item_addons FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
