import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase URL or Anon Key is missing. Auth features will fail until env variables are set up."
  );
}

// Client for frontend / client-side components
export const supabase = createClient(supabaseUrl || "https://dummy.supabase.co", supabaseAnonKey || "dummy_key");
