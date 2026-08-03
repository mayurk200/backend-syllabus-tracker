import { describe, expect, it } from 'vitest';
import { GATE_WEEKS } from '../data/gateWeeks';
import { linkForDay, linkedWeekIds } from '../data/gateLinks';
import { backlogHours, buildBacklog } from './backlog';
import type { WeekEntry, WeekKind } from '../types';
import {
  canSwapWeeks,
  slipOnLeaving,
  studyDayIndexes,
  swapBlockedReason,
  swapUpdates,
  weekEndMs,
  weekIsPinned,
  weekOutcome,
  weekWasLive,
} from '../types';

/**
 * The campaign calendar and the rules for reshuffling it.
 *
 * These cover the two things that are easy to get wrong and impossible to see
 * by reading: which swaps are legal, and how a week's verdict survives being
 * moved. Every case is stated against the real GATE_WEEKS rather than fixtures,
 * so a change to the calendar that breaks an assumption fails here.
 */

/** Mid-campaign, a date every week can be measured against. */
const MID = new Date('2026-10-01T12:00:00').getTime();
/** Before the campaign starts — nothing has closed. */
const BEFORE = new Date('2026-07-01T12:00:00').getTime();

const weeks = (): WeekEntry[] => GATE_WEEKS.map((w) => ({ ...w }));
const byId = (id: string): WeekEntry => {
  const w = weeks().find((x) => x.id === id);
  if (!w) throw new Error(`no such week: ${id}`);
  return w;
};
const firstOfKind = (kind: WeekKind): WeekEntry => {
  const w = weeks().find((x) => x.kind === kind);
  if (!w) throw new Error(`no week of kind ${kind}`);
  return w;
};
/** Every week finished, so completion never confuses an outcome assertion. */
const allDone = (w: WeekEntry): WeekEntry => ({ ...w, dayDone: w.days.map(() => true) });
const noneDone = (w: WeekEntry): WeekEntry => ({ ...w, dayDone: w.days.map(() => false) });

// ---------------------------------------------------------------------------

describe('the campaign calendar', () => {
  it('runs setup → core → revision → mock → taper, in that order', () => {
    const order: WeekKind[] = ['setup', 'core', 'revision', 'mock', 'taper'];
    const seen = weeks().map((w) => w.kind);
    const firstIndex = order.map((k) => seen.indexOf(k));
    expect(firstIndex).toEqual([...firstIndex].sort((a, b) => a - b));
    expect(new Set(seen)).toEqual(new Set(order));
  });

  it('has exactly one setup week and one taper week', () => {
    expect(weeks().filter((w) => w.kind === 'setup')).toHaveLength(1);
    expect(weeks().filter((w) => w.kind === 'taper')).toHaveLength(1);
  });

  it('gives every week a distinct, non-overlapping slot', () => {
    const sorted = weeks().sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].start > sorted[i - 1].end).toBe(true);
    }
  });

  it('links exactly the core weeks to subjects, and nothing else', () => {
    const linked = linkedWeekIds();
    for (const w of weeks()) {
      expect({ id: w.id, linked: linked.has(w.id) }).toEqual({
        id: w.id,
        linked: w.kind === 'core',
      });
    }
  });

  it('gives every core week six linked study days and no linked rest day', () => {
    for (const w of weeks().filter((x) => x.kind === 'core')) {
      for (const i of studyDayIndexes(w)) {
        expect(linkForDay(w.id, i), `${w.id} day ${i}`).not.toBeNull();
      }
      expect(linkForDay(w.id, 6)).toBeNull();
    }
  });
});

describe('milestones', () => {
  it('puts every mock-test milestone on a Saturday', () => {
    // M1–M7 are the timed tests; the plan moved them off the protected rest
    // day onto the preceding Saturday.
    const tests = weeks().filter(
      (w) => w.milestone && !['setup', 'taper'].includes(w.kind),
    );
    expect(tests.length).toBeGreaterThan(0);
    for (const w of tests) {
      const sat = new Date(`${w.start}T00:00:00`);
      sat.setDate(sat.getDate() + 5);
      expect(sat.getDay(), `${w.milestone} in ${w.id}`).toBe(6);
    }
  });

  it('numbers milestones in calendar order with no gaps or repeats', () => {
    const ms = weeks()
      .sort((a, b) => a.start.localeCompare(b.start))
      .filter((w) => w.milestone)
      .map((w) => w.milestone!);
    expect(ms).toEqual(ms.map((_, i) => `M${i}`));
  });

  it('anchors M0 to the setup week and the last milestone to the taper', () => {
    expect(firstOfKind('setup').milestone).toBe('M0');
    expect(firstOfKind('taper').milestone).toBeTruthy();
  });

  it('keeps a milestone on its dates when two weeks swap', () => {
    // The mock tests are booked against real dates, so the milestone belongs to
    // the slot. Swapping is what the incoming week inherits.
    const a = byId('W8'); // carries a milestone
    const b = byId('W9'); // does not
    expect(a.milestone).toBeTruthy();
    expect(b.milestone).toBeFalsy();

    const [a2, b2] = swap(a, b);
    expect(a2.dates).toBe(b.dates);
    expect(a2.milestone ?? null).toBe(b.milestone ?? null);
    expect(b2.dates).toBe(a.dates);
    expect(b2.milestone).toBe(a.milestone);
  });

  it('cannot strand a milestone: every slot keeps whatever it had', () => {
    const before = new Map(weeks().map((w) => [w.dates, w.milestone ?? null]));
    const [a2, b2] = swap(byId('W8'), byId('W12')); // both carry milestones
    const after = new Map(before);
    after.set(a2.dates, a2.milestone ?? null);
    after.set(b2.dates, b2.milestone ?? null);
    expect(after).toEqual(before);
  });
});

/**
 * The two weeks after a swap. This runs `swappedSlots` — the same function the
 * Firestore write uses — so the rules are tested rather than restated.
 */
function swap(a: WeekEntry, b: WeekEntry, now = MID): [WeekEntry, WeekEntry] {
  const [updateA, updateB] = swapUpdates(a, b, now);
  return [
    { ...a, ...updateA },
    { ...b, ...updateB },
  ];
}

describe('which swaps are allowed', () => {
  it('allows any two weeks of the same movable kind', () => {
    for (const kind of ['core', 'revision', 'mock'] as WeekKind[]) {
      const of = weeks().filter((w) => w.kind === kind);
      expect(of.length, kind).toBeGreaterThan(1);
      expect(canSwapWeeks(of[0], of[of.length - 1]), kind).toBe(true);
    }
  });

  it('refuses every cross-block pair, in both directions', () => {
    const kinds: WeekKind[] = ['setup', 'core', 'revision', 'mock', 'taper'];
    for (const ka of kinds) {
      for (const kb of kinds) {
        if (ka === kb) continue;
        const a = firstOfKind(ka);
        const b = firstOfKind(kb);
        expect(canSwapWeeks(a, b), `${ka} → ${kb}`).toBe(false);
        expect(canSwapWeeks(b, a), `${kb} → ${ka}`).toBe(false);
      }
    }
  });

  it('pins the setup and taper weeks against everything, including each other', () => {
    const setup = firstOfKind('setup');
    const taper = firstOfKind('taper');
    expect(weekIsPinned(setup)).toBe(true);
    expect(weekIsPinned(taper)).toBe(true);
    expect(canSwapWeeks(setup, taper)).toBe(false);
    for (const w of weeks()) {
      if (w.id !== setup.id) expect(canSwapWeeks(setup, w), w.id).toBe(false);
      if (w.id !== taper.id) expect(canSwapWeeks(taper, w), w.id).toBe(false);
    }
  });

  it('never pins a core, revision or mock week', () => {
    for (const w of weeks()) {
      expect(weekIsPinned(w), w.id).toBe(w.kind === 'setup' || w.kind === 'taper');
    }
  });

  it('treats a week swapped with itself as a no-op, not an error', () => {
    expect(swapBlockedReason(byId('W5'), byId('W5'))).toBeNull();
  });

  it('names the week and the reason when it refuses', () => {
    const reason = swapBlockedReason(byId('W5'), byId('W20'));
    expect(reason).toMatch(/W5/);
    expect(reason).toMatch(/W20/);
    expect(reason).toMatch(/core build|revision/);

    const pinned = swapBlockedReason(byId('W27'), byId('W25'));
    expect(pinned).toMatch(/W27/);
    expect(pinned).toMatch(/exam window/);
  });

  it('is symmetric for every pair in the calendar', () => {
    const all = weeks();
    for (const a of all) {
      for (const b of all) {
        expect(canSwapWeeks(a, b), `${a.id}/${b.id}`).toBe(canSwapWeeks(b, a));
      }
    }
  });
});

describe('a week that has been moved', () => {
  it('is judged normally while it sits where it was authored', () => {
    const w = noneDone(byId('W1')); // closed well before MID
    expect(weekWasLive(w)).toBe(true);
    expect(weekOutcome(w, MID)).toBe('missed');
  });

  it('is not judged when it lands on a slot that had already closed', () => {
    // W10 is untouched and in the future; drop it on W1's spent dates.
    const [moved] = swap(noneDone(byId('W10')), byId('W1'));
    expect(weekWasLive(moved)).toBe(false);
    expect(weekOutcome(moved, MID)).toBe('pending');
  });

  it('keeps a verdict it had already earned when it moves forward', () => {
    const slipped = { ...noneDone(byId('W1')), missedAt: MID - 86_400_000 };
    const [moved] = swap(slipped, byId('W20'));
    expect(weekWasLive(moved)).toBe(true);
  });

  it('passes on the ticks, not on the dates', () => {
    const [moved] = swap(allDone(byId('W10')), byId('W1'));
    expect(weekOutcome(moved, MID)).toBe('pass');
  });

  it('is pending before the campaign begins, wherever it sits', () => {
    for (const w of weeks()) expect(weekOutcome(noneDone(w), BEFORE), w.id).toBe('pending');
  });
});

describe('a swap cannot launder a miss', () => {
  it('records the slip when a closed, unfinished week is moved away', () => {
    // W1 closed unticked but the sweep has not reached it yet.
    const [moved] = swap(noneDone(byId('W1')), byId('W10'));
    expect(moved.missedAt).toBeTruthy();
    expect(weekWasLive(moved)).toBe(true);
  });

  it('keeps both weeks judged when two already-closed weeks trade slots', () => {
    // Both slots are spent, so both weeks did have their chance. Neither may
    // come out of the swap looking as though it never got one.
    const [a, b] = swap(noneDone(byId('W1')), noneDone(byId('W2')));
    expect(weekOutcome(a, MID), 'W1').toBe('missed');
    expect(weekOutcome(b, MID), 'W2').toBe('missed');
    expect(buildBacklog('gate', [], [a, b], MID).filter((i) => i.kind === 'week')).toHaveLength(2);
  });

  it('leaves a finished week unstamped when it moves', () => {
    const [moved] = swap(allDone(byId('W1')), byId('W10'));
    expect(moved.missedAt ?? null).toBeNull();
    expect(weekOutcome(moved, MID)).toBe('pass');
  });

  it('does not stamp a week that was never live in the slot it is leaving', () => {
    // W10 parked on W1's spent dates, then moved on again. It never had those
    // dates while they were open, so there is no slip to record.
    const [parked] = swap(noneDone(byId('W10')), byId('W1'));
    expect(weekWasLive(parked)).toBe(false);
    const [movedOn] = swap(parked, byId('W11'));
    expect(movedOn.missedAt ?? null).toBeNull();
    expect(weekOutcome(movedOn, MID)).toBe('pending');
  });

  it('does not stamp a week whose slot is still open', () => {
    const [moved] = swap(noneDone(byId('W10')), byId('W11'));
    expect(moved.missedAt ?? null).toBeNull();
  });

  it('dates the slip to when the slot closed, not to when it was noticed', () => {
    const w = noneDone(byId('W1'));
    expect(slipOnLeaving(w, MID)).toBe(weekEndMs(w));
    expect(slipOnLeaving(w, MID)).not.toBe(MID);
  });

  it('keeps weeks that closed on different dates distinguishable', () => {
    // Both are noticed on the same load; they did not slip at the same time.
    const a = noneDone(byId('W1'));
    const b = noneDone(byId('W5'));
    expect(slipOnLeaving(a, MID)).not.toBe(slipOnLeaving(b, MID));
    expect(slipOnLeaving(a, MID)!).toBeLessThan(slipOnLeaving(b, MID)!);
  });

  it('reports a week the same way whether or not the sweep has stamped it', () => {
    const raw = noneDone(byId('W1'));
    const swept = { ...raw, missedAt: weekEndMs(raw) };
    const strip = (w: WeekEntry) =>
      buildBacklog('gate', [], [w], MID).map(({ id, detail, missedAt, hours }) => ({
        id,
        detail,
        missedAt,
        hours,
      }));
    expect(strip(swept)).toEqual(strip(raw));
  });
});

describe('the backlog', () => {
  it('lists nothing before the campaign starts', () => {
    expect(buildBacklog('gate', [], weeks(), BEFORE)).toEqual([]);
  });

  it('counts a closed unticked week as its week row plus its study days', () => {
    const w = noneDone(byId('W1'));
    const items = buildBacklog('gate', [], [w], MID);
    expect(items.filter((i) => i.kind === 'week')).toHaveLength(1);
    expect(items.filter((i) => i.kind === 'day')).toHaveLength(studyDayIndexes(w).length);
    expect(items.every((i) => !i.rescheduled)).toBe(true);
  });

  it('ignores a week the calendar has not reached', () => {
    expect(buildBacklog('gate', [], [noneDone(byId('W20'))], MID)).toEqual([]);
  });

  it('does not invent a backlog from a week swapped onto spent dates', () => {
    const [moved] = swap(noneDone(byId('W20')), byId('W1'));
    expect(buildBacklog('gate', [], [moved], MID)).toEqual([]);
  });

  it('marks a slipped week rescheduled once it has a slot still to come', () => {
    const slipped = { ...noneDone(byId('W1')), missedAt: MID - 86_400_000 };
    const [moved] = swap(slipped, byId('W20'));
    const items = buildBacklog('gate', [], [moved], MID);
    expect(items.every((i) => i.rescheduled)).toBe(true);
    // It is on the plan again, so it stops counting against the hours owed.
    expect(backlogHours(items)).toBe(0);
    expect(items[0].detail).toMatch(/rescheduled/);
  });

  it('sorts by the original slip, so moving a week cannot bury it', () => {
    const early = { ...noneDone(byId('W1')), missedAt: 1000 };
    const late = { ...noneDone(byId('W2')), missedAt: 2000 };
    const [movedEarly] = swap(early, byId('W20'));
    const items = buildBacklog('gate', [], [late, movedEarly], MID).filter(
      (i) => i.kind === 'week',
    );
    expect(items.map((i) => i.title.slice(0, 2))).toEqual(['W1', 'W2']);
  });

  it('reads late again when the slot it was moved to closes too', () => {
    const relapsed = {
      ...noneDone(byId('W1')),
      missedAt: MID - 86_400_000,
      slottedAt: MID - 86_400_000,
    };
    const items = buildBacklog('gate', [], [relapsed], MID);
    expect(items.every((i) => !i.rescheduled)).toBe(true);
    expect(backlogHours(items)).toBeGreaterThan(0);
  });

  it('never counts a week row twice in the hours owed', () => {
    const items = buildBacklog('gate', [], [noneDone(byId('W1'))], MID);
    const dayHours = items
      .filter((i) => i.kind === 'day')
      .reduce((s, i) => s + i.hours, 0);
    expect(backlogHours(items)).toBe(dayHours);
  });

  it('does not put a subject behind merely for sitting earlier in the syllabus', () => {
    // The regression that showed 97 rows: one tick in a subject whose weeks are
    // still months away used to declare every earlier subject overdue.
    const phases = [
      {
        id: 0,
        title: 'Early',
        hours: 7,
        description: '',
        gate: '',
        gatePassed: false,
        topics: [
          {
            name: 'W1 · t',
            hours: 7,
            detail: '',
            done: false,
            subtopics: [{ name: 's', hours: 7, done: false }],
          },
        ],
      },
      {
        id: 1,
        title: 'Later',
        hours: 7,
        description: '',
        gate: '',
        gatePassed: false,
        topics: [
          {
            name: 'W20 · t',
            hours: 7,
            detail: '',
            done: false,
            subtopics: [{ name: 's', hours: 7, done: true }],
          },
        ],
      },
    ];
    const items = buildBacklog('gate', phases, [], MID);
    expect(items.filter((i) => i.kind === 'subtopic')).toEqual([]);
  });
});

describe('revision, mock and taper weeks', () => {
  const unlinked = () => weeks().filter((w) => w.kind !== 'core');

  it('have no subject behind them, so a tick mirrors nowhere', () => {
    for (const w of unlinked()) {
      for (let i = 0; i < w.days.length; i++) {
        expect(linkForDay(w.id, i), `${w.id} day ${i}`).toBeNull();
      }
    }
  });

  it('still carry seven days and six study days like any other week', () => {
    for (const w of unlinked()) {
      expect(w.days, w.id).toHaveLength(7);
      expect(studyDayIndexes(w), w.id).toHaveLength(6);
    }
  });

  it('go behind on the calendar exactly like a core week', () => {
    const w = noneDone(byId('W20'));
    const past = new Date(`${w.end}T23:59:59`).getTime() + 86_400_000;
    expect(weekOutcome(w, past)).toBe('missed');
    expect(buildBacklog('gate', [], [w], past).length).toBe(1 + 6);
  });

  it('reshuffle within their own block without touching the core plan', () => {
    const a = byId('W19');
    const b = byId('W21');
    expect(canSwapWeeks(a, b)).toBe(true);
    const [a2, b2] = swap(a, b);
    expect(a2.dates).toBe(b.dates);
    expect(b2.dates).toBe(a.dates);
    // The block still occupies the same four slots it did before.
    expect(new Set([a2.start, b2.start])).toEqual(new Set([a.start, b.start]));
  });

  it('cannot be swapped into the core build', () => {
    for (const w of weeks().filter((x) => x.kind === 'revision' || x.kind === 'mock')) {
      for (const c of weeks().filter((x) => x.kind === 'core')) {
        expect(canSwapWeeks(w, c), `${w.id}/${c.id}`).toBe(false);
      }
    }
  });

  it('keeps the taper on the exam window whatever else moves', () => {
    const taper = firstOfKind('taper');
    for (const w of weeks()) {
      if (w.id === taper.id) continue;
      expect(canSwapWeeks(taper, w), w.id).toBe(false);
    }
    expect(taper.end >= '2027-02-06').toBe(true);
  });
});
