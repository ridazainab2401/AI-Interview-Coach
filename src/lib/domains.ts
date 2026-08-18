export interface Stage {
  key: string;
  persona: string;
  goal: string;
}

export interface Domain {
  id: string;
  label: string;
  focusAreas: string[];
  stages: Stage[];
}

export const DOMAINS: Record<string, Omit<Domain, "id">> = {
  frontend: {
    label: "Frontend Developer",
    focusAreas: ["JavaScript", "React", "CSS/Layout", "Web Performance", "Accessibility"],
    stages: [
      { key: "hr", persona: "Ali, HR Interviewer", goal: "background, motivation, culture fit" },
      { key: "core", persona: "Huzaifa, Senior Frontend Engineer", goal: "JavaScript, React, CSS fundamentals" },
      { key: "lead", persona: "Musfir, Team Lead", goal: "collaboration, code review, handling disagreement" },
      { key: "system", persona: "Usman, CTO", goal: "frontend architecture and scaling a UI codebase" },
    ],
  },
  backend: {
    label: "Backend Developer",
    focusAreas: ["APIs", "Databases", "System Design", "Concurrency", "Security"],
    stages: [
      { key: "hr", persona: "Ali, HR Interviewer", goal: "background, motivation, culture fit" },
      { key: "core", persona: "Daniyal, Senior Backend Engineer", goal: "databases, APIs, data structures" },
      { key: "lead", persona: "Bilal, Team Lead", goal: "incident response, on-call, teamwork" },
      { key: "system", persona: "Usman, CTO", goal: "designing a scalable backend system" },
    ],
  },
  ai_ml: {
    label: "AI / Machine Learning Engineer",
    focusAreas: ["ML Fundamentals", "Model Evaluation", "Data Pipelines", "LLMs", "Deployment"],
    stages: [
      { key: "hr", persona: "Ali, HR Interviewer", goal: "background, motivation, culture fit" },
      { key: "core", persona: "Dr. Shaheer, Senior ML Engineer", goal: "ML fundamentals, model evaluation, LLM concepts" },
      { key: "lead", persona: "Ahmed, Team Lead", goal: "cross-functional collaboration with product/data teams" },
      { key: "system", persona: "Usman, CTO", goal: "designing an ML system end to end" },
    ],
  },
  devops: {
    label: "DevOps / Platform Engineer",
    focusAreas: ["CI/CD", "Containers", "Cloud Infra", "Monitoring", "Incident Response"],
    stages: [
      { key: "hr", persona: "Ali, HR Interviewer", goal: "background, motivation, culture fit" },
      { key: "core", persona: "Fahad, Senior DevOps Engineer", goal: "CI/CD, containers, infrastructure as code" },
      { key: "lead", persona: "Bilal, Team Lead", goal: "on-call practices and incident postmortems" },
      { key: "system", persona: "Usman, CTO", goal: "designing reliable, observable infrastructure" },
    ],
  },
  hr_behavioral: {
    label: "General / Behavioral (any field)",
    focusAreas: ["Communication", "Teamwork", "Conflict Resolution", "Leadership", "Motivation"],
    stages: [
      { key: "hr", persona: "Ali, HR Interviewer", goal: "background, motivation, culture fit" },
      { key: "lead", persona: "Bilal, Team Lead", goal: "teamwork, conflict, ownership stories (STAR method)" },
      { key: "system", persona: "Usman, CTO", goal: "vision, ambition, and how you handle ambiguity" },
    ],
  },
};

export function listDomains(): { id: string; label: string; focusAreas: string[] }[] {
  return Object.entries(DOMAINS).map(([id, d]) => ({
    id,
    label: d.label,
    focusAreas: d.focusAreas,
  }));
}

export function getDomain(domainId: string): Domain | null {
  const domain = DOMAINS[domainId];
  if (!domain) return null;
  return {
    id: domainId,
    ...domain,
  };
}
