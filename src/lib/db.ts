import {
  collection,
  doc,
  getDoc,
  getDocs,
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
import type { Meta, NewWeeklyReview, Phase, PhaseDoc, WeeklyReview } from '../types';

// ---- Path helpers ----
const phasesCol = (uid: string) => collection(db, 'users', uid, 'phases');
const phaseDoc = (uid: string, phaseId: number) =>
  doc(db, 'users', uid, 'phases', String(phaseId));
const metaDoc = (uid: string) => doc(db, 'users', uid, 'meta', 'profile');
const reviewsCol = (uid: string) => collection(db, 'users', uid, 'reviews');

// ---- Seeding (runs once) ----

/**
 * Seed the 12 phases + meta document, but only if nothing exists yet.
 * Verifies hour totals before writing and throws loudly on mismatch.
 */
export async function seedIfEmpty(uid: string): Promise<void> {
  verifySeedHours();

  const existing = await getDocs(phasesCol(uid));
  if (!existing.empty) return; // already seeded — do nothing

  const batch = writeBatch(db);

  for (const phase of SEED_PHASES) {
    const { id, ...rest } = phase;
    const payload: PhaseDoc = rest;
    batch.set(phaseDoc(uid, id), payload);
  }

  const meta: Meta = {
    targetHoursPerWeek: 10,
    startDate: new Date().toISOString().slice(0, 10),
  };
  batch.set(metaDoc(uid), meta);

  await batch.commit();
}

// ---- Phases ----

export function subscribePhases(
  uid: string,
  onData: (phases: Phase[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    phasesCol(uid),
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

export async function setTopicDone(
  uid: string,
  phase: Phase,
  topicIndex: number,
  done: boolean,
): Promise<void> {
  const topics = phase.topics.map((t, i) => (i === topicIndex ? { ...t, done } : t));
  await updateDoc(phaseDoc(uid, phase.id), { topics });
}

export async function setGatePassed(
  uid: string,
  phaseId: number,
  gatePassed: boolean,
): Promise<void> {
  await updateDoc(phaseDoc(uid, phaseId), { gatePassed });
}

// ---- Meta ----

export function subscribeMeta(
  uid: string,
  onData: (meta: Meta | null) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    metaDoc(uid),
    (snap) => onData(snap.exists() ? (snap.data() as Meta) : null),
    (err) => onError(err),
  );
}

export async function getMeta(uid: string): Promise<Meta | null> {
  const snap = await getDoc(metaDoc(uid));
  return snap.exists() ? (snap.data() as Meta) : null;
}

// ---- Weekly reviews ----

export async function addReview(uid: string, review: NewWeeklyReview): Promise<void> {
  // Use a client-generated doc via setDoc(doc(col)) to keep the return typed.
  const ref = doc(reviewsCol(uid));
  await setDoc(ref, {
    stalled: review.stalled,
    nextObjective: review.nextObjective,
    createdAt: serverTimestamp(),
  });
}

export function subscribeReviews(
  uid: string,
  onData: (reviews: WeeklyReview[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const q = query(reviewsCol(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const reviews: WeeklyReview[] = snap.docs.map((d) => {
        const data = d.data() as {
          stalled?: string;
          nextObjective?: string;
          createdAt?: Timestamp | null;
        };
        const created =
          data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now();
        return {
          id: d.id,
          stalled: data.stalled ?? '',
          nextObjective: data.nextObjective ?? '',
          createdAt: created,
        };
      });
      onData(reviews);
    },
    (err) => onError(err),
  );
}
