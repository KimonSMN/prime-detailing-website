// src/integrations/supabase/client.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true, // SDK handles refresh automatically
    detectSessionInUrl: true, // needed for OAuth/PKCE redirects
    flowType: "pkce", // uncomment if you use OAuth
  },
});

// Optional: wake/online hooks to nudge a refresh after sleep
if (typeof window !== "undefined") {
  const tryRefresh = async () => {
    try {
      await supabase.auth.refreshSession();
    } catch {
      /* ignore */
    }
  };
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tryRefresh();
  });
  window.addEventListener("online", tryRefresh);
}

// (Optional) Debug
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "TOKEN_REFRESHED") {
    console.info("Supabase token refreshed", session?.expires_at);
  }
});
