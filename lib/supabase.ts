import { createClient } from '@supabase/supabase-js';

// Mengambil dari environment Vite, dengan fallback permanen URL & Anon Key Subqi
const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  'https://ekyggonipxdjbzgkmxwr.supabase.co';

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWdnb25pcHhkamJ6Z2tteHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzOTExMjUsImV4cCI6MjA4ODk2NzEyNX0.gdt9tT_ndtfUF38IY3FbkMsca4hpP4x0yv5uh1Ud2HY';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERROR: Supabase URL/Key tidak ditemukan!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);