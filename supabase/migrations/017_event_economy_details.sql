-- Udvidet økonomi: tid på stedet, inkluderet, tilkøb

ALTER TABLE public.company_event_supplier_finance
  ADD COLUMN on_site_from TIME,
  ADD COLUMN on_site_to TIME,
  ADD COLUMN included_description TEXT,
  ADD COLUMN addon_description TEXT,
  ADD COLUMN addon_price NUMERIC(12, 2);

ALTER TABLE public.company_event_marketing_item_finance
  ADD COLUMN included_description TEXT,
  ADD COLUMN addon_description TEXT,
  ADD COLUMN addon_price NUMERIC(12, 2);
