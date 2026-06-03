-- Fælles huskeseddel: hvad der skal bestilles (ikke ordreflow)

CREATE TABLE public.shop_reminder (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  note TEXT NOT NULL DEFAULT '',
  updated_by_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.shop_reminder (id, note) VALUES (1, '');

CREATE TABLE public.shop_reminder_items (
  product_id UUID PRIMARY KEY REFERENCES public.shop_products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_reminder ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_reminder_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_reminder_select"
  ON public.shop_reminder FOR SELECT
  TO authenticated
  USING (public.is_approved());

CREATE POLICY "shop_reminder_upsert"
  ON public.shop_reminder FOR INSERT
  TO authenticated
  WITH CHECK (public.is_approved());

CREATE POLICY "shop_reminder_update"
  ON public.shop_reminder FOR UPDATE
  TO authenticated
  USING (public.is_approved())
  WITH CHECK (public.is_approved());

CREATE POLICY "shop_reminder_items_select"
  ON public.shop_reminder_items FOR SELECT
  TO authenticated
  USING (public.is_approved());

CREATE POLICY "shop_reminder_items_insert"
  ON public.shop_reminder_items FOR INSERT
  TO authenticated
  WITH CHECK (public.is_approved());

CREATE POLICY "shop_reminder_items_update"
  ON public.shop_reminder_items FOR UPDATE
  TO authenticated
  USING (public.is_approved())
  WITH CHECK (public.is_approved());

CREATE POLICY "shop_reminder_items_delete"
  ON public.shop_reminder_items FOR DELETE
  TO authenticated
  USING (public.is_approved());
