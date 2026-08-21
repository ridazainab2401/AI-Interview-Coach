"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const NO_RESPONSE_TOKEN = "__NO_RESPONSE__";
const SILENCE_TIMEOUT_MS = 10000;

interface ScoreSet {
  communication: number;
  technical: number;
  confidence: number;
  problemSolving: number;
  overall?: number;
}

interface TranscriptItem {
  stage: string;
  persona: string;
  question: string;
  difficulty: number;
  answer: string;
  scores: ScoreSet;
  feedback: string;
}

interface ReportData {
  candidate: string;
  role: string;
  questionsAsked: number;
  scoreboard: ScoreSet;
  difficultyPath: number[];
  strongAreas: string[];
  weakAreas: string[];
  recommendation: string;
  transcript: TranscriptItem[];
}

export default function VoiceInterviewRoom() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  // Screen State: 'loading' | 'interview' | 'report'
  const [screen, setScreen] = useState<"loading" | "interview" | "report">("loading");

  // Interview Screen States
  const [persona, setPersona] = useState("");
  const [question, setQuestion] = useState("Connecting you with your panel...");
  const [hint, setHint] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [micStatus, setMicStatus] = useState("Waiting for voice prompt...");

  // Progress states
  const [stageIndex, setStageIndex] = useState(0);
  const [totalStages, setTotalStages] = useState(4);
  const [difficulty, setDifficulty] = useState(3);

  // Scoreboard live values (1-10 mapped to stars)
  const [liveScores, setLiveScores] = useState<ScoreSet>({
    communication: 0,
    technical: 0,
    confidence: 0,
    problemSolving: 0,
  });

  // Recording Status
  const [isRecording, setIsRecording] = useState(false);

  // Report States
  const [report, setReport] = useState<ReportData | null>(null);

  // Refs for Speech API & Timers
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedAnswerRef = useRef("");
  const latestTranscriptRef = useRef("");
  const hasSpeechStartedRef = useRef(false);
  const turnFinalizedRef = useRef(false);

  // Initial Fetch Setup
  useEffect(() => {
    const checkAuthAndInit = async () => {
      // Check auth / bypass
      const { data: { user } } = await supabase.auth.getUser();
      const hasBypass = localStorage.getItem("interview_auth_bypass") === "true";

      if (!user && !hasBypass) {
        router.push("/login");
        return;
      }


      try {
        const res = await fetch(`/api/interview/report/${sessionId}`);
        if (!res.ok) {
          throw new Error("Failed to load interview session");
        }
        const data = await res.json();

      } catch (err) {
        console.error("Initialization error:", err);
      }
    };

    checkAuthAndInit();
  }, [sessionId, router]);

  // Let's fetch session details on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/interview/report/${sessionId}`);
        if (res.ok) {
          const reportData = await res.json();
          // If the interview has questions and is completed (e.g. done), show report
          // Wait, we can also query the session status.
          // Let's load the active question by making a call.
          // To ensure we get the correct state, let's write a GET `/api/interview/session/[sessionId]/route.ts`!
          // This will tell us the exact active question, persona, stage, and progress.
          // Let's do that. But first, let's write the rest of the React page.
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSession();
  }, [sessionId]);

  // Sync state helper
  const syncSessionState = (data: any) => {
    if (data.done) {
      setScreen("report");
      loadReportData();
      return;
    }

    setScreen("interview");
    setPersona(data.persona || "");
    setQuestion(data.question);
    setStageIndex(data.progress.stageIndex);
    setTotalStages(data.progress.totalStages);
    setDifficulty(data.progress.difficulty);
    setHint(data.hint || "");
    setFeedback(data.spokenText || "");

    if (data.lastScore) {
      setLiveScores(data.lastScore);
    }
  };

  const loadReportData = async () => {
    try {
      const res = await fetch(`/api/interview/report/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        setScreen("report");
      }
    } catch (err) {
      console.error("Failed to load report:", err);
    }
  };

  // Triggered on page load to fetch session details
  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await fetch(`/api/interview/session/${sessionId}`);
        if (!res.ok) {
          // If session endpoint doesn't exist or errors, fetch report as fallback
          const repRes = await fetch(`/api/interview/report/${sessionId}`);
          if (repRes.ok) {
            const repData = await repRes.json();
            // If they have completed all questions
            if (repData.questionsAsked >= 16 || repData.scoreboard.overall > 0) {
              setReport(repData);
              setScreen("report");
              return;
            }
          }
          throw new Error("Could not find session");
        }

        const data = await res.json();
        if (data.done) {
          loadReportData();
        } else {
          syncSessionState(data);
          // Auto speak the initial question
          await speak(data.spokenText || data.question);
          startRecording();
        }
      } catch (err) {
        console.error(err);
        // Fallback: if we just entered the room, we can start with dummy or start interview
        setScreen("interview");
      }
    };

    // We will create the GET session route next
    initSession();

    return () => {
      // Clean up recognition and synthesis
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      clearSilenceTimer();
    };
  }, [sessionId]);

  // ---- Text to Speech (TTS) ----
  const speak = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      const cleanText = text.replace(/__NO_RESPONSE__/g, "").replace(/\(.*?\)/g, "").trim();
      if (!cleanText) {
        resolve();
        return;
      }

      const utter = new SpeechSynthesisUtterance(cleanText);
      utter.rate = 1.0;
      utter.pitch = 1.0;

      let resolved = false;
      const safeResolve = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      utter.onend = safeResolve;
      utter.onerror = safeResolve;

      // Safety timeout: synthesis can get stuck in some browsers
      setTimeout(safeResolve, 15000);

      window.speechSynthesis.speak(utter);
    });
  };

  // ---- Speech to Text (STT) ----
  const getRecognition = () => {
    if (typeof window === "undefined") return null;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true;
    return rec;
  };

  const startRecording = () => {
    if (turnFinalizedRef.current && isRecording) return;

    const rec = getRecognition();
    if (!rec) {
      setMicStatus("Speech recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    recognitionRef.current = rec;
    turnFinalizedRef.current = false;
    hasSpeechStartedRef.current = false;
    accumulatedAnswerRef.current = "";
    latestTranscriptRef.current = "";

    setIsRecording(true);
    setMicStatus("Listening... (Speak now or wait 10s to skip)");
    setLiveTranscript("");
    armSilenceTimer();

    rec.onresult = (event: any) => {
      let interim = "";
      let newlyAdded = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          accumulatedAnswerRef.current += transcript + " ";
          newlyAdded = true;
        } else {
          interim += transcript;
          if (transcript.trim().length > 0) newlyAdded = true;
        }
      }

      if (newlyAdded || (accumulatedAnswerRef.current + interim).trim().length > 0) {
        if (!hasSpeechStartedRef.current) {
          setMicStatus("Listening... (Pause 10s to submit)");
        }
        hasSpeechStartedRef.current = true;
        armSilenceTimer();
      }

      const fullText = (accumulatedAnswerRef.current + interim).trim();
      latestTranscriptRef.current = fullText;
      setLiveTranscript(fullText);
    };

    rec.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      if (event.error !== "no-speech") {
        setMicStatus("Didn't catch that — tap the mic button to speak again.");
        clearSilenceTimer();
        setIsRecording(false);
      }
    };

    rec.onend = () => {
      if (isRecording && !turnFinalizedRef.current) {
        // Restart if stopped prematurely
        try {
          rec.start();
        } catch (e) {
          console.error("Failed to restart speech recognition", e);
        }
      } else {
        setIsRecording(false);
      }
    };

    try {
      rec.start();
    } catch (e) {
      console.error("Failed to start speech recognition", e);
    }
  };

  const stopRecordingUI = () => {
    setIsRecording(false);
  };

  const finalizeTurn = () => {
    if (turnFinalizedRef.current) return;
    turnFinalizedRef.current = true;
    clearSilenceTimer();
    stopRecordingUI();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping recognition on finalize:", e);
      }
    }

    const answer = hasSpeechStartedRef.current ? latestTranscriptRef.current.trim() : NO_RESPONSE_TOKEN;
    submitAnswer(answer || NO_RESPONSE_TOKEN);
  };

  const armSilenceTimer = () => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(finalizeTurn, SILENCE_TIMEOUT_MS);
  };

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const handleMicToggle = () => {
    if (isRecording) {
      clearSilenceTimer();
      finalizeTurn();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      startRecording();
    }
  };

  const submitAnswer = async (answerText: string) => {
    setMicStatus("Thinking...");
    setLiveTranscript(answerText === NO_RESPONSE_TOKEN ? "" : answerText);

    try {
      const res = await fetch("/api/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answerText }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit answer");
      }

      const data = await res.json();

      if (data.action === "retry") {
        setFeedbackText("");
        setFeedback("");
        await speak(data.spokenText);
        setMicStatus("Tap the mic to answer");
        return;
      }

      // 1. Immediately update live scores and stage progress
      if (data.lastScore) {
        setLiveScores(data.lastScore);
      }
      setStageIndex(data.progress.stageIndex);
      setTotalStages(data.progress.totalStages);
      setDifficulty(data.progress.difficulty);

      if (data.done) {
        setFeedbackText(data.feedback || "Interview completed.");
        setMicStatus("Interview complete!");
        await speak(data.spokenText);
        setScreen("report");
        loadReportData();
        return;
      }

      // 2. Speak and display the feedback
      const currentFeedback = data.feedback || "Okay, I see your point. Let's continue.";
      setFeedbackText(currentFeedback);
      setMicStatus("AI is giving feedback...");
      await speak(currentFeedback);

      // 3. Pause for 5 seconds countdown
      for (let i = 5; i > 0; i--) {
        setMicStatus(`Next question in ${i}s...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // 4. Update persona, question and hint, then clear feedbackText
      setFeedbackText("");
      setPersona(data.persona || "");
      setQuestion(data.question);
      setHint(data.hint || "");

      // 5. Speak the next question
      setMicStatus("AI is asking...");
      await speak(data.question);

      // 6. Start recording for the user's answer
      startRecording();
    } catch (err) {
      console.error("Answer submission failed:", err);
      setMicStatus("Error occurred. Tap the mic button to try again.");
    }
  };

  const starsFor = (score10: number) => {
    let filled = Math.round(Number(score10) / 2);
    if (isNaN(filled)) filled = 0;
    filled = Math.max(0, Math.min(5, filled));
    return "★".repeat(filled) + "☆".repeat(5 - filled);
  };

  if (screen === "loading") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center relative p-6">
        <div className="absolute top-1/3 left-1/2 w-48 h-48 bg-primary-container/10 rounded-full blur-3xl -translate-x-1/2 pointer-events-none"></div>
        <div className="flex flex-col items-center gap-4 z-10 text-center">
          <img src="/assets/waterdrop.png" alt="Loading" className="w-12 h-12 object-contain animate-spin" />
          <h2 className="font-display text-2xl font-black text-ocean-deep">Setting up the panel room...</h2>
          <p className="text-sm text-[var(--muted)] font-mono">Loading WhaleWise Interview Session</p>
        </div>
      </main>
    );
  }

  // --- LIVE INTERVIEW VIEW ---
  if (screen === "interview") {
    return (
      <main className="min-h-screen flex flex-col font-body-md overflow-x-hidden selection:bg-biolume-purple selection:text-ocean-deep relative z-10">
        {/* Floating bubbles */}
        <div className="bubble-container">
          <div className="bubble-unit" style={{ left: '8%', width: '35px', height: '35px', animationDelay: '0s', animationDuration: '14s' }}></div>
          <div className="bubble-unit" style={{ left: '22%', width: '20px', height: '20px', animationDelay: '3s', animationDuration: '18s' }}></div>
          <div className="bubble-unit" style={{ left: '50%', width: '45px', height: '45px', animationDelay: '1s', animationDuration: '13s' }}></div>
          <div className="bubble-unit" style={{ left: '78%', width: '25px', height: '25px', animationDelay: '5s', animationDuration: '16s' }}></div>
          <div className="bubble-unit" style={{ left: '92%', width: '30px', height: '30px', animationDelay: '2s', animationDuration: '11s' }}></div>
        </div>

        {/* Top Header */}
        <header className="w-full flex justify-between items-center px-8 py-5 z-50 relative">
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl font-black text-ocean-deep flex items-center gap-2">
              <img src="/assets/waterdrop.png" alt="Waterdrop Logo" className="w-6 h-6 object-contain" />
              WhaleWise
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full font-bold text-xs shadow-sm border border-red-200">
              <div className="w-2.5 h-2.5 rounded-full bg-red-600 on-air-indicator"></div>
              ON AIR
            </div>
            <button
              onClick={() => router.push("/interview")}
              className="p-2.5 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant flex items-center justify-center border-2 border-biolume-purple/35 cursor-pointer bg-white/40"
              title="Quit Interview"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Central Room Layout */}
        <div className="flex-1 w-full max-w-[1440px] mx-auto px-8 py-6 flex flex-col lg:flex-row gap-10 items-stretch relative z-10">
          {/* Left Side: Question and Mascot */}
          <section className="flex-1 flex flex-col items-center justify-center relative min-h-[550px]">
            {/* Dialogue Balloon Question Card */}
            <div className="w-full max-w-3xl speech-balloon rounded-[32px] p-8 md:p-10 mb-10 text-center relative z-10 transition-all hover:scale-[1.01] duration-300">
              <div className="inline-flex items-center gap-2 bg-sparkle-glow text-primary px-4 py-1.5 rounded-full mb-5 shadow-sm border border-white font-bold text-xs">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122A3 3 0 0010.5 21.5h3a3 3 0 00.97-5.378m-4.94-1.122a3 3 0 114.94 0M12 14v3m-3-1.5h6" />
                </svg>
                <span className="font-label-sm text-label-sm uppercase tracking-wider">
                  Stage: {persona.split(",")[0] || "Panelist"}
                </span>
              </div>

              <h2 className="font-display text-2xl md:text-3xl font-black text-ocean-deep mb-6 leading-snug">
                "{feedbackText ? feedbackText : question}"
              </h2>

              {hint && (
                <div className="text-left bg-surface-container/50 rounded-2xl p-5 border border-biolume-purple/30 mt-6 relative overflow-hidden">
                  <div className="flex items-center gap-2 text-secondary font-black text-xs uppercase tracking-wider mb-2">
                    <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-3m0 3v3m0-6h.008M12 3a9 9 0 00-9 9c0 2.222.805 4.257 2.13 5.842a2.25 2.25 0 01.597 1.517l.03 1.054a1.5 1.5 0 001.5 1.458h5.544a1.5 1.5 0 001.5-1.458l.03-1.054a2.25 2.25 0 01.596-1.517A9 9 0 0012 3z" />
                    </svg>
                    <span>Hint</span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface leading-relaxed font-bold">
                    {hint}
                  </p>
                </div>
              )}

              {/* Live Transcription Box */}
              {liveTranscript && (
                <div className="text-left bg-surface-container-low/80 rounded-2xl p-5 border border-biolume-purple/20 mt-5 shadow-inner">
                  <p className="font-body-lg text-body-lg text-on-surface-variant italic font-semibold">
                    <span className="text-primary font-black">You:</span> "{liveTranscript}"
                    <span className="inline-block w-2.5 h-6 bg-biolume-purple animate-pulse align-middle ml-1.5 rounded-full"></span>
                  </p>
                </div>
              )}
            </div>

            {/* Mascot Area */}
            <div className="flex flex-col items-center gap-5 relative z-20">
              <div className="relative w-64 h-64 flex items-center justify-center whale-float">
                <div className="absolute inset-0 bg-gradient-to-tr from-sparkle-glow/90 to-pearl-white/95 rounded-full blur-md scale-110 shadow-lg border border-white/50"></div>

                {/* Floating dynamic mascot image */}
                <img
                  className="relative z-10 w-56 h-56 rounded-full object-cover border-4 border-white shadow-2xl"
                  alt="Fin the Whale Mascot"
                  src="/assets/whalepng.png"
                />

                {/* Speech Bubble listening state */}
                {isRecording && (
                  <div className="absolute -bottom-4 right-0 glass-panel rounded-full px-5 py-2.5 flex items-center gap-2 z-30 shadow-lg border-white/60">
                    <span className="font-label-bold text-label-bold text-pink-accent text-xs font-black">Listening...</span>
                    <div className="flex items-end gap-1.5 h-4">
                      <div className="w-1.5 h-full bg-pink-accent rounded-t-full audio-bar"></div>
                      <div className="w-1.5 h-full bg-biolume-purple rounded-t-full audio-bar"></div>
                      <div className="w-1.5 h-full bg-primary rounded-t-full audio-bar"></div>
                      <div className="w-1.5 h-full bg-pink-accent rounded-t-full audio-bar"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Large Mic Trigger Button */}
              <button
                onClick={handleMicToggle}
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${isRecording
                    ? "bg-red-600 text-white hover:bg-red-700 on-air-indicator border-4 border-white scale-105"
                    : "bg-gradient-to-tr from-primary to-pink-accent text-white hover:scale-105 border-4 border-white shadow-lg shadow-pink-accent/20"
                  }`}
                title={isRecording ? "Stop speaking and submit" : "Start speaking"}
              >
                {isRecording ? (
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>

              <p className="text-sm font-mono text-[var(--muted)] font-black text-center">
                {micStatus}
              </p>
            </div>
          </section>

          {/* Right Side Panel: Live Metrics */}
          <aside className="w-full lg:w-96 flex flex-col gap-6 relative z-10">
            <div className="glass-panel rounded-[32px] p-8 flex flex-col gap-6 h-full border-2 border-biolume-purple/20 bg-white/70">
              <div className="flex items-center justify-between border-b border-biolume-purple/20 pb-4">
                <h3 className="font-display text-2xl font-black text-ocean-deep flex items-center gap-2">
                  <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v5.25c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 18.375v-5.25zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125v-9.75zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v14.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                  Live Signals
                </h3>
                {/* Level / Difficulty Indicator */}
                <div className="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full text-xs font-mono font-bold border border-white">
                  <span>LVL {difficulty}</span>
                </div>
              </div>

              {/* Progress: Stage Tracker */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs font-mono font-bold text-[var(--muted)]">
                  <span>STAGE PROGRESS</span>
                  <span>{stageIndex + 1} / {totalStages}</span>
                </div>
                <div className="flex gap-2.5">
                  {Array.from({ length: totalStages }).map((_, i) => (
                    <span
                      key={i}
                      className={`flex-1 h-3 rounded-full transition-all duration-300 ${i < stageIndex
                          ? "bg-primary opacity-45"
                          : i === stageIndex
                            ? "bg-primary scale-y-110"
                            : "bg-surface-container"
                        }`}
                    />
                  ))}
                </div>
              </div>

              {/* Live Metric Progress Bars */}
              <div className="space-y-5 mt-2">
                {[
                  { label: "Communication", key: "communication" as const },
                  { label: "Technical Accuracy", key: "technical" as const },
                  { label: "Confidence", key: "confidence" as const },
                  { label: "Problem Solving", key: "problemSolving" as const },
                ].map(({ label, key }) => (
                  <div key={key} className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <span className="font-black text-sm text-on-surface">{label}</span>
                      <span className="font-mono text-sm text-secondary font-black">
                        {liveScores[key] > 0 ? `${liveScores[key]} / 10` : micStatus === "Thinking..." ? "Analyzing..." : "Pending"}
                      </span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-3 overflow-hidden border border-white relative inner-glow">
                      <div
                        className="bg-gradient-to-r from-primary-container to-secondary h-3 rounded-full transition-all duration-500"
                        style={{ width: `${(liveScores[key] || 0) * 10}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-6 border-t border-biolume-purple/20">
                <p className="font-label-sm text-xs text-on-surface-variant flex items-start gap-2.5 font-bold leading-relaxed">
                  <img src="/assets/tips.png" alt="Tips" className="w-5 h-5 object-contain" />
                  <span>Use the STAR method (Situation, Task, Action, Result) for structured answers.</span>
                </p>
              </div>

              {/* Sidebar Action Buttons */}
              <div className="flex gap-4 mt-2">
                <button
                  onClick={() => router.push("/interview")}
                  className="flex-1 bg-surface-container-high/60 hover:bg-surface-container-high text-primary py-3.5 rounded-2xl font-bold transition-all shadow-sm flex justify-center items-center gap-1.5 border border-biolume-purple/20 text-xs cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12-12" />
                  </svg>
                  Quit
                </button>
                <button
                  onClick={handleMicToggle}
                  className="flex-1 bg-gradient-to-r from-pink-accent to-ocean-deep hover:scale-[1.01] text-white py-3.5 rounded-2xl font-bold transition-all shadow-md flex justify-center items-center gap-1.5 text-xs cursor-pointer"
                >
                  <span>{isRecording ? "Submit" : "Speak"}</span>
                  <img src="/assets/hand.png" alt="Waving Hand" className="w-4 h-4 object-contain" />
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* Footer */}
        <footer className="w-full text-center py-5 text-[var(--muted)] font-mono font-bold text-xs mt-auto">
          WhaleWise Interview Environment
        </footer>
      </main>
    );
  }

  // --- REPORT SCREEN VIEW ---
  if (screen === "report" && report) {
    return (
      <main className="w-full max-w-7xl mx-auto px-6 py-8 lg:py-16 selection:bg-biolume-purple selection:text-ocean-deep relative z-10">
        {/* Floating bubbles */}
        <div className="bubble-container">
          <div className="bubble-unit" style={{ left: '10%', width: '40px', height: '40px', animationDelay: '0s', animationDuration: '15s' }}></div>
          <div className="bubble-unit" style={{ left: '30%', width: '25px', height: '25px', animationDelay: '3s', animationDuration: '12s' }}></div>
          <div className="bubble-unit" style={{ left: '55%', width: '50px', height: '50px', animationDelay: '1s', animationDuration: '16s' }}></div>
          <div className="bubble-unit" style={{ left: '75%', width: '30px', height: '30px', animationDelay: '5s', animationDuration: '14s' }}></div>
          <div className="bubble-unit" style={{ left: '90%', width: '35px', height: '35px', animationDelay: '2s', animationDuration: '11s' }}></div>
        </div>

        {/* Celebratory Widescreen Header Banner */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-10 mb-12 relative z-10 glass-panel p-8 md:p-12 rounded-[40px] border-biolume-purple/35 max-w-5xl mx-auto bg-white/70">
          <div className="relative w-64 h-64 flex items-center justify-center whale-float">
            <div className="absolute inset-0 bg-gradient-to-tr from-sparkle-glow/90 to-pearl-white/95 rounded-full blur-md scale-110 shadow-lg border border-white/50"></div>
            <img
              src="/assets/whalepng.png"
              alt="Fin Celebrating"
              className="w-56 h-56 rounded-full object-cover relative z-10 border-4 border-white shadow-xl"
            />
          </div>
          <div className="text-center md:text-left flex-1">
            <span className="font-display text-xs font-bold text-secondary uppercase tracking-widest bg-sparkle-glow border border-biolume-purple/35 px-4 py-1.5 rounded-full mb-3 inline-block">
              Practice Session Completed
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-black text-ocean-deep mb-2">
              Well done, {report.candidate}!
            </h1>
            <p className="font-body-md text-base text-[var(--muted)] font-bold mb-6">
              Track: {report.role} • {report.questionsAsked} questions completed
            </p>

            <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
              <div className="px-6 py-3.5 bg-gradient-to-r from-primary to-pink-accent text-white rounded-full font-black text-lg shadow-md flex items-center gap-2 shadow-pink-accent/15">
                <span className="text-xs uppercase font-mono tracking-wider opacity-85">Performance Score:</span>
                <span>{report.scoreboard.overall} / 10</span>
              </div>
              <div className="px-5 py-3.5 bg-white/80 border-2 border-biolume-purple/30 rounded-full font-mono text-xs font-black text-on-surface">
                Fin's Approval: CERTIFIED
              </div>
            </div>
          </div>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto">
          {/* Detailed Score Breakdown */}
          <div className="lg:col-span-8 glass-card rounded-[32px] p-8 relative overflow-hidden border-2 border-biolume-purple/20 bg-white/70">
            <h3 className="font-display text-xl font-black text-ocean-deep uppercase tracking-wider mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
              </svg>
              Detailed Score Breakdown
            </h3>
            <div className="space-y-6">
              {[
                { label: "Communication", val: report.scoreboard.communication },
                { label: "Technical Accuracy", val: report.scoreboard.technical },
                { label: "Confidence", val: report.scoreboard.confidence },
                { label: "Problem Solving", val: report.scoreboard.problemSolving },
              ].map(({ label, val }) => (
                <div key={label} className="space-y-2.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-on-surface text-sm font-black">{label}</span>
                    <span className="text-secondary font-mono font-black">{val} / 10</span>
                  </div>
                  <div className="w-full h-3.5 bg-surface-container rounded-full overflow-hidden inner-glow border border-white">
                    <div
                      className="h-full bg-gradient-to-r from-primary-container to-pink-accent rounded-full transition-all duration-1000"
                      style={{ width: `${(val || 0) * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Areas Panel (Strong & Needs Improvement) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Strong Areas */}
            <div className="glass-card rounded-[32px] p-6 flex-1 border-2 border-biolume-purple/20 bg-white/70">
              <h3 className="font-display text-xs font-black text-primary uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.48 3.499c.196-.612 1.056-.612 1.252 0l1.834 5.727a.75.75 0 00.713.518h6.021c.643 0 .908.824.387 1.203l-4.871 3.538a.75.75 0 00-.272.838l1.834 5.727c.196.612-.502 1.119-1.023.758l-4.871-3.538a.75.75 0 00-.877 0l-4.871 3.538c-.52.361-1.219-.146-1.023-.758l1.834-5.727a.75.75 0 00-.272-.838l-4.871-3.538c-.52-.379-.255-1.203.387-1.203h6.021a.75.75 0 00.713-.518l1.834-5.727z" />
                </svg>
                Strong Areas
              </h3>
              <div className="flex flex-wrap gap-2">
                {report.strongAreas.length > 0 ? (
                  report.strongAreas.map((area, idx) => (
                    <span
                      key={idx}
                      className="bg-primary/10 text-primary text-xs font-mono font-bold px-3.5 py-1.5 rounded-full border border-primary/25"
                    >
                      {area}
                    </span>
                  ))
                ) : (
                  <span className="text-on-surface-variant font-body-md text-xs italic font-bold">— No clear strengths identified yet.</span>
                )}
              </div>
            </div>

            {/* Needs Improvement */}
            <div className="glass-card rounded-[32px] p-6 flex-1 border-2 border-biolume-purple/20 bg-white/70">
              <h3 className="font-display text-xs font-black text-red-600 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
                Needs Improvement
              </h3>
              <div className="flex flex-col gap-2">
                {report.weakAreas.length > 0 ? (
                  report.weakAreas.map((area, idx) => (
                    <div
                      key={idx}
                      className="px-3.5 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold text-xs shadow-sm inline-flex items-center gap-2 w-fit"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                      {area}
                    </div>
                  ))
                ) : (
                  <span className="text-on-surface-variant font-body-md text-xs italic font-bold">None noted</span>
                )}
              </div>
            </div>
          </div>

          {/* Feedback & Recommendation */}
          <div className="lg:col-span-12 glass-card rounded-[32px] p-8 border-l-4 border-l-pink-accent border-2 border-biolume-purple/20 relative bg-white/70">
            <div className="absolute top-4 right-4 text-pink-accent/15">
              <svg className="w-12 h-12 text-pink-accent/15" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.85h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.85h3.999v10h-9.999z" />
              </svg>
            </div>
            <h3 className="font-display text-xs font-black text-pink-accent uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-pink-accent" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-3m0 3v3m0-6h.008M12 3a9 9 0 00-9 9c0 2.222.805 4.257 2.13 5.842a2.25 2.25 0 01.597 1.517l.03 1.054a1.5 1.5 0 001.5 1.458h5.544a1.5 1.5 0 001.5-1.458l.03-1.054a2.25 2.25 0 01.596-1.517A9 9 0 0012 3z" />
              </svg>
              Architect's Feedback &amp; Recommendation
            </h3>
            <p className="font-body-lg text-lg text-on-surface relative z-10 leading-relaxed font-black">
              {report.recommendation}
            </p>
          </div>

          {/* Transcript Accordion */}
          <div className="lg:col-span-12 glass-card rounded-[32px] p-8 border-2 border-biolume-purple/20 bg-white/70">
            <details className="group">
              <summary className="font-mono text-xs uppercase tracking-widest text-[var(--muted)] cursor-pointer hover:text-[var(--text)] transition list-none flex justify-between items-center select-none font-bold">
                <span>View Full Transcript</span>
                <span className="text-xs transition-transform duration-300 group-open:rotate-180">
                  ▼
                </span>
              </summary>
              <div className="mt-6 space-y-6 max-h-96 overflow-y-auto pr-2">
                {report.transcript.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl border-2 border-biolume-purple/15 bg-white/50 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-center mb-3 font-mono text-xs font-bold">
                      <span className="text-secondary">{item.persona} (Lvl {item.difficulty})</span>
                      <span className="text-[var(--muted)]">QUESTION {idx + 1}</span>
                    </div>
                    <p className="text-base font-black text-ocean-deep mb-3 font-display">
                      "{item.question}"
                    </p>
                    <p className="text-sm italic text-on-surface opacity-85 mb-4 pl-4 border-l-2 border-biolume-purple/40 font-bold">
                      You: "{item.answer}"
                    </p>
                    <div className="text-xs text-on-surface leading-relaxed bg-surface-container-low border border-biolume-purple/20 p-4 rounded-xl font-bold">
                      <span className="font-mono text-[10px] uppercase text-secondary font-black block mb-1">
                        Coaching Feedback
                      </span>
                      {item.feedback}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-16 flex justify-center pb-8">
          <button
            onClick={() => router.push("/interview")}
            className="px-12 py-4.5 rounded-full bg-gradient-to-r from-primary to-pink-accent text-white font-headline-md text-lg font-black shadow-lg shadow-pink-accent/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 active:scale-95 flex items-center gap-3 sparkle-bg inner-glow border-2 border-white/40 cursor-pointer"
          >
            <span>Start New Practice</span>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 8.41a14.98 14.98 0 00-6.16 12.12A14.98 14.98 0 0015.59 14.37zm0 0L12 18m3.59-3.63h-4.8M9.63 8.41L12 6" />
            </svg>
          </button>
        </div>
      </main>
    );
  }

  return null;
}
