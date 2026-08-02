import type { Meta, Phase } from '../types';
import {
  TOTAL_SYLLABUS_HOURS,
  hoursLogged,
  isPhaseComplete,
  topicCompletion,
} from '../types';
import { PhaseProgressStrip } from './PhaseProgressStrip';
import { ProgressBar } from './ProgressBar';

interface DashboardProps {
  phases: Phase[];
  meta: Meta | null;
  onSelectPhase: (phaseId: number) => void;
  onOpenReview: () => void;
}

interface StatProps {
  label: string;
  value: string;
  sub?: string;
}

function Stat({ label, value, sub }: StatProps): JSX.Element {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-neutral-500">{sub}</div>}
    </div>
  );
}

export function Dashboard({
  phases,
  meta,
  onSelectPhase,
  onOpenReview,
}: DashboardProps): JSX.Element {
  const allTopics = phases.flatMap((p) => p.topics);
  const topicsDone = allTopics.filter((t) => t.done).length;
  const overallPct =
    allTopics.length === 0 ? 0 : Math.round((topicsDone / allTopics.length) * 100);

  const gatesPassed = phases.filter(isPhaseComplete).length;
  const totalHoursLogged = phases.reduce((sum, p) => sum + hoursLogged(p), 0);
  const hoursPct = Math.round((totalHoursLogged / TOTAL_SYLLABUS_HOURS) * 100);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Overall topics"
          value={`${overallPct}%`}
          sub={`${topicsDone}/${allTopics.length} done`}
        />
        <Stat label="Gates passed" value={`${gatesPassed}/12`} sub="advance on gates" />
        <Stat
          label="Hours logged"
          value={`${totalHoursLogged}`}
          sub={`of ${TOTAL_SYLLABUS_HOURS}h · ${hoursPct}%`}
        />
        <Stat
          label="Weekly target"
          value={meta ? `${meta.targetHoursPerWeek}h` : '—'}
          sub={meta ? `since ${meta.startDate}` : undefined}
        />
      </div>

      <div className="card space-y-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-neutral-300">Overall progress</h2>
          <span className="text-xs text-neutral-500">
            {gatesPassed}/12 gates · {overallPct}% topics
          </span>
        </div>
        <ProgressBar percent={overallPct} />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-neutral-300">Phases</h2>
        <PhaseProgressStrip phases={phases} onSelect={onSelectPhase} />
        <p className="text-[11px] text-neutral-600">
          Bar height = topics done · green cap = gate passed. Tap a phase to open it.
        </p>
      </div>

      {/* Ratio warning */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
        <div className="flex items-start gap-3">
          <span className="text-lg leading-none">⚖️</span>
          <div>
            <div className="text-sm font-semibold text-amber-300">70/30 ratio check</div>
            <p className="mt-1 text-xs text-amber-200/80">
              Roughly 70% of your time should be <strong>building</strong>, not reading or
              watching. Hours and checkboxes measure input — the gate is the only real
              output. If reading dominates, you are stalling.
            </p>
          </div>
        </div>
      </div>

      <button className="btn-ghost w-full" onClick={onOpenReview}>
        📝 Weekly review
      </button>

      <ul className="space-y-2">
        {phases.map((phase) => {
          const pct = topicCompletion(phase);
          const complete = isPhaseComplete(phase);
          return (
            <li key={phase.id}>
              <button
                onClick={() => onSelectPhase(phase.id)}
                className="card flex w-full items-center gap-3 text-left hover:bg-surface-2"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-sm font-bold text-neutral-300">
                  {phase.id}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-white">
                      {phase.title}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <ProgressBar percent={pct} />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-500">
                    <span>{pct}% topics · {phase.hours}h</span>
                    <span
                      className={
                        complete ? 'font-medium text-emerald-400' : 'text-neutral-500'
                      }
                    >
                      {complete ? '✓ gate passed' : 'gate open'}
                    </span>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
