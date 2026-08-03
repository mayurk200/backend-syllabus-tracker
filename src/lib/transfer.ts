import type {
  ActivityEvent,
  Meta,
  Phase,
  TrackId,
  WeekEntry,
  WeekStatus,
  WeekStatusMap,
  WeeklyReview,
} from '../types';

/**
 * Taking the tracker out and putting it back.
 *
 * There is no login, so there is no account to recover: the exported file is
 * the only copy of a campaign that runs for 27 weeks. Both directions live
 * here, pure and side-effect free, so the shape written is the shape read and
 * both can be tested without touching Firestore.
 */

export interface TrackerExport {
  exportedAt: string;
  /** Bumped when the shape changes in a way an older file would not satisfy. */
  version: number;
  track: TrackId;
  meta: Meta | null;
  phases: Phase[];
  /** GATE only — the campaign calendar, with each week's stored status. */
  weeks?: Array<WeekEntry & { status: WeekStatus | null }>;
  reviews: WeeklyReview[];
  activity: ActivityEvent[];
}

export const EXPORT_VERSION = 1;

export function buildExport(args: {
  track: TrackId;
  meta: Meta | null;
  phases: Phase[];
  weeks: WeekEntry[];
  weekStatus: WeekStatusMap;
  reviews: WeeklyReview[];
  activity: ActivityEvent[];
  now?: Date;
}): TrackerExport {
  const { track, meta, phases, weeks, weekStatus, reviews, activity } = args;
  return {
    exportedAt: (args.now ?? new Date()).toISOString(),
    version: EXPORT_VERSION,
    track,
    meta,
    phases,
    ...(track === 'gate'
      ? { weeks: weeks.map((w) => ({ ...w, status: weekStatus[w.id] ?? null })) }
      : {}),
    reviews,
    activity,
  };
}

export function exportFilename(track: TrackId, now = new Date()): string {
  return `${track}-tracker-${now.toISOString().slice(0, 10)}.json`;
}

export type ParseResult =
  | { ok: true; data: TrackerExport }
  | { ok: false; error: string };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Read a file the app itself wrote. Deliberately strict about the things that
 * would silently corrupt a restore — the wrong track, a missing unit list, a
 * week with no days — and relaxed about everything else, since a file from an
 * older build should still be worth more than nothing.
 */
export function parseImport(text: string, expected: TrackId): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not JSON.' };
  }
  if (!isRecord(raw)) return { ok: false, error: 'That file is not a tracker export.' };

  const track = raw.track;
  if (track !== 'gate' && track !== 'backend') {
    return { ok: false, error: 'That file does not say which track it belongs to.' };
  }
  if (track !== expected) {
    return {
      ok: false,
      error: `That file is a ${track} export. Switch to the ${track} track and import it there.`,
    };
  }

  if (!Array.isArray(raw.phases) || raw.phases.length === 0) {
    return { ok: false, error: 'That file has no units in it.' };
  }
  const phases = raw.phases.filter(
    (p): p is Phase => isRecord(p) && typeof p.id === 'number' && Array.isArray(p.topics),
  );
  if (phases.length !== raw.phases.length) {
    return { ok: false, error: 'Some units in that file are malformed.' };
  }

  let weeks: TrackerExport['weeks'];
  if (track === 'gate') {
    if (!Array.isArray(raw.weeks) || raw.weeks.length === 0) {
      return { ok: false, error: 'That file has no campaign weeks in it.' };
    }
    const ok = raw.weeks.every(
      (w) => isRecord(w) && typeof w.id === 'string' && Array.isArray(w.days),
    );
    if (!ok) return { ok: false, error: 'Some weeks in that file are malformed.' };
    weeks = raw.weeks as TrackerExport['weeks'];
  }

  const list = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

  return {
    ok: true,
    data: {
      exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : '',
      version: typeof raw.version === 'number' ? raw.version : 0,
      track,
      meta: isRecord(raw.meta) ? (raw.meta as unknown as Meta) : null,
      phases,
      ...(weeks ? { weeks } : {}),
      reviews: list<WeeklyReview>(raw.reviews).filter((r) => typeof r.id === 'string'),
      activity: list<ActivityEvent>(raw.activity).filter((a) => typeof a.id === 'string'),
    },
  };
}

/** One line describing what a parsed file will restore, for the confirm step. */
export function describeImport(data: TrackerExport): string {
  const bits = [
    `${data.phases.length} units`,
    ...(data.weeks ? [`${data.weeks.length} weeks`] : []),
    `${data.reviews.length} reviews`,
    `${data.activity.length} logged events`,
  ];
  const when = data.exportedAt ? ` exported ${data.exportedAt.slice(0, 10)}` : '';
  return `${bits.join(' · ')}${when}`;
}
