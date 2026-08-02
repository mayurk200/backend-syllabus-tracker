import { useState } from 'react';
import type { Phase } from '../types';
import { hoursLogged, topicCompletion } from '../types';
import { ProgressBar } from './ProgressBar';

interface PhaseDetailProps {
  phase: Phase;
  onBack: () => void;
  onToggleTopic: (topicIndex: number, done: boolean) => Promise<void>;
  onToggleGate: (gatePassed: boolean) => Promise<void>;
}

export function PhaseDetail({
  phase,
  onBack,
  onToggleTopic,
  onToggleGate,
}: PhaseDetailProps): JSX.Element {
  const [busyTopic, setBusyTopic] = useState<number | null>(null);
  const [busyGate, setBusyGate] = useState(false);

  const pct = topicCompletion(phase);
  const logged = hoursLogged(phase);

  const handleTopic = async (index: number, done: boolean): Promise<void> => {
    setBusyTopic(index);
    try {
      await onToggleTopic(index, done);
    } finally {
      setBusyTopic(null);
    }
  };

  const handleGate = async (): Promise<void> => {
    const next = !phase.gatePassed;
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
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-neutral-400 hover:text-white">
        ← Dashboard
      </button>

      <header className="space-y-1">
        <div className="text-xs uppercase tracking-wide text-neutral-500">
          Phase {phase.id}
        </div>
        <h1 className="text-xl font-bold text-white">{phase.title}</h1>
        <p className="text-sm text-neutral-400">{phase.description}</p>
      </header>

      {/* GATE BOX — prominent, at the top */}
      <div
        className={`rounded-xl border p-4 ${
          phase.gatePassed
            ? 'border-emerald-500/40 bg-emerald-500/10'
            : 'border-accent/40 bg-accent/10'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-300">
            🚪 Gate — {phase.gatePassed ? 'passed' : 'open'}
          </span>
          <span
            className={`text-xs font-medium ${
              phase.gatePassed ? 'text-emerald-400' : 'text-neutral-500'
            }`}
          >
            {phase.gatePassed ? '✓ complete' : 'not complete'}
          </span>
        </div>
        <p className="mt-2 text-sm text-neutral-100">{phase.gate}</p>
        <button
          onClick={() => void handleGate()}
          disabled={busyGate}
          className={phase.gatePassed ? 'btn-ghost mt-3 w-full' : 'btn-primary mt-3 w-full'}
        >
          {busyGate
            ? 'Saving…'
            : phase.gatePassed
              ? 'Reopen gate'
              : 'Mark gate passed'}
        </button>
        <p className="mt-2 text-[11px] text-neutral-500">
          You advance on the gate, not on hours. Checking every topic does not complete
          the phase.
        </p>
      </div>

      {/* Topic completion — SEPARATE indicator from gate */}
      <div className="card space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-neutral-300">Topics</span>
          <span className="text-xs text-neutral-500">
            {pct}% · {logged}/{phase.hours}h logged
          </span>
        </div>
        <ProgressBar percent={pct} />
      </div>

      <ul className="space-y-2">
        {phase.topics.map((topic, index) => (
          <li key={topic.name} className="card">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={topic.done}
                disabled={busyTopic === index}
                onChange={(e) => void handleTopic(index, e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-accent"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-sm font-medium ${
                      topic.done ? 'text-neutral-500 line-through' : 'text-white'
                    }`}
                  >
                    {topic.name}
                  </span>
                  <span className="shrink-0 text-xs text-neutral-500">{topic.hours}h</span>
                </div>
                <p className="mt-1 text-xs text-neutral-400">{topic.detail}</p>
              </div>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
