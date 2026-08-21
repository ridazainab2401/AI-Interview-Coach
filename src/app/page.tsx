import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import LandingPageClient from "./LandingPageClient";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const code = resolvedParams.code;
  const next = resolvedParams.next;

  if (typeof code === "string") {
    const nextPath = typeof next === "string" ? next : "/interview";
    redirect(`/auth/callback?code=${code}&next=${encodeURIComponent(nextPath)}`);
  }

  let isLoggedIn = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isLoggedIn = !!user;
  } catch (err) {
    console.error("Failed to check auth on server", err);
  }

  return <LandingPageClient initialIsLoggedIn={isLoggedIn} />;
}
