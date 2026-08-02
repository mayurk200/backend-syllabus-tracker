// Domain model — fixed shape, mirrors the syllabus. Do not add fields casually.

export interface Topic {
  name: string;
  hours: number;
  detail: string; // "what to learn"
  done: boolean;
}

export interface Phase {
  id: number; // 0..11
  title: string;
  hours: number; // total focused hours for the phase
  description: string; // one-liner
  gate: string; // artifact/skill that proves the phase is complete
  gatePassed: boolean;
  topics: Topic[];
}

// Firestore document stored at users/{uid}/phases/{phaseId}.
// `id` is the document id, so it is omitted from the stored payload.
export type PhaseDoc = Omit<Phase, 'id'>;

// users/{uid}/meta/profile
export interface Meta {
  targetHoursPerWeek: number;
  startDate: string; // ISO date string
}

// users/{uid}/reviews/{autoId}
export interface WeeklyReview {
  id: string;
  stalled: string; // "what stalled"
  nextObjective: string; // "next single objective"
  createdAt: number; // epoch millis
}

export type NewWeeklyReview = Omit<WeeklyReview, 'id'>;

// ---- Derived helpers (pure, UI-facing) ----

export function topicCompletion(phase: Phase): number {
  if (phase.topics.length === 0) return 0;
  const done = phase.topics.filter((t) => t.done).length;
  return Math.round((done / phase.topics.length) * 100);
}

/** Hours "logged" = sum of hours from topics marked done. */
export function hoursLogged(phase: Phase): number {
  return phase.topics.reduce((sum, t) => (t.done ? sum + t.hours : sum), 0);
}

/** A phase is complete ONLY when the gate is passed — never on topics alone. */
export function isPhaseComplete(phase: Phase): boolean {
  return phase.gatePassed;
}

export const TOTAL_SYLLABUS_HOURS = 267;
