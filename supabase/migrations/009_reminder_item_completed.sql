-- Todo-liste: afkryds når vare er bestilt

ALTER TABLE public.shop_reminder_items
  ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT false;
