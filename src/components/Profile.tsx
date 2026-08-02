import type { Meta, Phase, TrackDef, WeeklyReview } from '../types';
import { hoursLogged, isPhaseComplete } from '../types';
import { Corners } from './Corners';

interface ProfileProps {
  phases: Phase[];
  meta: Meta | null;
  track: TrackDef;
  reviews: WeeklyReview[];
  onOpenReview: () => void;
  onOpenReviews: () => void;
  onExport: () => void;
}

const ACCENT = '#5980a6';

function weeksSince(startDate: string | undefined): number {
  if (!startDate) return 0;
  const start = new Date(startDate).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.max(1, Math.floor((Date.now() - start) / (7 * 86_400_000)));
}

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

export function Profile({
  phases,
  meta,
  track,
  reviews,
  onOpenReview,
  onOpenReviews,
  onExport,
}: ProfileProps): JSX.Element {
  const gatesPassed = phases.filter(isPhaseComplete).length;
  const totalHours = phases.reduce((sum, p) => sum + hoursLogged(p), 0);
  const week = weeksSince(meta?.startDate);

  const settings: Array<{ label: string; value: string; onClick?: () => void }> = [
    { label: 'Weekly target', value: meta ? `${meta.targetHoursPerWeek}h` : '—' },
    { label: 'Start date', value: meta?.startDate ?? '—' },
    { label: 'Track', value: track.name },
    { label: 'Data', value: `Firestore · users/me/tracks/${track.id}` },
    { label: 'Export', value: 'JSON', onClick: onExport },
  ];

  return (
    <div className="blueprint p-4">
      <Corners />
      <div className="mb-4 flex items-baseline justify-between">
        <span className="h">PROFILE</span>
        <span className="k">{meta ? `since ${meta.startDate}` : ''}</span>
      </div>

      {/* stats */}
      <div
        className="mb-[18px] grid grid-cols-3 gap-px border"
        style={{ background: 'rgba(29,31,32,.35)', borderColor: 'rgba(29,31,32,.35)' }}
      >
        <div className="bg-bg p-3">
          <div className="k">Gates</div>
          <div style={{ font: '600 27px/1.1 var(--font-heading)', color: ACCENT }}>
            {gatesPassed}
          </div>
        </div>
        <div className="bg-bg p-3">
          <div className="k">Hours</div>
          <div style={{ font: '600 27px/1.1 var(--font-heading)' }}>{totalHours}</div>
          <div className="k">of {track.totalHours}</div>
        </div>
        <div className="bg-bg p-3">
          <div className="k">Weeks</div>
          <div style={{ font: '600 27px/1.1 var(--font-heading)' }}>{week}</div>
        </div>
      </div>

      <div className="md:grid md:grid-cols-2 md:items-start md:gap-7">
      {/* weekly reviews */}
      <div>
      <div className="k mb-2">Weekly reviews</div>
      <div
        className="mb-[18px] flex flex-col"
        style={{ borderTop: '1px solid rgba(29,31,32,.35)' }}
      >
        {reviews.length === 0 && (
          <div
            className="py-3"
            style={{ font: '400 12px var(--font-body)', color: 'rgba(29,31,32,.5)' }}
          >
            No reviews yet. Write your first one below.
          </div>
        )}
        {reviews.slice(0, 5).map((r) => (
          <div
            key={r.id}
            className="py-2.5"
            style={{ borderBottom: '1px solid rgba(29,31,32,.14)' }}
          >
            <div className="k">{fmtDate(r.createdAt)}</div>
            {r.stalled && (
              <div style={{ font: '400 12px/1.45 var(--font-body)', marginTop: 4 }}>
                {r.stalled}
              </div>
            )}
            {r.nextObjective && (
              <div
                style={{
                  font: '400 12px/1.45 var(--font-body)',
                  color: ACCENT,
                  marginTop: 2,
                }}
              >
                → {r.nextObjective}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mb-[18px] flex gap-2">
        <button className="btn-solid" onClick={onOpenReview}>
          Write this week's review
        </button>
        <button className="btn-line" style={{ width: 130 }} onClick={onOpenReviews}>
          Full log
        </button>
      </div>
      </div>

      {/* settings */}
      <div>
      <div className="k mb-2">Settings</div>
      <div style={{ borderTop: '1px solid rgba(29,31,32,.35)' }}>
        {settings.map((s) => {
          const content = (
            <>
              <span style={{ font: '500 13px var(--font-body)' }}>{s.label}</span>
              <span className="k">
                {s.value} {s.onClick ? '›' : ''}
              </span>
            </>
          );
          const style = {
            borderBottom: '1px solid rgba(29,31,32,.14)',
          } as const;
          return s.onClick ? (
            <button
              key={s.label}
              onClick={s.onClick}
              className="flex w-full items-baseline justify-between gap-2.5 py-2.5 text-left"
              style={style}
            >
              {content}
            </button>
          ) : (
            <div
              key={s.label}
              className="flex items-baseline justify-between gap-2.5 py-2.5"
              style={style}
            >
              {content}
            </div>
          );
        })}
      </div>
      </div>
      </div>
    </div>
  );
}
