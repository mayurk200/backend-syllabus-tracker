import { useState } from 'react';
import type { BacklogItem, Phase, TrackDef, WeekEntry } from '../types';
import { backlogHours, buildBacklog } from '../lib/backlog';
import { Corners } from './Corners';
import { PageHead } from './PageHead';

interface BacklogProps {
  track: TrackDef;
  phases: Phase[];
  weeks: WeekEntry[];
  onSelectPhase: (phaseId: number) => void;
  onOpenTimeline: () => void;
}

const ACCENT = '#5980a6';
const RED = '#a03c3c';
const AMBER = '#9a7b3f';

type Filter = 'all' | 'open' | 'rescheduled' | 'late';

function fmtDate(ms: number | null): string {
  if (ms === null) return '—';
  return new Date(ms).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

function daysAgo(ms: number | null, now: number): string {
  if (ms === null) return 'no date';
  const d = Math.floor((now - ms) / 86_400_000);
  if (d <= 0) return 'today';
  if (d === 1) return '1 day late';
  if (d < 14) return `${d} days late`;
  return `${Math.floor(d / 7)} weeks late`;
}

/**
 * Everything that slipped, oldest first. Nothing here is editable — each row
 * links to the page where the work actually gets ticked, so there is only ever
 * one place to complete something.
 */
export function Backlog({
  track,
  phases,
  weeks,
  onSelectPhase,
  onOpenTimeline,
}: BacklogProps): JSX.Element {
  const [chosen, setFilter] = useState<Filter>('open');
  const now = Date.now();

  const all = buildBacklog(track.id, phases, weeks, now);
  // The rescheduled chip only exists while something is rescheduled. Ticking
  // the last of it would otherwise strand you on a filter with no button to
  // leave by.
  const hasRescheduled = all.some((i) => i.rescheduled);
  const filter: Filter = chosen === 'rescheduled' && !hasRescheduled ? 'open' : chosen;

  const items = all.filter((i) => {
    if (filter === 'open') return !i.completedLate && !i.rescheduled;
    if (filter === 'rescheduled') return i.rescheduled;
    if (filter === 'late') return i.completedLate;
    return true;
  });

  const weeksMissed = all.filter((i) => i.kind === 'week' && !i.rescheduled).length;
  const weeksMoved = all.filter((i) => i.kind === 'week' && i.rescheduled).length;
  const caughtUp = all.filter((i) => i.completedLate).length;
  const hours = backlogHours(all);

  const filters: Array<{ id: Filter; label: string }> = [
    { id: 'open', label: 'Still open' },
    ...(hasRescheduled ? [{ id: 'rescheduled' as Filter, label: 'Rescheduled' }] : []),
    { id: 'late', label: 'Caught up late' },
    { id: 'all', label: 'Everything' },
  ];

  const tiles: Array<{ label: string; value: string; colour?: string }> = [
    { label: 'Outstanding', value: `${hours}h`, colour: RED },
    ...(track.id === 'gate'
      ? [
          { label: 'Weeks missed', value: String(weeksMissed) },
          { label: 'Rescheduled', value: String(weeksMoved), colour: AMBER },
        ]
      : [{ label: 'Items', value: String(all.length) }]),
    { label: 'Caught up late', value: String(caughtUp), colour: ACCENT },
  ];

  const open = (item: BacklogItem): void => {
    if (item.unitId !== undefined) onSelectPhase(item.unitId);
    else if (item.weekId) onOpenTimeline();
  };

  return (
    <div className="space-y-5">
      <PageHead
        kicker={track.name}
        title="Backlog"
        meta={
          track.id === 'gate'
            ? `${weeksMissed} weeks missed · ${hours}h outstanding`
            : `${hours}h outstanding`
        }
      />

      {all.length === 0 ? (
        <div className="blueprint p-4">
          <Corners />
          <div className="k mb-1.5" style={{ color: ACCENT }}>
            Nothing behind
          </div>
          <p
            style={{ font: '400 12.5px/1.6 var(--font-body)', color: 'rgba(29,31,32,.7)' }}
          >
            {track.id === 'gate'
              ? 'No campaign week has closed with work still open.'
              : `Nothing is left unticked in a ${track.unitLabel.toLowerCase()} you have already moved past.`}
          </p>
        </div>
      ) : (
        <>
          <div
            className="grid gap-px border"
            style={{
              gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 1fr))`,
              background: 'rgba(29,31,32,.35)',
              borderColor: 'rgba(29,31,32,.35)',
            }}
          >
            {tiles.map((t) => (
              <div key={t.label} className="bg-bg p-3">
                <div className="k">{t.label}</div>
                <div style={{ font: '600 27px/1.1 var(--font-heading)', color: t.colour }}>
                  {t.value}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((f) => {
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

          <div style={{ borderTop: '1px solid rgba(29,31,32,.35)' }}>
            {items.length === 0 && (
              <div className="k py-4" style={{ letterSpacing: '.04em' }}>
                {/* Everything behind can be rescheduled at once, which empties
                    the default filter while the page still has rows in it. */}
                {filter === 'open' && weeksMoved > 0
                  ? `Nothing still open — ${weeksMoved} ${weeksMoved === 1 ? 'week is' : 'weeks are'} rescheduled.`
                  : 'Nothing in this filter.'}
              </div>
            )}
            {items.map((item) => {
              const isWeek = item.kind === 'week';
              return (
                <button
                  key={item.id}
                  onClick={() => open(item)}
                  className="flex w-full items-start gap-3 py-2.5 text-left"
                  style={{ borderBottom: '1px solid rgba(29,31,32,.14)' }}
                >
                  <span
                    className="mt-1 h-2 w-2 flex-none"
                    style={{
                      background: item.completedLate
                        ? ACCENT
                        : item.rescheduled
                          ? AMBER
                          : RED,
                      opacity: isWeek ? 1 : 0.45,
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className="block"
                      style={{
                        font: isWeek
                          ? '600 13px/1.4 var(--font-body)'
                          : '400 13px/1.45 var(--font-body)',
                      }}
                    >
                      {item.title}
                    </span>
                    <span
                      className="mt-0.5 block"
                      style={{
                        font: '400 11.5px/1.5 var(--font-body)',
                        color: 'rgba(29,31,32,.55)',
                      }}
                    >
                      {item.detail}
                    </span>
                  </span>
                  <span className="flex-none text-right">
                    <span
                      className="k block"
                      style={{
                        color: item.completedLate
                          ? ACCENT
                          : item.rescheduled
                            ? AMBER
                            : RED,
                      }}
                    >
                      {item.completedLate
                        ? 'caught up'
                        : item.rescheduled
                          ? 'rescheduled'
                          : daysAgo(item.missedAt, now)}
                    </span>
                    <span className="k mt-1 block">
                      {item.hours ? `${item.hours}h` : ''}{' '}
                      {item.missedAt !== null &&
                        `${item.rescheduled ? 'was due ' : ''}${fmtDate(item.missedAt)}`}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <p
            className="k"
            style={{ letterSpacing: '.04em', lineHeight: 1.6, textTransform: 'none' }}
          >
            {track.id === 'gate'
              ? 'This track is dated, so the calendar decides what is behind: a week is marked missed once it closes with study days still unticked, and that stays on the record even after you finish the work — which is why rows can read "caught up". Subjects are studied in campaign-week order, so nothing is behind merely for sitting earlier in the syllabus than something you have ticked. Drag a missed week onto a free slot on the Timeline and it reads "rescheduled" instead: it has a date to be done on again and stops counting against the outstanding hours, though the original slip stays listed. Miss the new slot too and it goes back to being late. Tick the work on the Timeline or in the subject; both update each other.'
              : `This track has no dates, so being behind is positional: anything unticked in a ${track.unitLabel.toLowerCase()} you have already moved past. Tick it and it leaves this list.`}
          </p>
        </>
      )}
    </div>
  );
}
