import { useEffect, useState } from 'react';
import {
  seedIfEmpty,
  subscribeMeta,
  subscribePhases,
} from '../lib/db';
import type { Meta, Phase } from '../types';

interface TrackerData {
  phases: Phase[];
  meta: Meta | null;
  loading: boolean;
  error: string | null;
}

/**
 * Seeds on first load (once) then subscribes to phases + meta in real time.
 */
export function useTrackerData(uid: string | null): TrackerData {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const unsubs: Array<() => void> = [];

    seedIfEmpty(uid)
      .then(() => {
        if (cancelled) return;
        unsubs.push(
          subscribePhases(
            uid,
            (p) => {
              setPhases(p);
              setLoading(false);
            },
            (e) => setError(e.message),
          ),
        );
        unsubs.push(subscribeMeta(uid, setMeta, (e) => setError(e.message)));
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
  }, [uid]);

  return { phases, meta, loading, error };
}
