// Domain model — two tracks (GATE 2027 CS, Backend Engineering), each a list of
// units ("phases" for backend, "subjects" for GATE) containing topics, which in
// turn contain individually checkable subtopics. Do not add fields casually.

export type TrackId = 'gate' | 'backend';

/** Smallest checkable unit. Hours are focused hours. */
export interface Subtopic {
  name: string;
  hours: number;
  done: boolean;
  /** Flag for topics newly added to the GATE 2027 syllabus (no PYQ exists). */
  isNew?: boolean;
}

export interface Topic {
  name: string;
  hours: number; // must equal the sum of its subtopics' hours
  detail: string; // "what to learn" — one-line summary
  done: boolean; // true when every subtopic is done
  subtopics: Subtopic[];
}

export interface Phase {
  id: number; // 0-based index within its track
  title: string;
  hours: number; // total focused hours (must equal the sum of topic hours)
  description: string; // one-liner
  gate: string; // artifact/skill that proves the unit is complete
  gatePassed: boolean;
  topics: Topic[];
  /** GATE only: target marks in the paper for this subject. */
  targetMarks?: number;
  /** GATE only: which weeks of the campaign plan cover this subject. */
  weeks?: string;
}

// Firestore document stored at users/{uid}/tracks/{trackId}/phases/{phaseId}.
// `id` is the document id, so it is omitted from the stored payload.
export type PhaseDoc = Omit<Phase, 'id'>;

/** Static definition of a track — content lives in the seed files. */
export interface TrackDef {
  id: TrackId;
  name: string;
  shortName: string;
  /** What one unit is called, e.g. "Phase" or "Subject". */
  unitLabel: string;
  unitLabelPlural: string;
  totalHours: number;
  unitCount: number;
  tagline: string;
  /** GATE only: marks the whole paper is worth to you. */
  targetMarks?: number;
}

export const TRACKS: readonly TrackDef[] = [
  {
    id: 'gate',
    name: 'GATE 2027 — Computer Science',
    shortName: 'GATE 2027',
    unitLabel: 'Subject',
    unitLabelPlural: 'Subjects',
    totalHours: 852,
    unitCount: 12,
    tagline: 'AIR < 50 campaign · 27 weeks · 86-mark target',
    targetMarks: 86,
  },
  {
    id: 'backend',
    name: 'Backend Engineering — MLE Track',
    shortName: 'Backend',
    unitLabel: 'Phase',
    unitLabelPlural: 'Phases',
    totalHours: 267,
    unitCount: 12,
    tagline: 'Advance on the gate, not on hours · 70% build / 30% read',
  },
];

export function trackDef(id: TrackId): TrackDef {
  const t = TRACKS.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown track: ${id}`);
  return t;
}

// ---- GATE week timeline ----

export type WeekKind = 'setup' | 'core' | 'revision' | 'mock' | 'taper';

export interface WeekEntry {
  id: string; // 'W0' … 'W27'
  title: string; // 'Discrete Mathematics III'
  dates: string; // '17–23 Aug 2026'
  start: string; // ISO date of the Monday
  end: string; // ISO date of the Sunday
  phase: string; // 'P1 — Core Build'
  kind: WeekKind;
  hours: number; // planned focused hours
  /** Day-by-day intake topics (Mon–Thu new material, Fri consolidation). */
  days: string[];
  gate: string; // weekly pass/fail milestone
  milestone?: string; // 'M1', 'M4', … when a major milestone lands this week
  /** Which of the seven days have been worked, parallel to `days`. */
  dayDone?: boolean[];
  /**
   * Epoch millis at which this week's end passed with work still outstanding.
   * Written once and kept: finishing the work later marks it done but does not
   * erase the fact that it slipped.
   */
  missedAt?: number | null;
}

/** A week is missed once its end has passed with any study day still unticked. */
export function weekIsComplete(week: WeekEntry): boolean {
  const done = week.dayDone ?? [];
  return week.days.every((_, i) => (i === 6 ? true : (done[i] ?? false)));
}

/**
 * Planned split of a 45h campaign week: Mon–Fri 7h of intake/consolidation,
 * Saturday 10h of timed test + analysis, Sunday protected rest.
 */
const DAY_SHARE: readonly number[] = [7, 7, 7, 7, 7, 10, 0];
const DAY_SHARE_TOTAL = DAY_SHARE.reduce((a, b) => a + b, 0);

/** Planned hours for each day of a week, scaled to that week's total. */
export function weekDayHours(week: WeekEntry): number[] {
  return DAY_SHARE.map((share) =>
    Math.round((week.hours * share) / DAY_SHARE_TOTAL),
  );
}

/** 'Mon — Propositional logic…' → 'Mon'. */
export function dayLabel(day: string, index: number): string {
  const m = /^([A-Za-z]{3})\b/.exec(day);
  return m ? m[1] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] ?? '';
}

/** 'Mon — Propositional logic…' → 'Propositional logic…'. */
export function dayBody(day: string): string {
  const i = day.indexOf('—');
  return i === -1 ? day : day.slice(i + 1).trim();
}

/** Hours actually marked done in a week. */
export function weekHoursDone(week: WeekEntry): number {
  const hours = weekDayHours(week);
  return (week.dayDone ?? []).reduce((sum, d, i) => (d ? sum + (hours[i] ?? 0) : sum), 0);
}

/** users/{uid}/tracks/gate/meta/weeks — map of weekId -> status. */
export type WeekStatus = 'pass' | 'fail';
export type WeekStatusMap = Record<string, WeekStatus>;

// users/{uid}/tracks/{trackId}/meta/profile
export interface Meta {
  targetHoursPerWeek: number;
  startDate: string; // ISO date string
}

// users/{uid}/tracks/{trackId}/reviews/{autoId}
export interface WeeklyReview {
  id: string;
  stalled: string; // "what stalled"
  nextObjective: string; // "next single objective"
  createdAt: number; // epoch millis
  /** Share of the week spent building rather than reading/watching, 0–100. */
  builtPct: number;
  /** Did you do the objective the previous review set? null = not answered. */
  previousDone: boolean | null;
}

export type NewWeeklyReview = Omit<WeeklyReview, 'id'>;

// users/{uid}/tracks/{trackId}/activity/{autoId}
// Every tick, gate and review lands here so the dashboard can report real
// hours per day instead of inventing them.
export type ActivityKind = 'subtopic' | 'topic' | 'gate' | 'week' | 'day' | 'review';

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  label: string;
  /** Signed hours this event added to (or removed from) the log. */
  hours: number;
  at: number; // epoch millis
}

export type NewActivityEvent = Omit<ActivityEvent, 'id'>;

// ---- Backlog ----

/**
 * Work that is behind. On GATE that means a campaign week whose end passed with
 * days still unticked; on tracks without dates it means anything left unticked
 * in a unit you have already moved past.
 */
export interface BacklogItem {
  id: string;
  kind: 'week' | 'day' | 'subtopic';
  title: string;
  detail: string;
  hours: number;
  /** Unit to open when the item is tapped, when there is one. */
  unitId?: number;
  weekId?: string;
  /** When it was missed. Null on tracks with no dates. */
  missedAt: number | null;
  /** Ticked after it had already been missed. */
  completedLate: boolean;
}

/** Local Monday 00:00 of the week containing `ts`. */
export function startOfWeek(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const shift = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - shift);
  return d.getTime();
}

/** Hours logged per weekday (Mon…Sun) for the week containing `ts`. */
export function hoursByDay(activity: ActivityEvent[], ts: number): number[] {
  const start = startOfWeek(ts);
  const days = [0, 0, 0, 0, 0, 0, 0];
  for (const e of activity) {
    const offset = Math.floor((startOfDay(e.at) - start) / 86_400_000);
    if (offset >= 0 && offset < 7) days[offset] += e.hours;
  }
  return days.map((h) => Math.max(0, Math.round(h * 10) / 10));
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// ---- Derived helpers (pure, UI-facing) ----

export function allSubtopics(phase: Phase): Subtopic[] {
  return phase.topics.flatMap((t) => t.subtopics);
}

/** % of subtopics checked in a phase. */
export function topicCompletion(phase: Phase): number {
  const subs = allSubtopics(phase);
  if (subs.length === 0) {
    if (phase.topics.length === 0) return 0;
    const done = phase.topics.filter((t) => t.done).length;
    return Math.round((done / phase.topics.length) * 100);
  }
  const done = subs.filter((s) => s.done).length;
  return Math.round((done / subs.length) * 100);
}

/** % of subtopics checked within a single topic. */
export function subtopicCompletion(topic: Topic): number {
  if (topic.subtopics.length === 0) return topic.done ? 100 : 0;
  const done = topic.subtopics.filter((s) => s.done).length;
  return Math.round((done / topic.subtopics.length) * 100);
}

/** Hours "logged" = sum of hours from subtopics marked done. */
export function hoursLogged(phase: Phase): number {
  return phase.topics.reduce((sum, t) => sum + topicHoursLogged(t), 0);
}

export function topicHoursLogged(topic: Topic): number {
  if (topic.subtopics.length === 0) return topic.done ? topic.hours : 0;
  return topic.subtopics.reduce((s, st) => (st.done ? s + st.hours : s), 0);
}

/** Every subtopic ticked (and every topic that has none marked done). */
export function allWorkDone(phase: Phase): boolean {
  if (phase.topics.length === 0) return false;
  return phase.topics.every((t) =>
    t.subtopics.length === 0 ? t.done : t.subtopics.every((s) => s.done),
  );
}

/**
 * A unit is complete when everything in it is ticked. `gatePassed` is still the
 * stored flag — it is now written automatically as the last subtopic is ticked
 * and cleared again if one is unticked — and is also honoured on its own so
 * that units passed by hand before this rule changed stay complete until the
 * next tick recomputes them.
 */
export function isPhaseComplete(phase: Phase): boolean {
  return allWorkDone(phase) || phase.gatePassed;
}

/** Recompute a topic's `done` flag from its subtopics. */
export function topicDoneFromSubtopics(topic: Topic): boolean {
  if (topic.subtopics.length === 0) return topic.done;
  return topic.subtopics.every((s) => s.done);
}

/** Backend track: total focused hours across all 12 phases. */
export const TOTAL_SYLLABUS_HOURS = 267;
/** GATE track: first-pass (Phase-1) learning hours across all 12 subjects. */
export const TOTAL_GATE_HOURS = 852;
