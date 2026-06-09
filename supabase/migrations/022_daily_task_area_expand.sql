-- Udvid daglige opgaver med nye områder

CREATE TYPE public.daily_task_area_new AS ENUM (
  'cafe',
  'omklaedningsrum',
  'toiletter',
  'hallen',
  'sal1',
  'udeareal',
  'shop'
);

ALTER TABLE public.daily_tasks
  ALTER COLUMN area DROP DEFAULT;

ALTER TABLE public.daily_tasks
  ALTER COLUMN area TYPE public.daily_task_area_new
  USING (
    CASE area::text
      WHEN 'toilet' THEN 'toiletter'::public.daily_task_area_new
      WHEN 'bad' THEN 'omklaedningsrum'::public.daily_task_area_new
      WHEN 'cafe' THEN 'cafe'::public.daily_task_area_new
      WHEN 'hallen' THEN 'hallen'::public.daily_task_area_new
      ELSE 'hallen'::public.daily_task_area_new
    END
  );

ALTER TABLE public.daily_tasks
  ALTER COLUMN area SET DEFAULT 'cafe';

DROP TYPE public.daily_task_area;
ALTER TYPE public.daily_task_area_new RENAME TO daily_task_area;
