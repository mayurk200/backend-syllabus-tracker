import { describe, expect, it } from 'vitest';
import type { Phase, Topic } from '../types';
import { SEED_PHASES } from '../data/seedData';
import {
  carryReport,
  carryTicksForward,
  normaliseConcept,
  tickedSubtopicNames,
} from './roadmap';

function topic(name: string, subs: Array<[string, boolean]>): Topic {
  const subtopics = subs.map(([n, done]) => ({ name: n, hours: 1, done }));
  return {
    name,
    hours: subtopics.length,
    detail: '',
    done: subtopics.every((s) => s.done),
    subtopics,
    value: { weight: 'high', why: 'test' },
  };
}

function phase(id: number, title: string, topics: Topic[]): Phase {
  return {
    id,
    title,
    hours: topics.reduce((s, t) => s + t.hours, 0),
    description: '',
    gate: '',
    gatePassed: topics.every((t) => t.done),
    topics,
  };
}

describe('normaliseConcept', () => {
  it('ignores reflowed whitespace and case, so rewrapping a line is not a new subtopic', () => {
    expect(normaliseConcept('Reading  a\n heap DUMP')).toBe(normaliseConcept('reading a heap dump'));
  });
});

describe('carryTicksForward', () => {
  const oldTrack = [
    phase(0, 'Old phase A', [
      topic('Old topic', [
        ['Timeouts on every outbound call — non-negotiable', true],
        ['Something Python-only', true],
        ['Never touched this', false],
      ]),
    ]),
  ];

  const newTrack = [
    phase(0, 'New phase A', [topic('Fresh topic', [['Brand new subtopic', false]])]),
    phase(9, 'New phase B', [
      topic('Resilience', [
        // Same concept, now living several phases away from where it was.
        ['Timeouts on every outbound call — non-negotiable', false],
        ['Circuit breakers with Resilience4j', false],
      ]),
    ]),
  ];

  it('carries a tick across a phase move, because the subtopic name is the identity', () => {
    const merged = carryTicksForward(newTrack, tickedSubtopicNames(oldTrack));
    const carried = merged[1].topics[0].subtopics;
    expect(carried[0].done).toBe(true);
    expect(carried[1].done).toBe(false);
  });

  it('leaves genuinely new work unticked', () => {
    const merged = carryTicksForward(newTrack, tickedSubtopicNames(oldTrack));
    expect(merged[0].topics[0].subtopics[0].done).toBe(false);
  });

  it('does not carry a subtopic that was never ticked', () => {
    const ticked = tickedSubtopicNames(oldTrack);
    expect(ticked.has(normaliseConcept('Never touched this'))).toBe(false);
  });

  it('recomputes completion rather than copying it, so a grown phase reopens', () => {
    const complete = [phase(0, 'Done', [topic('T', [['A', true]])])];
    const grown = [phase(0, 'Done', [topic('T', [['A', false], ['B', false]])])];
    const merged = carryTicksForward(grown, tickedSubtopicNames(complete));
    expect(merged[0].topics[0].subtopics[0].done).toBe(true);
    expect(merged[0].topics[0].done).toBe(false);
    expect(merged[0].gatePassed).toBe(false);
  });

  it('marks a phase passed when the carried ticks happen to complete it', () => {
    const before = [phase(0, 'x', [topic('T', [['A', true], ['B', true]])])];
    const after = [phase(0, 'y', [topic('T2', [['A', false], ['B', false]])])];
    const merged = carryTicksForward(after, tickedSubtopicNames(before));
    expect(merged[0].gatePassed).toBe(true);
  });

  it('is idempotent — running the merge on its own output changes nothing', () => {
    const once = carryTicksForward(newTrack, tickedSubtopicNames(oldTrack));
    const twice = carryTicksForward(once, tickedSubtopicNames(once));
    expect(twice).toEqual(once);
  });

  it('handles a track stored without subtopics without throwing', () => {
    const legacy = [{ topics: [{ name: 'T', done: true }] }] as never;
    expect(() => tickedSubtopicNames(legacy)).not.toThrow();
  });
});

describe('carryReport', () => {
  it('names the ticked work the new plan has no home for, rather than dropping it silently', () => {
    const before = [
      phase(0, 'old', [
        topic('T', [
          ['Timeouts on every outbound call — non-negotiable', true],
          ['vLLM for LLM serving — paged attention, continuous batching', true],
        ]),
      ]),
    ];
    const report = carryReport(SEED_PHASES, before);
    expect(report.tickedBefore).toBe(2);
    expect(report.carried).toBe(1);
    expect(report.dropped).toEqual(['vLLM for LLM serving — paged attention, continuous batching']);
  });

  it('reports a clean carry when every ticked subtopic survived the rewrite', () => {
    const before = [
      phase(0, 'old', [topic('T', [['Timeouts on every outbound call — non-negotiable', true]])]),
    ];
    const report = carryReport(SEED_PHASES, before);
    expect(report.dropped).toEqual([]);
    expect(report.carried).toBe(1);
  });
});

describe('the real rewrite', () => {
  // The v2 plan that is actually sitting in Firestore right now, reduced to the
  // subtopics that were carried over verbatim into the Java roadmap.
  const survivors = [
    'Timeouts on every outbound call — non-negotiable',
    'Cache-aside, read-through, write-through, write-behind',
    'EXPLAIN and EXPLAIN ANALYZE — reading the plan tree',
    'MVCC in Postgres',
    'OWASP Top 10 — a written exploit and fix for each',
  ];

  it('recognises the concepts that survived from the Python plan', () => {
    const before = [
      phase(0, 'v2', [topic('mixed', survivors.map((n) => [n, true] as [string, boolean]))]),
    ];
    const report = carryReport(SEED_PHASES, before);
    // The OWASP line was reworded in the rewrite, so it is expected to drop.
    expect(report.carried).toBe(4);
    expect(report.dropped).toEqual(['OWASP Top 10 — a written exploit and fix for each']);
  });

  it('produces a plan that still passes the hour and value checks', () => {
    const merged = carryTicksForward(SEED_PHASES, new Set(['mvcc in postgres']));
    expect(merged).toHaveLength(SEED_PHASES.length);
    for (const [i, p] of merged.entries()) {
      expect(p.id).toBe(SEED_PHASES[i].id);
      expect(p.hours).toBe(SEED_PHASES[i].hours);
      expect(p.topics.every((t) => t.value !== undefined)).toBe(true);
    }
  });
});
