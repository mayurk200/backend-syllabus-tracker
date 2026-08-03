import { describe, expect, it } from 'vitest';
import { GATE_SUBJECTS } from '../data/gateData';
import { GATE_WEEKS } from '../data/gateWeeks';
import { buildExport, describeImport, exportFilename, parseImport } from './transfer';
import type { Meta, Phase, WeekEntry } from '../types';

/**
 * There is no login, so the exported file is the only copy of a 27-week
 * campaign. A parser that quietly drops a field loses work that cannot be
 * recovered, so these lean on round-tripping the real seed content rather than
 * on fixtures that could drift from it.
 */

const meta: Meta = { targetHoursPerWeek: 45, startDate: '2026-07-27' };
const phases = GATE_SUBJECTS as unknown as Phase[];
const weeks = GATE_WEEKS as unknown as WeekEntry[];

const full = () =>
  buildExport({
    track: 'gate',
    meta,
    phases,
    weeks,
    weekStatus: { W1: 'pass' },
    reviews: [
      {
        id: 'r1',
        stalled: 'nothing',
        nextObjective: 'finish Discrete',
        createdAt: 1,
        builtPct: 70,
        previousDone: true,
      },
    ],
    activity: [{ id: 'a1', kind: 'day', label: 'Worked W1 Mon', hours: 7, at: 2 }],
    now: new Date('2026-08-03T00:00:00Z'),
  });

const roundTrip = (value: unknown) => parseImport(JSON.stringify(value), 'gate');

describe('exporting', () => {
  it('carries every unit, week, review and event', () => {
    const e = full();
    expect(e.phases).toHaveLength(phases.length);
    expect(e.weeks).toHaveLength(weeks.length);
    expect(e.reviews).toHaveLength(1);
    expect(e.activity).toHaveLength(1);
  });

  it('folds each week status onto its week', () => {
    const e = full();
    expect(e.weeks?.find((w) => w.id === 'W1')?.status).toBe('pass');
    expect(e.weeks?.find((w) => w.id === 'W2')?.status).toBeNull();
  });

  it('leaves weeks out of a backend export, which has no calendar', () => {
    const e = buildExport({
      track: 'backend',
      meta,
      phases,
      weeks: [],
      weekStatus: {},
      reviews: [],
      activity: [],
    });
    expect(e.weeks).toBeUndefined();
  });

  it('names the file by track and day', () => {
    expect(exportFilename('gate', new Date('2026-08-03T00:00:00Z'))).toBe(
      'gate-tracker-2026-08-03.json',
    );
  });
});

describe('importing what was exported', () => {
  it('survives a round trip unchanged', () => {
    const e = full();
    const back = roundTrip(e);
    expect(back.ok).toBe(true);
    if (!back.ok) return;
    expect(back.data).toEqual(e);
  });

  it('keeps the day ticks, which are the whole point of the file', () => {
    const ticked = weeks.map((w, i) =>
      i === 0 ? { ...w, dayDone: [true, true, false, false, false, false, false] } : w,
    );
    const back = roundTrip(buildExport({
      track: 'gate',
      meta,
      phases,
      weeks: ticked,
      weekStatus: {},
      reviews: [],
      activity: [],
    }));
    expect(back.ok).toBe(true);
    if (!back.ok) return;
    expect(back.data.weeks?.[0].dayDone).toEqual([true, true, false, false, false, false, false]);
  });

  it('keeps a swapped arrangement, including slottedAt and missedAt', () => {
    const moved = weeks.map((w, i) =>
      i === 1 ? { ...w, slottedAt: 1234, missedAt: 5678 } : w,
    );
    const back = roundTrip(buildExport({
      track: 'gate',
      meta,
      phases,
      weeks: moved,
      weekStatus: {},
      reviews: [],
      activity: [],
    }));
    expect(back.ok).toBe(true);
    if (!back.ok) return;
    expect(back.data.weeks?.[1].slottedAt).toBe(1234);
    expect(back.data.weeks?.[1].missedAt).toBe(5678);
  });

  it('describes what it is about to restore', () => {
    expect(describeImport(full())).toContain(`${phases.length} units`);
    expect(describeImport(full())).toContain(`${weeks.length} weeks`);
    expect(describeImport(full())).toContain('exported 2026-08-03');
  });
});

describe('importing something else', () => {
  it('rejects a file that is not JSON', () => {
    const r = parseImport('not json {', 'gate');
    expect(r).toEqual({ ok: false, error: expect.stringContaining('not JSON') });
  });

  it('rejects JSON that is not an object', () => {
    expect(parseImport('[1,2,3]', 'gate').ok).toBe(false);
    expect(parseImport('"hello"', 'gate').ok).toBe(false);
  });

  it('refuses to restore one track from the other track export', () => {
    const r = parseImport(JSON.stringify(full()), 'backend');
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatch(/gate export/);
  });

  it('rejects a file with no units rather than wiping the syllabus', () => {
    const r = roundTrip({ ...full(), phases: [] });
    expect(r.ok).toBe(false);
  });

  it('rejects malformed units instead of importing the good ones', () => {
    const r = roundTrip({ ...full(), phases: [...phases, { id: 'nope' }] });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatch(/malformed/);
  });

  it('rejects a gate file whose weeks are missing or broken', () => {
    expect(roundTrip({ ...full(), weeks: undefined }).ok).toBe(false);
    expect(roundTrip({ ...full(), weeks: [{ id: 'W1' }] }).ok).toBe(false);
  });

  it('tolerates a file from an older build with no reviews or activity', () => {
    const r = roundTrip({ ...full(), reviews: undefined, activity: undefined, version: undefined });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.reviews).toEqual([]);
    expect(r.data.activity).toEqual([]);
    expect(r.data.version).toBe(0);
  });

  it('drops review and activity rows that have no id to write to', () => {
    const r = roundTrip({
      ...full(),
      reviews: [{ stalled: 'x' }],
      activity: [{ kind: 'day' }],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.reviews).toEqual([]);
    expect(r.data.activity).toEqual([]);
  });
});
