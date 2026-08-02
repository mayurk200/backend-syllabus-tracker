import { useEffect, useState } from 'react';
import type { NewWeeklyReview, WeeklyReview } from '../types';

interface WeeklyReviewModalProps {
  reviews: WeeklyReview[];
  onClose: () => void;
  onSubmit: (review: NewWeeklyReview) => Promise<void>;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function WeeklyReviewModal({
  reviews,
  onClose,
  onSubmit,
}: WeeklyReviewModalProps): JSX.Element {
  const [stalled, setStalled] = useState('');
  const [nextObjective, setNextObjective] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const canSave = stalled.trim().length > 0 || nextObjective.trim().length > 0;

  const handleSubmit = async (): Promise<void> => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSubmit({
        stalled: stalled.trim(),
        nextObjective: nextObjective.trim(),
        createdAt: Date.now(),
      });
      setStalled('');
      setNextObjective('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-md flex-col rounded-t-2xl border border-border bg-surface p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Weekly review</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4 overflow-y-auto">
          <label className="block space-y-1">
            <span className="text-sm font-medium text-neutral-300">What stalled?</span>
            <textarea
              value={stalled}
              onChange={(e) => setStalled(e.target.value)}
              rows={3}
              placeholder="Where did you get stuck or drift into reading instead of building?"
              className="w-full resize-none rounded-lg border border-border bg-surface-2 p-3 text-sm text-white placeholder:text-neutral-600 focus:border-accent focus:outline-none"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-neutral-300">
              Next single objective
            </span>
            <textarea
              value={nextObjective}
              onChange={(e) => setNextObjective(e.target.value)}
              rows={2}
              placeholder="One concrete thing to build next."
              className="w-full resize-none rounded-lg border border-border bg-surface-2 p-3 text-sm text-white placeholder:text-neutral-600 focus:border-accent focus:outline-none"
            />
          </label>

          <button
            onClick={() => void handleSubmit()}
            disabled={!canSave || saving}
            className="btn-primary w-full"
          >
            {saving ? 'Saving…' : 'Save review'}
          </button>

          {reviews.length > 0 && (
            <div className="space-y-2 border-t border-border pt-4">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500">
                Past reviews
              </h3>
              <ul className="space-y-3">
                {reviews.map((r) => (
                  <li key={r.id} className="rounded-lg bg-surface-2 p-3">
                    <div className="text-[11px] text-neutral-500">
                      {formatDate(r.createdAt)}
                    </div>
                    {r.stalled && (
                      <p className="mt-1 text-xs text-neutral-300">
                        <span className="text-neutral-500">Stalled: </span>
                        {r.stalled}
                      </p>
                    )}
                    {r.nextObjective && (
                      <p className="mt-1 text-xs text-neutral-300">
                        <span className="text-neutral-500">Next: </span>
                        {r.nextObjective}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
