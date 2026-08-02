import type { Phase, TrackDef, TrackId } from '../types';
import { TRACKS, isPhaseComplete, topicCompletion } from '../types';

export type Tab =
  | 'dashboard'
  | 'progress'
  | 'syllabus'
  | 'timeline'
  | 'backlog'
  | 'reviews'
  | 'review'
  | 'profile';

interface SidebarProps {
  tab: Tab;
  track: TrackDef;
  phases: Phase[];
  conceptCount: number;
  backlogCount: number;
  selectedPhaseId: number | null;
  gatesPassed: number;
  totalHours: number;
  topicPct: number;
  reviewsCount: number;
  weeksPassed: number;
  onSelect: (tab: Tab) => void;
  onSelectTrack: (track: TrackId) => void;
  onSelectPhase: (phaseId: number) => void;
  onExport: () => void;
}

const ACCENT = '#5980a6';

/** One line under each track tile: what that track costs you. */
function trackMeta(t: TrackDef): string {
  const base = `${t.totalHours}h · ${t.unitCount} ${t.unitLabelPlural.toLowerCase()}`;
  return t.targetMarks ? `${base} · ${t.targetMarks} marks` : base;
}

/** Desktop-only left sidebar shell. Hidden on mobile. */
export function Sidebar({
  tab,
  track,
  phases,
  conceptCount,
  backlogCount,
  selectedPhaseId,
  gatesPassed,
  totalHours,
  topicPct,
  reviewsCount,
  weeksPassed,
  onSelect,
  onSelectTrack,
  onSelectPhase,
  onExport,
}: SidebarProps): JSX.Element {
  const inDetail = selectedPhaseId !== null;

  const nav: Array<{ id: Tab; name: string; count: string }> = [
    { id: 'dashboard', name: 'Dashboard', count: `${gatesPassed}/${track.unitCount}` },
    { id: 'progress', name: 'Progress', count: `${topicPct}%` },
    { id: 'syllabus', name: 'Syllabus', count: `${conceptCount}` },
    ...(track.id === 'gate'
      ? [{ id: 'timeline' as Tab, name: 'Timeline', count: `${weeksPassed}/28` }]
      : []),
    { id: 'backlog', name: 'Backlog', count: backlogCount ? `${backlogCount}` : '—' },
    { id: 'reviews', name: 'Reviews', count: `${reviewsCount}` },
    { id: 'profile', name: 'Profile', count: `${totalHours}h` },
  ];

  return (
    <aside
      className="sticky top-0 hidden h-dvh w-64 flex-none flex-col overflow-y-auto md:flex"
      style={{ borderRight: '1px solid var(--ink)' }}
    >
      <div className="p-4" style={{ borderBottom: '1px solid rgba(29,31,32,.35)' }}>
        <span className="h">TRACKER</span>
      </div>

      {/* track switcher — two tiles, the wireframe's 9a header */}
      <div className="p-3" style={{ borderBottom: '1px solid rgba(29,31,32,.35)' }}>
        <div className="k mb-1.5">Track</div>
        <div className="grid grid-cols-2 gap-1.5">
          {TRACKS.map((t) => {
            const active = t.id === track.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTrack(t.id)}
                className="bx p-2 text-left"
                style={{
                  background: active ? ACCENT : 'transparent',
                  color: active ? '#fff' : 'rgba(29,31,32,.65)',
                  borderColor: active ? ACCENT : undefined,
                }}
              >
                <div
                  style={{ font: '600 13px/1 var(--font-heading)', letterSpacing: '.06em' }}
                >
                  {t.shortName}
                </div>
              </button>
            );
          })}
        </div>
        <div className="k mt-2">{trackMeta(track)}</div>
      </div>

      {/* nav */}
      <div className="px-3 py-3" style={{ borderBottom: '1px solid rgba(29,31,32,.35)' }}>
        {nav.map((n) => {
          const active = tab === n.id && !inDetail;
          return (
            <button
              key={n.id}
              onClick={() => onSelect(n.id)}
              className="flex w-full items-center gap-2.5 px-2.5 py-2.5 text-left"
              style={{
                borderLeft: `2px solid ${active ? ACCENT : 'transparent'}`,
                color: active ? ACCENT : 'var(--ink)',
              }}
            >
              <span
                className="bx h-3.5 w-3.5 flex-none"
                style={{ borderColor: active ? ACCENT : undefined }}
              />
              <span className="flex-1" style={{ font: '500 13px var(--font-body)' }}>
                {n.name}
              </span>
              <span className="k" style={{ color: active ? ACCENT : undefined }}>
                {n.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* the units themselves — jump straight to any subject/phase */}
      <div className="px-3 py-3" style={{ borderBottom: '1px solid rgba(29,31,32,.35)' }}>
        <div className="k mb-1.5 flex justify-between">
          <span>{track.unitLabelPlural}</span>
          {track.targetMarks && <span>{track.targetMarks}M total</span>}
        </div>
        {phases.map((p) => {
          const active = selectedPhaseId === p.id;
          const passed = isPhaseComplete(p);
          return (
            <button
              key={p.id}
              onClick={() => onSelectPhase(p.id)}
              className="flex w-full items-center gap-2 px-0.5 py-1.5 text-left"
              title={`${p.title} — ${p.hours}h`}
            >
              <span
                className="k w-4 flex-none"
                style={{ color: active || passed ? ACCENT : undefined }}
              >
                {p.id}
              </span>
              <span
                className="min-w-0 flex-1 truncate"
                style={{
                  font: '400 12px var(--font-body)',
                  color: active ? ACCENT : 'var(--ink)',
                }}
              >
                {p.title}
              </span>
              {p.targetMarks ? (
                <span className="k flex-none">{p.targetMarks}</span>
              ) : null}
              <span
                className="h-[5px] w-[26px] flex-none"
                style={{ background: 'rgba(29,31,32,.14)' }}
              >
                <span
                  className="block h-full"
                  style={{
                    width: `${topicCompletion(p)}%`,
                    background: passed ? ACCENT : 'rgba(89,128,166,.7)',
                  }}
                />
              </span>
            </button>
          );
        })}
      </div>

      {/* actions */}
      <div className="flex flex-col gap-2 p-3">
        <button
          className="btn-solid"
          style={{ height: 34 }}
          onClick={() => onSelect('review')}
        >
          Weekly review
        </button>
        <button className="btn-line" style={{ height: 34 }} onClick={onExport}>
          Export JSON
        </button>
      </div>

      {/* account footer */}
      <div
        className="mt-auto flex items-center gap-2.5 px-4 py-3.5"
        style={{ borderTop: '1px solid var(--ink)' }}
      >
        <div className="bx h-7 w-7 flex-none" />
        <div className="min-w-0 flex-1">
          <div style={{ font: '500 13px var(--font-body)' }}>Profile</div>
          <div className="k">
            {gatesPassed} gates · {totalHours}/{track.totalHours}h · {topicPct}%
          </div>
        </div>
      </div>
    </aside>
  );
}
