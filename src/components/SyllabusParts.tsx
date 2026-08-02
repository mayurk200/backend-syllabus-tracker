import type { LearnFrom } from '../data/gateSyllabus';

/**
 * The pieces the Syllabus page and the unit detail page both render, so the two
 * can never drift apart in wording or layout.
 */

export const SYLLABUS_ACCENT = '#5980a6';
const RED = '#a03c3c';

export interface ViewConcept {
  name: string;
  gloss: string | null;
  /** Made explicit in the 2027 revision — no PYQ exists. */
  isNew?: boolean;
  /** Present in 2026, removed for 2027 — do not study. */
  dropped?: boolean;
}

export interface ViewChapter {
  name: string;
  /** The official syllabus fragment, or the topic's own stated scope. */
  official: string;
  /** Exactly which chapter of which book covers this. */
  source: string | null;
  concepts: ViewConcept[];
}

export function Flag({ kind }: { kind: 'new' | 'dropped' }): JSX.Element {
  const colour = kind === 'new' ? RED : 'rgba(29,31,32,.45)';
  return (
    <span
      className="flex-none"
      style={{
        font: '600 8.5px var(--font-heading)',
        letterSpacing: '.12em',
        color: colour,
        border: `1px solid ${colour}`,
        padding: '2px 4px',
      }}
    >
      {kind === 'new' ? 'NEW 2027' : 'NOT IN 2027'}
    </span>
  );
}

/** Books, one lecture course, and where the drilling happens. Plain text — no links. */
export function LearnFromBlock({ learn }: { learn: LearnFrom }): JSX.Element {
  const rows: Array<{ label: string; items: string[] }> = [
    { label: 'Read', items: learn.text },
    { label: 'Watch — pick one', items: learn.lectures },
    { label: 'Practise', items: learn.practice },
  ];
  return (
    <div className="bx p-3.5">
      <div className="k mb-2.5">Learn from</div>
      <div className="grid gap-3.5 md:grid-cols-3">
        {rows.map((r) => (
          <div key={r.label} className="min-w-0">
            <div className="k mb-1.5" style={{ color: SYLLABUS_ACCENT }}>
              {r.label}
            </div>
            {r.items.map((item) => (
              <div
                key={item}
                className="mb-1"
                style={{
                  font: '400 12px/1.5 var(--font-body)',
                  color: 'rgba(29,31,32,.72)',
                }}
              >
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div
        className="mt-3 pt-2.5"
        style={{
          borderTop: '1px solid rgba(29,31,32,.14)',
          font: '400 12px/1.5 var(--font-body)',
          color: 'rgba(29,31,32,.55)',
        }}
      >
        {learn.note}
      </div>
    </div>
  );
}

/** "Read — Rosen, Ch. 1, §1.1–1.3" — the pointer to the exact book chapter. */
export function SourceLine({ source }: { source: string }): JSX.Element {
  return (
    <div
      className="py-1 pl-2.5"
      style={{
        borderLeft: '2px solid rgba(89,128,166,.45)',
        font: '400 11.5px/1.5 var(--font-body)',
        color: 'rgba(29,31,32,.62)',
      }}
    >
      <span className="k" style={{ marginRight: 6 }}>
        Read
      </span>
      {source}
    </div>
  );
}

export function ConceptRow({ concept }: { concept: ViewConcept }): JSX.Element {
  return (
    <div
      className="flex items-start gap-3 py-2"
      style={{ borderBottom: '1px solid rgba(29,31,32,.14)' }}
    >
      <span
        className="mt-1.5 h-1 w-1 flex-none"
        style={{ background: concept.dropped ? 'rgba(29,31,32,.3)' : SYLLABUS_ACCENT }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span
            style={{
              font: '500 13px/1.4 var(--font-body)',
              color: concept.dropped ? 'rgba(29,31,32,.45)' : 'var(--ink)',
              textDecoration: concept.dropped ? 'line-through' : 'none',
            }}
          >
            {concept.name}
          </span>
          {concept.isNew && <Flag kind="new" />}
          {concept.dropped && <Flag kind="dropped" />}
        </div>
        {concept.gloss && (
          <div
            className="mt-0.5"
            style={{ font: '400 12px/1.5 var(--font-body)', color: 'rgba(29,31,32,.6)' }}
          >
            {concept.gloss}
          </div>
        )}
      </div>
    </div>
  );
}

/** One chapter: its official scope, the book chapter to read, then every concept. */
export function ChapterBlock({ chapter }: { chapter: ViewChapter }): JSX.Element {
  return (
    <div className="mb-5">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <span
          style={{ font: '600 14px/1.2 var(--font-heading)', letterSpacing: '.02em' }}
        >
          {chapter.name}
        </span>
        <span className="k">{chapter.concepts.length} concepts</span>
      </div>
      <div
        className="mb-1.5"
        style={{ font: '400 11.5px/1.5 var(--font-body)', color: 'rgba(29,31,32,.5)' }}
      >
        {chapter.official}
      </div>
      {chapter.source && (
        <div className="mb-2">
          <SourceLine source={chapter.source} />
        </div>
      )}
      <div style={{ borderTop: '1px solid rgba(29,31,32,.35)' }}>
        {chapter.concepts.map((c) => (
          <ConceptRow key={c.name} concept={c} />
        ))}
      </div>
    </div>
  );
}
