import { describe, expect, it } from 'vitest';
import type { Phase, Subtopic, Topic } from '../types';
import { collectMarked, markedCount, markedHours } from '../types';
import { carryTicksForward, markedSubtopicNames, tickedSubtopicNames } from './roadmap';

function sub(name: string, done: boolean, marked?: boolean): Subtopic {
  return { name, hours: 2, done, ...(marked === undefined ? {} : { marked }) };
}

function topic(name: string, subtopics: Subtopic[]): Topic {
  return {
    name,
    hours: subtopics.reduce((s, x) => s + x.hours, 0),
    detail: '',
    done: subtopics.every((s) => s.done),
    subtopics,
  };
}

function phase(id: number, title: string, topics: Topic[]): Phase {
  return {
    id,
    title,
    hours: topics.reduce((s, t) => s + t.hours, 0),
    description: '',
    gate: '',
    gatePassed: false,
    topics,
  };
}

const track = [
  phase(0, 'First phase', [
    topic('Alpha', [
      sub('done and shaky', true, true),
      sub('done and confident', true),
      sub('untouched', false),
    ]),
  ]),
  phase(3, 'Later phase', [
    topic('Beta', [sub('flagged to do next', false, true), sub('nothing', false)]),
  ]),
];

describe('collectMarked', () => {
  it('finds flagged subtopics across every phase, in plan order', () => {
    const items = collectMarked(track);
    expect(items.map((i) => i.name)).toEqual(['done and shaky', 'flagged to do next']);
    expect(items[0].unitTitle).toBe('First phase');
    expect(items[1].unitTitle).toBe('Later phase');
  });

  it('keeps done and marked as separate facts — the whole point of the feature', () => {
    const items = collectMarked(track);
    expect(items[0].done).toBe(true);
    expect(items[1].done).toBe(false);
  });

  it('records the indices needed to unmark without searching by name', () => {
    const [first] = collectMarked(track);
    expect(track[0].topics[first.topicIndex].subtopics[first.subtopicIndex].name).toBe(
      first.name,
    );
    expect(first.unitId).toBe(0);
  });

  it('ignores a subtopic that has never been marked, and one marked false', () => {
    const none = [phase(0, 'x', [topic('t', [sub('a', true), sub('b', true, false)])])];
    expect(collectMarked(none)).toEqual([]);
    expect(markedCount(none)).toBe(0);
  });

  it('gives every row a unique id so React keys do not collide', () => {
    const ids = collectMarked(track).map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('counts marks and their hours', () => {
    expect(markedCount(track)).toBe(2);
    expect(markedHours(collectMarked(track))).toBe(4);
  });

  it('returns nothing for a track with no subtopics at all', () => {
    expect(collectMarked([phase(0, 'empty', [])])).toEqual([]);
    expect(markedHours([])).toBe(0);
  });
});

describe('marks across a roadmap rewrite', () => {
  const rewritten = [
    phase(0, 'Renamed phase', [
      topic('Renumbered topic', [
        sub('done and shaky', false),
        sub('flagged to do next', false),
        sub('brand new work', false),
      ]),
    ]),
  ];

  it('carries marks forward by name, like ticks — a mark is not reconstructible', () => {
    const merged = carryTicksForward(
      rewritten,
      tickedSubtopicNames(track),
      markedSubtopicNames(track),
    );
    const subs = merged[0].topics[0].subtopics;
    expect(subs[0]).toMatchObject({ name: 'done and shaky', done: true, marked: true });
    expect(subs[1]).toMatchObject({ name: 'flagged to do next', done: false, marked: true });
    expect(subs[2]).toMatchObject({ name: 'brand new work', done: false, marked: false });
  });

  it('clears marks when none are passed, rather than inventing them', () => {
    const merged = carryTicksForward(rewritten, tickedSubtopicNames(track));
    expect(merged[0].topics[0].subtopics.every((s) => s.marked === false)).toBe(true);
  });

  it('is idempotent — merging its own output keeps the same marks', () => {
    const once = carryTicksForward(
      rewritten,
      tickedSubtopicNames(track),
      markedSubtopicNames(track),
    );
    const twice = carryTicksForward(
      once,
      tickedSubtopicNames(once),
      markedSubtopicNames(once),
    );
    expect(twice).toEqual(once);
  });
});
