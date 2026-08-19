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
    <main className="min-h-screen flex items-center justify-center p-4 md:p-12 relative">
      {/* Floating bubbles */}
      <div className="bubble-container">
        <div className="bubble-unit" style={{ left: '15%', width: '35px', height: '35px', animationDelay: '1s', animationDuration: '14s' }}></div>
        <div className="bubble-unit" style={{ left: '25%', width: '25px', height: '25px', animationDelay: '3s', animationDuration: '12s' }}></div>
        <div className="bubble-unit" style={{ left: '60%', width: '45px', height: '45px', animationDelay: '0s', animationDuration: '16s' }}></div>
        <div className="bubble-unit" style={{ left: '80%', width: '20px', height: '20px', animationDelay: '5s', animationDuration: '10s' }}></div>
        <div className="bubble-unit" style={{ left: '95%', width: '30px', height: '30px', animationDelay: '2s', animationDuration: '18s' }}></div>
      </div>

      <div className="w-full max-w-6xl glass-panel rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col md:flex-row min-h-[600px] border-biolume-purple/30 z-10">
        {/* Left Column: Visuals & mascot */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-primary/10 via-secondary/10 to-sparkle-glow/20 p-8 md:p-16 flex flex-col justify-between items-center text-center relative border-b md:border-b-0 md:border-r border-biolume-purple/20">
          <div className="flex items-center gap-2 mb-8">
            <img src="/assets/waterdrop.png" alt="Waterdrop Logo" className="w-6 h-6 object-contain" />
            <span className="font-mono text-sm uppercase tracking-widest text-pink-accent font-black">
              WhaleWise Coach
            </span>
          </div>

          <div className="flex flex-col items-center gap-6 my-auto">
            <div className="relative w-64 h-64 flex items-center justify-center whale-float">
              <div className="absolute inset-0 bg-gradient-to-tr from-sparkle-glow/90 to-pearl-white/95 rounded-full blur-md scale-110 shadow-lg border border-white/50"></div>
              <img
                src="/assets/whalepng.png"
                alt="Fin the Whale CEO"
                className="w-56 h-56 rounded-full object-cover relative z-10 border-4 border-white shadow-xl"
              />
            </div>
            
            <div className="speech-balloon p-5 max-w-sm text-center relative z-20 mt-4">
              <p className="font-display font-extrabold text-ocean-deep text-sm leading-snug">
                "Welcome to the deep end of career preparation! Stop splashing around and let's get you hired."
              </p>
              <p className="text-[10px] font-mono text-[var(--muted)] mt-1.5 font-bold">
                — MR. BARNABY WRIGHT, CEO OF GLOBAL OCEAN INC.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs text-[var(--muted)] font-mono font-bold">
              AI Panel Interview · Live Voice Feedback · Advanced Grading
            </p>
          </div>
        </div>

        {/* Right Column: Form Section */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="font-display text-4xl md:text-5xl font-black text-ocean-deep leading-tight">
              Create an account
            </h1>
            <p className="text-sm text-[var(--muted)] mt-2 font-semibold">
              Sign up to save your reports and tracks
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-500/10 border-l-4 border-red-500 rounded-2xl text-sm text-red-700 font-semibold animate-pulse">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-green-500/10 border-l-4 border-green-500 rounded-2xl text-sm text-green-700 font-semibold animate-bounce">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-2 font-bold">
                Email Address
              </label>
              <input
                type="email"
                required
                className="w-full px-5 py-3.5 bg-surface-container-low/50 border-2 border-biolume-purple/30 rounded-2xl text-on-surface focus:outline-none focus:border-primary transition text-base"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-2 font-bold">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full px-5 py-3.5 bg-surface-container-low/50 border-2 border-biolume-purple/30 rounded-2xl text-on-surface focus:outline-none focus:border-primary transition text-base"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-2 font-bold">
                Confirm Password
              </label>
              <input
                type="password"
                required
                className="w-full px-5 py-3.5 bg-surface-container-low/50 border-2 border-biolume-purple/30 rounded-2xl text-on-surface focus:outline-none focus:border-primary transition text-base"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary via-pink-accent to-secondary hover:scale-[1.01] text-white py-4 rounded-full font-bold transition active:scale-[0.98] disabled:opacity-50 mt-2 cursor-pointer shadow-lg hover:shadow-xl text-base shadow-pink-accent/10 hover:shadow-pink-accent/20"
            >
              {loading ? "Creating account..." : "Join the Room"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--muted)] font-semibold">
            Already have an account?{" "}
            <Link href="/login" className="text-pink-accent font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
