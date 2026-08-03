import { describe, expect, it } from 'vitest';
import { GATE_SUBJECTS } from '../data/gateData';
import { GATE_WEEKS } from '../data/gateWeeks';
import { SEED_PHASES } from '../data/seedData';
import { backlogHours, buildBacklog } from './backlog';
import { rowState } from '../components/Backlog';
import type { BacklogItem, Phase, WeekEntry } from '../types';
import { studyDayIndexes, swapUpdates, weekEndMs } from '../types';

/**
 * The backlog answers one question — what do I still owe? — and answers it
 * differently on each track, because only one of them has dates. It has been
 * wrong twice in ways that were invisible on the page (90 phantom rows once, a
 * whole week silently vanishing once), so these check the counts and the states
 * rather than trusting the shape of the code.
 */

const MID = new Date('2026-10-01T12:00:00').getTime();
const BEFORE = new Date('2026-07-01T12:00:00').getTime();

const clone = (src: readonly Phase[]): Phase[] =>
  src.map((p) => ({
    ...p,
    topics: p.topics.map((t) => ({
      ...t,
      subtopics: t.subtopics.map((s) => ({ ...s })),
    })),
  }));

const gatePhases = () => clone(GATE_SUBJECTS);
const backendPhases = () => clone(SEED_PHASES);
const weeks = (): WeekEntry[] => GATE_WEEKS.map((w) => ({ ...w }));
const byId = (id: string): WeekEntry => {
  const w = weeks().find((x) => x.id === id);
  if (!w) throw new Error(id);
  return w;
};
const noneDone = (w: WeekEntry): WeekEntry => ({ ...w, dayDone: w.days.map(() => false) });
const allDone = (w: WeekEntry): WeekEntry => ({ ...w, dayDone: w.days.map(() => true) });
const swap = (a: WeekEntry, b: WeekEntry, now = MID): [WeekEntry, WeekEntry] => {
  const [ua, ub] = swapUpdates(a, b, now);
  return [{ ...a, ...ua }, { ...b, ...ub }];
};

/** What the TopNav badge counts. */
const badge = (items: BacklogItem[]): number =>
  items.filter((i) => !i.completedLate && !i.rescheduled).length;

// ---------------------------------------------------------------------------

describe('every row, whatever produced it', () => {
  const everyKind = (): BacklogItem[] => [
    ...buildBacklog('gate', [], [noneDone(byId('W1'))], MID),
    ...buildBacklog('gate', [], [swap(noneDone(byId('W10')), byId('W2'))[0]], MID),
    ...buildBacklog('backend', started(2), [], MID),
  ];

  it('carries all four state flags, so no consumer reads undefined', () => {
    for (const i of everyKind()) {
      expect(typeof i.completedLate, i.id).toBe('boolean');
      expect(typeof i.rescheduled, i.id).toBe('boolean');
      expect(typeof i.stranded, i.id).toBe('boolean');
      expect(i.missedAt === null || typeof i.missedAt === 'number').toBe(true);
    }
  });

  it('is in exactly one state, so the row cannot render two colours', () => {
    for (const i of everyKind()) {
      const on = [i.completedLate, i.rescheduled, i.stranded].filter(Boolean);
      expect(on.length, `${i.id} is in ${on.length} states`).toBeLessThanOrEqual(1);
    }
  });

  it('has a unique id, so React keys never collide', () => {
    const ids = everyKind().map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('always points somewhere to go and tick the work', () => {
    for (const i of everyKind()) {
      expect(i.unitId !== undefined || i.weekId !== undefined, i.id).toBe(true);
    }
  });

  it('gives each state its own colour and label', () => {
    const base: BacklogItem = {
      id: 'x',
      kind: 'week',
      title: 't',
      detail: 'd',
      hours: 1,
      missedAt: 1,
      completedLate: false,
      rescheduled: false,
      stranded: false,
    };
    const late = rowState(base);
    const caught = rowState({ ...base, completedLate: true });
    const resched = rowState({ ...base, rescheduled: true });
    const strand = rowState({ ...base, stranded: true });
    const colours = [late, caught, resched, strand].map((s) => s.colour);
    expect(new Set(colours).size).toBe(4);
    expect(caught.label).toBe('caught up');
    expect(resched.label).toBe('rescheduled');
    expect(strand.label).toBe('needs a slot');
    // Late has no label of its own — the row shows how late instead.
    expect(late.label).toBe('');
  });
});

describe('the GATE backlog', () => {
  it('is empty before the campaign starts', () => {
    expect(buildBacklog('gate', gatePhases(), weeks(), BEFORE)).toEqual([]);
  });

  it('never lists a subject row, whichever subject has been ticked', () => {
    // The regression that read 97: subjects are studied in campaign-week order,
    // so sitting earlier in the syllabus is not being behind.
    for (let n = 0; n < GATE_SUBJECTS.length; n++) {
      const p = gatePhases();
      p[n].topics[0].subtopics[0].done = true;
      const items = buildBacklog('gate', p, weeks(), MID);
      expect(items.filter((i) => i.kind === 'subtopic'), `subject ${n}`).toEqual([]);
    }
  });

  it('holds the badge steady no matter which subject is ticked', () => {
    const counts = GATE_SUBJECTS.map((_, n) => {
      const p = gatePhases();
      p[n].topics[0].subtopics[0].done = true;
      return badge(buildBacklog('gate', p, weeks(), MID));
    });
    expect(new Set(counts).size, `varied: ${counts.join(',')}`).toBe(1);
  });

  it('lists a closed unticked week as one week row plus its study days', () => {
    const w = noneDone(byId('W1'));
    const items = buildBacklog('gate', gatePhases(), [w], MID);
    expect(items.filter((i) => i.kind === 'week')).toHaveLength(1);
    expect(items.filter((i) => i.kind === 'day')).toHaveLength(studyDayIndexes(w).length);
  });

  it('shrinks a week row by row as its days are ticked', () => {
    const w = byId('W1');
    const counts = [0, 2, 4, 6].map((n) => {
      const dayDone = w.days.map((_, i) => i < n);
      return buildBacklog('gate', gatePhases(), [{ ...w, dayDone }], MID).length;
    });
    // The last one is 0, not 1: a week finished before the sweep ever stamped
    // it never slipped, so there is nothing to report having caught up on.
    expect(counts).toEqual([7, 5, 3, 0]);
  });

  it('leaves one row behind when a stamped week is finished late', () => {
    const w = { ...allDone(byId('W1')), missedAt: 1000 };
    const items = buildBacklog('gate', gatePhases(), [w], MID);
    expect(items).toHaveLength(1);
    expect(items[0].completedLate).toBe(true);
  });

  it('keeps a finished-late week on the record with nothing left owing', () => {
    const w = { ...allDone(byId('W1')), missedAt: 1000 };
    const items = buildBacklog('gate', gatePhases(), [w], MID);
    expect(items).toHaveLength(1);
    expect(items[0].completedLate).toBe(true);
    expect(backlogHours(items)).toBe(0);
    expect(badge(items)).toBe(0);
  });

  it('counts the hours of the days still open, and only those', () => {
    const w = { ...byId('W1'), dayDone: [true, false, false, false, false, false, false] };
    const items = buildBacklog('gate', gatePhases(), [w], MID);
    const dayHours = items
      .filter((i) => i.kind === 'day')
      .reduce((s, i) => s + i.hours, 0);
    expect(backlogHours(items)).toBe(dayHours);
    expect(items.find((i) => i.kind === 'week')?.hours).toBe(dayHours);
  });

  it('puts the oldest slip first however the weeks are ordered', () => {
    const a = { ...noneDone(byId('W1')), missedAt: 3000 };
    const b = { ...noneDone(byId('W2')), missedAt: 1000 };
    const c = { ...noneDone(byId('W3')), missedAt: 2000 };
    const rows = buildBacklog('gate', gatePhases(), [a, b, c], MID).filter(
      (i) => i.kind === 'week',
    );
    expect(rows.map((i) => i.weekId)).toEqual(['W2', 'W3', 'W1']);
  });

  it('takes rescheduled work out of the hours owed but leaves it listed', () => {
    const slipped = { ...noneDone(byId('W1')), missedAt: 1000 };
    const [moved] = swap(slipped, byId('W20'));
    const items = buildBacklog('gate', gatePhases(), [moved], MID);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => i.rescheduled)).toBe(true);
    expect(backlogHours(items)).toBe(0);
    expect(badge(items)).toBe(0);
  });

  it('keeps displaced work owed, since it has no date at all', () => {
    const [parked] = swap(noneDone(byId('W10')), byId('W2'));
    const items = buildBacklog('gate', gatePhases(), [parked], MID);
    expect(items.every((i) => i.stranded)).toBe(true);
    expect(backlogHours(items)).toBeGreaterThan(0);
    expect(badge(items)).toBeGreaterThan(0);
  });

  it('reports the whole calendar at once without double counting', () => {
    const all = weeks().map(noneDone);
    const items = buildBacklog('gate', gatePhases(), all, MID);
    const closed = all.filter((w) => weekEndMs(w) < MID);
    expect(items.filter((i) => i.kind === 'week')).toHaveLength(closed.length);
    expect(items).toHaveLength(closed.length * 7);
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });
});

/** A backend track with work started in `phase`, nothing ticked before it. */
function started(phase: number): Phase[] {
  const p = backendPhases();
  p[phase].topics[0].subtopics[0].done = true;
  return p;
}

describe('the backend backlog', () => {
  it('is empty until something is started', () => {
    expect(buildBacklog('backend', backendPhases(), [], MID)).toEqual([]);
  });

  it('is empty while only the first phase has been touched', () => {
    expect(buildBacklog('backend', started(0), [], MID)).toEqual([]);
  });

  it('lists what is unticked in the phases already moved past', () => {
    const items = buildBacklog('backend', started(2), [], MID);
    const expected = backendPhases()
      .slice(0, 2)
      .reduce((s, p) => s + p.topics.reduce((a, t) => a + t.subtopics.length, 0), 0);
    expect(items).toHaveLength(expected);
    expect(items.every((i) => i.kind === 'subtopic')).toBe(true);
  });

  it('skips a phase that was finished rather than abandoned', () => {
    const p = started(2);
    for (const t of p[0].topics) for (const s of t.subtopics) s.done = true;
    const items = buildBacklog('backend', p, [], MID);
    expect(items.every((i) => i.unitId !== 0)).toBe(true);
  });

  it('ignores the campaign calendar, which this track does not have', () => {
    const a = buildBacklog('backend', started(2), [], MID);
    const b = buildBacklog('backend', started(2), weeks().map(noneDone), MID);
    expect(b).toEqual(a);
  });

  it('has no dates, so nothing is late, rescheduled or displaced', () => {
    for (const i of buildBacklog('backend', started(3), [], MID)) {
      expect(i.missedAt).toBeNull();
      expect(i.rescheduled).toBe(false);
      expect(i.stranded).toBe(false);
      expect(i.completedLate).toBe(false);
    }
  });

  it('counts every listed hour as owed', () => {
    const items = buildBacklog('backend', started(3), [], MID);
    expect(backlogHours(items)).toBe(items.reduce((s, i) => s + i.hours, 0));
  });

  it('shrinks as the work behind is ticked', () => {
    const p = started(2);
    const before = buildBacklog('backend', p, [], MID).length;
    p[0].topics[0].subtopics[0].done = true;
    expect(buildBacklog('backend', p, [], MID)).toHaveLength(before - 1);
  });
});
