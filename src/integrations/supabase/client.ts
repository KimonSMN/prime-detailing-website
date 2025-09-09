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
  // 👇 Kill caching in IG/TikTok/Facebook in-app browsers
  global: {
    fetch: (url, options) =>
      fetch(url, {
        ...options,
        cache: "no-store",
        headers: {
          ...(options?.headers || {}),
          "Cache-Control": "no-store",
          Pragma: "no-cache",
          Expires: "0",
        },
      }),
  },
});
