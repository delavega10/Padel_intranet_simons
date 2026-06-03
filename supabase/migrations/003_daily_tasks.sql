-- Daglige gøremål (mandag–søndag, runder) + medarbejder-sager

CREATE TYPE public.weekday AS ENUM (
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
);

CREATE TYPE public.case_status AS ENUM ('open', 'resolved');

-- Admin opretter opgaveskabeloner per ugedag og runde (1–5)
CREATE TABLE public.daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekday public.weekday NOT NULL,
  round_number INT NOT NULL CHECK (round_number >= 1 AND round_number <= 5),
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Afkrydsning per opgave per dag (én gang pr. opgave pr. dag)
CREATE TABLE public.daily_task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.daily_tasks(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, completion_date)
);

-- Sag oprettet af medarbejder (noget der skal fixes)
CREATE TABLE public.employee_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status public.case_status NOT NULL DEFAULT 'open',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by_name TEXT NOT NULL,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX daily_tasks_weekday_round_idx ON public.daily_tasks (weekday, round_number, sort_order);
CREATE INDEX daily_task_completions_date_idx ON public.daily_task_completions (completion_date);
CREATE INDEX employee_cases_open_idx ON public.employee_cases (status) WHERE status = 'open';

ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_cases ENABLE ROW LEVEL SECURITY;

-- Opgaver: alle godkendte læser; kun admin opretter/redigerer/sletter
CREATE POLICY "daily_tasks_select"
  ON public.daily_tasks FOR SELECT
  TO authenticated
  USING (public.is_approved());

CREATE POLICY "daily_tasks_admin_write"
  ON public.daily_tasks FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "daily_tasks_admin_update"
  ON public.daily_tasks FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "daily_tasks_admin_delete"
  ON public.daily_tasks FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Afkrydsninger: alle godkendte kan læse og oprette (afkrydse)
CREATE POLICY "completions_select"
  ON public.daily_task_completions FOR SELECT
  TO authenticated
  USING (public.is_approved());

CREATE POLICY "completions_insert"
  ON public.daily_task_completions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_approved() AND completed_by = auth.uid());

CREATE POLICY "completions_delete_admin_only"
  ON public.daily_task_completions FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Sager: alle læser; medarbejdere opretter; admin kan opdatere (løs sag)
CREATE POLICY "cases_select"
  ON public.employee_cases FOR SELECT
  TO authenticated
  USING (public.is_approved());

CREATE POLICY "cases_insert"
  ON public.employee_cases FOR INSERT
  TO authenticated
  WITH CHECK (public.is_approved() AND created_by = auth.uid());

CREATE POLICY "cases_update_admin"
  ON public.employee_cases FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
