import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = 'https://gnebvpqmaxxyzuxjrjid.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduZWJ2cHFtYXh4eXp1eGpyamlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDgzOTMsImV4cCI6MjA5NTk4NDM5M30.M8dmapsz-Qi83G4W_N8UHQN6sttuayLzVyA6QCbhy9U'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
