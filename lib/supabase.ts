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

// --- Cross-Subdomain Session Sync (www.subqi.com <-> subqi.com) ---
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const isSubqi = window.location.hostname.endsWith('subqi.com');
  const cookieDomain = isSubqi ? '.subqi.com' : '';
  const COOKIE_NAME = '__sq_auth_sync';

  const getCookie = (name: string): string | null => {
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : null;
  };

  const setSyncCookie = (tokens: { access_token: string; refresh_token: string }) => {
    try {
      const val = encodeURIComponent(JSON.stringify(tokens));
      const domainPart = cookieDomain ? `; Domain=${cookieDomain}` : '';
      document.cookie = `${COOKIE_NAME}=${val}; Path=/${domainPart}; Max-Age=2592000; SameSite=Lax; Secure`;
    } catch (_) {}
  };

  const clearSyncCookie = () => {
    try {
      const domainPart = cookieDomain ? `; Domain=${cookieDomain}` : '';
      document.cookie = `${COOKIE_NAME}=; Path=/${domainPart}; Max-Age=0; SameSite=Lax; Secure`;
    } catch (_) {}
  };

  // 1. Initial check: If localStorage has no session, try restoring from shared domain cookie
  (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const raw = getCookie(COOKIE_NAME);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.access_token && parsed?.refresh_token) {
            await supabase.auth.setSession({
              access_token: parsed.access_token,
              refresh_token: parsed.refresh_token
            });
          }
        }
      } else if (session.access_token && session.refresh_token) {
        setSyncCookie({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });
      }
    } catch (_) {}
  })();

  // 2. Auth state listener: Keep shared cookie updated on sign in / refresh / sign out
  supabase.auth.onAuthStateChange((event, session) => {
    if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
      setSyncCookie({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });
    } else if (event === 'SIGNED_OUT') {
      clearSyncCookie();
    }
  });
}