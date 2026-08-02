import type { Meta, Phase } from '../types';
import {
  TOTAL_SYLLABUS_HOURS,
  hoursLogged,
  isPhaseComplete,
  topicCompletion,
} from '../types';
import { Corners } from './Corners';

interface ProgressProps {
  phases: Phase[];
  meta: Meta | null;
  onSelectPhase: (phaseId: number) => void;
}

const ACCENT = '#5980a6';
const MUTED = 'rgba(29,31,32,.55)';
const FILL = 'rgba(89,128,166,.28)';
const BARBG = 'rgba(29,31,32,.14)';

function weeksSince(startDate: string | undefined): number {
  if (!startDate) return 0;
  const start = new Date(startDate).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.max(1, Math.floor((Date.now() - start) / (7 * 86_400_000)));
}

export function Progress({ phases, meta, onSelectPhase }: ProgressProps): JSX.Element {
  const gatesPassed = phases.filter(isPhaseComplete).length;
  const totalHours = phases.reduce((sum, p) => sum + hoursLogged(p), 0);
  const allTopics = phases.flatMap((p) => p.topics);
  const topicsDone = allTopics.filter((t) => t.done).length;
  const topicPct =
    allTopics.length === 0 ? 0 : Math.round((topicsDone / allTopics.length) * 100);
  const week = weeksSince(meta?.startDate);

  return (
    <div className="space-y-6">
      {/* Instrument panel (1b): output vs input, then the phase matrix */}
      <div className="blueprint p-4">
        <Corners />
        <div className="mb-3.5 flex items-baseline justify-between">
          <span className="h">PROGRESS</span>
          <span className="k">{week ? `week ${week}` : 'not started'}</span>
        </div>

        {/* Output (gates) emphasized over input (hours) — advance on the gate */}
        <div
          className="mb-4 grid grid-cols-2 gap-px border"
          style={{ background: 'rgba(29,31,32,.35)', borderColor: 'rgba(29,31,32,.35)' }}
        >
          <div className="bg-bg p-3">
            <div className="k">Output — gates</div>
            <div style={{ font: '600 34px/1 var(--font-heading)', color: ACCENT }}>
              {gatesPassed}/12
            </div>
            <div className="k" style={{ letterSpacing: '.06em' }}>
              the only real measure
            </div>
          </div>
          <div className="bg-bg p-3">
            <div className="k">Input — hours</div>
            <div style={{ font: '600 20px/1.2 var(--font-heading)', color: MUTED }}>
              {totalHours}
              <span style={{ fontSize: 15 }}>/{TOTAL_SYLLABUS_HOURS}</span>
            </div>
            <div className="k" style={{ letterSpacing: '.06em' }}>
              {topicPct}% topics checked
            </div>
          </div>
        </div>

        <div className="k mb-2">Phase matrix — fill = topics · cap = gate</div>
        <div className="grid grid-cols-4 gap-1.5">
          {phases.map((p) => {
            const pct = topicCompletion(p);
            const passed = isPhaseComplete(p);
            return (
              <button
                key={p.id}
                onClick={() => onSelectPhase(p.id)}
                className="bx relative h-[52px] overflow-hidden"
                title={`Phase ${p.id} — ${p.title}`}
              >
                <div
                  className="absolute inset-x-0 bottom-0"
                  style={{ height: `${pct}%`, background: FILL }}
                />
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: passed ? ACCENT : 'transparent' }}
                />
                <span
                  className="absolute inset-0 grid place-items-center"
                  style={{ font: '600 13px var(--font-heading)' }}
                >
                  {p.id}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ratio — shown as principle/target, not a fabricated number */}
      <div className="blueprint p-4">
        <Corners />
        <div className="k mb-2">Ratio — build vs read</div>
        <div className="flex h-3.5">
          <div style={{ flex: 70, background: ACCENT }} />
          <div style={{ flex: 30, background: 'rgba(29,31,32,.18)' }} />
        </div>
        <div className="k mt-1.5 flex justify-between">
          <span>aim ~70% building</span>
          <span>30% reading</span>
        </div>
        <p
          className="mt-2.5"
          style={{
            font: '400 12px/1.45 var(--font-body)',
            color: 'rgba(29,31,32,.6)',
          }}
        >
          Spend most of your time building, not reading. The gate is the only real
          output — hours and checkboxes are just input.
        </p>
      </div>

      {/* Gate ladder (1a): tappable, shows each gate artifact */}
      <div className="blueprint p-4">
        <Corners />
        <div className="mb-3 flex items-baseline justify-between">
          <span className="h">GATE LADDER</span>
          <span className="k">{gatesPassed} of 12 gates</span>
        </div>
        <div className="flex flex-col">
          {phases.map((p) => {
            const pct = topicCompletion(p);
            const passed = isPhaseComplete(p);
            return (
              <button
                key={p.id}
                onClick={() => onSelectPhase(p.id)}
                className="flex items-start gap-3 py-2.5 text-left"
                style={{ borderTop: '1px solid rgba(29,31,32,.18)' }}
              >
                <div
                  className="bx grid h-[26px] w-[26px] flex-none place-items-center"
                  style={{
                    font: '600 12px var(--font-heading)',
                    background: passed ? ACCENT : 'transparent',
                    color: passed ? '#fff' : 'var(--ink)',
                  }}
                >
                  {p.id}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span style={{ font: '500 13px var(--font-body)' }}>{p.title}</span>
                    <span className="k" style={{ color: passed ? ACCENT : undefined }}>
                      {passed ? 'PASSED' : 'OPEN'}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1" style={{ background: BARBG }}>
                    <div
                      className="h-full"
                      style={{ width: `${pct}%`, background: 'rgba(89,128,166,.55)' }}
                    />
                  </div>
                  <div
                    className="mt-1.5"
                    style={{
                      font: '400 11px/1.35 var(--font-body)',
                      color: 'rgba(29,31,32,.55)',
                    }}
                  >
                    {p.gate}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
