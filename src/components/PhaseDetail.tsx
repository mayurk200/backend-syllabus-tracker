import { useState } from 'react';
import type { Phase } from '../types';
import { hoursLogged, isPhaseComplete } from '../types';
import { Corners } from './Corners';

interface PhaseDetailProps {
  phase: Phase;
  phases: Phase[]; // for the pip track across all 12
  onBack: () => void;
  onToggleTopic: (topicIndex: number, done: boolean) => Promise<void>;
  onToggleGate: (gatePassed: boolean) => Promise<void>;
}

const ACCENT = '#5980a6';

export function PhaseDetail({
  phase,
  phases,
  onBack,
  onToggleTopic,
  onToggleGate,
}: PhaseDetailProps): JSX.Element {
  const [busyTopic, setBusyTopic] = useState<number | null>(null);
  const [busyGate, setBusyGate] = useState(false);

  const topicsDone = phase.topics.filter((t) => t.done).length;
  const logged = hoursLogged(phase);

  const handleTopic = async (index: number, done: boolean): Promise<void> => {
    setBusyTopic(index);
    try {
      await onToggleTopic(index, done);
    } finally {
      setBusyTopic(null);
    }
  };

  const handleGate = async (next: boolean): Promise<void> => {
    if (next === phase.gatePassed) return;
    const msg = next
      ? `Mark the gate for "${phase.title}" as PASSED?\n\nGate: ${phase.gate}\n\nOnly do this once the artifact actually exists.`
      : `Reopen the gate for "${phase.title}"? This marks the phase incomplete again.`;
    if (!window.confirm(msg)) return;
    setBusyGate(true);
    try {
      await onToggleGate(next);
    } finally {
      setBusyGate(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="k mb-4"
        style={{ letterSpacing: '.1em', background: 'transparent' }}
      >
        ‹ back to progress
      </button>

      <div className="blueprint p-4">
        <Corners />

        {/* pip track across all phases */}
        <div className="mb-4 flex gap-1">
          {phases.map((p) => (
            <div
              key={p.id}
              className="h-1.5 flex-1"
              style={{ background: isPhaseComplete(p) ? ACCENT : 'rgba(29,31,32,.16)' }}
            />
          ))}
        </div>

        <div className="k">
          Phase {phase.id} of 12 · gate {phase.gatePassed ? 'passed' : 'open'}
        </div>
        <div style={{ font: '600 26px/1.05 var(--font-heading)', margin: '6px 0 4px' }}>
          {phase.title}
        </div>
        <p
          className="mb-4"
          style={{ font: '400 12px/1.4 var(--font-body)', color: 'rgba(29,31,32,.6)' }}
        >
          {phase.description}
        </p>

        <div className="md:grid md:grid-cols-[380px_1fr] md:items-start md:gap-7">
          {/* Left: gate artifact + topics-logged bar */}
          <div className="md:sticky md:top-4">
            <div className="bx mb-4 p-3.5">
              <div className="k mb-2">Gate artifact</div>
              <div style={{ font: '400 14px/1.45 var(--font-body)' }}>{phase.gate}</div>
              <div className="mt-3.5 flex gap-2">
                <button
                  className="btn-solid"
                  disabled={busyGate}
                  onClick={() => void handleGate(true)}
                  style={
                    phase.gatePassed ? { background: ACCENT, opacity: 1 } : undefined
                  }
                >
                  {phase.gatePassed ? '✓ passed' : busyGate ? '…' : 'Mark passed'}
                </button>
                <button
                  className="btn-line"
                  style={{ width: 110 }}
                  disabled={busyGate}
                  onClick={() => void handleGate(false)}
                >
                  Not yet
                </button>
              </div>
              <div className="k mt-2" style={{ letterSpacing: '.04em' }}>
                you advance on the gate, not on hours
              </div>
            </div>

            <div className="bx mb-4 p-3.5">
              <div className="k mb-2">Topics logged</div>
              <div className="h-2.5" style={{ background: 'rgba(29,31,32,.14)' }}>
                <div
                  className="h-full"
                  style={{
                    width: `${phase.hours ? Math.round((logged / phase.hours) * 100) : 0}%`,
                    background: ACCENT,
                  }}
                />
              </div>
              <div className="k mt-1.5 flex justify-between">
                <span>{phase.hours ? Math.round((logged / phase.hours) * 100) : 0}%</span>
                <span>
                  {logged}/{phase.hours}h
                </span>
              </div>
            </div>
          </div>

          {/* Right: supporting-topic checklist */}
          <div>
            <div className="k mb-2">
              Supporting topics — {topicsDone} of {phase.topics.length} · {logged}/
              {phase.hours}h
            </div>
            <div
              className="flex flex-col gap-px"
              style={{
                background: 'rgba(29,31,32,.2)',
                border: '1px solid rgba(29,31,32,.35)',
              }}
            >
              {phase.topics.map((topic, index) => (
            <label
              key={topic.name}
              className="flex cursor-pointer items-start gap-2.5 bg-bg px-3 py-2.5"
            >
              <input
                type="checkbox"
                checked={topic.done}
                disabled={busyTopic === index}
                onChange={(e) => void handleTopic(index, e.target.checked)}
                className="sr-only"
              />
              <span
                className="bx mt-0.5 grid h-[15px] w-[15px] flex-none place-items-center"
                style={{ background: topic.done ? ACCENT : 'transparent' }}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span
                    style={{
                      font: '500 13px var(--font-body)',
                      color: topic.done ? 'rgba(29,31,32,.45)' : 'var(--ink)',
                      textDecoration: topic.done ? 'line-through' : 'none',
                    }}
                  >
                    {topic.name}
                  </span>
                  <span className="k flex-none">{topic.hours}h</span>
                </span>
                <span
                  className="mt-1 block"
                  style={{
                    font: '400 11px/1.4 var(--font-body)',
                    color: 'rgba(29,31,32,.5)',
                  }}
                >
                  {topic.detail}
                </span>
              </span>
            </label>
          ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
