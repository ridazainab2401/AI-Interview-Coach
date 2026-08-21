import { createBrowserClient } from "@supabase/ssr";

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
export const supabase = createBrowserClient(activeUrl, activeKey);

// Synchronize auth state with cookies for Next.js Middleware check
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
      if (session) {
        // Cookie expires in 7 days
        const maxAge = 7 * 24 * 60 * 60;
        document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
      }
    } else if (event === "SIGNED_OUT") {
      // Delete cookie
      document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure";
    }
  });
}


