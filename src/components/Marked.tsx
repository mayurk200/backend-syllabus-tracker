import { useState } from 'react';
import type { MarkedItem, Phase, TrackDef } from '../types';
import { collectMarked, markedHours } from '../types';
import { backendGloss } from '../data/backendSyllabus';
import { Corners } from './Corners';
import { PageHead } from './PageHead';

interface MarkedProps {
  track: TrackDef;
  phases: Phase[];
  onSelectPhase: (phaseId: number) => void;
  onUnmark: (item: MarkedItem) => Promise<void>;
  onClearAll: () => Promise<void>;
}

const ACCENT = '#5980a6';
const AMBER = '#9a7b3f';

type Filter = 'all' | 'shaky' | 'pending';

/**
 * Everything flagged to come back to.
 *
 * Two kinds of row live here and the distinction is the point of the page:
 * something ticked but marked is a weak spot — you did the work and would not
 * bet on it — while something unticked and marked is just work you singled out
 * to do next. The first is what a revision session should be built from, so it
 * gets its own filter and leads by default.
 *
 * Rows can be unmarked here, but not ticked: completion stays on the plan page
 * so there is only ever one place work gets closed.
 */
export function Marked({
  track,
  phases,
  onSelectPhase,
  onUnmark,
  onClearAll,
}: MarkedProps): JSX.Element {
  const [chosen, setFilter] = useState<Filter>('shaky');

  const all = collectMarked(phases);
  const shaky = all.filter((i) => i.done);
  const pending = all.filter((i) => !i.done);

  // Ticking or unmarking the last shaky row would otherwise strand you on a
  // filter with nothing in it and no obvious way back.
  const filter: Filter = chosen === 'shaky' && shaky.length === 0 ? 'all' : chosen;
  const items = filter === 'shaky' ? shaky : filter === 'pending' ? pending : all;

  const filters: Array<{ id: Filter; label: string; n: number }> = [
    { id: 'shaky', label: 'Done but shaky', n: shaky.length },
    { id: 'pending', label: 'Not done yet', n: pending.length },
    { id: 'all', label: 'Everything', n: all.length },
  ];

  const tiles = [
    { label: 'Marked', value: String(all.length), colour: AMBER },
    { label: 'Done but shaky', value: String(shaky.length), colour: AMBER },
    { label: 'Revision hours', value: `${markedHours(all)}h` },
  ];

  return (
    <div className="space-y-5">
      <PageHead
        kicker={track.name}
        title="Marked for review"
        meta={
          all.length === 0
            ? 'nothing marked'
            : `${all.length} marked · ${shaky.length} done but shaky · ${markedHours(all)}h`
        }
      />

      {all.length === 0 ? (
        <div className="blueprint p-4">
          <Corners />
          <div className="k mb-1.5" style={{ color: ACCENT }}>
            Nothing marked
          </div>
          <p style={{ font: '400 12.5px/1.6 var(--font-body)', color: 'rgba(29,31,32,.7)' }}>
            Open any {track.unitLabel.toLowerCase()}, expand a topic, and tap{' '}
            <strong>MARK</strong> beside a subtopic to flag it. Marking is separate from
            ticking, so the useful case is the one you have already done and still would
            not want to be asked about — those collect here as a revision list.
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

          <div className="flex flex-wrap items-center gap-2">
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
                  {f.label} {f.n > 0 && <span className="k ml-1">{f.n}</span>}
                </button>
              );
            })}
            <button
              onClick={() => void onClearAll()}
              className="btn-line ml-auto"
              style={{ height: 30, paddingLeft: 14, paddingRight: 14 }}
            >
              Clear all {all.length}
            </button>
          </div>

          <div style={{ borderTop: '1px solid rgba(29,31,32,.35)' }}>
            {items.length === 0 && (
              <div className="k py-4" style={{ letterSpacing: '.04em' }}>
                Nothing in this filter.
              </div>
            )}
            {items.map((item) => {
              const gloss = track.id === 'gate' ? null : backendGloss(item.name);
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 py-2.5"
                  style={{ borderBottom: '1px solid rgba(29,31,32,.14)' }}
                >
                  <span
                    className="mt-1.5 h-2 w-2 flex-none"
                    style={{ background: AMBER, opacity: item.done ? 1 : 0.4 }}
                  />
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => onSelectPhase(item.unitId)}
                  >
                    <span
                      className="block"
                      style={{ font: '400 13px/1.45 var(--font-body)' }}
                    >
                      {item.name}
                    </span>
                    {gloss && (
                      <span
                        className="mt-0.5 block"
                        style={{
                          font: '400 11.5px/1.5 var(--font-body)',
                          color: 'rgba(29,31,32,.55)',
                        }}
                      >
                        {gloss}
                      </span>
                    )}
                    <span className="k mt-1 block" style={{ letterSpacing: '.05em' }}>
                      {item.unitTitle} · {item.topicName}
                    </span>
                  </button>
                  <span className="flex-none text-right">
                    <span
                      className="k block"
                      style={{ color: item.done ? AMBER : 'rgba(29,31,32,.5)' }}
                    >
                      {item.done ? 'done but shaky' : 'not done'}
                    </span>
                    <span className="k mt-1 block">{item.hours}h</span>
                  </span>
                  <button
                    onClick={() => void onUnmark(item)}
                    className="k flex-none"
                    aria-label={`Unmark ${item.name}`}
                    style={{
                      border: '1px solid rgba(29,31,32,.2)',
                      padding: '3px 6px',
                      background: 'transparent',
                    }}
                  >
                    unmark
                  </button>
                </div>
              );
            })}
          </div>

          <p
            className="k"
            style={{ letterSpacing: '.04em', lineHeight: 1.6, textTransform: 'none' }}
          >
            Marking is independent of ticking, so a subtopic can be finished and still sit
            here — that is the case worth having, because it is the work you would fail a
            question on. Rows link back to the {track.unitLabel.toLowerCase()} they belong
            to; ticking still happens there, so completion has one home. Unmarking is the
            only edit this page makes.
          </p>
        </>
      )}
    </div>
  );
}
