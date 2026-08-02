import { useEffect, useMemo, useState } from 'react';
import type { WeekEntry, WeekStatus, WeekStatusMap } from '../types';
import { dayBody, dayLabel, weekDayHours, weekHoursDone } from '../types';
import { Corners } from './Corners';

interface TimelineProps {
  weeks: WeekEntry[];
  status: WeekStatusMap;
  onSetStatus: (week: WeekEntry, status: WeekStatus | null) => Promise<void>;
  onSetDayDone: (week: WeekEntry, dayIndex: number, done: boolean) => Promise<void>;
}

const ACCENT = '#5980a6';
const RED = '#a03c3c';
const MUTED = 'rgba(29,31,32,.55)';

const KIND_LABEL: Record<WeekEntry['kind'], string> = {
  setup: 'setup',
  core: 'core build',
  revision: 'revision',
  mock: 'mocks',
  taper: 'taper',
};

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
  status,
  onSetStatus,
  onSetDayDone,
}: TimelineProps): JSX.Element {
  const now = useNow();
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

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

  const passed = Object.values(status).filter((s) => s === 'pass').length;
  const failed = Object.values(status).filter((s) => s === 'fail').length;

  const beforeStart = now < campaignStart;
  const afterExam = remaining === 0;
  const needleLeft = `${((currentIndex >= 0 ? currentIndex + weekFrac : 0) / Math.max(1, weeks.length)) * 100}%`;

  // The most recently judged weeks — the honest run of pass/fail behind you.
  const recentGates = weeks
    .filter((w) => status[w.id])
    .slice(-5)
    .reverse();

  const currentHours = current ? weekDayHours(current) : [];
  const currentLogged = current ? weekHoursDone(current) : 0;
  const currentStatus = current ? status[current.id] : undefined;

  const handleStatus = async (w: WeekEntry, next: WeekStatus | null): Promise<void> => {
    setBusy(w.id);
    try {
      await onSetStatus(w, next);
    } finally {
      setBusy(null);
    }
  };

  const handleDay = async (w: WeekEntry, i: number, done: boolean): Promise<void> => {
    setBusy(`${w.id}:${i}`);
    try {
      await onSetDayDone(w, i, done);
    } finally {
      setBusy(null);
    }
  };

  const milestoneWeek = weeks.find((w, i) => Boolean(w.milestone) && i > currentIndex);

  return (
    <div className="space-y-5">
      {/* ── head: what it is, and how long is left ────────────────────── */}
      <div
        className="flex flex-wrap items-end justify-between gap-3 pb-3.5"
        style={{ borderBottom: '1px solid var(--ink)' }}
      >
        <div>
          <div className="k">GATE 2027 CS · exam 6 Feb 2027, 09:30</div>
          <div style={{ font: '600 26px/1.05 var(--font-heading)', marginTop: 4 }}>
            Timeline
          </div>
        </div>
        <div className="text-right">
          <div className="k">Countdown</div>
          <div
            style={{
              font: '600 30px/1 var(--font-heading)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {afterExam
              ? 'exam window'
              : `${days}d ${pad(hrs)}:${pad(mins)}:${pad(secs)}`}
          </div>
        </div>
      </div>

      {/* ── the 28-week strip, with milestone ticks and the live needle ── */}
      <div>
        <div className="k mb-2 flex justify-between">
          <span>
            Campaign · {weeks.length} weeks · {CAMPAIGN_HOURS}h
          </span>
          <span>
            {current
              ? `${current.id} of ${weeks.length} · you are here`
              : beforeStart
                ? 'not started'
                : 'campaign over'}
          </span>
        </div>
        <div className="relative flex h-11 gap-[2px]">
          {weeks.map((w, i) => {
            const s = status[w.id];
            const isPast = now > endOf(w);
            const isCurrent = i === currentIndex;
            const fill =
              s === 'pass'
                ? ACCENT
                : s === 'fail'
                  ? 'rgba(160,60,60,.65)'
                  : isPast
                    ? 'rgba(29,31,32,.3)'
                    : 'rgba(29,31,32,.13)';
            return (
              <button
                key={w.id}
                onClick={() => setOpen(open === w.id ? null : w.id)}
                className="flex flex-1 flex-col gap-[3px]"
                title={`${w.id} · ${w.title} · ${w.dates}`}
              >
                <span
                  className="bx flex-1"
                  style={{
                    background: fill,
                    borderColor: isCurrent ? ACCENT : undefined,
                    outline: isCurrent ? `1px solid ${ACCENT}` : 'none',
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
              <div className="k">Weekly gate · {current.id}</div>
              <p style={{ font: '400 13px/1.5 var(--font-body)', marginTop: 6 }}>
                {current.gate}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  className={currentStatus === 'pass' ? 'btn-solid' : 'btn-line'}
                  style={{ flex: 1, height: 34 }}
                  disabled={busy === current.id}
                  onClick={() =>
                    void handleStatus(current, currentStatus === 'pass' ? null : 'pass')
                  }
                >
                  Pass
                </button>
                <button
                  className="btn-line"
                  style={{
                    flex: 1,
                    height: 34,
                    borderColor: RED,
                    color: RED,
                    background:
                      currentStatus === 'fail' ? 'rgba(160,60,60,.12)' : 'transparent',
                  }}
                  disabled={busy === current.id}
                  onClick={() =>
                    void handleStatus(current, currentStatus === 'fail' ? null : 'fail')
                  }
                >
                  Fail
                </button>
              </div>
            </div>
          )}

          <div className="min-w-0">
            <div className="k mb-2 flex justify-between">
              <span>Recent weekly gates</span>
              <span>
                {passed} passed · {failed} failed
              </span>
            </div>
            <div style={{ borderTop: '1px solid rgba(29,31,32,.35)' }}>
              {recentGates.length === 0 && (
                <div className="k py-2.5" style={{ letterSpacing: '.04em' }}>
                  No week judged yet.
                </div>
              )}
              {recentGates.map((w) => {
                const s = status[w.id];
                return (
                  <button
                    key={w.id}
                    onClick={() => setOpen(open === w.id ? null : w.id)}
                    className="flex w-full items-baseline gap-2.5 py-2 text-left"
                    style={{ borderBottom: '1px solid rgba(29,31,32,.14)' }}
                  >
                    <span className="k w-8 flex-none">{w.id}</span>
                    <span
                      className="min-w-0 flex-1 truncate"
                      style={{ font: '400 12px/1.4 var(--font-body)' }}
                    >
                      {w.title}
                    </span>
                    <span
                      className="k flex-none"
                      style={{ color: s === 'pass' ? ACCENT : RED }}
                    >
                      {s === 'pass' ? 'pass' : 'fail'}
                    </span>
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
          <span className="k">tap a week for the day-by-day</span>
        </div>

        {weeks.map((w, i) => {
          const s = status[w.id];
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
                      s === 'pass'
                        ? ACCENT
                        : s === 'fail'
                          ? 'rgba(160,60,60,.8)'
                          : 'transparent',
                    color: s ? '#fff' : isPast ? MUTED : 'var(--ink)',
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
                  <div className="flex gap-2">
                    <button
                      className="btn-line"
                      style={{
                        flex: 1,
                        height: 32,
                        borderColor: s === 'pass' ? ACCENT : undefined,
                        color: s === 'pass' ? ACCENT : undefined,
                      }}
                      disabled={busy === w.id}
                      onClick={() => void handleStatus(w, s === 'pass' ? null : 'pass')}
                    >
                      {s === 'pass' ? '✓ passed' : 'Gate passed'}
                    </button>
                    <button
                      className="btn-line"
                      style={{
                        flex: 1,
                        height: 32,
                        borderColor: s === 'fail' ? RED : undefined,
                        color: s === 'fail' ? RED : undefined,
                      }}
                      disabled={busy === w.id}
                      onClick={() => void handleStatus(w, s === 'fail' ? null : 'fail')}
                    >
                      {s === 'fail' ? '✗ failed' : 'Gate failed'}
                    </button>
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
