import { useEffect, useState } from 'react';
import type { TrackDef, TrackId } from '../types';
import { TRACKS } from '../types';

export type Tab =
  | 'dashboard'
  | 'progress'
  | 'syllabus'
  | 'timeline'
  | 'backlog'
  // Flagged subtopics. Distinct from 'reviews' (the weekly review log) and
  // 'review' (writing one) — same word, unrelated features.
  | 'marked'
  | 'reviews'
  | 'review'
  | 'profile';

interface TopNavProps {
  tab: Tab;
  track: TrackDef;
  inDetail: boolean;
  backlogCount: number;
  markedCount: number;
  onSelect: (tab: Tab) => void;
  onSelectTrack: (track: TrackId) => void;
}

const EXAM_ISO = '2027-02-06T09:30:00';

const PAGES: Array<{ id: Tab; name: string; gateOnly?: boolean }> = [
  { id: 'dashboard', name: 'Dashboard' },
  { id: 'progress', name: 'Progress' },
  { id: 'syllabus', name: 'Syllabus' },
  { id: 'timeline', name: 'Timeline', gateOnly: true },
  { id: 'backlog', name: 'Backlog' },
  { id: 'marked', name: 'Marked' },
  { id: 'reviews', name: 'Reviews' },
  { id: 'profile', name: 'Profile' },
];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Live countdown to the first exam session, ticking every second. */
function useCountdown(): string {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = Math.max(0, new Date(EXAM_ISO).getTime() - now);
  if (remaining === 0) return 'exam window';
  const days = Math.floor(remaining / 86_400_000);
  const hrs = Math.floor((remaining % 86_400_000) / 3_600_000);
  const mins = Math.floor((remaining % 3_600_000) / 60_000);
  const secs = Math.floor((remaining % 60_000) / 1000);
  return `${days}d ${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

/**
 * The sticky header: brand, the pages, the track switcher and the live
 * countdown. Replaces the sidebar shell — on mobile it keeps only the brand
 * and the switcher, since the bottom tab bar carries navigation there.
 */
export function TopNav({
  tab,
  track,
  inDetail,
  backlogCount,
  markedCount,
  onSelect,
  onSelectTrack,
}: TopNavProps): JSX.Element {
  const countdown = useCountdown();
  const pages = PAGES.filter((p) => !p.gateOnly || track.id === 'gate');

  return (
    <header
      className="sticky top-0 z-20"
      style={{ background: 'var(--bg)', borderBottom: '1px solid var(--ink)' }}
    >
      <div className="mx-auto flex h-16 max-w-[1160px] items-center gap-4 px-4 md:gap-7 md:px-8">
        <div className="flex flex-none items-center gap-3">
          <div
            className="bx grid h-[26px] w-[26px] place-items-center"
            style={{
              font: '600 11px var(--font-heading)',
              letterSpacing: '.06em',
              color: 'var(--accent-700)',
            }}
          >
            GT
          </div>
          <span
            className="hidden sm:inline"
            style={{ font: '600 16px/1 var(--font-heading)', letterSpacing: '.12em' }}
          >
            TRACKER
          </span>
        </div>

        <nav className="hidden flex-1 gap-0.5 md:flex">
          {pages.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`topnav-link ${tab === p.id && !inDetail ? 'active' : ''}`}
            >
              {p.name}
              {p.id === 'backlog' && backlogCount > 0 && (
                <span className="k ml-1.5" style={{ color: '#a03c3c' }}>
                  {backlogCount}
                </span>
              )}
              {p.id === 'marked' && markedCount > 0 && (
                <span className="k ml-1.5" style={{ color: '#9a7b3f' }}>
                  {markedCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex flex-none items-center gap-3 md:gap-[18px]">
          {/* track switcher */}
          <div className="flex" style={{ border: '1px solid var(--divider-strong)' }}>
            {TRACKS.map((t) => {
              const active = t.id === track.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTrack(t.id)}
                  className="px-2.5 py-1.5"
                  title={t.optional ? `${t.name} — optional track` : t.name}
                  style={{
                    background: active ? 'var(--accent)' : 'transparent',
                    // An optional track is reachable but not equal: when it is
                    // not the one you are on it sits back a step, so the
                    // switcher shows which plan is actually being run.
                    color: active
                      ? '#fff'
                      : t.optional
                        ? 'rgba(29,31,32,.4)'
                        : 'rgba(29,31,32,.6)',
                    font: '600 10px var(--font-heading)',
                    letterSpacing: '.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {t.shortName}
                  {t.optional && (
                    <span
                      style={{ marginLeft: 4, opacity: active ? 0.75 : 0.6, fontWeight: 400 }}
                    >
                      opt
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {track.id === 'gate' && (
            <div className="hidden text-right lg:block">
              <div className="k">Exam 6 Feb 2027</div>
              <div
                style={{
                  font: '600 15px/1 var(--font-heading)',
                  fontVariantNumeric: 'tabular-nums',
                  marginTop: 4,
                }}
              >
                {countdown}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
