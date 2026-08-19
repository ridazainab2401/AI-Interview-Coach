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
  const [isDemoBypass, setIsDemoBypass] = useState(false);

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
            disabled={loading}
            className="w-full bg-[var(--amber)] text-[#17140f] py-3.5 rounded-full font-semibold transition hover:bg-[var(--amber)]/95 active:scale-[0.98] disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? "Authenticating..." : "Enter the Room"}
          </button>
        </form>

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
