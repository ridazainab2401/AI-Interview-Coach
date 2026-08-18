"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        // If confirmation is required, show verification prompt. If not, auto-sign in.
        if (data.session) {
          router.push("/interview");
        } else {
          setSuccessMsg("Registration successful! Check your email to confirm your account.");
        }
      }
    } catch (err: any) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border-amber/15 shadow-2xl">
        <div className="text-center mb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--amber)] mb-2">
            The Interview Room
          </p>
          <h1 className="font-display text-3xl font-semibold text-[var(--text)]">
            Create an account
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Sign up to save your reports and tracks
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/10 border-l-2 border-red-500 rounded text-sm text-red-400">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-green-500/10 border-l-2 border-green-500 rounded text-sm text-green-400">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
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
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-[var(--panel)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--amber)] transition"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--amber)] text-[#17140f] py-3.5 rounded-full font-semibold transition hover:bg-[var(--amber)]/95 active:scale-[0.98] disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? "Creating account..." : "Join the Room"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--amber)] hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
