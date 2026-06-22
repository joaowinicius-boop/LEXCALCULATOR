import { createClient } from '@supabase/supabase-js'

// Backend consolidado no projeto RA TECHNOLOGY (ACTIVE — não pausa por inatividade).
const SUPABASE_URL  = 'https://gtyvqzljarwkwrmukejj.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0eXZxemxqYXJ3a3dybXVrZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzcyODQsImV4cCI6MjA4ODY1MzI4NH0.wDnmNobVnZq_u3L4Jz4I5qGpFixErbQ7W42mHqYYgAg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
