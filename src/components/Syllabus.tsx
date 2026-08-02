import { useMemo, useState } from 'react';
import type { Phase, TrackDef } from '../types';
import type { LearnFrom } from '../data/gateSyllabus';
import {
  GATE_LEARN_FROM,
  GATE_SYLLABUS,
  GATE_SYLLABUS_SOURCE,
  chapterSource,
} from '../data/gateSyllabus';
import {
  BACKEND_LEARN_FROM,
  backendGloss,
  backendTopicSource,
} from '../data/backendSyllabus';
import { Corners } from './Corners';
import type { ViewChapter, ViewConcept } from './SyllabusParts';
import { ChapterBlock, LearnFromBlock } from './SyllabusParts';

interface SyllabusProps {
  track: TrackDef;
  phases: Phase[];
  onSelectPhase: (phaseId: number) => void;
}

const ACCENT = '#5980a6';

type Filter = 'all' | 'new' | 'dropped';

interface ViewUnit {
  key: string;
  /** Tracker unit id, when this maps onto a phase/subject you can open. */
  unitId: number | null;
  section: string;
  title: string;
  official: string;
  chapters: ViewChapter[];
  learn?: LearnFrom;
}

/** Both tracks reduced to one shape the page can render. */
function buildUnits(track: TrackDef, phases: Phase[]): ViewUnit[] {
  if (track.id === 'gate') {
    return GATE_SYLLABUS.map((u) => ({
      key: `gate-${u.unitId}`,
      unitId: u.unitId,
      section: u.section,
      title: u.title,
      official: u.official,
      learn: GATE_LEARN_FROM[u.unitId],
      chapters: u.chapters.map((c) => ({
        name: c.name,
        official: c.official,
        source: chapterSource(u.unitId, c.name),
        concepts: c.concepts.map((x) => ({
          name: x.name,
          gloss: x.gloss,
          isNew: x.isNew,
          dropped: x.dropped,
        })),
      })),
    }));
  }

  // Backend: the study plan in Firestore is the syllabus, enriched with glosses.
  return phases.map((p) => ({
    key: `backend-${p.id}`,
    unitId: p.id,
    section: `Phase ${p.id}`,
    title: p.title,
    official: p.description,
    learn: BACKEND_LEARN_FROM[p.title],
    chapters: p.topics.map((t) => ({
      name: t.name,
      official: t.detail,
      source: backendTopicSource(p.title, t.name),
      concepts: t.subtopics.map((s) => ({
        name: s.name,
        gloss: backendGloss(s.name),
      })),
    })),
  }));
}

function matches(c: ViewConcept, chapter: ViewChapter, unit: ViewUnit, q: string): boolean {
  if (!q) return true;
  return (
    c.name.toLowerCase().includes(q) ||
    (c.gloss?.toLowerCase().includes(q) ?? false) ||
    chapter.name.toLowerCase().includes(q) ||
    unit.title.toLowerCase().includes(q)
  );
}

/**
 * The reference page: every chapter and every concept, with a line explaining
 * each one. Read-only on purpose — ticking lives on the study plan, so the two
 * can never disagree.
 */
export function Syllabus({ track, phases, onSelectPhase }: SyllabusProps): JSX.Element {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<Set<string>>(() => new Set());

  const units = useMemo(() => buildUnits(track, phases), [track, phases]);
  const q = query.trim().toLowerCase();

  // Apply the search and the new/dropped filter, dropping anything left empty.
  const filtered = useMemo(() => {
    return units
      .map((u) => {
        const chapters = u.chapters
          .map((c) => ({
            ...c,
            concepts: c.concepts.filter((x) => {
              if (filter === 'new' && !x.isNew) return false;
              if (filter === 'dropped' && !x.dropped) return false;
              return matches(x, c, u, q);
            }),
          }))
          .filter((c) => c.concepts.length > 0);
        return { ...u, chapters };
      })
      .filter((u) => u.chapters.length > 0);
  }, [units, q, filter]);

  const totalConcepts = units.reduce(
    (s, u) => s + u.chapters.reduce((n, c) => n + c.concepts.length, 0),
    0,
  );
  const totalChapters = units.reduce((s, u) => s + u.chapters.length, 0);
  const shownConcepts = filtered.reduce(
    (s, u) => s + u.chapters.reduce((n, c) => n + c.concepts.length, 0),
    0,
  );
  const searching = q.length > 0 || filter !== 'all';

  const isOpen = (key: string): boolean => searching || open.has(key);

  const toggle = (key: string): void => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = (): void => setOpen(new Set(units.map((u) => u.key)));
  const collapseAll = (): void => setOpen(new Set());

  const filters: Array<{ id: Filter; label: string }> = [
    { id: 'all', label: 'Everything' },
    ...(track.id === 'gate'
      ? ([
          { id: 'new' as Filter, label: 'New in 2027' },
          { id: 'dropped' as Filter, label: 'Dropped for 2027' },
        ] as Array<{ id: Filter; label: string }>)
      : []),
  ];

  return (
    <div className="space-y-5">
      {/* ── head ──────────────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-end justify-between gap-3 pb-3.5"
        style={{ borderBottom: '1px solid var(--ink)' }}
      >
        <div>
          <div className="k">{track.name}</div>
          <div style={{ font: '600 26px/1.05 var(--font-heading)', marginTop: 4 }}>
            Syllabus
          </div>
        </div>
        <span className="k">
          {units.length} {track.unitLabelPlural.toLowerCase()} · {totalChapters} chapters ·{' '}
          {totalConcepts} concepts
        </span>
      </div>

      {/* ── provenance ────────────────────────────────────────────────── */}
      <div className="blueprint p-3.5">
        <Corners />
        <div className="k mb-1.5">Where this comes from</div>
        {track.id === 'gate' ? (
          <p style={{ font: '400 12.5px/1.6 var(--font-body)', color: 'rgba(29,31,32,.7)' }}>
            The quoted lines under each subject are the verbatim text of the{' '}
            {GATE_SYLLABUS_SOURCE.label} — {GATE_SYLLABUS_SOURCE.where}. Everything below
            each quoted line is the standard expansion of it from the reference texts the
            paper is set from. Nothing here is in scope unless the official line covers it.
          </p>
        ) : (
          <p style={{ font: '400 12.5px/1.6 var(--font-body)', color: 'rgba(29,31,32,.7)' }}>
            There is no external authority for this track — the plan itself is the syllabus.
            The quoted line under each phase and chapter is its own stated scope, taken live
            from the database, and each concept carries a line explaining what it is and why
            it earns its place.
          </p>
        )}
      </div>

      {/* ── search and filters ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search every concept…"
          className="min-w-0 flex-1"
          style={{
            height: 38,
            padding: '0 12px',
            background: 'transparent',
            border: '1px solid var(--divider-strong)',
            borderRadius: 0,
            font: '400 13px var(--font-body)',
            color: 'var(--ink)',
          }}
        />
        {filters.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="btn-line"
              style={{
                height: 38,
                paddingLeft: 12,
                paddingRight: 12,
                background: active ? 'rgba(89,128,166,.10)' : 'transparent',
                borderColor: active ? ACCENT : undefined,
                color: active ? ACCENT : undefined,
              }}
            >
              {f.label}
            </button>
          );
        })}
        <button className="btn-line" style={{ height: 38, paddingLeft: 12, paddingRight: 12 }} onClick={expandAll}>
          Expand all
        </button>
        <button className="btn-line" style={{ height: 38, paddingLeft: 12, paddingRight: 12 }} onClick={collapseAll}>
          Collapse
        </button>
      </div>

      <div className="k">
        {searching
          ? `${shownConcepts} of ${totalConcepts} concepts match`
          : `${totalConcepts} concepts · tap a ${track.unitLabel.toLowerCase()} to open it`}
      </div>

      {/* ── the syllabus ──────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="bx p-4">
          <div className="k" style={{ letterSpacing: '.04em' }}>
            Nothing matches “{query}”.
          </div>
        </div>
      )}

      {filtered.map((u) => {
        const expanded = isOpen(u.key);
        const conceptCount = u.chapters.reduce((n, c) => n + c.concepts.length, 0);
        return (
          <div key={u.key} style={{ borderTop: '1px solid rgba(29,31,32,.35)' }}>
            <div className="flex items-start gap-3 py-3">
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => toggle(u.key)}
                aria-expanded={expanded}
              >
                <span className="k">{u.section}</span>
                <span
                  className="mt-1 block"
                  style={{ font: '600 19px/1.15 var(--font-heading)' }}
                >
                  {u.title}
                </span>
              </button>
              <span className="k mt-1 flex-none">
                {u.chapters.length} ch · {conceptCount}
              </span>
              {u.unitId !== null && (
                <button
                  className="btn-line mt-0.5 flex-none"
                  style={{ height: 26, paddingLeft: 10, paddingRight: 10 }}
                  onClick={() => onSelectPhase(u.unitId as number)}
                >
                  Open
                </button>
              )}
              <button
                className="k mt-1 flex-none"
                onClick={() => toggle(u.key)}
                aria-label={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded ? '▾' : '▸'}
              </button>
            </div>

            {expanded && (
              <div className="pb-5">
                {/* the official scope for the whole subject */}
                <blockquote
                  className="mb-4 py-1 pl-3.5"
                  style={{
                    borderLeft: `2px solid ${ACCENT}`,
                    font: '400 12.5px/1.6 var(--font-body)',
                    color: 'rgba(29,31,32,.7)',
                    margin: 0,
                  }}
                >
                  {u.official}
                </blockquote>

                {u.learn && (
                  <div className="mb-5">
                    <LearnFromBlock learn={u.learn} />
                  </div>
                )}

                {u.chapters.map((c) => (
                  <ChapterBlock key={c.name} chapter={c} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
