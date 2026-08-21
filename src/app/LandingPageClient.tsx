"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface LandingPageClientProps {
  initialIsLoggedIn: boolean;
}

interface DomainItem {
  id: string;
  label: string;
  focusAreas: string[];
}

export default function LandingPageClient({ initialIsLoggedIn }: LandingPageClientProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);
  const [isGuest, setIsGuest] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Simulation State
  const [simStep, setSimStep] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(true);

  // Tracks / Domains data
  const domains: DomainItem[] = [
    {
      id: "frontend",
      label: "Frontend Developer",
      focusAreas: ["JavaScript", "React", "CSS/Layout", "Web Performance", "Accessibility"],
    },
    {
      id: "backend",
      label: "Backend Developer",
      focusAreas: ["APIs", "Databases", "System Design", "Concurrency", "Security"],
    },
    {
      id: "ai_ml",
      label: "AI / Machine Learning Engineer",
      focusAreas: ["ML Fundamentals", "Model Evaluation", "Data Pipelines", "LLMs", "Deployment"],
    },
    {
      id: "devops",
      label: "DevOps / Platform Engineer",
      focusAreas: ["CI/CD", "Containers", "Cloud Infra", "Monitoring", "Incident Response"],
    },
    {
      id: "hr_behavioral",
      label: "General / Behavioral (any field)",
      focusAreas: ["Communication", "Teamwork", "Conflict Resolution", "Leadership", "Motivation"],
    },
  ];

  const [activeTab, setActiveTab] = useState(domains[0].id);

  useEffect(() => {
    // Client-side authentication checks
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const hasBypass = localStorage.getItem("interview_auth_bypass") === "true";
      
      if (data.session) {
        setIsLoggedIn(true);
      }
      if (hasBypass) {
        setIsGuest(true);
      }
    };
    checkAuth();
  }, []);

  const handleGuestBypass = () => {
    localStorage.setItem("interview_auth_bypass", "true");
    setIsGuest(true);
    router.push("/interview");
  };

  const handlePrimaryCTA = () => {
    if (isLoggedIn || isGuest) {
      router.push("/interview");
    } else {
      router.push("/login");
    }
  };

  // Simulation steps
  const simulationTurns = [
    {
      interviewer: "Ali, HR Interviewer",
      avatar: "🐳",
      question: "Welcome to your WhaleWise interview. To start off, tell me about yourself and why you're interested in joining our team.",
      answer: "I'm a full-stack engineer passionate about building high-performance applications. I love how WhaleWise makes coaching accessible, and I want to contribute to scaling your AI agents.",
      feedback: {
        scores: { communication: 90, content: 85, structure: 88 },
        overall: "87.6",
        hint: "Great structure. Try using the STAR method to elaborate on a specific project you scaled.",
      },
    },
    {
      interviewer: "Huzaifa, Senior Engineer",
      avatar: "🐋",
      question: "Let's dive into system performance. How would you optimize a slow React application displaying large real-time datasets?",
      answer: "I would implement windowing via React Virtualized to render only visible rows, use memoization hooks like useMemo and useCallback to avoid unneeded re-renders, and throttle state updates from WebSocket streams.",
      feedback: {
        scores: { communication: 92, content: 95, structure: 90 },
        overall: "92.3",
        hint: "Excellent backend/frontend trade-off awareness. Throttling updates is a crucial engineering detail.",
      },
    },
    {
      interviewer: "Usman, CTO",
      avatar: "🌊",
      question: "Tell me about a time you disagreed with a key design decision made by a senior colleague. How did you handle it?",
      answer: "We were deciding between a SQL database and a document store. I set up a quick bench testing script to prove SQL transaction integrity was necessary for our ledger. I presented the quantitative data without blaming, and we reached an agreement.",
      feedback: {
        scores: { communication: 95, content: 92, structure: 94 },
        overall: "93.6",
        hint: "Perfect answer demonstrating professional data-driven communication and collaboration.",
      },
    },
  ];

  const currentTurn = simulationTurns[simStep];

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
      {/* Background decoration */}
      <div className="bubble-container">
        <div className="bubble-unit" style={{ left: "8%", width: "25px", height: "25px", animationDelay: "0s", animationDuration: "18s" }}></div>
        <div className="bubble-unit" style={{ left: "25%", width: "35px", height: "35px", animationDelay: "3s", animationDuration: "15s" }}></div>
        <div className="bubble-unit" style={{ left: "55%", width: "20px", height: "20px", animationDelay: "1s", animationDuration: "20s" }}></div>
        <div className="bubble-unit" style={{ left: "75%", width: "45px", height: "45px", animationDelay: "5s", animationDuration: "13s" }}></div>
        <div className="bubble-unit" style={{ left: "90%", width: "30px", height: "30px", animationDelay: "2s", animationDuration: "17s" }}></div>
      </div>

      {/* Navbar */}
      <nav className="w-full sticky top-0 z-50 bg-white/40 backdrop-blur-md border-b border-biolume-purple/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/assets/waterdrop.png" alt="Waterdrop Logo" className="w-6 h-6 object-contain" />
            <span className="font-display font-extrabold text-xl text-ocean-deep tracking-tight">
              WhaleWise <span className="text-pink-accent">Coach</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-ocean-deep hover:text-pink-accent transition">
              Tracks
            </a>
            <a href="#how-it-works" className="text-sm font-semibold text-ocean-deep hover:text-pink-accent transition">
              How It Works
            </a>
            <a href="#live-demo" className="text-sm font-semibold text-ocean-deep hover:text-pink-accent transition">
              Interactive Demo
            </a>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn || isGuest ? (
              <button
                onClick={() => router.push("/interview")}
                className="px-5 py-2.5 bg-primary text-white hover:bg-primary-container rounded-full text-xs font-mono font-bold transition shadow-md active:scale-95 cursor-pointer"
              >
                Enter the Room
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-5 py-2.5 border-2 border-biolume-purple/30 hover:border-pink-accent rounded-full text-xs font-mono text-ocean-deep hover:text-pink-accent transition font-bold bg-white/30"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-2.5 bg-[var(--amber)] hover:bg-[var(--amber)]/90 text-white rounded-full text-xs font-mono font-bold transition shadow-md active:scale-95 cursor-pointer"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center p-2 text-ocean-deep focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-biolume-purple/20 flex flex-col gap-4 animate-fadeIn">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-ocean-deep hover:text-pink-accent px-2 py-1 transition"
            >
              Tracks
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-ocean-deep hover:text-pink-accent px-2 py-1 transition"
            >
              How It Works
            </a>
            <a
              href="#live-demo"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-ocean-deep hover:text-pink-accent px-2 py-1 transition"
            >
              Interactive Demo
            </a>
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-biolume-purple/10">
              {isLoggedIn || isGuest ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push("/interview");
                  }}
                  className="w-full text-center py-3 bg-primary text-white rounded-full font-mono text-xs font-bold transition"
                >
                  Enter the Room
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-3 border border-biolume-purple/30 rounded-full font-mono text-xs font-bold text-ocean-deep"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-3 bg-[var(--amber)] text-white rounded-full font-mono text-xs font-bold"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="w-full relative overflow-hidden bg-gradient-to-b from-blue-50/20 via-purple-50/10 to-transparent">
        {/* Spotlighting glowing overlay behind the content */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-primary/10 to-pink-accent/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
        
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-24 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-pink-accent/10 border border-pink-accent/25 rounded-full text-xs font-mono text-pink-accent font-bold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-accent animate-pulse"></span>
              Live Voice Coaching
            </div>

            <h1 className="font-display text-5xl md:text-6xl font-black text-ocean-deep leading-tight">
              Walk into the room.<br />
              Face the <span className="bg-gradient-to-r from-primary to-pink-accent bg-clip-text text-transparent">AI Panel.</span>
            </h1>

            <p className="text-base md:text-lg text-[var(--muted)] max-w-xl leading-relaxed font-medium">
              Simulate real-world stress with an adaptive panel of AI interviewers. Practice live by voice, face unexpected follow-ups, and get a complete diagnostic breakdown of your communication.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <button
                onClick={handlePrimaryCTA}
                className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-98 transition text-center cursor-pointer flex justify-center items-center gap-2"
              >
                Start Free Practice
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
              <button
                onClick={handleGuestBypass}
                className="px-8 py-4 border-2 border-biolume-purple/45 hover:border-pink-accent text-ocean-deep hover:text-pink-accent font-semibold rounded-full bg-white/40 transition text-center cursor-pointer"
              >
                Try as Guest (Instant Access)
              </button>
            </div>

          {/* Social Proof Stats */}
          <div className="pt-8 grid grid-cols-3 gap-6 border-t border-biolume-purple/20">
            <div>
              <p className="font-display text-2xl font-black text-ocean-deep">5+</p>
              <p className="text-xs text-[var(--muted)] font-mono uppercase tracking-wider">Tracks Supported</p>
            </div>
            <div>
              <p className="font-display text-2xl font-black text-ocean-deep">Instant</p>
              <p className="text-xs text-[var(--muted)] font-mono uppercase tracking-wider">Voice Responses</p>
            </div>
            <div>
              <p className="font-display text-2xl font-black text-ocean-deep">Adaptive</p>
              <p className="text-xs text-[var(--muted)] font-mono uppercase tracking-wider">Stress Simulator</p>
            </div>
          </div>
        </div>

        {/* Visual Hero Mockup */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-lg glass-panel p-6 rounded-3xl border-biolume-purple/35 shadow-2xl relative">
            <div className="flex justify-between items-center pb-4 border-b border-biolume-purple/25 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse on-air-indicator"></span>
                <span className="font-mono text-xs tracking-wider uppercase font-bold text-red-600">ON AIR - SIMULATOR</span>
              </div>
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-primary/20"></span>
                <span className="w-3 h-3 rounded-full bg-primary/20"></span>
                <span className="w-3 h-3 rounded-full bg-primary/20"></span>
              </div>
            </div>

            {/* Simulated Live Panel Screen */}
            <div className="bg-white/50 rounded-2xl p-5 border border-biolume-purple/15 flex flex-col gap-6 min-h-[300px] justify-between relative overflow-hidden">
              {/* Interviewer Avatar and Details */}
              <div className="flex items-center gap-4 bg-white/70 p-3.5 rounded-xl border border-biolume-purple/10 shadow-sm relative z-10">
                <div className="w-12 h-12 bg-pink-accent/15 border border-pink-accent/35 rounded-xl flex items-center justify-center text-2xl shadow-inner animate-bounce">
                  {currentTurn.avatar}
                </div>
                <div>
                  <h4 className="font-display font-extrabold text-base text-ocean-deep">{currentTurn.interviewer}</h4>
                  <p className="text-xs font-mono text-[var(--muted)]">Active Panelist (Round {simStep + 1} of 3)</p>
                </div>
              </div>

              {/* Speech Output */}
              <div className="flex-grow flex flex-col justify-center">
                <div className="speech-balloon p-5 text-sm md:text-base font-medium leading-relaxed text-ocean-deep text-center transition-all duration-300">
                  "{currentTurn.question}"
                </div>
              </div>

              {/* Bouncing Waveform Animation */}
              <div className="flex items-center justify-center gap-1.5 h-10 mt-2 z-10">
                <span className="audio-bar w-1 bg-pink-accent h-6 rounded-full"></span>
                <span className="audio-bar w-1 bg-primary h-8 rounded-full"></span>
                <span className="audio-bar w-1 bg-pink-accent h-4 rounded-full"></span>
                <span className="audio-bar w-1 bg-secondary h-9 rounded-full"></span>
                <span className="audio-bar w-1 bg-primary h-5 rounded-full"></span>
                <span className="audio-bar w-1 bg-pink-accent h-7 rounded-full"></span>
                <span className="audio-bar w-1 bg-primary h-3 rounded-full"></span>
              </div>
            </div>

            {/* Simulation Controller */}
            <div className="mt-4 pt-4 border-t border-biolume-purple/20 flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--muted)]">Interactive Preview</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSimStep((prev) => (prev > 0 ? prev - 1 : 2))}
                  className="p-2 border border-biolume-purple/25 hover:border-pink-accent rounded-full text-xs font-mono text-ocean-deep hover:text-pink-accent transition cursor-pointer flex items-center justify-center"
                  aria-label="Previous step"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button
                  onClick={() => setSimStep((prev) => (prev < 2 ? prev + 1 : 0))}
                  className="px-4 py-2 bg-ocean-deep hover:bg-pink-accent text-white font-mono text-xs rounded-full transition flex items-center gap-1.5 cursor-pointer font-bold"
                >
                  Next Interviewer
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

      {/* Tracks Showcase Section */}
      <section id="features" className="bg-white/95 border-y border-biolume-purple/25 py-20 relative z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-12">
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="font-display text-4xl font-extrabold text-ocean-deep">
              Practice specialized tracks with tailored panel personas
            </h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Every track features a different panel profile, asking adaptive core technology, collaboration, and leadership questions.
            </p>
          </div>

          {/* Interactive Tabs */}
          <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
            {domains.map((domain) => (
              <button
                key={domain.id}
                onClick={() => setActiveTab(domain.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-mono font-bold transition border cursor-pointer ${
                  activeTab === domain.id
                    ? "bg-pink-accent text-white border-pink-accent shadow-md"
                    : "bg-white/60 text-ocean-deep border-biolume-purple/25 hover:border-pink-accent/50"
                }`}
              >
                {domain.label}
              </button>
            ))}
          </div>

          {/* Selected Track Details Card */}
          <div className="max-w-3xl mx-auto glass-panel p-8 rounded-3xl border-biolume-purple/30 shadow-xl relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-accent/5 rounded-full blur-2xl"></div>
            
            {domains.map((domain) => {
              if (domain.id !== activeTab) return null;
              return (
                <div key={domain.id} className="space-y-6 text-left animate-fadeIn">
                  <h3 className="font-display text-2xl font-black text-ocean-deep flex items-center gap-2">
                    <span className="text-pink-accent">#</span> {domain.label} Track
                  </h3>

                  <div>
                    <h4 className="font-mono text-xs uppercase tracking-wider text-[var(--muted)] mb-3 font-bold">Focus Areas Evaluated:</h4>
                    <div className="flex flex-wrap gap-2">
                      {domain.focusAreas.map((area, idx) => (
                        <span
                          key={idx}
                          className="px-3.5 py-1.5 bg-primary-container/20 text-ocean-deep rounded-lg text-xs font-semibold border border-primary/10 shadow-sm"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-biolume-purple/10 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/40 p-4 rounded-xl border border-biolume-purple/10">
                      <p className="font-mono text-[10px] text-pink-accent uppercase tracking-wider font-bold">Panel Stage 1</p>
                      <p className="font-display font-bold text-sm text-ocean-deep mt-1">HR & Motivation</p>
                      <p className="text-xs text-[var(--muted)] mt-1.5">Culture fit, motivation, and career direction details.</p>
                    </div>
                    <div className="bg-white/40 p-4 rounded-xl border border-biolume-purple/10">
                      <p className="font-mono text-[10px] text-pink-accent uppercase tracking-wider font-bold">Panel Stage 2</p>
                      <p className="font-display font-bold text-sm text-ocean-deep mt-1">Technical Core</p>
                      <p className="text-xs text-[var(--muted)] mt-1.5">Adaptive coding, frameworks, and architecture fundamentals.</p>
                    </div>
                    <div className="bg-white/40 p-4 rounded-xl border border-biolume-purple/10">
                      <p className="font-mono text-[10px] text-pink-accent uppercase tracking-wider font-bold">Panel Stage 3</p>
                      <p className="font-display font-bold text-sm text-ocean-deep mt-1">Leadership & System</p>
                      <p className="text-xs text-[var(--muted)] mt-1.5">CTO alignment, scaling constraints, and team conflicts.</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="w-full bg-[#f4f7ff]/95 border-y border-biolume-purple/20 py-24 relative z-10 shadow-inner">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto space-y-4 mb-16">
            <h2 className="font-display text-4xl font-extrabold text-ocean-deep">
              How The Interview Room Works
            </h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Prepare, practice, and polish your interviewing skills in three simple stages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="glass-panel p-6 rounded-2xl border-biolume-purple/25 relative flex flex-col justify-between bg-white/70">
              <span className="font-mono text-5xl text-pink-accent/20 font-black absolute top-4 right-4">01</span>
              <div className="space-y-4 mt-8">
                <h3 className="font-display text-lg font-bold text-ocean-deep">Pick Your Domain</h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Choose from Backend, Frontend, AI/ML, DevOps, or General behavioral tracks. Add your name to let the AI address you dynamically.
                </p>
              </div>
              <div className="mt-6 flex justify-start">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A4.86 4.86 0 0012 8a4.86 4.86 0 00-7.5 2.332V21m15 0h-15" />
                </svg>
              </div>
            </div>

            {/* Step 2 */}
            <div className="glass-panel p-6 rounded-2xl border-biolume-purple/25 relative flex flex-col justify-between bg-white/70">
              <span className="font-mono text-5xl text-pink-accent/20 font-black absolute top-4 right-4">02</span>
              <div className="space-y-4 mt-8">
                <h3 className="font-display text-lg font-bold text-ocean-deep">Speak to the AI Panel</h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Listen to voice questions, speak your responses, or view transcripts. The panel adapts its follow-up questions based on your details.
                </p>
              </div>
              <div className="mt-6 flex justify-start">
                <svg className="w-8 h-8 text-pink-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </div>
            </div>

            {/* Step 3 */}
            <div className="glass-panel p-6 rounded-2xl border-biolume-purple/25 relative flex flex-col justify-between bg-white/70">
              <span className="font-mono text-5xl text-pink-accent/20 font-black absolute top-4 right-4">03</span>
              <div className="space-y-4 mt-8">
                <h3 className="font-display text-lg font-bold text-ocean-deep">Get Real-Time Diagnostics</h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  View detailed scores across communication clarity, structural flow, and code correctness. Receive helpful tips on how to improve.
                </p>
              </div>
              <div className="mt-6 flex justify-start">
                <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v5.25c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 18.375v-5.25zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125v-9.75zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v14.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Interactive Evaluation Demo Widget */}
      <section id="live-demo" className="bg-white/95 border-t border-biolume-purple/25 py-20 relative z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto space-y-4 mb-12">
            <h2 className="font-display text-3xl font-extrabold text-ocean-deep">
              Experience the Feedback Engine
            </h2>
            <p className="text-sm text-[var(--muted)]">
              See what feedback looks like. Below is the active panel evaluation scorecard for the current preview step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            {/* Left Box: Speech bubbles */}
            <div className="md:col-span-7 glass-panel p-6 rounded-2xl border-biolume-purple/25 flex flex-col justify-between gap-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💬</span>
                  <span className="font-mono text-[10px] text-pink-accent uppercase tracking-wider font-bold">Simulated Dialogue</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/60 p-3 rounded-xl border border-biolume-purple/10 text-xs">
                    <p className="font-bold text-ocean-deep">{currentTurn.interviewer}</p>
                    <p className="text-[var(--muted)] mt-1">"{currentTurn.question}"</p>
                  </div>
                  <div className="speech-balloon-left p-3 text-xs bg-white text-ocean-deep">
                    <p className="font-bold text-pink-accent">Your Answer</p>
                    <p className="mt-1">"{currentTurn.answer}"</p>
                  </div>
                </div>
              </div>
              <div className="text-center text-xs text-[var(--muted)] bg-white/20 p-2 rounded border border-biolume-purple/10 font-mono">
                Click "Next Interviewer" on the simulator above to see other examples!
              </div>
            </div>

            {/* Right Box: Scorecard diagnostics */}
            <div className="md:col-span-5 glass-panel p-6 rounded-2xl border-pink-accent/20 shadow-lg flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-accent/5 rounded-full blur-xl"></div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-display font-extrabold text-base text-ocean-deep">Panel Scorecard</span>
                  <div className="px-2.5 py-1 bg-pink-accent text-white rounded-full text-xs font-mono font-bold">
                    {currentTurn.feedback.overall}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-ocean-deep mb-1">
                      <span>Communication Clarity</span>
                      <span>{currentTurn.feedback.scores.communication}/100</span>
                    </div>
                    <div className="w-full bg-primary-container/20 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${currentTurn.feedback.scores.communication}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-ocean-deep mb-1">
                      <span>Content Correctness</span>
                      <span>{currentTurn.feedback.scores.content}/100</span>
                    </div>
                    <div className="w-full bg-primary-container/20 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-pink-accent h-full rounded-full transition-all duration-500" style={{ width: `${currentTurn.feedback.scores.content}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-ocean-deep mb-1">
                      <span>Structural Flow (STAR)</span>
                      <span>{currentTurn.feedback.scores.structure}/100</span>
                    </div>
                    <div className="w-full bg-primary-container/20 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: `${currentTurn.feedback.scores.structure}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 bg-white/70 rounded-xl border border-biolume-purple/20 text-[11px] leading-relaxed text-ocean-deep">
                <span className="font-mono font-extrabold text-pink-accent block mb-1">COACH HINT:</span>
                "{currentTurn.feedback.hint}"
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Polished Footer */}
      <footer className="w-full bg-[#edf2fd]/95 border-t border-biolume-purple/25 px-6 py-12 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src="/assets/waterdrop.png" alt="Waterdrop Logo" className="w-5 h-5 object-contain" />
            <span className="font-display font-extrabold text-base text-ocean-deep">
              The Interview Room
            </span>
          </div>

          <p className="text-xs font-mono text-[var(--muted)]">
            © {new Date().getFullYear()} WhaleWise Coach. All rights reserved. Built with adaptive AI.
          </p>

          <div className="flex gap-4">
            <Link href="/login" className="text-xs font-mono text-[var(--muted)] hover:text-pink-accent font-bold transition font-bold">
              Sign In
            </Link>
            <span className="text-biolume-purple/40">|</span>
            <button onClick={handleGuestBypass} className="text-xs font-mono text-[var(--muted)] hover:text-pink-accent font-bold transition cursor-pointer font-bold bg-transparent border-0 p-0">
              Guest Bypass
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
