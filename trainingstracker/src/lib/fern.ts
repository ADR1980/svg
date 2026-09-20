/* ==========================================================================
   Supabase. Fehlen URL und Schlüssel, läuft die App im Alleingang: alles
   landet in IndexedDB und bleibt dort. Das ist kein Notbetrieb, sondern der
   Zustand vor der ersten Anmeldung.
   ========================================================================== */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const FOTO_EIMER = (import.meta.env.VITE_SUPABASE_BUCKET as string) || 'progress-photos'

export const fernVorhanden = Boolean(URL && KEY)

export const fern: SupabaseClient | null = fernVorhanden
  ? createClient(URL!, KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'trainingstracker-auth'
      }
    })
  : null

export function imNetz(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}
