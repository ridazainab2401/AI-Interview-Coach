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
    <main className="min-h-screen p-8 md:p-16 max-w-4xl mx-auto flex flex-col justify-between">
      {/* Header bar */}
      <div className="flex justify-between items-center mb-12">
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--amber)]">
          THE INTERVIEW ROOM
        </p>
        <button
          onClick={handleLogout}
          className="px-4 py-1.5 border border-[var(--border)] hover:border-red-500/55 rounded-full text-xs font-mono text-[var(--muted)] hover:text-red-400 transition cursor-pointer"
        >
          Sign Out
        </button>
      </div>

      <div className="flex-grow flex flex-col justify-center">
        <div className="mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-semibold text-[var(--text)] leading-tight mb-4">
            Which room are you<br />walking into today?
          </h1>
          <p className="text-[var(--muted)] text-base md:text-lg max-w-xl leading-relaxed">
            Pick a track. A panel of four AI interviewers will take you through it, live, by voice.
          </p>
        </div>

        <div className="space-y-6 mb-10">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-2">
              Your Name
            </label>
            <input
              type="text"
              className="w-full max-w-md px-5 py-4 bg-[var(--panel)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--amber)] transition text-base"
              placeholder="Enter your name"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--muted)] mb-3">
              Select Your Role / Track
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {domains.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDomain(d.id)}
                  className={`p-5 rounded-2xl border text-left flex flex-col gap-2 transition duration-200 cursor-pointer ${
                    selectedDomain === d.id
                      ? "border-[var(--amber)] bg-[var(--amber-dim)]/5"
                      : "border-[var(--border)] bg-[var(--panel)] hover:-translate-y-0.5 hover:border-[var(--muted)]"
                  }`}
                >
                  <h3 className="font-display font-semibold text-lg text-[var(--amber)]">
                    {d.label}
                  </h3>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
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
            className="px-10 py-4.5 bg-[var(--amber)] text-[#17140f] rounded-full font-semibold transition hover:bg-[var(--amber)]/95 active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed text-base cursor-pointer shadow-lg"
          >
            {isStarting ? "Preparing the panel..." : "Enter the room"}
          </button>
          <p className="font-mono text-[10px] text-[var(--muted)]">
            * Uses your microphone. Works best in modern Chrome, Edge, or Safari.
          </p>
        </div>
      </div>

      <div className="mt-16 text-center text-xs text-[var(--muted)] font-mono">
        © 2026 The Interview Room
      </div>
    </main>
  );
}
