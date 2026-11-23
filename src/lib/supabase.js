import { createClient } from '@supabase/supabase-js'

// Backend do Lex: projeto Supabase "LexCalculator" da organização LexGroup (migrado em 23/11/2026).
export const SUPABASE_URL  = 'https://zdfvykmhddritwqjrnvi.supabase.co'
export const SUPABASE_ANON = 'sb_publishable_i427tan1KDU2wUe9ZHDwuQ_tYdUm7wJ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
