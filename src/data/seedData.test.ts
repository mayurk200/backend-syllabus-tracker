import { describe, expect, it } from 'vitest';
import { SEED_PHASES, verifySeedHours } from './seedData';
import { BACKEND_LEARN_FROM, backendGloss, backendTopicSource } from './backendSyllabus';
import type { Phase } from '../types';
import {
  TOTAL_SYLLABUS_HOURS,
  bandProgress,
  criticalProgress,
  nextByValue,
  phaseWeight,
} from '../types';

describe('backend seed', () => {
  it('adds up — subtopics to topics, topics to phases, phases to the declared total', () => {
    expect(() => verifySeedHours()).not.toThrow();
    const total = SEED_PHASES.reduce((s, p) => s + p.hours, 0);
    expect(total).toBe(TOTAL_SYLLABUS_HOURS);
  });

  it('numbers its phases 0..n with no gaps, because the id is the Firestore doc id', () => {
    expect(SEED_PHASES.map((p) => p.id)).toEqual(SEED_PHASES.map((_, i) => i));
  });

  it('gives every topic a band with a reason, since an unjustified weight is the thing to avoid', () => {
    for (const phase of SEED_PHASES) {
      for (const topic of phase.topics) {
        expect(topic.value, `${phase.title} → ${topic.name}`).toBeDefined();
        expect(topic.value!.why.length).toBeGreaterThan(20);
      }
    }
  });

  it('carries no numeric score — the bands are a judgement, not a measurement', () => {
    for (const phase of SEED_PHASES) {
      for (const topic of phase.topics) {
        expect(topic.value).not.toHaveProperty('score');
        expect(Object.keys(topic.value!).sort()).toEqual(['weight', 'why']);
      }
    }
  });

  it('states no invented statistic in a justification', () => {
    // Percentages and "N out of M" claims about the market are exactly the kind
    // of false precision this plan is not allowed to assert.
    const offenders: string[] = [];
    for (const phase of SEED_PHASES) {
      for (const topic of phase.topics) {
        const why = topic.value!.why;
        if (/\d+\s?%|~\s?\d|\b\d+ out of \d+\b/.test(why)) {
          offenders.push(`${phase.title} → ${topic.name}: ${why}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('names every subtopic uniquely across the whole track — the merge matches ticks by name alone', () => {
    const names = SEED_PHASES.flatMap((p) => p.topics.flatMap((t) => t.subtopics.map((s) => s.name)));
    const seen = new Map<string, number>();
    for (const n of names) seen.set(n, (seen.get(n) ?? 0) + 1);
    const dupes = [...seen].filter(([, c]) => c > 1).map(([n]) => n);
    expect(dupes).toEqual([]);
  });

  it('titles every phase uniquely — the reference layer is keyed on the title', () => {
    const titles = SEED_PHASES.map((p) => p.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('rejects a plan whose hours no longer add up', () => {
    const broken: Phase[] = [
      { ...SEED_PHASES[0], hours: SEED_PHASES[0].hours + 1 } as Phase,
    ];
    expect(() => verifySeedHours(broken)).toThrow(/verification FAILED/);
  });

  it('rejects a topic weighted without a justification', () => {
    const first = SEED_PHASES[0];
    const stripped: Phase = {
      ...first,
      topics: first.topics.map((t, i) =>
        i === 0 ? { ...t, value: { ...t.value!, why: '  ' } } : t,
      ),
    };
    expect(() => verifySeedHours([stripped])).toThrow(/no justification/);
  });
});

describe('reference layer', () => {
  it('glosses every subtopic — the reference tab is the point of the phase detail page', () => {
    const missing = SEED_PHASES.flatMap((p) =>
      p.topics.flatMap((t) =>
        t.subtopics.filter((s) => !backendGloss(s.name)).map((s) => `${p.title} → ${s.name}`),
      ),
    );
    expect(missing).toEqual([]);
  });

  it('names a reading source for every topic and a reading list for every phase', () => {
    for (const phase of SEED_PHASES) {
      expect(BACKEND_LEARN_FROM[phase.title], `no reading list for ${phase.title}`).toBeDefined();
      for (const topic of phase.topics) {
        expect(
          backendTopicSource(phase.title, topic.name),
          `no source for ${phase.title} → ${topic.name}`,
        ).not.toBeNull();
      }
    }
  });
});

describe('value', () => {
  const phase = SEED_PHASES.find((p) => p.title === 'DSA & Problem Solving')!;
  const allDone = (p: Phase): Phase => ({
    ...p,
    topics: p.topics.map((t) => ({
      ...t,
      done: true,
      subtopics: t.subtopics.map((s) => ({ ...s, done: true })),
    })),
  });

  it('counts critical topics done out of critical topics total', () => {
    const before = criticalProgress(phase);
    expect(before.done).toBe(0);
    expect(before.total).toBeGreaterThan(0);
    expect(criticalProgress(allDone(phase))).toEqual({
      done: before.total,
      total: before.total,
    });
  });

  it('counts each band separately, and reports zero for a band the phase does not use', () => {
    expect(bandProgress(phase, 'critical').total).toBeGreaterThan(0);
    const audit = SEED_PHASES[0];
    expect(bandProgress(audit, 'optional')).toEqual({ done: 0, total: 0 });
  });

  it('reports the heaviest band present in a phase', () => {
    expect(phaseWeight(phase)).toBe('critical');
    const optionalOnly: Phase = {
      ...phase,
      topics: phase.topics.map((t) => ({ ...t, value: { weight: 'optional', why: 'x' } })),
    };
    expect(phaseWeight(optionalOnly)).toBe('optional');
  });

  it('suggests critical work before high work, whatever phase it sits in', () => {
    const next = nextByValue(SEED_PHASES as Phase[], 5);
    expect(next).toHaveLength(5);
    expect(next.every(({ topic }) => topic.value!.weight === 'critical')).toBe(true);
  });

  it('puts the shortest topic first inside a band, since hours are the only real number here', () => {
    const next = nextByValue([phase], 4);
    const hours = next.map(({ topic }) => topic.hours);
    expect([...hours].sort((a, b) => a - b)).toEqual(hours);
  });

  it('drops work that is already done', () => {
    expect(nextByValue([allDone(phase)])).toHaveLength(0);
  });
});
