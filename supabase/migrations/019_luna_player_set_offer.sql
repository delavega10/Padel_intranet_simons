-- LunaLiga: spillersæt-tilbud (skabelon + tracking per kaptajn)

CREATE TABLE public.luna_player_set_offer (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  set_name TEXT NOT NULL DEFAULT 'Spillersæt',
  quantity INT,
  included_description TEXT,
  price NUMERIC(12, 2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.luna_player_set_offer (id, set_name)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Spillersæt')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.luna_captains
  ADD COLUMN IF NOT EXISTS player_set_offer_sent BOOLEAN NOT NULL DEFAULT false;

CREATE TRIGGER luna_player_set_offer_updated_at
  BEFORE UPDATE ON public.luna_player_set_offer
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.luna_player_set_offer ENABLE ROW LEVEL SECURITY;

CREATE POLICY "luna_player_set_offer_select"
  ON public.luna_player_set_offer FOR SELECT TO authenticated
  USING (public.is_approved());

CREATE POLICY "luna_player_set_offer_admin_write"
  ON public.luna_player_set_offer FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
