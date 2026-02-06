import { createClient } from '@supabase/supabase-js';

// Mengambil variabel dari .env.local menggunakan standar Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validasi sederhana agar tidak pusing jika lupa isi .env
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL atau Anon Key belum disetting di .env.local!");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);