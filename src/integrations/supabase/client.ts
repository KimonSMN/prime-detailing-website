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
    detectSessionInUrl: true,
  },
  global: {
    // IMPORTANT: truly keep existing headers from BOTH input + init
    fetch: async (input, init) => {
      // Normalize to a Request so we don't lose body/method/etc.
      const baseReq =
        input instanceof Request ? input : new Request(input, init);

      // Merge headers from the base Request and init.headers (if present)
      const merged = new Headers(baseReq.headers);
      if (init?.headers) {
        new Headers(init.headers).forEach((v, k) => merged.set(k, v));
      }

      // Add your no-cache headers WITHOUT nuking auth/apikey
      merged.set("Cache-Control", "no-store");
      merged.set("Pragma", "no-cache");
      merged.set("Expires", "0");

      // Rebuild the Request with merged headers
      const finalReq = new Request(baseReq, {
        headers: merged,
        cache: "no-store",
      });

      return fetch(finalReq);
    },
  },
});
