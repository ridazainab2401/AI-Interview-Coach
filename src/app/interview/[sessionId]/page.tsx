"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const NO_RESPONSE_TOKEN = "__NO_RESPONSE__";
const SILENCE_TIMEOUT_MS = 5000;

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

      // If we are starting, we need to fetch the session status
      // We start the interview from the client side, or if we navigated directly here, fetch session
      // Wait, to keep it simple, we already started it in the parent dashboard!
      // But we need the initial question return. Let's fetch it by sending a start request OR fetching state.
      // Wait! In domains list, we started the session. But how do we load a session if it was already created?
      // Let's call /api/interview/answer with a special token or just fetch the session.
      // Actually, since start API was called, we can fetch the state of the session from the backend report API
      // OR we can make a query. Let's send an answer request with NO_RESPONSE_TOKEN to retrieve the current pending question!
      // This is a neat trick: if we request with an empty response, the agent returns the current pending question without moving forward!
      // Wait! Let's check `submit_answer` in `agent.ts`:
      // If `answer_text` is `NO_RESPONSE_TOKEN`, it advances.
      // Oh! To fetch without advancing, we could just fetch the session directly. Let's create a GET route or we can just fetch the report or have a session retrieval.
      // Wait, in `agent.ts`, when `start_interview` is called, it returns:
      // `{ sessionId, persona, spokenText, question, stage, progress }`
      // But what if the user refreshed the page?
      // Let's implement a GET session details endpoint or let the dashboard pass the initial start data via state!
      // Wait, passing it via localStorage or state is very easy. Let's check if we can read the initial prompt.
      // To be safe, if we don't have it, let's load it from a session GET request. Oh! We didn't create a GET session API endpoint, but wait! We can easily load it.
      // Let's fetch the session details by requesting the report, and if not done, we can find the active question.
      // Let's check the session data from Redis. Since we have a GET `/api/interview/report/[sessionId]` endpoint, if the session is not completed, does it return the current status?
      // Yes! In `report.ts`, it returns the compiled data. But we can also look at the session directly.
      // Let's make a GET request to `/api/interview/report/${sessionId}`:
      // If the session is NOT `done`, does it work? Yes! It builds the report on whatever questions have been answered.
      // But wait! We can also fetch the last question in the transcript.
      // Let's fetch the report or session to initialize. Let's do that!
      try {
        const res = await fetch(`/api/interview/report/${sessionId}`);
        if (!res.ok) {
          throw new Error("Failed to load interview session");
        }
        const data = await res.json();

        // If the session is already finished, show report screen immediately
        // Wait, does the session have a `done` flag in the report?
        // Let's check `buildReport`: it returns candidate, role, scoreboard, etc.
        // We can add a simple check. If the transcript has answers, we can populate scoreboard.
        // Let's fetch the session and if it's done, show report.
        // But what if the interview is in progress?
        // Let's check if the transcript has unanswered questions.
        // If there's an unanswered question, that's our current question!
        // Let's see: we can query the backend. Wait, let's just make a simple POST to a session sync API or query it.
        // Actually, we can fetch the raw session from a new GET `/api/interview/session/[sessionId]` endpoint or handle it.
        // Let's add a quick route for GET `/api/interview/session/[sessionId]` to return the session state! That's super clean and correct.
        // Let's write that route now.
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

      setLiveTranscript(accumulatedAnswerRef.current + interim);
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

    const answer = hasSpeechStartedRef.current ? accumulatedAnswerRef.current.trim() : NO_RESPONSE_TOKEN;
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
      <main className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-sm text-[var(--muted)] animate-pulse">
          Setting up the panel room...
        </p>
      </main>
    );
  }

  // --- LIVE INTERVIEW VIEW ---
  if (screen === "interview") {
    return (
      <main className="min-h-screen p-6 md:p-12 flex flex-col justify-between max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[var(--red)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--red)] pulse-dot"></span>
            ON AIR
          </div>

          {/* Difficulty dots */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
              LEVEL
            </span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <span
                  key={lvl}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${lvl <= difficulty
                    ? "bg-[var(--amber)]"
                    : "bg-[var(--panel-2)]"
                    } ${lvl === difficulty ? "scale-125" : ""}`}
                />
              ))}
            </div>
          </div>

          {/* Stage Progress pills */}
          <div className="flex gap-2">
            {Array.from({ length: totalStages }).map((_, i) => (
              <span
                key={i}
                className={`w-6 h-1.5 rounded-full transition duration-300 ${i < stageIndex
                  ? "bg-[var(--amber)] opacity-40"
                  : i === stageIndex
                    ? "bg-[var(--amber)]"
                    : "bg-[var(--panel-2)]"
                  }`}
              />
            ))}
          </div>
        </header>

        {/* Panel stage card */}
        <section className="glass-panel p-8 md:p-12 rounded-3xl border-amber/15 shadow-2xl flex-grow flex flex-col justify-center mb-8 relative overflow-hidden">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--amber)] mb-3">
            — {persona || "Active Panelist"}
          </p>
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-[var(--text)] leading-snug mb-6">
            {feedbackText ? feedbackText : question}
          </h2>
          {hint && (
            <div className="font-mono text-xs text-[var(--teal)] bg-[var(--teal)]/5 border-l-2 border-[var(--teal)] p-4 rounded-r-xl max-w-2xl">
              <span className="font-semibold uppercase tracking-wider block mb-1">
                Hint
              </span>
              {hint}
            </div>
          )}
        </section>

        {/* Mic control and feedback area */}
        <section className="flex flex-col items-center gap-6 mb-8">
          {/* Waveform indicator */}
          <div className="flex items-end justify-center gap-1.5 h-10 w-full max-w-xs">
            {isRecording ? (
              Array.from({ length: 9 }).map((_, i) => (
                <span
                  key={i}
                  className="w-1 bg-[var(--amber)] rounded-full waveform-bar"
                  style={{
                    height: `${Math.random() * 80 + 20}%`,
                  }}
                />
              ))
            ) : (
              <div className="w-16 h-0.5 bg-[var(--border)] rounded" />
            )}
          </div>

          {/* Large mic button */}
          <button
            onClick={handleMicToggle}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition duration-300 shadow-xl cursor-pointer ${isRecording
              ? "bg-[var(--red)] text-white hover:bg-[var(--red)]/90"
              : "bg-[var(--amber)] text-[#17140f] hover:scale-105"
              }`}
          >
            {isRecording ? (
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
                <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
                <path
                  d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M19 11a7 7 0 0 1-14 0M12 18v3"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>

          <div className="text-center">
            <p className="text-xs font-mono text-[var(--muted)] mb-1">
              {micStatus}
            </p>
            {liveTranscript && (
              <p className="text-sm italic text-[var(--text)] max-w-xl mx-auto opacity-80 px-4">
                "{liveTranscript}"
              </p>
            )}
          </div>
        </section>

        {/* Live Scoreboard */}
        <aside className="glass-panel p-6 rounded-2xl border-amber/10 flex flex-wrap md:flex-nowrap justify-between gap-6 max-w-3xl mx-auto w-full">
          <div className="w-full text-center md:text-left md:w-auto flex flex-col justify-center border-b md:border-b-0 md:border-r border-[var(--border)] pb-3 md:pb-0 md:pr-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--amber)]">
              Live Scores
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full text-center">
            {[
              { label: "Communication", key: "communication" as const },
              { label: "Technical Accuracy", key: "technical" as const },
              { label: "Confidence", key: "confidence" as const },
              { label: "Problem Solving", key: "problemSolving" as const },
            ].map(({ label, key }) => (
              <div key={key} className="flex flex-col items-center">
                <span className="text-[10px] text-[var(--muted)] mb-1 font-mono uppercase">
                  {label}
                </span>
                <span className="text-[var(--amber)] tracking-wider font-mono text-sm">
                  {starsFor(liveScores[key])}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </main>
    );
  }

  // --- REPORT SCREEN VIEW ---
  if (screen === "report" && report) {
    return (
      <main className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto">
        <div className="glass-panel p-8 md:p-12 rounded-3xl border-amber/15 shadow-2xl">
          <header className="text-center mb-10 border-b border-[var(--border)] pb-8">
            <p className="font-mono text-xs uppercase tracking-widest text-[var(--amber)] mb-2">
              INTERVIEW REPORT
            </p>
            <h1 className="font-display text-4xl font-semibold text-[var(--text)] mb-1">
              {report.candidate}
            </h1>
            <p className="text-sm text-[var(--muted)] font-mono">
              {report.role} · {report.questionsAsked} questions asked
            </p>

            <div className="mt-8 flex flex-col items-center justify-center">
              <span className="font-display text-6xl font-bold text-[var(--amber)]">
                {report.scoreboard.overall}
              </span>
              <span className="text-xs uppercase font-mono tracking-wider text-[var(--muted)] mt-2">
                Overall score out of 10
              </span>
            </div>
          </header>

          {/* Breakdown bars */}
          <section className="space-y-5 mb-10">
            <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--muted)] mb-4">
              Detailed Score Breakdown
            </h3>
            {[
              { label: "Communication", val: report.scoreboard.communication },
              { label: "Technical Accuracy", val: report.scoreboard.technical },
              { label: "Confidence", val: report.scoreboard.confidence },
              { label: "Problem Solving", val: report.scoreboard.problemSolving },
            ].map(({ label, val }) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[var(--muted)]">{label}</span>
                  <span className="text-[var(--text)] font-semibold">{val} / 10</span>
                </div>
                <div className="h-2 bg-[var(--panel-2)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--amber)] rounded-full transition-all duration-1000"
                    style={{ width: `${(val || 0) * 10}%` }}
                  />
                </div>
              </div>
            ))}
          </section>

          {/* Strong / Weak columns */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 border-t border-[var(--border)] pt-8">
            <div>
              <h4 className="font-mono text-xs uppercase tracking-widest text-[var(--teal)] mb-3">
                Strong Areas
              </h4>
              <ul className="space-y-2">
                {report.strongAreas.length > 0 ? (
                  report.strongAreas.map((area, idx) => (
                    <li
                      key={idx}
                      className="inline-block bg-[var(--teal)]/10 text-[var(--teal)] text-xs font-mono px-3 py-1.5 rounded-full mr-2 mb-2 border border-[var(--teal)]/10"
                    >
                      {area}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-[var(--muted)]">—</li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-xs uppercase tracking-widest text-[var(--red)] mb-3">
                Needs Improvement
              </h4>
              <ul className="space-y-2">
                {report.weakAreas.length > 0 ? (
                  report.weakAreas.map((area, idx) => (
                    <li
                      key={idx}
                      className="inline-block bg-[var(--red)]/10 text-[var(--red)] text-xs font-mono px-3 py-1.5 rounded-full mr-2 mb-2 border border-[var(--red)]/10"
                    >
                      {area}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-[var(--muted)]">None noted</li>
                )}
              </ul>
            </div>
          </section>

          {/* Recommendation */}
          <section className="bg-[var(--panel)] p-6 rounded-2xl border border-[var(--border)] mb-10">
            <h4 className="font-mono text-xs uppercase tracking-widest text-[var(--amber)] mb-2">
              Architect's Feedback & Recommendation
            </h4>
            <p className="text-sm leading-relaxed text-[var(--text)] opacity-90">
              {report.recommendation}
            </p>
          </section>

          {/* Transcript accordion */}
          <section className="border-t border-[var(--border)] pt-8 mb-10">
            <details className="group">
              <summary className="font-mono text-xs uppercase tracking-widest text-[var(--muted)] cursor-pointer hover:text-[var(--text)] transition list-none flex justify-between items-center select-none">
                <span>View Full Transcript</span>
                <span className="text-xs transition-transform duration-300 group-open:rotate-180">
                  ▼
                </span>
              </summary>
              <div className="mt-6 space-y-6 max-h-96 overflow-y-auto pr-2">
                {report.transcript.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-[var(--border)] bg-[var(--panel)]/40"
                  >
                    <p className="font-mono text-[10px] text-[var(--amber)] uppercase mb-2">
                      {item.persona} (Lvl {item.difficulty})
                    </p>
                    <p className="text-sm font-semibold text-[var(--text)] mb-3">
                      "{item.question}"
                    </p>
                    <p className="text-sm italic text-[var(--text)] opacity-85 mb-4 pl-4 border-l border-[var(--border)]">
                      You: "{item.answer}"
                    </p>
                    <div className="text-xs text-[var(--muted)] leading-relaxed bg-[var(--panel-2)]/50 p-3 rounded">
                      <span className="font-mono text-[10px] uppercase text-[var(--amber)] block mb-1">
                        Feedback
                      </span>
                      {item.feedback}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </section>

          <footer className="text-center pt-4">
            <button
              onClick={() => router.push("/interview")}
              className="px-10 py-4 bg-[var(--amber)] text-[#17140f] rounded-full font-semibold transition hover:bg-[var(--amber)]/95 active:scale-[0.98] cursor-pointer shadow-lg"
            >
              Start New Practice
            </button>
          </footer>
        </div>
      </main>
    );
  }

  return null;
}
