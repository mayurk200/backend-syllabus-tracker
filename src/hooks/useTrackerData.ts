import { useEffect, useState } from 'react';
import {
  seedIfEmpty,
  subscribeActivity,
  subscribeMeta,
  subscribePhases,
  subscribeWeeks,
} from '../lib/db';
import type {
  ActivityEvent,
  Meta,
  Phase,
  TrackId,
  WeekEntry,
  WeekStatusMap,
} from '../types';

/** How much of the event log the dashboard and review pages keep in memory. */
const ACTIVITY_LIMIT = 200;

interface TrackerData {
  phases: Phase[];
  meta: Meta | null;
  weeks: WeekEntry[];
  weekStatus: WeekStatusMap;
  activity: ActivityEvent[];
  loading: boolean;
  error: string | null;
}

/**
 * Seeds both tracks on first load (once), then subscribes to the active
 * track's phases and meta plus the GATE week timeline — all live from
 * Firestore. Nothing is read from the local seed files after seeding.
 */
export function useTrackerData(uid: string | null, track: TrackId): TrackerData {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [weeks, setWeeks] = useState<WeekEntry[]>([]);
  const [weekStatus, setWeekStatus] = useState<WeekStatusMap>({});
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPhases([]);
    setActivity([]);

    const unsubs: Array<() => void> = [];

    seedIfEmpty(uid)
      .then(() => {
        if (cancelled) return;
        unsubs.push(
          subscribePhases(
            uid,
            track,
            (p) => {
              setPhases(p);
              setLoading(false);
            },
            (e) => setError(e.message),
          ),
        );
        unsubs.push(subscribeMeta(uid, track, setMeta, (e) => setError(e.message)));
        unsubs.push(
          subscribeWeeks(
            uid,
            (w, s) => {
              setWeeks(w);
              setWeekStatus(s);
            },
            (e) => setError(e.message),
          ),
        );
        unsubs.push(
          subscribeActivity(uid, track, ACTIVITY_LIMIT, setActivity, (e) =>
            setError(e.message),
          ),
        );
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      });

    return () => {
      cancelled = true;
      for (const u of unsubs) u();
    };
  }, [uid, track]);

  return { phases, meta, weeks, weekStatus, activity, loading, error };
}
