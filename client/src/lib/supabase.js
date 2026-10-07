import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://byztyberaoyczdaffbbe.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5enR5YmVyYW95Y3pkYWZmYmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMjA4NjMsImV4cCI6MjEwNjc5Njg2M30.VLd4yVlRrA5OtAmHx1fb8I5xWHPgPw6kluSALCJY8Bg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
