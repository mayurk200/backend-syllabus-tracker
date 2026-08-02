import { useState } from 'react';
import type { ActivityEvent, Meta, Phase, TrackDef, WeeklyReview } from '../types';
import { hoursLogged, isPhaseComplete, startOfWeek } from '../types';

interface ReviewsProps {
  reviews: WeeklyReview[];
  activity: ActivityEvent[];
  phases: Phase[];
  meta: Meta | null;
  track: TrackDef;
  onOpenReview: () => void;
}

type Filter = 'all' | 'missed' | 'gate';

const ACCENT = '#5980a6';
const WEEKS_SHOWN = 14;
const ROWS_SHOWN = 8;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All weeks' },
  { id: 'missed', label: 'Missed target' },
  { id: 'gate', label: 'Gate weeks' },
];

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

/** Hours and gate count per calendar week, keyed by the week's Monday. */
function weeklyTotals(activity: ActivityEvent[]): Map<number, { hours: number; gates: number }> {
  const map = new Map<number, { hours: number; gates: number }>();
  for (const e of activity) {
    const key = startOfWeek(e.at);
    const bucket = map.get(key) ?? { hours: 0, gates: 0 };
    bucket.hours += e.hours;
    if (e.kind === 'gate' && e.hours === 0 && e.label.startsWith('Gate passed')) {
      bucket.gates += 1;
    }
    map.set(key, bucket);
  }
  return map;
}

/** The honest log — every week you wrote down, as one row. */
export function Reviews({
  reviews,
  activity,
  phases,
  meta,
  track,
  onOpenReview,
}: ReviewsProps): JSX.Element {
  const [filter, setFilter] = useState<Filter>('all');
  const [expanded, setExpanded] = useState(false);

  const now = Date.now();
  const totals = weeklyTotals(activity);
  const target = meta?.targetHoursPerWeek ?? 0;
  const gatesPassed = phases.filter(isPhaseComplete).length;
  const totalLogged = phases.reduce((sum, p) => sum + hoursLogged(p), 0);

  // The pace strip: the last N calendar weeks up to this one.
  const thisWeek = startOfWeek(now);
  const pace = Array.from({ length: WEEKS_SHOWN }, (_, i) => {
    const start = thisWeek - (WEEKS_SHOWN - 1 - i) * 7 * 86_400_000;
    return { start, hours: Math.max(0, Math.round((totals.get(start)?.hours ?? 0) * 10) / 10) };
  });
  const peak = Math.max(1, target, ...pace.map((p) => p.hours));

  const rows = reviews
    .map((r) => {
      const start = startOfWeek(r.createdAt);
      const bucket = totals.get(start);
      return {
        review: r,
        start,
        hours: Math.max(0, Math.round((bucket?.hours ?? 0) * 10) / 10),
        gates: bucket?.gates ?? 0,
      };
    })
    .filter((row) => {
      if (filter === 'missed') return target > 0 && row.hours < target;
      if (filter === 'gate') return row.gates > 0;
      return true;
    });

  const visible = expanded ? rows : rows.slice(0, ROWS_SHOWN);

  return (
    <div className="space-y-5">
      <div
        className="flex flex-wrap items-baseline justify-between gap-2 pb-3.5"
        style={{ borderBottom: '1px solid var(--ink)' }}
      >
        <div style={{ font: '600 26px/1 var(--font-heading)' }}>Reviews</div>
        <span className="k">
          {reviews.length} weeks · {totalLogged}h · {gatesPassed} gates
        </span>
      </div>

      {/* filters — a rail on desktop, a row on mobile */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="btn-line"
              style={{
                height: 30,
                paddingLeft: 14,
                paddingRight: 14,
                background: active ? 'rgba(89,128,166,.10)' : 'transparent',
                borderColor: active ? ACCENT : undefined,
                color: active ? ACCENT : undefined,
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* pace — real hours per week from the activity log */}
      <div>
        <div className="k mb-2">
          Pace · last {WEEKS_SHOWN} weeks{target ? ` · target ${target}h` : ''}
        </div>
        <div
          className="relative flex h-20 items-end gap-1.5"
          style={{ borderBottom: '1px solid rgba(29,31,32,.35)' }}
        >
          {target > 0 && (
            <div
              className="pointer-events-none absolute inset-x-0"
              style={{
                bottom: `${(target / peak) * 100}%`,
                borderTop: '1px dashed rgba(29,31,32,.4)',
              }}
            />
          )}
          {pace.map((p) => (
            <div
              key={p.start}
              className="flex-1"
              style={{
                height: `${Math.round((p.hours / peak) * 100)}%`,
                minHeight: p.hours > 0 ? 2 : 0,
                background:
                  target > 0 && p.hours < target ? 'rgba(29,31,32,.28)' : ACCENT,
              }}
              title={`${fmtDate(p.start)} · ${p.hours}h`}
            />
          ))}
        </div>
      </div>

      {/* the log */}
      <div className="min-w-0 overflow-x-auto">
        <div style={{ minWidth: 640 }}>
          <div
            className="k grid gap-x-4 py-2.5"
            style={{
              gridTemplateColumns: '90px 60px 60px 1fr 1fr',
              borderBottom: '1px solid rgba(29,31,32,.35)',
            }}
          >
            <span>Date</span>
            <span>Week</span>
            <span>Hours</span>
            <span>What stalled</span>
            <span>Next objective</span>
          </div>

          {visible.length === 0 && (
            <div className="k py-4" style={{ letterSpacing: '.04em' }}>
              {reviews.length === 0
                ? 'No reviews yet — the log starts when you write one.'
                : 'No weeks match this filter.'}
            </div>
          )}

          {visible.map((row, i) => (
            <div
              key={row.review.id}
              className="grid items-baseline gap-x-4 py-2.5"
              style={{
                gridTemplateColumns: '90px 60px 60px 1fr 1fr',
                borderBottom: '1px solid rgba(29,31,32,.14)',
              }}
            >
              <span style={{ font: '500 13px var(--font-body)' }}>
                {fmtDate(row.review.createdAt)}
              </span>
              <span className="k">W{rows.length - i}</span>
              <span
                className="k"
                style={{
                  color: target > 0 && row.hours < target ? '#a03c3c' : undefined,
                }}
              >
                {row.hours}h
              </span>
              <span style={{ font: '400 13px/1.45 var(--font-body)' }}>
                {row.review.stalled || '—'}
              </span>
              <span
                style={{ font: '400 13px/1.45 var(--font-body)', color: '#4a6c8c' }}
              >
                {row.review.nextObjective || '—'}
                {row.review.previousDone === true && (
                  <span className="k ml-1.5" style={{ color: ACCENT }}>
                    did it
                  </span>
                )}
                {row.review.previousDone === false && (
                  <span className="k ml-1.5" style={{ color: '#a03c3c' }}>
                    didn't
                  </span>
                )}
              </span>
            </div>
          ))}

          {rows.length > ROWS_SHOWN && (
            <button className="k pt-3" onClick={() => setExpanded(!expanded)}>
              {expanded ? '− collapse' : `+ ${rows.length - ROWS_SHOWN} earlier weeks`}
            </button>
          )}
        </div>
      </div>

      <button className="btn-solid" style={{ maxWidth: 260 }} onClick={onOpenReview}>
        Write this week's review
      </button>

      <p
        className="k"
        style={{ letterSpacing: '.04em', lineHeight: 1.6, textTransform: 'none' }}
      >
        Hours come from the {track.shortName} activity log — every subtopic you tick
        writes its hours with a timestamp, so this chart is a record, not an estimate.
      </p>
    </div>
  );
}
