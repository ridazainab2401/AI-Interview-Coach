"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface DomainItem {
  id: string;
  label: string;
  focusAreas: string[];
}

export default function InterviewDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      // Check Supabase Auth
      const { data: { user } } = await supabase.auth.getUser();
      const hasBypass = localStorage.getItem("interview_auth_bypass") === "true";

      if (!user && !hasBypass) {
        router.push("/login");
        return;
      }

      setUser(user);
      if (user) {
        setCandidateName(user.email?.split("@")[0] || "");
      }

      // Fetch Domains from our API
      try {
        const res = await fetch("/api/domains");
        const data = await res.json();
        if (data.domains) {
          setDomains(data.domains);
        }
      } catch (err) {
        console.error("Failed to load domains:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [router]);

  const handleLogout = async () => {
    localStorage.removeItem("interview_auth_bypass");
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleBegin = async () => {
    if (!selectedDomain) return;
    setIsStarting(true);

    try {
      const res = await fetch("/api/interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domainId: selectedDomain,
          candidateName: candidateName.trim() || "Candidate",
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to start interview");
      }

      const data = await res.json();
      router.push(`/interview/${data.sessionId}`);
    } catch (err) {
      console.error(err);
      alert("Error starting interview. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-sm text-[var(--muted)] animate-pulse">
          Opening the doors...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-12 max-w-7xl mx-auto flex flex-col justify-between relative z-10">
      {/* Floating bubbles */}
      <div className="bubble-container">
        <div className="bubble-unit" style={{ left: '5%', width: '30px', height: '30px', animationDelay: '0s', animationDuration: '16s' }}></div>
        <div className="bubble-unit" style={{ left: '20%', width: '40px', height: '40px', animationDelay: '4s', animationDuration: '14s' }}></div>
        <div className="bubble-unit" style={{ left: '45%', width: '20px', height: '20px', animationDelay: '2s', animationDuration: '18s' }}></div>
        <div className="bubble-unit" style={{ left: '70%', width: '50px', height: '50px', animationDelay: '1s', animationDuration: '12s' }}></div>
        <div className="bubble-unit" style={{ left: '85%', width: '25px', height: '25px', animationDelay: '6s', animationDuration: '15s' }}></div>
      </div>

      {/* Header bar */}
      <div className="flex justify-between items-center mb-8 relative z-20">
        <div className="flex items-center gap-2">
          <img src="/assets/waterdrop.png" alt="Waterdrop Logo" className="w-6 h-6 object-contain" />
          <p className="font-mono text-sm uppercase tracking-widest text-pink-accent font-black">
            WhaleWise Interview
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="px-5 py-2 border-2 border-biolume-purple/30 hover:border-red-500/55 rounded-full text-xs font-mono text-on-surface-variant hover:text-red-600 transition cursor-pointer font-bold bg-white/40"
        >
          Sign Out
        </button>
      </div>

      {/* Main split-screen container */}
      <div className="flex-grow flex flex-col lg:flex-row gap-12 items-stretch mt-6 relative z-10">
        {/* Left Column: Input and selection */}
        <div className="flex-grow flex flex-col justify-center lg:w-3/5">
          <div className="mb-8">
            <h1 className="font-display text-4xl md:text-5xl font-black text-ocean-deep leading-tight mb-4">
              Which room are you<br />walking into today?
            </h1>
            <p className="text-[var(--muted)] text-base md:text-lg max-w-xl leading-relaxed font-semibold">
              Pick a track. A panel of AI interviewers will take you through it, live, by voice.
            </p>
          </div>

          <div className="space-y-8 mb-8">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-2 font-bold">
                Your Name
              </label>
              <input
                type="text"
                className="w-full max-w-md px-5 py-4 bg-white/70 border-2 border-biolume-purple/35 rounded-2xl text-on-surface focus:outline-none focus:border-primary transition text-base font-semibold shadow-sm"
                placeholder="Enter your name"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-3 font-bold">
                Select Your Role / Track
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {domains.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDomain(d.id)}
                    className={`p-6 rounded-[28px] border-2 text-left flex flex-col gap-2.5 transition duration-200 cursor-pointer shadow-sm ${selectedDomain === d.id
                      ? "border-pink-accent bg-pink-accent/10 scale-[1.01] shadow-md shadow-pink-accent/5"
                      : "border-biolume-purple/20 bg-white/70 hover:-translate-y-0.5 hover:border-pink-accent hover:shadow-md"
                      }`}
                  >
                    <h3 className="font-display font-extrabold text-lg text-ocean-deep">
                      {d.label}
                    </h3>
                    <p className="text-xs text-[var(--muted)] leading-relaxed font-bold">
                      {d.focusAreas.join(" · ")}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3">
            <button
              onClick={handleBegin}
              disabled={!selectedDomain || isStarting}
              className="px-12 py-4.5 bg-gradient-to-r from-primary via-pink-accent to-secondary hover:scale-[1.01] text-white rounded-full font-bold transition active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed text-base cursor-pointer shadow-lg hover:shadow-xl shadow-pink-accent/10 hover:shadow-pink-accent/20"
            >
              {isStarting ? "Preparing the panel..." : "Enter the room"}
            </button>
            <p className="font-mono text-[10px] text-[var(--muted)] font-bold">
              * Uses your microphone. Works best in modern Chrome, Edge, or Safari.
            </p>
          </div>
        </div>

        {/* Right Column: Illustration Panel */}
        <div className="w-full lg:w-2/5 flex flex-col items-center justify-center p-8 md:p-12 glass-panel rounded-[40px] border-biolume-purple/35 bg-surface-container-low/40 relative">
          <div className="flex flex-col items-center gap-6 my-auto">
            {/* Mascot float */}
            <div className="relative w-64 h-64 flex items-center justify-center whale-float">
              <div className="absolute inset-0 bg-gradient-to-tr from-sparkle-glow/90 to-pearl-white/95 rounded-full blur-md scale-110 shadow-lg border border-white/50"></div>
              <img
                src="/assets/whalepng.png"
                alt="Fin Presenting"
                className="w-56 h-56 rounded-full object-cover relative z-10 border-4 border-white shadow-xl"
              />
            </div>
            
            {/* Dialogue bubble next to mascot */}
            <div className="speech-balloon p-6 relative z-10 w-full max-w-sm mt-4 text-center">
              <p className="font-display font-extrabold text-ocean-deep text-sm leading-snug">
                "Don't worry, we won't bite! Select a track, prepare your microphone, and step into the interview room."
              </p>
              <p className="text-[10px] font-mono text-[var(--muted)] mt-2 font-bold">
                — FIN, YOUR LEAD COACH
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center text-xs text-[var(--muted)] font-mono font-bold relative z-20">
        © 2026 WhaleWise Interview Room
      </div>
    </main>
  );
}
