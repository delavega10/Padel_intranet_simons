-- LunaLiga: booking-datoer, faktura og Matchi-bekræftelse per kaptajn

ALTER TABLE public.luna_captains
  ADD COLUMN IF NOT EXISTS booking_dates_comment TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_sent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS matchi_booking_confirmed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tracking_updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Alle godkendte kan opdatere tracking; kun admin opretter/sletter kaptajner
DROP POLICY IF EXISTS "luna_captains_admin_update" ON public.luna_captains;

CREATE POLICY "luna_captains_update_tracking"
  ON public.luna_captains FOR UPDATE
  TO authenticated
  USING (public.is_approved())
  WITH CHECK (public.is_approved());
