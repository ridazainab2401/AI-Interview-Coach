"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isDemoBypass, setIsDemoBypass] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const errorParam = params.get("error");
      if (errorParam) {
        setErrorMsg(errorParam);
      }
    }
  }, []);

  useEffect(() => {
    // Check if session already exists
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.push("/interview");
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        router.push("/interview");
      }
    } catch (err: any) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setErrorMsg("");
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setErrorMsg(error.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setErrorMsg("An unexpected error occurred. Please try again.");
      setGoogleLoading(false);
    }
  };

  const handleDemoBypass = () => {
    // Set a local flag and redirect to demo interview dashboard
    localStorage.setItem("interview_auth_bypass", "true");
    router.push("/interview");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border-biolume-purple/20 shadow-2xl relative overflow-hidden">
        {/* Glow decorative bubble inside card */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary-container/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-1.5 mb-2">
            <img src="/assets/waterdrop.png" alt="Waterdrop Logo" className="w-4 h-4 object-contain" />
            <p className="font-mono text-xs uppercase tracking-widest text-pink-accent font-bold">
              WhaleWise Coach
            </p>
          </div>
          <h1 className="font-display text-4xl font-extrabold text-ocean-deep">
            Welcome back
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Sign in to start practicing with the AI panel
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border-l-2 border-red-500 rounded text-sm text-red-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-[var(--panel)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--amber)] transition"
              placeholder="name@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-2">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-[var(--panel)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--amber)] transition"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-[var(--amber)] text-[#17140f] py-3.5 rounded-full font-semibold transition hover:bg-[var(--amber)]/95 active:scale-[0.98] disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? "Authenticating..." : "Enter the Room"}
          </button>
        </form>

        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-[var(--border)]"></div>
          <span className="flex-shrink mx-4 text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-bold">or</span>
          <div className="flex-grow border-t border-[var(--border)]"></div>
        </div>

        <button
          onClick={signInWithGoogle}
          disabled={loading || googleLoading}
          className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-surface-container-low/50 border border-[var(--border)] hover:border-[var(--amber)] rounded-full text-sm font-semibold text-[var(--text)] transition cursor-pointer active:scale-[0.98] disabled:opacity-50"
        >
          {googleLoading ? (
            <span className="font-mono text-xs text-[var(--muted)] animate-pulse">Connecting to Google...</span>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.89 3.02C6.23 7.82 8.87 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.57v2.96h3.87c2.26-2.08 3.56-5.14 3.56-8.68z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 10.58c-.24-.73-.38-1.5-.38-2.3s.14-1.57.38-2.3L1.39 2.96C.5 4.77 0 6.81 0 9s.5 4.23 1.39 6.04l3.89-3.46z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.87-2.96c-1.08.72-2.45 1.16-4.09 1.16-3.13 0-5.77-2.78-6.72-6.52l-3.89 3.02C3.37 20.33 7.35 23 12 23z"
                />
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        <div className="mt-6 text-center text-sm text-[var(--muted)]">
          Don't have an account?{" "}
          <Link href="/signup" className="text-[var(--amber)] hover:underline">
            Sign up
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
          <p className="text-xs text-[var(--muted)] mb-3">
            Want to try the tool without signing up?
          </p>
          <button
            onClick={handleDemoBypass}
            className="px-4 py-2 border border-[var(--border)] hover:border-[var(--amber)] rounded-full text-xs font-mono text-[var(--text)] transition cursor-pointer"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </main>
  );
}
