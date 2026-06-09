-- Daglige gøremål: områder (Cafe, Toilet, Bad, Hallen)

CREATE TYPE public.daily_task_area AS ENUM ('cafe', 'toilet', 'bad', 'hallen');

ALTER TABLE public.daily_tasks
  ADD COLUMN IF NOT EXISTS area public.daily_task_area NOT NULL DEFAULT 'hallen';

CREATE INDEX IF NOT EXISTS daily_tasks_weekday_area_idx
  ON public.daily_tasks (weekday, area, sort_order);
