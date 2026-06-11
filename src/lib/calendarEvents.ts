import { supabase } from '@/lib/supabase'

/** Slet et kalender-event (kræver admin via RLS). */
export async function deleteCalendarEvent(id: string): Promise<{ error: string | null }> {
  const { error, count } = await supabase
    .from('events')
    .delete({ count: 'exact' })
    .eq('id', id)

  if (error) return { error: error.message }
  if (!count) return { error: 'Eventet kunne ikke slettes. Prøv igen eller kontakt admin.' }
  return { error: null }
}
