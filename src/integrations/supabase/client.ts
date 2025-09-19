// src/integrations/supabase/client.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// ---- Refresh coordination (single-flight) ----
let refreshInFlight: Promise<void> | null = null;

async function runSingleRefresh() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      // Ask SDK to refresh; swallow failures (we'll surface on retry)
      try {
        await supabase.auth.refreshSession();
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

// Refresh if we’re close to expiry (handles tab sleep/wake)
async function ensureFreshToken(bufferSec = 60) {
  const { data } = await supabase.auth.getSession();
  const exp = data.session?.expires_at; // unix seconds
  if (!exp) return;
  const now = Math.floor(Date.now() / 1000);
  if (exp - now <= bufferSec) {
    await runSingleRefresh();
  }
}

const SUPABASE_HOST = new URL(supabaseUrl).host;
const isSupabaseRequest = (url: string) => {
  try {
    return new URL(url).host.endsWith(SUPABASE_HOST);
  } catch {
    return false;
  }
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    // IMPORTANT: keep all headers/method/body and make JWT expiry invisible to the app
    fetch: async (input, init) => {
      // Build base Request
      const baseReq =
        input instanceof Request ? input : new Request(input, init);

      // Proactive refresh (prevents first-call-after-sleep 401s)
      if (isSupabaseRequest(baseReq.url)) {
        await ensureFreshToken(75); // refresh ~75s before exp
      }

      // Merge headers from request + init
      const merged = new Headers(baseReq.headers);
      if (init?.headers)
        new Headers(init.headers).forEach((v, k) => merged.set(k, v));

      // Add cache-busters (don’t overwrite Authorization/apikey)
      merged.set("Cache-Control", "no-store");
      merged.set("Pragma", "no-cache");
      merged.set("Expires", "0");

      // First attempt
      const attempt = async () =>
        fetch(new Request(baseReq, { headers: merged, cache: "no-store" }));

      let res = await attempt();

      // If we hit 401 from Supabase, force a single-flight refresh and retry once
      if (res.status === 401 && isSupabaseRequest(baseReq.url)) {
        await runSingleRefresh();
        res = await attempt();
      }

      return res;
    },
  },
});

// Optional: wake/online hooks to refresh immediately after sleep/offline
if (typeof window !== "undefined") {
  const tryRefresh = async () => {
    try {
      await ensureFreshToken(3600);
    } catch {}
  };
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") tryRefresh();
  });
  window.addEventListener("online", tryRefresh);
}

// (Optional) Debug
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "TOKEN_REFRESHED")
    console.info("Supabase token refreshed", session?.expires_at);
});
