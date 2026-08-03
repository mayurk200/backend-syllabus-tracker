import type { TrackDef } from '../types';

interface SplashProps {
  track: TrackDef;
  label: string;
}

/**
 * The loading veil. Shown while Firestore seeds and the first snapshots land —
 * a real wait, not a decorative one, so the sweep and the bar are honest about
 * something actually happening.
 */
export function Splash({ track, label }: SplashProps): JSX.Element {
  const meta = track.targetMarks
    ? `${track.totalHours}h · ${track.unitCount} ${track.unitLabelPlural} · ${track.targetMarks} marks`
    : `${track.totalHours}h · ${track.unitCount} ${track.unitLabelPlural}`;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center px-6"
      style={{ background: 'var(--bg)', animation: 'veil .2s ease both' }}
    >
      <div className="flex w-[320px] max-w-full flex-col items-center gap-[22px]">
        <div className="blueprint relative grid h-[74px] w-[74px] place-items-center overflow-hidden">
          <span className="corner tl" />
          <span className="corner tr" />
          <span className="corner bl" />
          <span className="corner br" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg,transparent,rgba(89,128,166,.22),transparent)',
              animation: 'sweep 1.15s cubic-bezier(.4,0,.2,1) infinite',
            }}
          />
          <div
            style={{
              font: '600 22px/1 var(--font-heading)',
              letterSpacing: '.1em',
              color: 'var(--accent-700)',
            }}
          >
            GT
          </div>
        </div>

        <div className="text-center">
          <div style={{ font: '600 19px/1.1 var(--font-heading)', letterSpacing: '.06em' }}>
            {track.shortName.toUpperCase()}
          </div>
          <div
            className="k mt-2"
            style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
          >
            {label}
          </div>
        </div>

        <div
          className="h-[2px] w-full overflow-hidden"
          style={{ background: 'rgba(29,31,32,.14)' }}
        >
          <div
            className="h-full"
            style={{
              background: 'var(--accent)',
              animation: 'draw 1.5s cubic-bezier(.22,.61,.36,1) both',
            }}
          />
        </div>

        <div className="k" style={{ letterSpacing: '.2em', textTransform: 'uppercase' }}>
          {meta}
        </div>
      </div>
    </div>
  );
}
