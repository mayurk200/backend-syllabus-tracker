import type { Phase } from '../types';
import { isPhaseComplete, topicCompletion } from '../types';

interface PhaseProgressStripProps {
  phases: Phase[];
  onSelect: (phaseId: number) => void;
}

export function PhaseProgressStrip({
  phases,
  onSelect,
}: PhaseProgressStripProps): JSX.Element {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {phases.map((phase) => {
        const complete = isPhaseComplete(phase);
        const pct = topicCompletion(phase);
        return (
          <button
            key={phase.id}
            onClick={() => onSelect(phase.id)}
            title={`Phase ${phase.id} — ${phase.title} · ${pct}% topics · gate ${
              complete ? 'passed' : 'open'
            }`}
            className="group flex min-w-0 flex-1 flex-col items-center gap-1"
          >
            <div className="relative h-12 w-full overflow-hidden rounded-md border border-border bg-surface-2">
              {/* topic fill */}
              <div
                className="absolute bottom-0 left-0 right-0 bg-accent/30"
                style={{ height: `${pct}%` }}
              />
              {/* gate marker */}
              {complete && (
                <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500" />
              )}
              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-neutral-300">
                {phase.id}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
