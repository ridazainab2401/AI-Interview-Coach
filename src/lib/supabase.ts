import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isValidUrl = (url: string) => {
  return url && (url.startsWith("http://") || url.startsWith("https://"));
};

if (!isValidUrl(supabaseUrl) || !supabaseAnonKey || supabaseAnonKey.includes("placeholder") || supabaseAnonKey.includes("your_")) {
  console.warn(
    "Supabase URL or Anon Key is missing or invalid. Auth features will fail until env variables are set up."
  );
}

const activeUrl = isValidUrl(supabaseUrl) ? supabaseUrl : "https://dummy.supabase.co";
const activeKey = supabaseAnonKey && !supabaseAnonKey.includes("placeholder") && !supabaseAnonKey.includes("your_") 
  ? supabaseAnonKey 
  : "dummy_key";

// Client for frontend / client-side components
export const supabase = createClient(activeUrl, activeKey);

