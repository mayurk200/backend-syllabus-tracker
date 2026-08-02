import { useEffect, useState } from 'react';
import type { NewWeeklyReview, WeeklyReview } from '../types';
import { Corners } from './Corners';

interface WeeklyReviewModalProps {
  reviews: WeeklyReview[];
  onClose: () => void;
  onSubmit: (review: NewWeeklyReview) => Promise<void>;
}

function fmtDate(ms: number): string {
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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    resize: 'none',
    background: 'var(--surface)',
    border: '1px solid var(--divider)',
    padding: 12,
    font: '400 14px/1.4 var(--font-body)',
    color: 'var(--ink)',
    borderRadius: 0,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(29,31,32,.5)' }}
      onClick={onClose}
    >
      <div
        className="blueprint flex max-h-[90dvh] w-full max-w-md flex-col p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <Corners />
        <div className="flex items-center justify-between">
          <span className="h" style={{ fontSize: 18 }}>
            WEEKLY REVIEW
          </span>
          <button
            onClick={onClose}
            className="k"
            style={{ background: 'transparent', fontSize: 14 }}
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4 overflow-y-auto">
          <label className="block">
            <span className="k">What stalled?</span>
            <textarea
              value={stalled}
              onChange={(e) => setStalled(e.target.value)}
              rows={3}
              placeholder="Where did you drift into reading instead of building?"
              className="mt-1.5"
              style={inputStyle}
            />
          </label>

          <label className="block">
            <span className="k">Next single objective</span>
            <textarea
              value={nextObjective}
              onChange={(e) => setNextObjective(e.target.value)}
              rows={2}
              placeholder="One concrete thing to build next."
              className="mt-1.5"
              style={inputStyle}
            />
          </label>

          <button
            onClick={() => void handleSubmit()}
            disabled={!canSave || saving}
            className="btn-solid"
          >
            {saving ? 'Saving…' : 'Save review'}
          </button>

          {reviews.length > 0 && (
            <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 16 }}>
              <div className="k mb-2">Past reviews</div>
              <ul className="space-y-2.5">
                {reviews.map((r) => (
                  <li key={r.id} className="bx p-3">
                    <div className="k">{fmtDate(r.createdAt)}</div>
                    {r.stalled && (
                      <p style={{ font: '400 12px/1.45 var(--font-body)', marginTop: 4 }}>
                        {r.stalled}
                      </p>
                    )}
                    {r.nextObjective && (
                      <p
                        style={{
                          font: '400 12px/1.45 var(--font-body)',
                          color: 'var(--accent)',
                          marginTop: 2,
                        }}
                      >
                        → {r.nextObjective}
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
