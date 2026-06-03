-- Nyhedsfeed: billeder og link-previews

ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS link_previews JSONB NOT NULL DEFAULT '[]';

-- Titel valgfri – feed bruger ofte kun brødtekst
ALTER TABLE public.news ALTER COLUMN title DROP NOT NULL;

-- Alle godkendte kan oprette feed-indlæg (forfatter = sig selv)
DROP POLICY IF EXISTS "news_admin_write" ON public.news;
DROP POLICY IF EXISTS "news_admin_update" ON public.news;
DROP POLICY IF EXISTS "news_admin_delete" ON public.news;

CREATE POLICY "news_insert_approved"
  ON public.news FOR INSERT
  TO authenticated
  WITH CHECK (public.is_approved() AND author_id = auth.uid());

CREATE POLICY "news_update_own_or_admin"
  ON public.news FOR UPDATE
  TO authenticated
  USING (public.is_approved() AND (author_id = auth.uid() OR public.is_admin()))
  WITH CHECK (public.is_approved());

CREATE POLICY "news_delete_own_or_admin"
  ON public.news FOR DELETE
  TO authenticated
  USING (public.is_approved() AND (author_id = auth.uid() OR public.is_admin()));

-- Storage til feed-billeder
INSERT INTO storage.buckets (id, name, public)
VALUES ('news-media', 'news-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "news_media_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'news-media' AND public.is_approved());

CREATE POLICY "news_media_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'news-media' AND public.is_approved());

CREATE POLICY "news_media_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'news-media' AND public.is_approved());
