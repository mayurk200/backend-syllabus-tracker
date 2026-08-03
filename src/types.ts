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
  /**
   * 'M1', 'M4', … when a major milestone lands this week. Unlike the rest of a
   * week, this belongs to the calendar slot rather than to the plan: the mock
   * tests sit on fixed dates, so a swap leaves the milestone where it is and
   * the incoming week inherits it.
   */
  milestone?: string | null;
  /** Which of the seven days have been worked, parallel to `days`. */
  dayDone?: boolean[];
  /**
   * Epoch millis at which this week's end passed with work still outstanding.
   * Written once and kept: finishing the work later marks it done but does not
   * erase the fact that it slipped.
   */
  missedAt?: number | null;
  /**
   * Epoch millis at which this week was moved into the calendar slot it now
   * occupies. Absent while a week still sits in the slot it was authored in.
   * Only the dates move in a swap, so everything else here — the plan, the
   * ticks, the record of a slip — belongs to the week and travels with it.
   */
  slottedAt?: number | null;
  /**
   * Raw marks scored in this week's milestone test, out of `MILESTONE_MAX`.
   * Only meaningful on a week that carries a milestone. Null until sat.
   */
  milestoneScore?: number | null;
}

/** GATE is marked out of 100 raw. */
export const MILESTONE_MAX = 100;

/**
 * The campaign targets 84–88 raw. Below that band the mock says the plan is not
 * working yet; the point of recording scores is to see that early rather than
 * in February.
 */
export const MILESTONE_TARGET = 84;

export type MilestoneVerdict = 'unsat' | 'under' | 'onTarget';

export function milestoneVerdict(week: WeekEntry): MilestoneVerdict {
  const s = week.milestoneScore;
  if (s === null || s === undefined) return 'unsat';
  return s >= MILESTONE_TARGET ? 'onTarget' : 'under';
}

/** Milestone weeks in calendar order, for the score history. */
export function milestoneWeeks(weeks: WeekEntry[]): WeekEntry[] {
  return weeks
    .filter((w) => Boolean(w.milestone))
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** Mean of the milestones actually sat, or null if none have been. */
export function milestoneAverage(weeks: WeekEntry[]): number | null {
  const sat = milestoneWeeks(weeks)
    .map((w) => w.milestoneScore)
    .filter((s): s is number => typeof s === 'number');
  if (sat.length === 0) return null;
  return Math.round((sat.reduce((a, b) => a + b, 0) / sat.length) * 10) / 10;
}

export const WEEK_KIND_LABEL: Record<WeekKind, string> = {
  setup: 'setup',
  core: 'core build',
  revision: 'revision',
  mock: 'mocks',
  taper: 'taper',
};

/**
 * Kinds that anchor the campaign and never move. The setup week holds the
 * baseline diagnostic that everything after it is calibrated against, and the
 * taper is the run-in to the exam window itself — neither means anything in a
 * different slot.
 */
const PINNED_KINDS: ReadonlySet<WeekKind> = new Set<WeekKind>(['setup', 'taper']);

export function weekIsPinned(week: WeekEntry): boolean {
  return PINNED_KINDS.has(week.kind);
}

/**
 * Why two weeks may not trade slots, or null if they may.
 *
 * Weeks swap within their own block only. The campaign is built in phases —
 * core build, then revision, then mocks — and moving a week across that
 * boundary reorders the method rather than the material, which is never what
 * reshuffling a study plan is meant to do. Inside a block you are free.
 */
export function swapBlockedReason(a: WeekEntry, b: WeekEntry): string | null {
  if (a.id === b.id) return null;
  for (const w of [a, b]) {
    if (weekIsPinned(w)) {
      return w.kind === 'setup'
        ? `${w.id} is the baseline setup week — the whole plan is calibrated against it, so it stays put.`
        : `${w.id} is the taper into the exam window and cannot move.`;
    }
  }
  if (a.kind !== b.kind) {
    return `${a.id} is ${WEEK_KIND_LABEL[a.kind]} and ${b.id} is ${WEEK_KIND_LABEL[b.kind]} — weeks only swap within their own block.`;
  }
  return null;
}

export function canSwapWeeks(a: WeekEntry, b: WeekEntry): boolean {
  return swapBlockedReason(a, b) === null;
}

/**
 * Work that is owed: the slot has closed and the week is not finished. True
 * both for a week that was there when its dates ran out and for one parked on
 * dates that had already passed — either way it has no date left to be done on.
 */
export function weekNeedsSlot(week: WeekEntry, now: number): boolean {
  return weekEnded(week, now) && !weekIsComplete(week);
}

export interface CatchUpSuggestion {
  /** The week that is owed. */
  week: WeekEntry;
  /** The slot it could take. */
  target: WeekEntry;
  /** True when the target is already finished, so the swap costs nothing. */
  free: boolean;
}

/**
 * The oldest week still owed, and the best slot to move it to.
 *
 * Swapping is a trade, so giving a missed week a future date sends whatever was
 * there back onto spent dates. A week already finished can absorb that without
 * losing anything — it keeps its pass wherever it sits — so those are offered
 * first, and an unfinished target only when there is no better option. That
 * trade is not hidden: the displaced week shows up as needing a slot itself.
 */
export function suggestCatchUp(weeks: WeekEntry[], now: number): CatchUpSuggestion | null {
  const owed = weeks
    .filter((w) => weekNeedsSlot(w, now))
    .sort((a, b) => (a.missedAt ?? weekEndMs(a)) - (b.missedAt ?? weekEndMs(b)));

  for (const week of owed) {
    const target = weeks
      .filter(
        (t) =>
          t.id !== week.id &&
          canSwapWeeks(week, t) &&
          // Only a slot that has not started: moving the week you are in the
          // middle of is not catching up, it is losing your place.
          new Date(`${t.start}T00:00:00`).getTime() > now,
      )
      .sort((a, b) => {
        const byCost = Number(weekIsComplete(b)) - Number(weekIsComplete(a));
        return byCost !== 0 ? byCost : a.start.localeCompare(b.start);
      })[0];
    if (target) return { week, target, free: weekIsComplete(target) };
  }
  return null;
}

/** The fields a swap rewrites on one of the two weeks. */
export interface WeekSlotUpdate {
  start: string;
  end: string;
  dates: string;
  milestone: string | null;
  milestoneScore: number | null;
  slottedAt: number;
  /** Written only when the move is leaving a slip behind. */
  missedAt?: number;
}

/**
 * A week being moved out of a slot that closed with work still open has
 * slipped, whether or not the nightly sweep has reached it yet. Recording that
 * at the moment of the move is what stops a swap from erasing a miss: without
 * it, two already-closed weeks could trade slots and both would come out
 * looking as though they had never been given their dates at all.
 *
 * A week that was itself parked on those dates after they closed is exempt —
 * it never had the slot while the slot was live, so there is nothing to record.
 */
export function slipOnLeaving(week: WeekEntry, now: number): number | null {
  if (week.missedAt) return null;
  if (!weekEnded(week, now)) return null;
  if (weekIsComplete(week)) return null;
  if (!weekWasLive(week)) return null;
  // The slip happened when the slot closed, not when it was noticed.
  return weekEndMs(week);
}

/**
 * What to write to each week when they trade slots. The dates move, and so do
 * the milestone and its score — the mock tests are booked against real dates,
 * so those belong to the slot rather than to the plan, and they have to travel
 * together or a result would end up filed under a different test. Everything
 * else (the id, the days, the ticks) stays with the week.
 *
 * Pure, so the Firestore write and the tests run the same rules.
 */
export function swapUpdates(
  a: WeekEntry,
  b: WeekEntry,
  now: number,
): [WeekSlotUpdate, WeekSlotUpdate] {
  const slot = (to: WeekEntry, from: WeekEntry): WeekSlotUpdate => {
    const slip = slipOnLeaving(from, now);
    return {
      start: to.start,
      end: to.end,
      dates: to.dates,
      milestone: to.milestone ?? null,
      milestoneScore: to.milestoneScore ?? null,
      slottedAt: now,
      ...(slip === null ? {} : { missedAt: slip }),
    };
  };
  return [slot(b, a), slot(a, b)];
}

/** Sunday: protected rest, index 6 of every week, never counted as work. */
export const REST_DAY_INDEX = 6;

/** Indices of the six study days — everything except the rest day. */
export function studyDayIndexes(week: WeekEntry): number[] {
  return week.days.map((_, i) => i).filter((i) => i !== REST_DAY_INDEX);
}

/** Study days still unticked. */
export function missedStudyDays(week: WeekEntry): number[] {
  const done = week.dayDone ?? [];
  return studyDayIndexes(week).filter((i) => !(done[i] ?? false));
}

/** A week is complete once every study day is ticked. */
export function weekIsComplete(week: WeekEntry): boolean {
  return missedStudyDays(week).length === 0;
}

/** The last moment of a week's calendar slot, in epoch millis. */
export function weekEndMs(week: WeekEntry): number {
  return new Date(`${week.end}T23:59:59`).getTime();
}

export function weekEnded(week: WeekEntry, now: number): boolean {
  return weekEndMs(week) < now;
}

/**
 * Did this week ever actually sit in its slot while that slot was open?
 *
 * Weeks can be swapped, which means a week can land on dates that have already
 * passed — a deadline it was never given the chance to meet. Such a week is not
 * judged: it has not run rather than been missed. A week already carrying
 * `missedAt` was judged in an earlier slot, and that verdict stands wherever it
 * moves to afterwards.
 */
export function weekWasLive(week: WeekEntry): boolean {
  if (week.missedAt) return true;
  return !week.slottedAt || week.slottedAt <= weekEndMs(week);
}

/**
 * How a week turned out. Derived, never chosen: finishing every study day
 * passes it whenever that happens, and a week that closes with work left over
 * is partial if you did some of it and missed outright if you did none.
 */
export type WeekOutcome = 'pending' | 'pass' | 'partial' | 'missed';

export function weekOutcome(week: WeekEntry, now: number): WeekOutcome {
  if (weekIsComplete(week)) return 'pass';
  if (!weekEnded(week, now) || !weekWasLive(week)) return 'pending';
  return missedStudyDays(week).length < studyDayIndexes(week).length
    ? 'partial'
    : 'missed';
}

export const WEEK_OUTCOME_LABEL: Record<WeekOutcome, string> = {
  pending: 'in progress',
  pass: 'passed',
  partial: 'some done',
  missed: 'missed',
};

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
  /**
   * Slipped once, then moved onto a slot that has not closed yet — so it has a
   * date to be done on again and is no longer counted as outstanding. The slip
   * itself stays on the record, and if the new slot also closes with work open
   * the week simply reads late again.
   */
  rescheduled: boolean;
  /**
   * Displaced onto dates that had already passed, so it was never given its
   * slot and now has no date at all. Not late — unscheduled. Without this it
   * would read as "pending" forever and quietly leave the plan.
   */
  stranded: boolean;
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
