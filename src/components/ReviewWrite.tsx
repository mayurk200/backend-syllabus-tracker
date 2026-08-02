import { useState } from 'react';
import type { ActivityEvent, Meta, NewWeeklyReview, WeeklyReview } from '../types';
import { hoursByDay, startOfWeek } from '../types';
import { Corners } from './Corners';

interface ReviewWriteProps {
  reviews: WeeklyReview[];
  activity: ActivityEvent[];
  meta: Meta | null;
  onSubmit: (review: NewWeeklyReview) => Promise<void>;
  onSetPreviousDone: (reviewId: string, done: boolean | null) => Promise<void>;
  onDone: () => void;
}

const ACCENT = '#5980a6';
const BARBG = 'rgba(29,31,32,.14)';
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function weeksSince(startDate: string | undefined): number {
  if (!startDate) return 0;
  const start = new Date(startDate).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.max(1, Math.floor((Date.now() - start) / (7 * 86_400_000)));
}

function fmtRange(startMs: number): string {
  const end = new Date(startMs + 6 * 86_400_000);
  const opts = { day: 'numeric', month: 'short' } as const;
  return `${new Date(startMs).toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/** The full-page weekly review — deliberately not a cramped modal. */
export function ReviewWrite({
  reviews,
  activity,
  meta,
  onSubmit,
  onSetPreviousDone,
  onDone,
}: ReviewWriteProps): JSX.Element {
  const [stalled, setStalled] = useState('');
  const [nextObjective, setNextObjective] = useState('');
  const [builtPct, setBuiltPct] = useState(70);
  const [saving, setSaving] = useState(false);
  const [busyPrev, setBusyPrev] = useState(false);

  const now = Date.now();
  const weekStart = startOfWeek(now);
  const dayHours = hoursByDay(activity, now);
  const weekHours = Math.round(dayHours.reduce((a, b) => a + b, 0) * 10) / 10;
  const peak = Math.max(1, ...dayHours);
  const target = meta?.targetHoursPerWeek ?? 0;
  const week = weeksSince(meta?.startDate);
  const last = reviews[0];

  const canSave = stalled.trim().length > 0 || nextObjective.trim().length > 0;

  const handleSubmit = async (): Promise<void> => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSubmit({
        stalled: stalled.trim(),
        nextObjective: nextObjective.trim(),
        builtPct,
        previousDone: null,
        createdAt: Date.now(),
      });
      setStalled('');
      setNextObjective('');
      onDone();
    } finally {
      setSaving(false);
    }
  };

  const handlePrev = async (done: boolean): Promise<void> => {
    if (!last || busyPrev) return;
    setBusyPrev(true);
    try {
      await onSetPreviousDone(last.id, last.previousDone === done ? null : done);
    } finally {
      setBusyPrev(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    resize: 'none',
    background: 'transparent',
    border: '1px solid var(--divider-strong)',
    padding: 12,
    font: '400 13px/1.5 var(--font-body)',
    color: 'var(--ink)',
    borderRadius: 0,
  };

  return (
    <div className="space-y-5">
      <div
        className="flex flex-wrap items-baseline justify-between gap-2 pb-3.5"
        style={{ borderBottom: '1px solid var(--ink)' }}
      >
        <div>
          <div className="k">
            {week ? `Week ${week} · ` : ''}
            {fmtRange(weekStart)}
          </div>
          <div style={{ font: '600 26px/1.05 var(--font-heading)', marginTop: 4 }}>
            Weekly review
          </div>
        </div>
        <span className="k">
          {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'} written
        </span>
      </div>

      <div className="grid gap-7 md:grid-cols-[1fr_320px]">
        {/* ── the writing ─────────────────────────────────────────────── */}
        <div className="flex min-w-0 flex-col gap-4">
          <div>
            <div className="k mb-1.5">What stalled?</div>
            <textarea
              value={stalled}
              onChange={(e) => setStalled(e.target.value)}
              rows={6}
              placeholder="Where did you get stuck, or drift into reading instead of building?"
              style={fieldStyle}
            />
          </div>

          <div>
            <div className="k mb-1.5">Next single objective</div>
            <textarea
              value={nextObjective}
              onChange={(e) => setNextObjective(e.target.value)}
              rows={3}
              placeholder="One concrete thing to build before the next review."
              style={fieldStyle}
            />
          </div>

          <div>
            <div className="k mb-1.5">Time split — drag to set</div>
            <div className="relative">
              <div className="bx flex h-5">
                <div style={{ flex: builtPct, background: ACCENT }} />
                <div style={{ flex: 100 - builtPct, background: BARBG }} />
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={builtPct}
                onChange={(e) => setBuiltPct(Number(e.target.value))}
                aria-label="Percent of the week spent building"
                className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
              />
            </div>
            <div className="k mt-1.5 flex justify-between">
              <span>Built {builtPct}%</span>
              <span>Read / watched {100 - builtPct}%</span>
            </div>
          </div>

          <div className="mt-2 flex gap-2.5">
            <button
              className="btn-solid"
              style={{ flex: 1 }}
              disabled={!canSave || saving}
              onClick={() => void handleSubmit()}
            >
              {saving ? 'Saving…' : 'Save review'}
            </button>
            <button className="btn-line" style={{ width: 140 }} onClick={onDone}>
              Discard
            </button>
          </div>
        </div>

        {/* ── last week + the week's real hours ───────────────────────── */}
        <div className="min-w-0">
          <div className="k mb-2">Last week said</div>
          {last ? (
            <div className="bx mb-5 p-3.5">
              <div className="k">{fmtDate(last.createdAt)}</div>
              {last.stalled && (
                <p style={{ font: '400 13px/1.45 var(--font-body)', marginTop: 6 }}>
                  {last.stalled}
                </p>
              )}
              {last.nextObjective && (
                <p
                  style={{
                    font: '400 13px/1.45 var(--font-body)',
                    color: '#4a6c8c',
                    marginTop: 4,
                  }}
                >
                  → {last.nextObjective}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  className="btn-line"
                  style={{
                    flex: 1,
                    height: 32,
                    borderColor: last.previousDone === true ? ACCENT : undefined,
                    color: last.previousDone === true ? ACCENT : undefined,
                  }}
                  disabled={busyPrev}
                  onClick={() => void handlePrev(true)}
                >
                  Did it
                </button>
                <button
                  className="btn-line"
                  style={{
                    flex: 1,
                    height: 32,
                    borderColor: last.previousDone === false ? '#a03c3c' : undefined,
                    color: last.previousDone === false ? '#a03c3c' : undefined,
                  }}
                  disabled={busyPrev}
                  onClick={() => void handlePrev(false)}
                >
                  Didn't
                </button>
              </div>
            </div>
          ) : (
            <div className="bx mb-5 p-3.5">
              <div className="k" style={{ letterSpacing: '.04em' }}>
                This is your first review. Nothing to answer for yet.
              </div>
            </div>
          )}

          <div className="k mb-2">
            Hours this week · {weekHours} of {target}h
          </div>
          <div
            className="flex h-[110px] items-end gap-1.5"
            style={{ borderBottom: '1px solid rgba(29,31,32,.35)' }}
          >
            {dayHours.map((h, i) => (
              <div
                key={i}
                className="flex-1"
                style={{
                  height: `${Math.round((h / peak) * 100)}%`,
                  minHeight: h > 0 ? 2 : 0,
                  background: 'rgba(89,128,166,.5)',
                }}
                title={`${h}h`}
              />
            ))}
          </div>
          <div className="mt-1.5 flex gap-1.5">
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="k flex-1 text-center">
                {d}
              </div>
            ))}
          </div>

          <div className="blueprint mt-5 p-3.5">
            <Corners />
            <div className="k mb-1.5">Why this matters</div>
            <p style={{ font: '400 12px/1.5 var(--font-body)', color: 'rgba(29,31,32,.6)' }}>
              The review is the only place the tracker asks you to be honest in prose.
              Hours and checkboxes are input; this is the week's verdict.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
