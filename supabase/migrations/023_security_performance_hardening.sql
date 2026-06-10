-- Sikkerheds- og performance-oprydning (fra Supabase advisors)

-- 1) set_updated_at: lås search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2) SECURITY DEFINER-funktioner: fjern adgang for anon (og public)
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_approved() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_emil() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.can_manage_training() FROM anon, public;

-- handle_new_user er en trigger-funktion og skal ikke kunne kaldes via API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- 3) RLS initplan: brug (select auth.uid()) så den kun evalueres én gang
DROP POLICY "news_insert_approved" ON public.news;
CREATE POLICY "news_insert_approved"
  ON public.news FOR INSERT TO authenticated
  WITH CHECK (public.is_approved() AND author_id = (SELECT auth.uid()));

DROP POLICY "news_update_own_or_admin" ON public.news;
CREATE POLICY "news_update_own_or_admin"
  ON public.news FOR UPDATE TO authenticated
  USING (public.is_approved() AND (author_id = (SELECT auth.uid()) OR public.is_admin()))
  WITH CHECK (public.is_approved());

DROP POLICY "news_delete_own_or_admin" ON public.news;
CREATE POLICY "news_delete_own_or_admin"
  ON public.news FOR DELETE TO authenticated
  USING (public.is_approved() AND (author_id = (SELECT auth.uid()) OR public.is_admin()));

DROP POLICY "completions_insert" ON public.daily_task_completions;
CREATE POLICY "completions_insert"
  ON public.daily_task_completions FOR INSERT TO authenticated
  WITH CHECK (public.is_approved() AND completed_by = (SELECT auth.uid()));

DROP POLICY "cases_insert" ON public.employee_cases;
CREATE POLICY "cases_insert"
  ON public.employee_cases FOR INSERT TO authenticated
  WITH CHECK (public.is_approved() AND created_by = (SELECT auth.uid()));

DROP POLICY "admin_todos_insert" ON public.admin_todos;
CREATE POLICY "admin_todos_insert"
  ON public.admin_todos FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND created_by = (SELECT auth.uid()));

DROP POLICY "shop_orders_select" ON public.shop_orders;
CREATE POLICY "shop_orders_select"
  ON public.shop_orders FOR SELECT TO authenticated
  USING (public.is_approved() AND (ordered_by = (SELECT auth.uid()) OR public.is_admin()));

DROP POLICY "shop_orders_insert" ON public.shop_orders;
CREATE POLICY "shop_orders_insert"
  ON public.shop_orders FOR INSERT TO authenticated
  WITH CHECK (public.is_approved() AND ordered_by = (SELECT auth.uid()));

DROP POLICY "shop_order_lines_select" ON public.shop_order_lines;
CREATE POLICY "shop_order_lines_select"
  ON public.shop_order_lines FOR SELECT TO authenticated
  USING (public.is_approved() AND EXISTS (
    SELECT 1 FROM public.shop_orders o
    WHERE o.id = shop_order_lines.order_id
      AND (o.ordered_by = (SELECT auth.uid()) OR public.is_admin())
  ));

DROP POLICY "shop_order_lines_insert" ON public.shop_order_lines;
CREATE POLICY "shop_order_lines_insert"
  ON public.shop_order_lines FOR INSERT TO authenticated
  WITH CHECK (public.is_approved() AND EXISTS (
    SELECT 1 FROM public.shop_orders o
    WHERE o.id = shop_order_lines.order_id
      AND o.ordered_by = (SELECT auth.uid())
  ));

DROP POLICY "emil_todos_insert" ON public.emil_todos;
CREATE POLICY "emil_todos_insert"
  ON public.emil_todos FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND created_by = (SELECT auth.uid()));

-- 4) Indeks på fremmednøgler uden dækkende indeks
CREATE INDEX IF NOT EXISTS admin_todos_created_by_idx ON public.admin_todos (created_by);
CREATE INDEX IF NOT EXISTS company_events_created_by_idx ON public.company_events (created_by);
CREATE INDEX IF NOT EXISTS daily_task_completions_completed_by_idx ON public.daily_task_completions (completed_by);
CREATE INDEX IF NOT EXISTS documents_uploaded_by_idx ON public.documents (uploaded_by);
CREATE INDEX IF NOT EXISTS emil_todos_created_by_idx ON public.emil_todos (created_by);
CREATE INDEX IF NOT EXISTS employee_cases_created_by_idx ON public.employee_cases (created_by);
CREATE INDEX IF NOT EXISTS employee_cases_resolved_by_idx ON public.employee_cases (resolved_by);
CREATE INDEX IF NOT EXISTS events_created_by_idx ON public.events (created_by);
CREATE INDEX IF NOT EXISTS news_author_id_idx ON public.news (author_id);
CREATE INDEX IF NOT EXISTS shop_order_lines_order_id_idx ON public.shop_order_lines (order_id);
CREATE INDEX IF NOT EXISTS shop_order_lines_product_id_idx ON public.shop_order_lines (product_id);
CREATE INDEX IF NOT EXISTS shop_orders_ordered_by_idx ON public.shop_orders (ordered_by);
CREATE INDEX IF NOT EXISTS training_notes_author_id_idx ON public.training_notes (author_id);
