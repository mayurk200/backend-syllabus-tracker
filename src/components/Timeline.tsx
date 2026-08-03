import { useEffect, useMemo, useState } from 'react';
import type { WeekEntry, WeekOutcome } from '../types';
import {
  WEEK_KIND_LABEL,
  WEEK_OUTCOME_LABEL,
  canSwapWeeks,
  dayBody,
  dayLabel,
  missedStudyDays,
  studyDayIndexes,
  weekDayHours,
  weekHoursDone,
  weekIsPinned,
  weekOutcome,
} from '../types';
import { Corners } from './Corners';
import { PageHead } from './PageHead';

interface TimelineProps {
  weeks: WeekEntry[];
  onSetDayDone: (week: WeekEntry, dayIndex: number, done: boolean) => Promise<void>;
  /** Trade two weeks' calendar slots — dates only, the plan stays put. */
  onSwapWeeks: (a: WeekEntry, b: WeekEntry) => Promise<void>;
  /** Undo every swap, putting each week back in its authored slot. */
  onResetWeeks: () => Promise<void>;
}

const AMBER = '#9a7b3f';

/** One colour per outcome, used by the strip, the rows and the badges alike. */
function outcomeColour(outcome: WeekOutcome): string {
  if (outcome === 'pass') return ACCENT;
  if (outcome === 'partial') return AMBER;
  if (outcome === 'missed') return RED;
  return 'rgba(29,31,32,.35)';
}

const ACCENT = '#5980a6';
const RED = '#a03c3c';
const MUTED = 'rgba(29,31,32,.55)';

const KIND_LABEL = WEEK_KIND_LABEL;

const EXAM_ISO = '2027-02-06T09:30:00';
const CAMPAIGN_START_ISO = '2026-07-27T00:00:00';
const CAMPAIGN_HOURS = 1240;

function startOf(w: WeekEntry): number {
  return new Date(`${w.start}T00:00:00`).getTime();
}
function endOf(w: WeekEntry): number {
  return new Date(`${w.end}T23:59:59`).getTime();
}

/** Ticks once a second so the countdown is genuinely live. */
function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function Timeline({
  weeks,
  onSetDayDone,
  onSwapWeeks,
  onResetWeeks,
}: TimelineProps): JSX.Element {
  const now = useNow();
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  // Week being dragged along the strip, and the week it is hovering over.
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  // Reset asks once before it undoes an arrangement.
  const [confirmReset, setConfirmReset] = useState(false);

  const exam = useMemo(() => new Date(EXAM_ISO).getTime(), []);
  const campaignStart = useMemo(() => new Date(CAMPAIGN_START_ISO).getTime(), []);

  const currentIndex = weeks.findIndex((w) => now >= startOf(w) && now <= endOf(w));
  const current = currentIndex >= 0 ? weeks[currentIndex] : undefined;

  // live countdown to the first exam session
  const remaining = Math.max(0, exam - now);
  const days = Math.floor(remaining / 86_400_000);
  const hrs = Math.floor((remaining % 86_400_000) / 3_600_000);
  const mins = Math.floor((remaining % 3_600_000) / 60_000);
  const secs = Math.floor((remaining % 60_000) / 1000);

  // progress within the current week, for the live needle
  const weekFrac = current
    ? Math.min(1, Math.max(0, (now - startOf(current)) / (endOf(current) - startOf(current))))
    : now < campaignStart
      ? 0
      : 1;

  const outcomes = new Map<string, WeekOutcome>(
    weeks.map((w) => [w.id, weekOutcome(w, now)]),
  );
  const passed = weeks.filter((w) => outcomes.get(w.id) === 'pass').length;
  const partial = weeks.filter((w) => outcomes.get(w.id) === 'partial').length;
  const missed = weeks.filter((w) => outcomes.get(w.id) === 'missed').length;

  const beforeStart = now < campaignStart;
  const afterExam = remaining === 0;
  const needleLeft = `${((currentIndex >= 0 ? currentIndex + weekFrac : 0) / Math.max(1, weeks.length)) * 100}%`;

  // The weeks already behind you, with how each turned out.
  const settled = weeks
    .filter((w) => {
      const o = outcomes.get(w.id);
      return o === 'pass' || o === 'partial' || o === 'missed';
    })
    .slice(-5)
    .reverse();

  const currentHours = current ? weekDayHours(current) : [];
  const currentLogged = current ? weekHoursDone(current) : 0;
  const currentOutcome = current ? outcomes.get(current.id) : undefined;
  const currentMissed = current ? missedStudyDays(current) : [];

  const handleDay = async (w: WeekEntry, i: number, done: boolean): Promise<void> => {
    setBusy(`${w.id}:${i}`);
    try {
      await onSetDayDone(w, i, done);
    } finally {
      setBusy(null);
    }
  };

  /** Drop one week onto another: they trade dates and nothing else. */
  const handleDrop = async (fromId: string, toId: string): Promise<void> => {
    const a = weeks.find((w) => w.id === fromId);
    const b = weeks.find((w) => w.id === toId);
    if (!a || !b || a.id === b.id) return;
    setBusy(`swap:${a.id}`);
    try {
      await onSwapWeeks(a, b);
    } finally {
      setBusy(null);
    }
  };

  const swapped = weeks.filter((w) => Boolean(w.slottedAt)).length;

  const handleReset = async (): Promise<void> => {
    setConfirmReset(false);
    setBusy('reset');
    try {
      await onResetWeeks();
    } finally {
      setBusy(null);
    }
  };

  const milestoneWeek = weeks.find((w, i) => Boolean(w.milestone) && i > currentIndex);

  return (
    <div className="space-y-5">
      {/* ── head: what it is, and how long is left ────────────────────── */}
      <PageHead
        kicker="GATE 2027 CS · exam 6 Feb 2027, 09:30"
        title="Timeline"
        meta={
          <div className="text-right">
            <div className="k">Countdown</div>
            <div
              style={{
                font: '300 34px/1 var(--font-heading)',
                fontVariantNumeric: 'tabular-nums',
                marginTop: 4,
              }}
            >
              {afterExam
                ? 'exam window'
                : `${days}d ${pad(hrs)}:${pad(mins)}:${pad(secs)}`}
            </div>
          </div>
        }
      />

      {/* ── the 28-week strip, with milestone ticks and the live needle ── */}
      <div>
        <div className="k mb-2 flex justify-between gap-3">
          <span>
            Campaign · {weeks.length} weeks · {CAMPAIGN_HOURS}h
          </span>
          <span className="flex items-baseline gap-3">
            <span style={{ color: drag ? ACCENT : undefined }}>
              {drag
                ? `drop ${drag} on another ${KIND_LABEL[weeks.find((w) => w.id === drag)?.kind ?? 'core']} week`
                : swapped > 0
                  ? `drag to swap within a block · ${swapped} moved`
                  : 'drag to swap within a block'}
            </span>
            {swapped > 0 && !drag && (
              <button
                onClick={() => (confirmReset ? void handleReset() : setConfirmReset(true))}
                onBlur={() => setConfirmReset(false)}
                disabled={busy === 'reset'}
                className="k"
                style={{
                  color: confirmReset ? RED : ACCENT,
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                }}
                title="Put every week back in the slot it started in. Ticks are kept."
              >
                {busy === 'reset'
                  ? 'resetting…'
                  : confirmReset
                    ? 'reset the order? tap again'
                    : 'reset order'}
              </button>
            )}
          </span>
          <span>
            {current
              ? `week ${currentIndex + 1} of ${weeks.length} · ${current.id} · you are here`
              : beforeStart
                ? 'not started'
                : 'campaign over'}
          </span>
        </div>
        <div className="relative flex h-11 gap-[2px]">
          {weeks.map((w, i) => {
            const outcome = outcomes.get(w.id) ?? 'pending';
            const isCurrent = i === currentIndex;
            const fill =
              outcome === 'pending'
                ? 'rgba(29,31,32,.13)'
                : outcome === 'partial'
                  ? 'rgba(154,123,63,.7)'
                  : outcome === 'missed'
                    ? 'rgba(160,60,60,.65)'
                    : ACCENT;
            const isDragging = drag === w.id;
            const dragged = drag ? weeks.find((x) => x.id === drag) : undefined;
            // Only weeks in the same block accept the drop; the rest grey out
            // while a drag is live so the rule is visible rather than learned
            // by having a drop refused.
            const droppable = Boolean(dragged) && dragged!.id !== w.id && canSwapWeeks(dragged!, w);
            const isTarget = over === w.id && droppable;
            const movable = !weekIsPinned(w);
            return (
              <button
                key={w.id}
                onClick={() => setOpen(open === w.id ? null : w.id)}
                className="flex flex-1 flex-col gap-[3px]"
                title={`${w.id} · ${w.title} · ${w.dates} · ${KIND_LABEL[w.kind]}${
                  movable
                    ? ` — drag onto another ${KIND_LABEL[w.kind]} week to swap dates`
                    : ' — pinned, cannot move'
                }`}
                draggable={movable}
                onDragStart={(e) => {
                  if (!movable) return;
                  setDrag(w.id);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', w.id);
                }}
                onDragEnd={() => {
                  setDrag(null);
                  setOver(null);
                }}
                onDragOver={(e) => {
                  if (!droppable) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setOver(w.id);
                }}
                onDragLeave={() => setOver((c) => (c === w.id ? null : c))}
                onDrop={(e) => {
                  if (!droppable) return;
                  e.preventDefault();
                  const from = drag ?? e.dataTransfer.getData('text/plain');
                  setDrag(null);
                  setOver(null);
                  if (from && from !== w.id) void handleDrop(from, w.id);
                }}
                style={{
                  cursor: movable ? 'grab' : 'default',
                  opacity: isDragging ? 0.35 : dragged && !droppable ? 0.4 : 1,
                }}
              >
                <span
                  className="bx flex-1"
                  style={{
                    background: fill,
                    borderColor: isTarget ? RED : isCurrent ? ACCENT : undefined,
                    outline: isTarget
                      ? `2px solid ${RED}`
                      : isCurrent
                        ? `1px solid ${ACCENT}`
                        : 'none',
                  }}
                />
                <span
                  className="h-[3px] flex-none"
                  style={{ background: w.milestone ? 'var(--ink)' : 'transparent' }}
                />
              </button>
            );
          })}
          {!beforeStart && !afterExam && (
            <>
              <div
                className="pointer-events-none absolute -top-1 -bottom-1 w-[2px]"
                style={{ left: needleLeft, background: RED }}
              />
              <div
                className="k pointer-events-none absolute -top-3"
                style={{ left: needleLeft, transform: 'translateX(-50%)', color: RED }}
              >
                NOW
              </div>
            </>
          )}
        </div>
        <div className="k mt-2 flex justify-between">
          <span>27 Jul 2026</span>
          <span>
            {milestoneWeek ? `${milestoneWeek.milestone} · ${milestoneWeek.id}` : '—'}
          </span>
          <span>6 Feb 2027</span>
        </div>
      </div>

      {/* ── this week, day by day · weekly gate rail ──────────────────── */}
      <div className="grid gap-7 md:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {current ? (
            <>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <span className="k">
                  {current.id} · {current.dates} · {KIND_LABEL[current.kind]} ·{' '}
                  {current.title}
                </span>
                <span className="k">
                  {current.hours}h planned · {currentLogged}h logged
                </span>
              </div>
              <div style={{ borderTop: '1px solid rgba(29,31,32,.35)' }}>
                {current.days.map((d, i) => {
                  const done = current.dayDone?.[i] ?? false;
                  const isToday = (new Date(now).getDay() + 6) % 7 === i;
                  return (
                    <button
                      key={i}
                      onClick={() => void handleDay(current, i, !done)}
                      disabled={busy === `${current.id}:${i}`}
                      className="flex w-full items-start gap-3 py-2.5 text-left"
                      style={{ borderBottom: '1px solid rgba(29,31,32,.14)' }}
                    >
                      <span
                        className="bx mt-0.5 h-4 w-4 flex-none"
                        style={{
                          background: done ? ACCENT : 'transparent',
                          borderColor: isToday ? ACCENT : undefined,
                        }}
                      />
                      <span
                        className="k mt-[3px] w-[34px] flex-none"
                        style={{ color: isToday ? ACCENT : undefined }}
                      >
                        {dayLabel(d, i)}
                      </span>
                      <span
                        className="min-w-0 flex-1"
                        style={{
                          font: '400 13px/1.45 var(--font-body)',
                          color: done ? 'rgba(29,31,32,.45)' : 'var(--ink)',
                        }}
                      >
                        {dayBody(d)}
                      </span>
                      <span className="k mt-[3px] w-8 flex-none text-right">
                        {currentHours[i] ? `${currentHours[i]}h` : '—'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="bx p-4">
              <div className="k">
                {beforeStart
                  ? `The campaign starts ${weeks[0]?.dates ?? '27 Jul 2026'}.`
                  : 'The campaign calendar has run out.'}
              </div>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          {current && (
            <div className="bx p-3.5">
              <div className="flex items-baseline justify-between">
                <span className="k">Weekly gate · {current.id}</span>
                <span
                  className="k"
                  style={{ color: outcomeColour(currentOutcome ?? 'pending') }}
                >
                  {currentOutcome === 'pass' ? '✓ ' : ''}
                  {WEEK_OUTCOME_LABEL[currentOutcome ?? 'pending']}
                </span>
              </div>
              <p style={{ font: '400 13px/1.5 var(--font-body)', marginTop: 6 }}>
                {current.gate}
              </p>
              <div className="mt-3 h-2" style={{ background: 'rgba(29,31,32,.14)' }}>
                <div
                  className="h-full"
                  style={{
                    width: `${Math.round(((studyDayIndexes(current).length - currentMissed.length) / studyDayIndexes(current).length) * 100)}%`,
                    background: outcomeColour(currentOutcome ?? 'pending'),
                  }}
                />
              </div>
              <div className="k mt-2" style={{ lineHeight: 1.5, letterSpacing: '.04em' }}>
                {currentOutcome === 'pass'
                  ? 'Every study day ticked — the week passed automatically.'
                  : `${studyDayIndexes(current).length - currentMissed.length} of ${studyDayIndexes(current).length} study days done. Passes on its own once all six are ticked.`}
              </div>
            </div>
          )}

          <div className="min-w-0">
            <div className="k mb-2 flex justify-between">
              <span>Weeks behind you</span>
              <span>
                {passed} passed · {partial} partial · {missed} missed
              </span>
            </div>
            <div style={{ borderTop: '1px solid rgba(29,31,32,.35)' }}>
              {settled.length === 0 && (
                <div className="k py-2.5" style={{ letterSpacing: '.04em' }}>
                  No week has closed yet.
                </div>
              )}
              {settled.map((w) => {
                const outcome = outcomes.get(w.id) ?? 'pending';
                const gaps = missedStudyDays(w);
                return (
                  <button
                    key={w.id}
                    onClick={() => setOpen(open === w.id ? null : w.id)}
                    className="w-full py-2 text-left"
                    style={{ borderBottom: '1px solid rgba(29,31,32,.14)' }}
                  >
                    <span className="flex items-baseline gap-2.5">
                      <span className="k w-8 flex-none">{w.id}</span>
                      <span
                        className="min-w-0 flex-1 truncate"
                        style={{ font: '400 12px/1.4 var(--font-body)' }}
                      >
                        {w.title}
                      </span>
                      <span
                        className="k flex-none"
                        style={{ color: outcomeColour(outcome) }}
                      >
                        {WEEK_OUTCOME_LABEL[outcome]}
                      </span>
                    </span>
                    {gaps.length > 0 && (
                      <span
                        className="k mt-1 block"
                        style={{ letterSpacing: '.04em', color: outcomeColour(outcome) }}
                      >
                        missed {gaps.map((i) => dayLabel(w.days[i], i)).join(', ')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── the whole plan, still one tap from here ───────────────────── */}
      <div className="blueprint p-4">
        <Corners />
        <div className="mb-3 flex items-baseline justify-between">
          <span className="h">{weeks.length}-WEEK PLAN</span>
          <span className="k">
            tap for the day-by-day · drag on the strip to swap dates
          </span>
        </div>

        {weeks.map((w, i) => {
          const outcome = outcomes.get(w.id) ?? 'pending';
          const gaps = outcome === 'pending' ? [] : missedStudyDays(w);
          const isCurrent = i === currentIndex;
          const isPast = now > endOf(w);
          const expanded = open === w.id;
          const hours = weekDayHours(w);
          return (
            <div key={w.id} style={{ borderTop: '1px solid rgba(29,31,32,.18)' }}>
              <button
                onClick={() => setOpen(expanded ? null : w.id)}
                className="flex w-full items-start gap-3 py-2.5 text-left"
              >
                <div
                  className="bx grid h-[26px] w-[34px] flex-none place-items-center"
                  style={{
                    font: '600 11px var(--font-heading)',
                    background:
                      outcome === 'pending' ? 'transparent' : outcomeColour(outcome),
                    color:
                      outcome === 'pending'
                        ? isPast
                          ? MUTED
                          : 'var(--ink)'
                        : '#fff',
                    borderColor: isCurrent ? ACCENT : undefined,
                  }}
                >
                  {w.id}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      style={{
                        font: '500 13px var(--font-body)',
                        color: isCurrent ? ACCENT : 'var(--ink)',
                      }}
                    >
                      {w.title}
                    </span>
                    <span className="k flex-none">
                      {w.milestone ? `★ ${w.milestone}` : KIND_LABEL[w.kind]}
                    </span>
                  </div>
                  <div className="k mt-1" style={{ letterSpacing: '.05em' }}>
                    {w.dates} · {weekHoursDone(w)}/{w.hours}h {isCurrent && '· now'}
                    {outcome !== 'pending' && (
                      <span style={{ color: outcomeColour(outcome) }}>
                        {' '}
                        · {w.missedAt && outcome === 'pass'
                          ? 'caught up late'
                          : WEEK_OUTCOME_LABEL[outcome]}
                      </span>
                    )}
                    {gaps.length > 0 && (
                      <span style={{ color: outcomeColour(outcome) }}>
                        {' '}
                        · missed {gaps.map((j) => dayLabel(w.days[j], j)).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </button>

              {expanded && (
                <div className="pb-3.5 pl-[46px] pr-1">
                  <div className="mb-2.5">
                    {w.days.map((d, j) => {
                      const done = w.dayDone?.[j] ?? false;
                      return (
                        <button
                          key={j}
                          onClick={() => void handleDay(w, j, !done)}
                          disabled={busy === `${w.id}:${j}`}
                          className="flex w-full items-start gap-2.5 py-1.5 text-left"
                          style={{ borderTop: '1px solid rgba(29,31,32,.1)' }}
                        >
                          <span
                            className="bx mt-0.5 h-[13px] w-[13px] flex-none"
                            style={{ background: done ? ACCENT : 'transparent' }}
                          />
                          <span className="k mt-[2px] w-7 flex-none">
                            {dayLabel(d, j)}
                          </span>
                          <span
                            className="min-w-0 flex-1"
                            style={{
                              font: '400 11.5px/1.45 var(--font-body)',
                              color: done ? 'rgba(29,31,32,.45)' : 'rgba(29,31,32,.75)',
                            }}
                          >
                            {dayBody(d)}
                          </span>
                          <span className="k mt-[2px] w-6 flex-none text-right">
                            {hours[j] ? `${hours[j]}h` : '—'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="bx mb-2.5 p-2.5">
                    <div className="k mb-1">Gate</div>
                    <div style={{ font: '400 11.5px/1.45 var(--font-body)' }}>{w.gate}</div>
                  </div>
                  <div
                    className="k"
                    style={{
                      letterSpacing: '.04em',
                      lineHeight: 1.5,
                      color: outcome === 'pending' ? undefined : outcomeColour(outcome),
                    }}
                  >
                    {outcome === 'pass'
                      ? '✓ Passed — every study day ticked.'
                      : gaps.length > 0 && outcome !== 'pending'
                        ? `${WEEK_OUTCOME_LABEL[outcome]} — still open: ${gaps
                            .map((j) => dayBody(w.days[j]).slice(0, 48))
                            .join(' · ')}`
                        : `Passes on its own once all ${studyDayIndexes(w).length} study days are ticked.`}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
