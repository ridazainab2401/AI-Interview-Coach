import Redis from "ioredis";

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

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL);
  } catch (err) {
    console.error("Failed to initialize Redis with ioredis:", err);
  }
} else {
  console.warn(
    "REDIS_URL is missing. Falling back to in-memory store (sessions will not persist across serverless instances)."
  );
}

export async function getSession(id: string): Promise<InterviewSession | null> {
  if (redisClient) {
    try {
      const raw = await redisClient.get(`session:${id}`);
      return raw ? (JSON.parse(raw) as InterviewSession) : null;
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
      await redisClient.set(`session:${id}`, JSON.stringify(session), "EX", 7200);
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

