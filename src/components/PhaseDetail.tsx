import { useMemo, useState } from 'react';
import type { Phase, TopicValue, TrackDef, ValueWeight } from '../types';
import {
  VALUE_WEIGHT_MEANING,
  criticalProgress,
  hoursLogged,
  isPhaseComplete,
  subtopicCompletion,
  topicHoursLogged,
} from '../types';
import { GATE_LEARN_FROM, GATE_SYLLABUS, chapterSource } from '../data/gateSyllabus';
import {
  BACKEND_LEARN_FROM,
  backendGloss,
  backendTopicSource,
} from '../data/backendSyllabus';
import type { ViewChapter } from './SyllabusParts';
import { ChapterBlock, LearnFromBlock, SourceLine } from './SyllabusParts';
import { PageHead } from './PageHead';

interface PhaseDetailProps {
  phase: Phase;
  phases: Phase[]; // for the pip track across all units
  track: TrackDef;
  onBack: () => void;
  onToggleTopic: (topicIndex: number, done: boolean) => Promise<void>;
  onToggleSubtopic: (
    topicIndex: number,
    subtopicIndex: number,
    done: boolean,
  ) => Promise<void>;
  onToggleMarked: (
    topicIndex: number,
    subtopicIndex: number,
    marked: boolean,
  ) => Promise<void>;
}

const ACCENT = '#5980a6';
const RED = '#a03c3c';
/** Marked for review — the same amber the backlog uses for "needs attention". */
const AMBER = '#9a7b3f';

/**
 * Band as a word and a colour, with no number beside it. A number here would
 * read as a measurement, and nothing measured these — the argument in `why` is
 * the whole of the evidence.
 */
const WEIGHT_COLOR: Record<ValueWeight, string> = {
  critical: RED,
  high: ACCENT,
  medium: 'rgba(29,31,32,.5)',
  optional: 'rgba(29,31,32,.32)',
};

function ValueBadge({ value }: { value: TopicValue }): JSX.Element {
  const color = WEIGHT_COLOR[value.weight];
  return (
    <span
      className="flex-none"
      title={VALUE_WEIGHT_MEANING[value.weight]}
      style={{
        font: '600 8.5px var(--font-heading)',
        letterSpacing: '.12em',
        textTransform: 'uppercase',
        color,
        border: `1px solid ${color}`,
        padding: '2px 4px',
        whiteSpace: 'nowrap',
      }}
    >
      {value.weight}
    </span>
  );
}

function NewFlag(): JSX.Element {
  return (
    <span
      className="flex-none"
      style={{
        font: '600 8.5px var(--font-heading)',
        letterSpacing: '.12em',
        color: RED,
        border: `1px solid ${RED}`,
        padding: '2px 4px',
      }}
    >
      NEW 2027
    </span>
  );
}

export function PhaseDetail({
  phase,
  phases,
  track,
  onBack,
  onToggleTopic,
  onToggleSubtopic,
  onToggleMarked,
}: PhaseDetailProps): JSX.Element {
  const [open, setOpen] = useState<number | null>(0);
  const isGate = track.id === 'gate';

  // On GATE the official syllabus is a different shape from the weekly plan, so
  // the full scope is worth showing open. On every other roadmap the checklist
  // above already is the syllabus, so it starts collapsed rather than repeating
  // itself — same section, sensible default.
  const [showReference, setShowReference] = useState(isGate);

  /** What to read for this unit. */
  const learn = isGate ? GATE_LEARN_FROM[phase.id] : BACKEND_LEARN_FROM[phase.title];

  /** Every chapter and concept in this unit, whichever roadmap it belongs to. */
  const chapters: ViewChapter[] = useMemo(() => {
    if (isGate) {
      const unit = GATE_SYLLABUS.find((u) => u.unitId === phase.id);
      if (!unit) return [];
      return unit.chapters.map((c) => ({
        name: c.name,
        official: c.official,
        source: chapterSource(phase.id, c.name),
        concepts: c.concepts.map((x) => ({
          name: x.name,
          gloss: x.gloss,
          isNew: x.isNew,
          dropped: x.dropped,
        })),
      }));
    }
    return phase.topics.map((t) => ({
      name: t.name,
      official: t.detail,
      source: backendTopicSource(phase.title, t.name),
      concepts: t.subtopics.map((s) => ({
        name: s.name,
        gloss: backendGloss(s.name),
        isNew: s.isNew,
      })),
    }));
  }, [isGate, phase]);

  const officialScope = isGate
    ? GATE_SYLLABUS.find((u) => u.unitId === phase.id)?.official
    : phase.description;
  const conceptTotal = chapters.reduce((s, c) => s + c.concepts.length, 0);

  const logged = hoursLogged(phase);
  const subsTotal = phase.topics.reduce((s, t) => s + t.subtopics.length, 0);
  const subsDone = phase.topics.reduce(
    (s, t) => s + t.subtopics.filter((x) => x.done).length,
    0,
  );
  const unitIndex = phases.findIndex((p) => p.id === phase.id) + 1;
  const complete = isPhaseComplete(phase);
  const scored = phase.topics.some((t) => t.value);
  const critical = criticalProgress(phase);

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="k"
        style={{ letterSpacing: '.1em', background: 'transparent' }}
      >
        ‹ back
      </button>

      {/* pip track across all units */}
      <div className="flex gap-1">
        {phases.map((p) => (
          <div
            key={p.id}
            className="h-1.5 flex-1"
            style={{
              background: isPhaseComplete(p)
                ? ACCENT
                : p.id === phase.id
                  ? 'rgba(89,128,166,.45)'
                  : 'rgba(29,31,32,.16)',
            }}
          />
        ))}
      </div>

      {/* ── head ──────────────────────────────────────────────────────── */}
      <PageHead
        kicker={`${track.unitLabel} ${unitIndex} of ${phases.length || track.unitCount}${
          phase.weeks ? ` · ${phase.weeks}` : ''
        }`}
        title={phase.title}
        meta={`${phase.hours}h · ${phase.topics.length} topics · ${subsTotal} subtopics${
          phase.targetMarks ? ` · ${phase.targetMarks} marks target` : ''
        }${critical.total > 0 ? ` · ${critical.total} critical topics` : ''}`}
      />

      <div className="grid gap-7 md:grid-cols-[380px_1fr] md:items-start">
        {/* ── gate + the two numbers ─────────────────────────────────── */}
        <div className="flex flex-col gap-4 md:sticky md:top-4">
          <div
            className="bx p-3.5"
            style={complete ? { borderColor: ACCENT } : undefined}
          >
            <div className="flex items-baseline justify-between">
              <span className="k" style={complete ? { color: ACCENT } : undefined}>
                {track.unitLabel} gate
              </span>
              <span className="k" style={complete ? { color: ACCENT } : undefined}>
                {complete ? '✓ complete' : `${subsDone}/${subsTotal} ticked`}
              </span>
            </div>
            <p style={{ font: '400 14px/1.5 var(--font-body)', marginTop: 10 }}>
              {phase.gate}
            </p>
            <p
              className="mt-2"
              style={{ font: '400 12px/1.45 var(--font-body)', color: 'rgba(29,31,32,.55)' }}
            >
              {phase.description}
            </p>
            <div className="mt-4 h-2" style={{ background: 'rgba(29,31,32,.14)' }}>
              <div
                className="h-full"
                style={{
                  width: `${subsTotal ? Math.round((subsDone / subsTotal) * 100) : 0}%`,
                  background: ACCENT,
                }}
              />
            </div>
            <div className="k mt-2.5" style={{ letterSpacing: '.04em', lineHeight: 1.5 }}>
              {complete
                ? `This ${track.unitLabel.toLowerCase()} is complete — everything in it is ticked. Untick anything and it reopens.`
                : `Marked complete automatically once every subtopic is ticked. ${subsTotal - subsDone} to go.`}
            </div>
          </div>

          <div
            className={`grid gap-px border ${scored ? 'grid-cols-3' : 'grid-cols-2'}`}
            style={{
              background: 'rgba(29,31,32,.35)',
              borderColor: 'rgba(29,31,32,.35)',
            }}
          >
            <div className="bg-bg p-3.5">
              <div className="k">Subtopics</div>
              <div style={{ font: '600 24px/1.1 var(--font-heading)' }}>
                {subsDone}/{subsTotal}
              </div>
            </div>
            <div className="bg-bg p-3.5">
              <div className="k">Hours</div>
              <div style={{ font: '600 24px/1.1 var(--font-heading)' }}>
                {logged}/{phase.hours}
              </div>
            </div>
            {/* A count of the topics that decide whether you clear the bar,
                shown beside hours because the two can diverge: it is possible
                to be well into the hours and barely into the critical work. */}
            {scored && critical.total > 0 && (
              <div className="bg-bg p-3.5">
                <div className="k">Critical</div>
                <div style={{ font: '600 24px/1.1 var(--font-heading)' }}>
                  {critical.done}/{critical.total}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── topics → subtopics ────────────────────────────────────── */}
        <div className="min-w-0">
          <div className="k mb-2">Topics — tap to expand</div>
          <div style={{ borderTop: '1px solid rgba(29,31,32,.35)' }}>
            {phase.topics.map((topic, ti) => {
              const expanded = open === ti;
              const isNew = topic.subtopics.some((s) => s.isNew);
              const subsDoneHere = topic.subtopics.filter((s) => s.done).length;
              return (
                <div key={topic.name}>
                  <div
                    className="flex items-start gap-3 py-2.5"
                    style={{ borderBottom: '1px solid rgba(29,31,32,.14)' }}
                  >
                    <button
                      className="bx mt-0.5 h-4 w-4 flex-none"
                      style={{ background: topic.done ? ACCENT : 'transparent' }}
                      aria-label={topic.done ? 'Untick topic' : 'Tick whole topic'}
                      onClick={() => void onToggleTopic(ti, !topic.done)}
                    />
                    <button
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                      onClick={() => setOpen(expanded ? null : ti)}
                    >
                      <span
                        className="min-w-0 flex-1"
                        style={{
                          font: '500 13px/1.4 var(--font-body)',
                          color: topic.done ? 'rgba(29,31,32,.45)' : 'var(--ink)',
                        }}
                      >
                        {topic.name}
                      </span>
                      {isNew && <NewFlag />}
                      {topic.value && <ValueBadge value={topic.value} />}
                      <span className="k w-[34px] flex-none text-right">
                        {subsDoneHere}/{topic.subtopics.length}
                      </span>
                      <span className="k w-7 flex-none text-right">{topic.hours}h</span>
                      <span className="k flex-none">{expanded ? '▾' : '▸'}</span>
                    </button>
                  </div>

                  {expanded && (
                    <div
                      className="my-3 ml-1 pl-3.5"
                      style={{ borderLeft: `2px solid ${ACCENT}` }}
                    >
                      <div className="k mb-1.5">
                        {topic.detail} · {topic.subtopics.length} subtopics ·{' '}
                        {topicHoursLogged(topic)}/{topic.hours}h ·{' '}
                        {subtopicCompletion(topic)}%
                      </div>
                      {/* Why the badge says what it says. A weight with no
                          argument behind it is the thing this whole model is
                          meant to avoid, so it is shown, not hidden in a tooltip. */}
                      {topic.value && (
                        <div
                          className="mb-2 py-1.5 pl-2.5"
                          style={{
                            borderLeft: `2px solid ${WEIGHT_COLOR[topic.value.weight]}`,
                            font: '400 12px/1.5 var(--font-body)',
                            color: 'rgba(29,31,32,.7)',
                          }}
                        >
                          {topic.value.why}
                          <span className="k mt-1 block">
                            {VALUE_WEIGHT_MEANING[topic.value.weight]}
                          </span>
                        </div>
                      )}
                      {!isGate && backendTopicSource(phase.title, topic.name) && (
                        <div className="mb-2">
                          <SourceLine
                            source={backendTopicSource(phase.title, topic.name) as string}
                          />
                        </div>
                      )}
                      <div style={{ borderTop: '1px solid rgba(29,31,32,.35)' }}>
                        {topic.subtopics.map((s, si) => (
                          <label
                            key={s.name}
                            className="flex cursor-pointer items-start gap-3 py-2"
                            style={{ borderBottom: '1px solid rgba(29,31,32,.14)' }}
                          >
                            <input
                              type="checkbox"
                              checked={s.done}
                              onChange={(e) =>
                                void onToggleSubtopic(ti, si, e.target.checked)
                              }
                              className="sr-only"
                            />
                            <span
                              className="bx mt-0.5 h-[14px] w-[14px] flex-none"
                              style={{ background: s.done ? ACCENT : 'transparent' }}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1">
                              <span
                                className="block"
                                style={{
                                  font: '400 13px/1.45 var(--font-body)',
                                  color: s.done ? 'rgba(29,31,32,.42)' : 'var(--ink)',
                                }}
                              >
                                {s.name}
                              </span>
                              {!isGate && backendGloss(s.name) && (
                                <span
                                  className="mt-0.5 block"
                                  style={{
                                    font: '400 12px/1.5 var(--font-body)',
                                    color: 'rgba(29,31,32,.55)',
                                  }}
                                >
                                  {backendGloss(s.name)}
                                </span>
                              )}
                            </span>
                            {s.isNew && <NewFlag />}
                            {/* Outside the label's checkbox, so flagging never
                                ticks the work by accident. */}
                            <button
                              type="button"
                              className="flex-none"
                              aria-pressed={Boolean(s.marked)}
                              aria-label={
                                s.marked ? 'Unmark for review' : 'Mark for review'
                              }
                              title={
                                s.marked
                                  ? 'Marked for review — tap to clear'
                                  : 'Mark for review'
                              }
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void onToggleMarked(ti, si, !s.marked);
                              }}
                              style={{
                                font: '600 8.5px var(--font-heading)',
                                letterSpacing: '.12em',
                                padding: '2px 4px',
                                background: s.marked ? AMBER : 'transparent',
                                color: s.marked ? '#fff' : 'rgba(29,31,32,.3)',
                                border: `1px solid ${s.marked ? AMBER : 'rgba(29,31,32,.2)'}`,
                              }}
                            >
                              {s.marked ? 'MARKED' : 'MARK'}
                            </button>
                            <span className="k w-[26px] flex-none text-right">
                              {s.hours}h
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── everything behind the checklist: what to read, and the full scope ── */}
      {learn && <LearnFromBlock learn={learn} />}

      {chapters.length > 0 && (
        <div>
          <div
            className="flex flex-wrap items-end justify-between gap-2 pb-3"
            style={{ borderBottom: '1px solid var(--ink)' }}
          >
            <div>
              <div className="k">
                {isGate
                  ? 'Official GATE 2027 scope for this subject'
                  : `Full scope for this ${track.unitLabel.toLowerCase()}`}
              </div>
              <div style={{ font: '600 19px/1.15 var(--font-heading)', marginTop: 4 }}>
                Syllabus in full
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="k">
                {chapters.length} chapters · {conceptTotal} concepts
              </span>
              <button
                className="btn-line"
                style={{ height: 28, paddingLeft: 10, paddingRight: 10 }}
                onClick={() => setShowReference(!showReference)}
              >
                {showReference ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {showReference && (
            <div className="pt-4">
              {officialScope && (
                <blockquote
                  className="mb-5 py-1 pl-3.5"
                  style={{
                    borderLeft: `2px solid ${ACCENT}`,
                    font: '400 12.5px/1.6 var(--font-body)',
                    color: 'rgba(29,31,32,.7)',
                    margin: 0,
                  }}
                >
                  {officialScope}
                </blockquote>
              )}
              {chapters.map((c) => (
                <ChapterBlock key={c.name} chapter={c} />
              ))}
              <p
                className="k"
                style={{ letterSpacing: '.04em', lineHeight: 1.6, textTransform: 'none' }}
              >
                {isGate
                  ? 'The checklist above is the campaign plan — one subtopic per study day. The list here is the syllabus itself. They cover the same ground in different shapes, which is why only the checklist carries ticks.'
                  : 'The same ground as the checklist above, read straight through without the checkboxes — and with the book chapter named for every topic.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
