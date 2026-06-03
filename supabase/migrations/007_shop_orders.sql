-- Bestillinger: varer og ordrer

CREATE TYPE public.shop_tile_color AS ENUM ('green', 'dark');
CREATE TYPE public.shop_order_status AS ENUM ('ny', 'klar', 'afhentet', 'annulleret');

CREATE TABLE public.shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tile_color public.shop_tile_color NOT NULL DEFAULT 'green',
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.shop_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordered_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ordered_by_name TEXT NOT NULL,
  status public.shop_order_status NOT NULL DEFAULT 'ny',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.shop_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.shop_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.shop_products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0)
);

CREATE INDEX shop_products_sort_idx ON public.shop_products (active, sort_order);
CREATE INDEX shop_orders_status_idx ON public.shop_orders (status, created_at DESC);

ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_order_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_products_select"
  ON public.shop_products FOR SELECT
  TO authenticated
  USING (public.is_approved() AND active = true);

CREATE POLICY "shop_products_admin_write"
  ON public.shop_products FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "shop_orders_select"
  ON public.shop_orders FOR SELECT
  TO authenticated
  USING (
    public.is_approved()
    AND (ordered_by = auth.uid() OR public.is_admin())
  );

CREATE POLICY "shop_orders_insert"
  ON public.shop_orders FOR INSERT
  TO authenticated
  WITH CHECK (public.is_approved() AND ordered_by = auth.uid());

CREATE POLICY "shop_orders_admin_update"
  ON public.shop_orders FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "shop_order_lines_select"
  ON public.shop_order_lines FOR SELECT
  TO authenticated
  USING (
    public.is_approved()
    AND EXISTS (
      SELECT 1 FROM public.shop_orders o
      WHERE o.id = order_id
        AND (o.ordered_by = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "shop_order_lines_insert"
  ON public.shop_order_lines FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_approved()
    AND EXISTS (
      SELECT 1 FROM public.shop_orders o
      WHERE o.id = order_id AND o.ordered_by = auth.uid()
    )
  );

-- Standardvarer (som i bestillings-grid)
INSERT INTO public.shop_products (name, tile_color, sort_order) VALUES
  ('STATE', 'green', 1),
  ('Snack: ENERGIBAR PUREPOWER', 'green', 2),
  ('Snack: Kaffe', 'green', 3),
  ('Øl: SPECIEL ØL 50 cl', 'green', 4),
  ('Lånebat', 'green', 5),
  ('Snack: ELECTROLYTES (RØR)', 'green', 6),
  ('BABOLAT BOLDE', 'green', 7),
  ('Øl: SPECIEL ØL 25 cl', 'green', 8),
  ('HEAD grip 1 stk. (hvid)', 'green', 9),
  ('Snack: DRUESUKKER PUREPOWER', 'green', 10),
  ('HEAD BOLDE', 'green', 11),
  ('YouPadel Grip', 'green', 12),
  ('Kildevand', 'green', 13),
  ('DEMOBAT (medlem)', 'green', 14),
  ('Snack: H3RO bar', 'green', 15),
  ('Dåse - Sodavand', 'green', 16),
  ('DEMO BAT ikke medlem', 'green', 17),
  ('Øl: Fadøl - Tuborg Classic 50 cl', 'green', 18),
  ('Snack: Chokolade', 'green', 19),
  ('Snack: CHIPS', 'green', 20),
  ('Øl: Fadøl - Tuborg Classic 25 cl', 'green', 21);
