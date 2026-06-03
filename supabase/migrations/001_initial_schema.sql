-- Padelklub intranet – initial schema
-- Kør i Supabase SQL Editor eller via: supabase db push

-- Roller
CREATE TYPE public.user_role AS ENUM ('admin', 'trainer', 'employee');

-- Dokumentkategorier
CREATE TYPE public.document_category AS ENUM (
  'personale',
  'traening',
  'turnering',
  'sponsor',
  'drift'
);

-- Profiler (koblet til auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role public.user_role NOT NULL DEFAULT 'employee',
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Nyheder
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  published_at DATE NOT NULL DEFAULT CURRENT_DATE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Events / kalender
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  description TEXT,
  responsible_person TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dokumentmetadata (filer i Storage)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category public.document_category NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Træningsnoter
CREATE TABLE public.training_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name TEXT NOT NULL,
  level TEXT NOT NULL,
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  exercises TEXT,
  notes TEXT,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Opdater updated_at automatisk
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER news_updated_at
  BEFORE UPDATE ON public.news
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER training_notes_updated_at
  BEFORE UPDATE ON public.training_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Opret profil ved ny bruger (skal godkendes af admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Hjælpefunktioner til RLS (bruger profiles – ikke user_metadata)
CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND approved = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND approved = true AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_trainer_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND approved = true
      AND role IN ('admin', 'trainer')
  );
$$;

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_notes ENABLE ROW LEVEL SECURITY;

-- Profiles: godkendte brugere kan læse alle; kun admin kan opdatere andre
CREATE POLICY "profiles_select_approved"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_approved_user());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() AND public.is_approved_user())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_admin_all"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- News: alle godkendte læser; admin skriver
CREATE POLICY "news_select_approved"
  ON public.news FOR SELECT
  TO authenticated
  USING (public.is_approved_user());

CREATE POLICY "news_admin_write"
  ON public.news FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "news_admin_update"
  ON public.news FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "news_admin_delete"
  ON public.news FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Events
CREATE POLICY "events_select_approved"
  ON public.events FOR SELECT
  TO authenticated
  USING (public.is_approved_user());

CREATE POLICY "events_admin_write"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "events_admin_update"
  ON public.events FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "events_admin_delete"
  ON public.events FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Documents
CREATE POLICY "documents_select_approved"
  ON public.documents FOR SELECT
  TO authenticated
  USING (public.is_approved_user());

CREATE POLICY "documents_admin_write"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "documents_admin_delete"
  ON public.documents FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Training notes: alle læser; træner/admin skriver
CREATE POLICY "training_notes_select_approved"
  ON public.training_notes FOR SELECT
  TO authenticated
  USING (public.is_approved_user());

CREATE POLICY "training_notes_trainer_insert"
  ON public.training_notes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_trainer_or_admin());

CREATE POLICY "training_notes_trainer_update"
  ON public.training_notes FOR UPDATE
  TO authenticated
  USING (public.is_trainer_or_admin() OR author_id = auth.uid())
  WITH CHECK (public.is_trainer_or_admin());

CREATE POLICY "training_notes_admin_delete"
  ON public.training_notes FOR DELETE
  TO authenticated
  USING (public.is_admin() OR author_id = auth.uid());

-- Storage bucket til dokumenter (opret bucket "documents" i dashboard)
-- Kør efter bucket er oprettet:
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "documents_storage_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents' AND public.is_approved_user());

CREATE POLICY "documents_storage_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents' AND public.is_admin());

CREATE POLICY "documents_storage_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents' AND public.is_admin());

CREATE POLICY "documents_storage_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents' AND public.is_admin());
