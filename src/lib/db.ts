import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { SEED_PHASES, verifySeedHours } from '../data/seedData';
import { GATE_SUBJECTS, verifyGateHours } from '../data/gateData';
import { GATE_WEEKS } from '../data/gateWeeks';
import { linkForDay, linkForSubtopic } from '../data/gateLinks';
import type {
  ActivityEvent,
  Meta,
  NewActivityEvent,
  NewWeeklyReview,
  Phase,
  PhaseDoc,
  Topic,
  TrackId,
  WeekEntry,
  WeeklyReview,
  WeekStatus,
  WeekStatusMap,
} from '../types';
import {
  REST_DAY_INDEX,
  swapBlockedReason,
  swapUpdates,
  topicDoneFromSubtopics,
  topicHoursLogged,
  weekDayHours,
  weekEndMs,
  weekIsComplete,
  weekWasLive,
} from '../types';

/**
 * Firestore is the source of truth. The files under src/data are a one-time
 * bootstrap payload; after the first load every read and write goes to the
 * database and the app never falls back to the local copy.
 *
 *   users/{uid}/tracks/{trackId}/phases/{phaseId}   subjects / phases
 *   users/{uid}/tracks/{trackId}/meta/profile       target hours, start date
 *   users/{uid}/tracks/{trackId}/reviews/{autoId}   weekly reviews
 *   users/{uid}/tracks/{trackId}/activity/{autoId}  append-only event log
 *   users/{uid}/tracks/gate/weeks/{weekId}          the 28-week timeline
 *   users/{uid}/tracks/{trackId}/meta/seed          seed version marker
 */

const SEED_VERSION = 2;

// ---- Path helpers ----
const trackDoc = (uid: string, track: TrackId) => doc(db, 'users', uid, 'tracks', track);
const phasesCol = (uid: string, track: TrackId) =>
  collection(db, 'users', uid, 'tracks', track, 'phases');
const phaseDoc = (uid: string, track: TrackId, phaseId: number) =>
  doc(db, 'users', uid, 'tracks', track, 'phases', String(phaseId));
const weeksCol = (uid: string) => collection(db, 'users', uid, 'tracks', 'gate', 'weeks');
const weekDoc = (uid: string, weekId: string) =>
  doc(db, 'users', uid, 'tracks', 'gate', 'weeks', weekId);
const metaDoc = (uid: string, track: TrackId) =>
  doc(db, 'users', uid, 'tracks', track, 'meta', 'profile');
const seedDoc = (uid: string, track: TrackId) =>
  doc(db, 'users', uid, 'tracks', track, 'meta', 'seed');
const reviewsCol = (uid: string, track: TrackId) =>
  collection(db, 'users', uid, 'tracks', track, 'reviews');
const activityCol = (uid: string, track: TrackId) =>
  collection(db, 'users', uid, 'tracks', track, 'activity');

// ---- Activity log ----

/**
 * Append one event. Timestamps are client-side millis on purpose: the dashboard
 * buckets hours by local day, and a serverTimestamp reads back as null until the
 * write is acknowledged, which would drop the event out of today's column.
 */
async function logActivity(
  uid: string,
  track: TrackId,
  event: Omit<NewActivityEvent, 'at'>,
): Promise<void> {
  await setDoc(doc(activityCol(uid, track)), { ...event, at: Date.now() });
}

/** Most recent events first. `max` caps how much history the UI keeps in memory. */
export function subscribeActivity(
  uid: string,
  track: TrackId,
  max: number,
  onData: (events: ActivityEvent[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const q = query(activityCol(uid, track), orderBy('at', 'desc'), limit(max));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const data = d.data() as Omit<ActivityEvent, 'id'>;
          return {
            id: d.id,
            kind: data.kind,
            label: data.label ?? '',
            hours: data.hours ?? 0,
            at: data.at ?? Date.now(),
          };
        }),
      );
    },
    (err) => onError(err),
  );
}

// ---- Seeding (runs once per track) ----

function seedPhasesFor(track: TrackId): readonly Phase[] {
  return track === 'gate' ? GATE_SUBJECTS : SEED_PHASES;
}

/**
 * Write the initial content for a track into Firestore, but only if that track
 * has no documents yet. Verifies hour totals first and throws loudly on a
 * mismatch rather than seeding bad data.
 */
export async function seedTrackIfEmpty(uid: string, track: TrackId): Promise<void> {
  if (track === 'gate') verifyGateHours();
  else verifySeedHours();

  const existing = await getDocs(phasesCol(uid, track));
  if (!existing.empty) return; // already seeded — the database wins

  const batch = writeBatch(db);

  // The parent track document must exist for the console to show the subtree.
  batch.set(trackDoc(uid, track), { id: track, seededAt: serverTimestamp() });

  for (const phase of seedPhasesFor(track)) {
    const { id, ...rest } = phase;
    batch.set(phaseDoc(uid, track, id), rest as PhaseDoc);
  }

  if (track === 'gate') {
    for (const w of GATE_WEEKS) {
      const { id, ...rest } = w;
      batch.set(weekDoc(uid, id), { ...rest, status: null });
    }
  }

  const meta: Meta = {
    targetHoursPerWeek: track === 'gate' ? 45 : 15,
    startDate: track === 'gate' ? '2026-07-27' : new Date().toISOString().slice(0, 10),
  };
  batch.set(metaDoc(uid, track), meta);
  batch.set(seedDoc(uid, track), { version: SEED_VERSION, at: serverTimestamp() });

  await batch.commit();
}

/** Seed every track. Safe to call on every load. */
export async function seedIfEmpty(uid: string): Promise<void> {
  await seedTrackIfEmpty(uid, 'gate');
  await seedTrackIfEmpty(uid, 'backend');
  await migrateLegacyBackend(uid);
}

/**
 * v1 stored the backend phases at users/{uid}/phases/*. If that legacy data is
 * still there, carry the user's ticks and gates across, then leave the old
 * documents alone (harmless, and a safety net if anything went wrong).
 */
async function migrateLegacyBackend(uid: string): Promise<void> {
  const legacy = await getDocs(collection(db, 'users', uid, 'phases'));
  if (legacy.empty) return;

  const marker = await getDoc(
    doc(db, 'users', uid, 'tracks', 'backend', 'meta', 'migrated'),
  );
  if (marker.exists()) return;

  const current = await getDocs(phasesCol(uid, 'backend'));
  const byId = new Map<string, Phase>();
  current.forEach((d) => byId.set(d.id, { id: Number(d.id), ...(d.data() as PhaseDoc) }));

  const batch = writeBatch(db);
  legacy.forEach((d) => {
    const old = d.data() as {
      gatePassed?: boolean;
      topics?: Array<{ name: string; done?: boolean }>;
    };
    const next = byId.get(d.id);
    if (!next) return;

    const doneNames = new Set(
      (old.topics ?? []).filter((t) => t.done).map((t) => t.name),
    );
    const topics = next.topics.map((t) =>
      doneNames.has(t.name)
        ? { ...t, done: true, subtopics: t.subtopics.map((s) => ({ ...s, done: true })) }
        : t,
    );
    batch.update(phaseDoc(uid, 'backend', next.id), {
      topics,
      gatePassed: Boolean(old.gatePassed),
    });
  });
  batch.set(doc(db, 'users', uid, 'tracks', 'backend', 'meta', 'migrated'), {
    at: serverTimestamp(),
  });
  await batch.commit();
}

// ---- Phases / subjects ----

export function subscribePhases(
  uid: string,
  track: TrackId,
  onData: (phases: Phase[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    phasesCol(uid, track),
    (snap) => {
      const phases: Phase[] = snap.docs.map((d) => {
        const data = d.data() as PhaseDoc;
        return { id: Number(d.id), ...data };
      });
      phases.sort((a, b) => a.id - b.id);
      onData(phases);
    },
    (err) => onError(err),
  );
}

/** Everything in the unit ticked — the condition that marks it complete. */
function everythingDone(topics: Topic[]): boolean {
  if (topics.length === 0) return false;
  return topics.every((t) =>
    t.subtopics.length === 0 ? t.done : t.subtopics.every((s) => s.done),
  );
}

/**
 * Completion is derived, not chosen: ticking the last subtopic marks the unit
 * complete and unticking one reopens it. Recorded in the activity log either
 * way so the dashboard and the review history still see it happen.
 */
async function writeTopics(
  uid: string,
  track: TrackId,
  phase: Phase,
  topics: Topic[],
): Promise<void> {
  const gatePassed = everythingDone(topics);
  await updateDoc(phaseDoc(uid, track, phase.id), { topics, gatePassed });
  if (gatePassed !== phase.gatePassed) {
    await logActivity(uid, track, {
      kind: 'gate',
      label: `${gatePassed ? 'Gate passed' : 'Gate reopened'} — ${phase.title}`,
      hours: 0,
    });
  }
}

/**
 * The same day of study exists twice on the GATE track — as a campaign day and
 * as a subject subtopic. These two keep the pair in step, so a tick made on
 * either page shows up on the other. Both write directly rather than calling
 * the public setters, which is what stops them calling each other back.
 */
async function mirrorDayToSubtopic(
  uid: string,
  weekId: string,
  dayIndex: number,
  done: boolean,
): Promise<void> {
  const link = linkForDay(weekId, dayIndex);
  if (!link) return;

  const ref = phaseDoc(uid, 'gate', link.unitId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data() as PhaseDoc;
  const target = data.topics[link.topicIndex]?.subtopics[link.subtopicIndex];
  if (!target || target.done === done) return;

  const topics = data.topics.map((t, i) => {
    if (i !== link.topicIndex) return t;
    const subtopics = t.subtopics.map((s, j) =>
      j === link.subtopicIndex ? { ...s, done } : s,
    );
    const next = { ...t, subtopics };
    return { ...next, done: topicDoneFromSubtopics(next) };
  });
  await updateDoc(ref, { topics, gatePassed: everythingDone(topics) });
}

async function mirrorSubtopicToDay(
  uid: string,
  unitId: number,
  topicIndex: number,
  subtopicIndex: number,
  done: boolean,
): Promise<void> {
  const link = linkForSubtopic(unitId, topicIndex, subtopicIndex);
  if (!link) return;

  const ref = weekDoc(uid, link.weekId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data() as WeekDoc;
  const current = data.dayDone ?? (data.days ?? []).map(() => false);
  if (current[link.dayIndex] === done) return;

  const dayDone = current.map((d, i) => (i === link.dayIndex ? done : d));
  await updateDoc(ref, { dayDone, status: statusFromDays(data.days ?? [], dayDone) });
}

/**
 * A week passes when every study day is ticked, and stops passing the moment
 * one is untied again. Sunday is protected rest and never counts.
 */
function statusFromDays(days: string[], dayDone: boolean[]): WeekStatus | null {
  if (days.length === 0) return null;
  const allDone = days.every((_, i) =>
    i === REST_DAY_INDEX ? true : (dayDone[i] ?? false),
  );
  return allDone ? 'pass' : null;
}

/** Tick or untick a single subtopic; the parent topic's flag is recomputed. */
export async function setSubtopicDone(
  uid: string,
  track: TrackId,
  phase: Phase,
  topicIndex: number,
  subtopicIndex: number,
  done: boolean,
): Promise<void> {
  const subtopic = phase.topics[topicIndex]?.subtopics[subtopicIndex];
  if (!subtopic || subtopic.done === done) return;

  const topics = phase.topics.map((t, i) => {
    if (i !== topicIndex) return t;
    const subtopics = t.subtopics.map((s, j) =>
      j === subtopicIndex ? { ...s, done } : s,
    );
    const next = { ...t, subtopics };
    return { ...next, done: topicDoneFromSubtopics(next) };
  });
  await logActivity(uid, track, {
    kind: 'subtopic',
    label: `${done ? 'Ticked' : 'Unticked'} ${subtopic.name}`,
    hours: done ? subtopic.hours : -subtopic.hours,
  });
  await writeTopics(uid, track, phase, topics);
  if (track === 'gate') {
    await mirrorSubtopicToDay(uid, phase.id, topicIndex, subtopicIndex, done);
  }
}

/** Tick or untick a whole topic — cascades to every subtopic under it. */
export async function setTopicDone(
  uid: string,
  track: TrackId,
  phase: Phase,
  topicIndex: number,
  done: boolean,
): Promise<void> {
  const topic = phase.topics[topicIndex];
  if (!topic) return;
  const before = topicHoursLogged(topic);

  const topics = phase.topics.map((t, i) =>
    i === topicIndex
      ? { ...t, done, subtopics: t.subtopics.map((s) => ({ ...s, done })) }
      : t,
  );
  await logActivity(uid, track, {
    kind: 'topic',
    label: `${done ? 'Closed' : 'Reopened'} ${topic.name}`,
    hours: (done ? topic.hours : 0) - before,
  });
  await writeTopics(uid, track, phase, topics);
}

// ---- GATE week timeline ----

type WeekDoc = Omit<WeekEntry, 'id'> & { status?: WeekStatus | null };

export function subscribeWeeks(
  uid: string,
  onData: (weeks: WeekEntry[], status: WeekStatusMap) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    weeksCol(uid),
    (snap) => {
      const weeks: WeekEntry[] = [];
      const status: WeekStatusMap = {};
      snap.docs.forEach((d) => {
        const { status: s, ...rest } = d.data() as WeekDoc;
        weeks.push({ id: d.id, ...(rest as Omit<WeekEntry, 'id'>) });
        if (s) status[d.id] = s;
      });
      // Ordered by the calendar, not by id: weeks can be swapped into each
      // other's slots, and after a swap the ids are deliberately out of
      // sequence — W7 stays W7 wherever it lands.
      weeks.sort((a, b) => a.start.localeCompare(b.start));
      onData(weeks, status);
    },
    (err) => onError(err),
  );
}

/** Tick one day of a campaign week. Hours come from the week's planned split. */
export async function setWeekDayDone(
  uid: string,
  week: WeekEntry,
  dayIndex: number,
  done: boolean,
): Promise<void> {
  const current = week.dayDone ?? week.days.map(() => false);
  if (current[dayIndex] === done) return;
  const dayDone = current.map((d, i) => (i === dayIndex ? done : d));
  const status = statusFromDays(week.days, dayDone);
  await updateDoc(weekDoc(uid, week.id), { dayDone, status });

  if (status === 'pass' && week.dayDone && !weekIsComplete(week)) {
    await logActivity(uid, 'gate', {
      kind: 'week',
      label: `${week.id} passed — ${week.title}`,
      hours: 0,
    });
  }

  const hours = weekDayHours(week)[dayIndex] ?? 0;
  const label = week.days[dayIndex] ?? `${week.id} day ${dayIndex + 1}`;
  await logActivity(uid, 'gate', {
    kind: 'day',
    label: `${done ? 'Worked' : 'Cleared'} ${week.id} ${label.slice(0, 60)}`,
    hours: done ? hours : -hours,
  });
  await mirrorDayToSubtopic(uid, week.id, dayIndex, done);
}

/**
 * Trade two weeks' calendar slots.
 *
 * Only the dates move. The id, the plan, the day ticks and any record of a slip
 * stay with the week, which is what keeps the subject↔day links in gateLinks.ts
 * pointing at the same work — they are keyed by week id, and the subject topics
 * carry that id in their names. After a swap the ids read out of sequence on
 * the timeline; that is the point.
 *
 * The milestone is the one exception, and moves the other way: the mock tests
 * are pinned to fixed dates, so it stays with the slot and the incoming week
 * inherits it. Week ids never change.
 *
 * `slottedAt` marks the move so that a week dropped onto dates that have
 * already passed is not then swept as missed (see `weekWasLive`), and a week
 * leaving a slot it had already lost is stamped on the way out so that the
 * move records the slip rather than erasing it (see `slipOnLeaving`).
 */
export async function swapWeekSlots(
  uid: string,
  a: WeekEntry,
  b: WeekEntry,
  now = Date.now(),
): Promise<void> {
  if (a.id === b.id) return;
  // The timeline already refuses these drops; this is the backstop.
  const blocked = swapBlockedReason(a, b);
  if (blocked) throw new Error(blocked);

  const [updateA, updateB] = swapUpdates(a, b, now);
  const batch = writeBatch(db);
  batch.update(weekDoc(uid, a.id), { ...updateA });
  batch.update(weekDoc(uid, b.id), { ...updateB });
  await batch.commit();

  await logActivity(uid, 'gate', {
    kind: 'week',
    label: `${a.id} ⇄ ${b.id} — ${a.id} now ${b.dates}, ${b.id} now ${a.dates}`,
    hours: 0,
  });
}

/**
 * Put every week back in the slot it was authored in, undoing all swaps at
 * once. Only the calendar is restored: the day ticks and every `missedAt` stay
 * exactly as they are, because what you did and what you slipped on happened
 * whatever order the plan was in.
 */
export async function resetWeekSlots(uid: string): Promise<void> {
  const batch = writeBatch(db);
  for (const w of GATE_WEEKS) {
    batch.update(weekDoc(uid, w.id), {
      start: w.start,
      end: w.end,
      dates: w.dates,
      milestone: w.milestone ?? null,
      slottedAt: null,
    });
  }
  await batch.commit();

  await logActivity(uid, 'gate', {
    kind: 'week',
    label: 'Timeline reset — every week back in its original slot',
    hours: 0,
  });
}

/**
 * Mark every campaign week whose end has passed with work still outstanding.
 * `missedAt` is written once and never cleared — catching up later still counts,
 * but the slip stays on the record. Safe to call on every load.
 */
export async function sweepMissedWeeks(
  uid: string,
  weeks: WeekEntry[],
  now = Date.now(),
): Promise<void> {
  const overdue = weeks.filter(
    (w) => !w.missedAt && weekWasLive(w) && weekEndMs(w) < now && !weekIsComplete(w),
  );
  if (overdue.length === 0) return;

  const batch = writeBatch(db);
  for (const w of overdue) {
    // Stamped with the moment the week closed, not the moment the sweep ran.
    // Several weeks noticed on the same load slipped on different dates, and
    // the backlog orders and dates itself by this.
    batch.update(weekDoc(uid, w.id), { missedAt: weekEndMs(w) });
  }
  await batch.commit();

  for (const w of overdue) {
    await logActivity(uid, 'gate', {
      kind: 'week',
      label: `${w.id} missed — ${w.title}`,
      hours: 0,
    });
  }
}

// ---- Meta ----

export function subscribeMeta(
  uid: string,
  track: TrackId,
  onData: (meta: Meta | null) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    metaDoc(uid, track),
    (snap) => onData(snap.exists() ? (snap.data() as Meta) : null),
    (err) => onError(err),
  );
}

export async function getMeta(uid: string, track: TrackId): Promise<Meta | null> {
  const snap = await getDoc(metaDoc(uid, track));
  return snap.exists() ? (snap.data() as Meta) : null;
}

export async function setMeta(
  uid: string,
  track: TrackId,
  meta: Partial<Meta>,
): Promise<void> {
  await setDoc(metaDoc(uid, track), meta, { merge: true });
}

// ---- Weekly reviews ----

export async function addReview(
  uid: string,
  track: TrackId,
  review: NewWeeklyReview,
): Promise<void> {
  const ref = doc(reviewsCol(uid, track));
  await setDoc(ref, {
    stalled: review.stalled,
    nextObjective: review.nextObjective,
    builtPct: review.builtPct,
    previousDone: review.previousDone,
    createdAt: serverTimestamp(),
  });
  await logActivity(uid, track, {
    kind: 'review',
    label: review.nextObjective
      ? `Weekly review — next: ${review.nextObjective}`
      : 'Weekly review written',
    hours: 0,
  });
}

/** Answer the "did you do it?" question on an already-saved review. */
export async function setReviewPreviousDone(
  uid: string,
  track: TrackId,
  reviewId: string,
  previousDone: boolean | null,
): Promise<void> {
  await updateDoc(doc(reviewsCol(uid, track), reviewId), { previousDone });
}

export function subscribeReviews(
  uid: string,
  track: TrackId,
  onData: (reviews: WeeklyReview[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const q = query(reviewsCol(uid, track), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const reviews: WeeklyReview[] = snap.docs.map((d) => {
        const data = d.data() as {
          stalled?: string;
          nextObjective?: string;
          builtPct?: number;
          previousDone?: boolean | null;
          createdAt?: Timestamp | null;
        };
        const created =
          data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now();
        return {
          id: d.id,
          stalled: data.stalled ?? '',
          nextObjective: data.nextObjective ?? '',
          builtPct: data.builtPct ?? 0,
          previousDone: data.previousDone ?? null,
          createdAt: created,
        };
      });
      onData(reviews);
    },
    (err) => onError(err),
  );
}
