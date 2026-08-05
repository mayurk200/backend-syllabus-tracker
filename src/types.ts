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
  /**
   * Flagged to come back to. Deliberately independent of `done`: the useful
   * case is work you have ticked but would not bet on under exam conditions,
   * and collapsing the two would force you to choose between recording that you
   * did it and recording that you are unsure of it.
   */
  marked?: boolean;
}

/**
 * What a topic is worth against the salary target the track is aimed at.
 *
 * Bands only, deliberately. An earlier version of this carried a 0–100 score
 * per topic, and the number was invented — nothing measured it, and putting it
 * next to real quantities like hours made a judgement call read as data. A band
 * is honest about being a recommendation; a score is not.
 *
 * `why` is not optional decoration. A band with no argument behind it is the
 * thing this model exists to prevent, and `verifySeedHours` rejects the seed if
 * a topic is weighted without one.
 */
export type ValueWeight = 'critical' | 'high' | 'medium' | 'optional';

export interface TopicValue {
  weight: ValueWeight;
  /** One line arguing for the band. Reasoning you could defend, not a statistic. */
  why: string;
}

export interface Topic {
  name: string;
  hours: number; // must equal the sum of its subtopics' hours
  detail: string; // "what to learn" — one-line summary
  done: boolean; // true when every subtopic is done
  subtopics: Subtopic[];
  /** Backend track only: worth against the salary target. */
  value?: TopicValue;
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
  /**
   * A track you are keeping rather than committing to. It stays fully usable —
   * nothing is hidden or disabled — but it is not what the app opens on, and
   * the shell says so instead of letting the two plans look equally live.
   */
  optional?: boolean;
}

/**
 * Backend first: it is the track being worked, so it is the one the app opens
 * on. GATE is kept and complete, but marked optional — the two plans are
 * 746 h and 852 h respectively and cannot both be run at full weight, so the
 * shell states which one is primary rather than leaving it ambiguous.
 */
export const TRACKS: readonly TrackDef[] = [
  {
    id: 'backend',
    name: 'Backend Engineering — Java · 30 LPA track',
    shortName: 'Backend',
    unitLabel: 'Phase',
    unitLabelPlural: 'Phases',
    totalHours: 746,
    unitCount: 16,
    tagline: 'Java · Spring Boot · fresher → 30 LPA · advance on the gate, not on hours',
  },
  {
    id: 'gate',
    name: 'GATE 2027 — Computer Science',
    shortName: 'GATE 2027',
    unitLabel: 'Subject',
    unitLabelPlural: 'Subjects',
    totalHours: 852,
    unitCount: 12,
    tagline: 'Optional track · AIR < 50 campaign · 27 weeks · 86-mark target',
    targetMarks: 86,
    optional: true,
  },
];

/** What the app opens on. The first track listed is the one being worked. */
export const DEFAULT_TRACK: TrackId = TRACKS[0].id;

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

// ---- Marked for review ----

/** One flagged subtopic, with everything the review page needs to show it. */
export interface MarkedItem {
  /** Stable across renders, and unique because subtopic names are. */
  id: string;
  unitId: number;
  unitTitle: string;
  topicIndex: number;
  subtopicIndex: number;
  topicName: string;
  name: string;
  hours: number;
  /** Whether the work itself is ticked. A marked item can be either. */
  done: boolean;
}

/**
 * Every subtopic flagged for review, in plan order.
 *
 * Plan order rather than "most recently marked": there is no timestamp on a
 * mark, and inventing one would mean writing a field on every toggle for the
 * sake of a sort nobody asked for. Reading the list in syllabus order also
 * groups related weak spots together, which is how you would revise them.
 */
export function collectMarked(phases: Phase[]): MarkedItem[] {
  const items: MarkedItem[] = [];
  for (const phase of phases) {
    phase.topics.forEach((topic, topicIndex) => {
      topic.subtopics.forEach((sub, subtopicIndex) => {
        if (!sub.marked) return;
        items.push({
          id: `${phase.id}:${topicIndex}:${subtopicIndex}`,
          unitId: phase.id,
          unitTitle: phase.title,
          topicIndex,
          subtopicIndex,
          topicName: topic.name,
          name: sub.name,
          hours: sub.hours,
          done: sub.done,
        });
      });
    });
  }
  return items;
}

export function markedCount(phases: Phase[]): number {
  return phases.reduce(
    (n, p) => n + p.topics.reduce((m, t) => m + t.subtopics.filter((s) => s.marked).length, 0),
    0,
  );
}

/** Focused hours sitting behind the flags. */
export function markedHours(items: MarkedItem[]): number {
  return Math.round(items.reduce((s, i) => s + i.hours, 0) * 10) / 10;
}

// ---- Value against the salary target ----

/** Most valuable first — the order the bands are argued in, not alphabetical. */
export const VALUE_WEIGHTS: readonly ValueWeight[] = [
  'critical',
  'high',
  'medium',
  'optional',
];

export const VALUE_WEIGHT_LABEL: Record<ValueWeight, string> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  optional: 'optional',
};

/**
 * What each band means, so the badge is not just a colour.
 *
 * Phrased as instructions about this plan rather than as claims about what
 * interviewers do. The per-topic `why` carries the argument; a band label
 * should not smuggle in a blanket assertion about all 64 topics under it.
 */
export const VALUE_WEIGHT_MEANING: Record<ValueWeight, string> = {
  critical: 'Do not skip. The plan does not hold together without this.',
  high: 'Strongly recommended — this is where depth comes from.',
  medium: 'Worth doing once the two bands above are covered.',
  optional: 'Only once everything else is done. Cut this first if time is short.',
};

/** Where a band sits in the ordering. Lower is more important. */
function bandRank(weight: ValueWeight): number {
  return VALUE_WEIGHTS.indexOf(weight);
}

export interface BandProgress {
  done: number;
  total: number;
}

/**
 * How many topics in a band are finished.
 *
 * A count, not a percentage of some composite index. There is no arithmetic
 * here that could be mistaken for a measurement: the bands are a judgement, and
 * the only honest thing to report about a judgement is how much of it you have
 * acted on.
 */
export function bandProgress(
  phases: Phase[] | Phase,
  weight: ValueWeight,
): BandProgress {
  const list = Array.isArray(phases) ? phases : [phases];
  const topics = list.flatMap((p) => p.topics).filter((t) => t.value?.weight === weight);
  return {
    done: topics.filter((t) => topicDoneFromSubtopics(t)).length,
    total: topics.length,
  };
}

/** Shorthand for the band that decides whether you clear the bar. */
export function criticalProgress(phases: Phase[] | Phase): BandProgress {
  return bandProgress(phases, 'critical');
}

/** The heaviest band present in a unit — what the badge on the card shows. */
export function phaseWeight(phase: Phase): ValueWeight | null {
  for (const w of VALUE_WEIGHTS) {
    if (phase.topics.some((t) => t.value?.weight === w)) return w;
  }
  return null;
}

/**
 * Unticked topics, most important first, and within a band the shortest first.
 *
 * The second half of that rule is the only ordering claim being made: given two
 * topics that matter equally, the one that takes three hours should come before
 * the one that takes forty. That needs no invented score — the hours are real
 * and the band is stated.
 */
export function nextByValue(phases: Phase[], max = 5): Array<{ phase: Phase; topic: Topic }> {
  return phases
    .flatMap((phase) => phase.topics.map((topic) => ({ phase, topic })))
    .filter(({ topic }) => topic.value && !topicDoneFromSubtopics(topic))
    .sort((a, b) => {
      const byBand = bandRank(a.topic.value!.weight) - bandRank(b.topic.value!.weight);
      return byBand !== 0 ? byBand : a.topic.hours - b.topic.hours;
    })
    .slice(0, max);
}

/** Recompute a topic's `done` flag from its subtopics. */
export function topicDoneFromSubtopics(topic: Topic): boolean {
  if (topic.subtopics.length === 0) return topic.done;
  return topic.subtopics.every((s) => s.done);
}

/** Backend track: total focused hours across all 16 phases. */
export const TOTAL_SYLLABUS_HOURS = 746;
/** GATE track: first-pass (Phase-1) learning hours across all 12 subjects. */
export const TOTAL_GATE_HOURS = 852;
