// src/integrations/supabase/client.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  // IMPORTANT: keep existing headers from supabase-js (apikey, Authorization)
  global: {
    fetch: (input: RequestInfo, init?: RequestInit) => {
      const headers = new Headers(init?.headers as HeadersInit);
      headers.set("Cache-Control", "no-store");
      headers.set("Pragma", "no-cache");
      headers.set("Expires", "0");

      return fetch(input, {
        ...init,
        cache: "no-store",
        headers, // <- send the merged Headers object, not a spread
      });
    },
  },
});
