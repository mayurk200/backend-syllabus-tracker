import type { ActivityEvent, Meta, Phase, TrackDef, WeeklyReview } from '../types';
import {
  VALUE_WEIGHT_LABEL,
  criticalProgress,
  hoursByDay,
  hoursLogged,
  isPhaseComplete,
  nextByValue,
  startOfWeek,
  topicCompletion,
} from '../types';
import { Corners } from './Corners';

interface DashboardProps {
  phases: Phase[];
  meta: Meta | null;
  track: TrackDef;
  activity: ActivityEvent[];
  reviews: WeeklyReview[];
  onSelectPhase: (phaseId: number) => void;
  onOpenReview: () => void;
}

const ACCENT = '#5980a6';
const MUTED = 'rgba(29,31,32,.55)';
const BARBG = 'rgba(29,31,32,.14)';
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function weeksSince(startDate: string | undefined): number {
  if (!startDate) return 0;
  const start = new Date(startDate).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.max(1, Math.floor((Date.now() - start) / (7 * 86_400_000)));
}

/** "3h ago", "Yesterday", "12 Oct" — enough to place an event, no more. */
function ago(ms: number, now: number): string {
  const diff = now - ms;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 172_800_000) return 'yesterday';
  return new Date(ms).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
}

export function Dashboard({
  phases,
  meta,
  track,
  activity,
  reviews,
  onSelectPhase,
  onOpenReview,
}: DashboardProps): JSX.Element {
  const now = Date.now();
  const gatesPassed = phases.filter(isPhaseComplete).length;
  const totalLogged = phases.reduce((sum, p) => sum + hoursLogged(p), 0);
  const week = weeksSince(meta?.startDate);
  const unitCount = phases.length || track.unitCount;

  // The current unit is the first one not yet complete — the app only ever
  // points at one thing.
  const current = phases.find((p) => !isPhaseComplete(p)) ?? phases[phases.length - 1];
  const currentIndex = current ? phases.indexOf(current) + 1 : 0;
  const currentLogged = current ? hoursLogged(current) : 0;
  const currentTopicsDone = current ? current.topics.filter((t) => t.done).length : 0;

  // Next three unticked subtopics in the current unit — the literal next moves.
  const upNext = current
    ? current.topics
        .flatMap((t) =>
          t.subtopics.filter((s) => !s.done).map((s) => ({ ...s, parent: t.name })),
        )
        .slice(0, 3)
    : [];

  const weekStart = startOfWeek(now);
  const dayHours = hoursByDay(activity, now);
  const weekHours = Math.round(dayHours.reduce((a, b) => a + b, 0) * 10) / 10;
  const target = meta?.targetHoursPerWeek ?? 0;
  const peak = Math.max(1, ...dayHours);
  const todayIndex = (new Date(now).getDay() + 6) % 7;

  // Build-vs-read comes from what you wrote in the last four reviews, or is
  // shown as the bare target when you have not written any yet.
  const recentReviews = reviews.slice(0, 4);
  const builtPct = recentReviews.length
    ? Math.round(
        recentReviews.reduce((s, r) => s + r.builtPct, 0) / recentReviews.length,
      )
    : null;

  const reviewThisWeek = reviews.some((r) => r.createdAt >= weekStart);

  const subsDone = phases.reduce(
    (s, p) => s + p.topics.reduce((n, t) => n + t.subtopics.filter((x) => x.done).length, 0),
    0,
  );
  const subsTotal = phases.reduce(
    (s, p) => s + p.topics.reduce((n, t) => n + t.subtopics.length, 0),
    0,
  );

  const scored = phases.some((p) => p.topics.some((t) => t.value));
  const critical = criticalProgress(phases);
  /** Unticked topics, most important band first, shortest first within it. */
  const bestReturn = scored ? nextByValue(phases, 3) : [];

  const band: Array<{ label: string; value: string; note: string; fg?: string }> = [
    {
      label: 'Gates',
      value: `${gatesPassed}/${unitCount}`,
      note: 'complete when fully ticked',
      fg: 'var(--accent-700)',
    },
    {
      label: 'Hours',
      value: `${totalLogged}/${track.totalHours}`,
      note: 'first-pass learning',
      fg: MUTED,
    },
    // On a track that bands its topics, the critical count earns the slot next
    // to hours: hours can climb a long way without any of the work that
    // actually decides the outcome getting done.
    scored && critical.total > 0
      ? {
          label: 'Critical topics',
          value: `${critical.done}/${critical.total}`,
          note: 'the work that decides the outcome',
          fg: critical.done > 0 ? 'var(--accent-700)' : MUTED,
        }
      : {
          label: 'Subtopics',
          value: `${subsDone}/${subsTotal}`,
          note: track.id === 'gate' ? 'one per study day' : 'the checkable grain',
        },
    {
      label: 'This week',
      value: `${weekHours}/${target}h`,
      note: reviewThisWeek ? 'review written' : 'review due Sunday',
    },
  ];

  return (
    <div className="space-y-[34px]">
      {/* ── hero ──────────────────────────────────────────────────────── */}
      <section
        className="pb-[34px]"
        style={{ borderBottom: '1px solid rgba(29,31,32,.16)' }}
      >
        <div className="k">
          {track.name}
          {week ? ` · week ${week}` : ''}
          {current ? ` · ${track.unitLabel.toLowerCase()} ${currentIndex} of ${unitCount}` : ''}
        </div>
        <h1 className="display-xl mt-3.5" style={{ maxWidth: '15ch' }}>
          You advance on the work, not the hours.
        </h1>
        <p
          className="mt-[18px]"
          style={{
            maxWidth: '56ch',
            font: '400 15px/1.65 var(--font-body)',
            color: 'rgba(29,31,32,.7)',
          }}
        >
          {track.unitCount} {track.unitLabelPlural.toLowerCase()}, one artifact each.
          A {track.unitLabel.toLowerCase()} closes when every subtopic in it is ticked —
          so tick one only when you could actually produce the thing it names.
        </p>
      </section>

      {/* ── the four numbers ──────────────────────────────────────────── */}
      <section
        className="grid grid-cols-2 gap-px border md:grid-cols-4"
        style={{ background: 'rgba(29,31,32,.35)', borderColor: 'rgba(29,31,32,.35)' }}
      >
        {band.map((s) => (
          <div key={s.label} className="bg-bg p-4">
            <div className="k">{s.label}</div>
            <div
              className="mt-2.5"
              style={{
                font: '600 clamp(26px,3vw,34px)/1 var(--font-heading)',
                fontVariantNumeric: 'tabular-nums',
                color: s.fg,
              }}
            >
              {s.value}
            </div>
            <div className="k mt-2" style={{ letterSpacing: '.08em' }}>
              {s.note}
            </div>
          </div>
        ))}
      </section>

      {/* ── the one thing you are on ──────────────────────────────────── */}
      <div>
        <div className="blueprint p-[26px]">
          <Corners />
          {current ? (
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
                <div className="k">
                  Current gate · {track.unitLabel.toLowerCase()} {currentIndex} of{' '}
                  {unitCount}
                </div>
                <div style={{ font: '600 24px/1.05 var(--font-heading)', marginTop: 4 }}>
                  {current.title}
                </div>
                <p
                  className="mt-2.5"
                  style={{ font: '400 13.5px/1.5 var(--font-body)' }}
                >
                  {current.gate}
                </p>
                <div className="mt-3.5 flex gap-2.5">
                  <button
                    className="btn-solid"
                    style={{ width: 200, height: 38 }}
                    onClick={() => onSelectPhase(current.id)}
                  >
                    Open {track.unitLabel.toLowerCase()}
                  </button>
                  <button
                    className="btn-line"
                    style={{ width: 130, height: 38 }}
                    onClick={onOpenReview}
                  >
                    Weekly review
                  </button>
                </div>
              </div>
              <div className="w-full flex-none sm:w-[150px]">
                <div className="k mb-1.5">
                  Topics {currentTopicsDone} / {current.topics.length}
                </div>
                <div className="h-2" style={{ background: BARBG }}>
                  <div
                    className="h-full"
                    style={{
                      width: `${topicCompletion(current)}%`,
                      background: ACCENT,
                    }}
                  />
                </div>
                <div className="k mt-2.5">
                  {currentLogged} / {current.hours}h logged
                </div>
                <div className="mt-1.5 h-2" style={{ background: BARBG }}>
                  <div
                    className="h-full"
                    style={{
                      width: `${current.hours ? Math.round((currentLogged / current.hours) * 100) : 0}%`,
                      background: 'rgba(89,128,166,.5)',
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="k">Nothing loaded yet.</div>
          )}
        </div>

        {/* Ordered by band rather than by phase number, which is the one place
            this track deliberately argues with its own sequence: critical work
            should be visible even when it sits ten phases ahead. Within a band
            the shortest topic comes first — the only ordering claim here, and
            it rests on hours, which are real. */}
        {bestReturn.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="k">Most important next</span>
              <span className="k">shortest first</span>
            </div>
            <div style={{ borderTop: '1px solid rgba(29,31,32,.18)' }}>
              {bestReturn.map(({ phase, topic }) => (
                <button
                  key={`${phase.id}-${topic.name}`}
                  onClick={() => onSelectPhase(phase.id)}
                  className="flex w-full items-start gap-3 py-2 text-left"
                  style={{ borderBottom: '1px solid rgba(29,31,32,.14)' }}
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate"
                      style={{ font: '500 13px/1.4 var(--font-body)' }}
                    >
                      {topic.name}
                    </span>
                    <span className="k mt-0.5 block" style={{ letterSpacing: '.06em' }}>
                      {phase.title} ·{' '}
                      {topic.value ? VALUE_WEIGHT_LABEL[topic.value.weight] : ''}
                    </span>
                  </span>
                  <span
                    className="flex-none"
                    style={{
                      font: '600 15px/1 var(--font-heading)',
                      fontVariantNumeric: 'tabular-nums',
                      color: ACCENT,
                    }}
                  >
                    {topic.hours}h
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── ladder · up next + pace · ratio + activity ─────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_280px_280px]">
        {/* units */}
        <div className="min-w-0">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="k">{track.unitLabelPlural}</span>
            <span className="k">
              {gatesPassed} passed · {unitCount - gatesPassed} open
            </span>
          </div>
          {phases.map((p) => {
            const passed = isPhaseComplete(p);
            return (
              <button
                key={p.id}
                onClick={() => onSelectPhase(p.id)}
                className="flex w-full items-center gap-2.5 py-2 text-left"
                style={{ borderTop: '1px solid rgba(29,31,32,.18)' }}
              >
                <span
                  className="bx grid h-[22px] w-[22px] flex-none place-items-center"
                  style={{
                    font: '600 11px var(--font-heading)',
                    background: passed ? ACCENT : 'transparent',
                    color: passed ? '#fff' : 'var(--ink)',
                    borderColor: p === current ? ACCENT : undefined,
                  }}
                >
                  {p.id}
                </span>
                <span
                  className="min-w-0 flex-1 truncate"
                  style={{
                    font: '500 13px var(--font-body)',
                    color: p === current ? ACCENT : 'var(--ink)',
                  }}
                >
                  {p.title}
                </span>
                <span className="h-1.5 w-[60px] flex-none" style={{ background: BARBG }}>
                  <span
                    className="block h-full"
                    style={{
                      width: `${topicCompletion(p)}%`,
                      background: 'rgba(89,128,166,.6)',
                    }}
                  />
                </span>
                <span className="k w-[46px] flex-none text-right">
                  {passed ? 'passed' : p === current ? 'now' : 'open'}
                </span>
              </button>
            );
          })}
        </div>

        {/* up next + this week */}
        <div className="flex min-w-0 flex-col gap-5">
          <div>
            <div className="k mb-2">Up next</div>
            <div style={{ borderTop: '1px solid rgba(29,31,32,.35)' }}>
              {upNext.length === 0 && (
                <div className="k py-2.5" style={{ letterSpacing: '.04em' }}>
                  Everything in this {track.unitLabel.toLowerCase()} is ticked.
                </div>
              )}
              {upNext.map((u) => (
                <div
                  key={u.name}
                  className="py-2"
                  style={{ borderBottom: '1px solid rgba(29,31,32,.14)' }}
                >
                  <div className="flex justify-between gap-2">
                    <span style={{ font: '500 13px/1.35 var(--font-body)' }}>
                      {u.name}
                    </span>
                    <span className="k flex-none">{u.hours}h</span>
                  </div>
                  <div className="k mt-1" style={{ letterSpacing: '.04em' }}>
                    {u.parent}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="k mb-2">
              This week · {weekHours} of {target}h
            </div>
            <div
              className="flex h-[70px] items-end gap-1.5"
              style={{ borderBottom: '1px solid rgba(29,31,32,.35)' }}
            >
              {dayHours.map((h, i) => (
                <div
                  key={i}
                  className="flex-1"
                  style={{
                    height: `${Math.round((h / peak) * 100)}%`,
                    minHeight: h > 0 ? 2 : 0,
                    background: i === todayIndex ? ACCENT : 'rgba(89,128,166,.45)',
                  }}
                  title={`${h}h`}
                />
              ))}
            </div>
            <div className="mt-1.5 flex gap-1.5">
              {DAY_LABELS.map((d, i) => (
                <div
                  key={i}
                  className="k flex-1 text-center"
                  style={{ color: i === todayIndex ? ACCENT : undefined }}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ratio + activity */}
        <div className="flex min-w-0 flex-col gap-5">
          <div className="bx p-3.5">
            <div className="k">
              Build vs read · {recentReviews.length ? `${recentReviews.length} weeks` : 'target'}
            </div>
            <div className="mt-2 flex h-3.5">
              <div style={{ flex: builtPct ?? 70, background: ACCENT }} />
              <div style={{ flex: 100 - (builtPct ?? 70), background: 'rgba(29,31,32,.18)' }} />
            </div>
            <div className="k mt-1.5 flex justify-between">
              <span>{builtPct === null ? 'no reviews yet' : `${builtPct}% building`}</span>
              <span>target 70%</span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="k mb-2">Recent activity</div>
            <div style={{ borderTop: '1px solid rgba(29,31,32,.35)' }}>
              {activity.length === 0 && (
                <div className="k py-2.5" style={{ letterSpacing: '.04em' }}>
                  Nothing logged yet — tick something.
                </div>
              )}
              {activity.slice(0, 6).map((a) => (
                <div
                  key={a.id}
                  className="flex items-baseline gap-2.5 py-2"
                  style={{ borderBottom: '1px solid rgba(29,31,32,.14)' }}
                >
                  <span className="k w-[62px] flex-none">{ago(a.at, now)}</span>
                  <span
                    className="min-w-0 flex-1"
                    style={{ font: '400 12px/1.4 var(--font-body)' }}
                  >
                    {a.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
