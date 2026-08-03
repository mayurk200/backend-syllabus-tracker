import { useCallback, useEffect, useRef, useState } from 'react';

const VISIBLE_MS = 4200;

/**
 * A single transient confirmation, bottom-centre. Only raised for things that
 * genuinely happened — a unit completing, a week passing — never as decoration.
 */
export function Toast({ text }: { text: string }): JSX.Element {
  return (
    <div
      className="bx fixed bottom-8 left-1/2 z-45 flex items-center gap-3.5 px-5 py-3.5"
      style={{
        transform: 'translateX(-50%)',
        background: 'var(--bg)',
        animation: 'fadeUp .28s cubic-bezier(.22,.61,.36,1) both',
      }}
      role="status"
      aria-live="polite"
    >
      <span
        className="grid h-[18px] w-[18px] place-items-center"
        style={{
          background: 'var(--accent)',
          color: '#fff',
          font: '600 11px var(--font-heading)',
          animation: 'tick .3s .1s cubic-bezier(.22,.61,.36,1) both',
        }}
      >
        ✓
      </span>
      <span style={{ font: '500 13px var(--font-body)' }}>{text}</span>
    </div>
  );
}

/** Raise a toast, and clear it again after a few seconds. */
export function useToast(): { toast: string; raise: (text: string) => void } {
  const [toast, setToast] = useState('');
  const timer = useRef<number | undefined>(undefined);

  const raise = useCallback((text: string) => {
    setToast(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(''), VISIBLE_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { toast, raise };
}
