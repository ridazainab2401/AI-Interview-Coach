import { Redis } from "@upstash/redis";

export interface ScoreSet {
  communication: number;
  technical: number;
  confidence: number;
  problemSolving: number;
}

export interface TranscriptItem {
  stage: string;
  persona: string;
  question: string;
  topic: string;
  difficulty: number;
  answer: string | null;
  evaluation: any | null;
}

export interface InterviewSession {
  id: string;
  domainId: string;
  domain: any;
  candidateName: string;
  stageIndex: number;
  questionsInStage: number;
  totalQuestions: number;
  difficulty: number;
  difficultyPath: number[];
  weakAreas: string[];
  strongAreas: string[];
  transcript: TranscriptItem[];
  scores: ScoreSet[];
  done: boolean;
  userId?: string;
}

// In-memory fallback if Redis is not configured
let redisClient: Redis | null = null;
const memoryStore = new Map<string, string>();

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (err) {
    console.error("Failed to initialize Upstash Redis:", err);
  }
} else {
  console.warn(
    "UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing. Falling back to in-memory store (sessions will not persist across serverless instances)."
  );
}

export async function getSession(id: string): Promise<InterviewSession | null> {
  if (redisClient) {
    try {
      return await redisClient.get<InterviewSession>(`session:${id}`);
    } catch (err) {
      console.error(`Redis error fetching session ${id}:`, err);
    }
  }

  // Fallback to memory
  const raw = memoryStore.get(id);
  if (!raw) return null;
  return JSON.parse(raw) as InterviewSession;
}

export async function setSession(id: string, session: InterviewSession): Promise<void> {
  if (redisClient) {
    try {
      // 2 hours expiry (7200 seconds)
      await redisClient.set(`session:${id}`, session, { ex: 7200 });
      return;
    } catch (err) {
      console.error(`Redis error setting session ${id}:`, err);
    }
  }

  // Fallback to memory
  memoryStore.set(id, JSON.stringify(session));
}

export async function deleteSession(id: string): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.del(`session:${id}`);
      return;
    } catch (err) {
      console.error(`Redis error deleting session ${id}:`, err);
    }
  }

  // Fallback to memory
  memoryStore.delete(id);
}
