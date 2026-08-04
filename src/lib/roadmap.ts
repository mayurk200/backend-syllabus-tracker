import type { Phase, PhaseDoc } from '../types';
import { topicDoneFromSubtopics } from '../types';

/**
 * Carrying progress across a rewritten roadmap.
 *
 * The plan in src/data/seedData.ts is a bootstrap payload, but the plan itself
 * changes — the backend track was rewritten from Python/FastAPI to Java/Spring,
 * and phases were added, split and renumbered. Phase ids are therefore useless
 * as identity across that change: phase 1 used to be Python fluency and is now
 * the JVM. Topic names moved too.
 *
 * What survives a rewrite is the subtopic name, because it names the thing you
 * actually learned. So ticks are matched on that alone, across the whole track
 * rather than within a phase — a subtopic that moved from Phase 1 to Phase 10
 * (timeouts on outbound calls, say) is still the same piece of knowledge, and
 * you should not have to learn it twice because the plan was reorganised.
 *
 * The seed data guarantees these names are unique track-wide, which is what
 * makes a flat set the right structure here rather than a nested lookup.
 */

/** Names are compared on visible text, so reflowed whitespace is not a new subtopic. */
export function normaliseConcept(name: string): string {
  return name.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Every subtopic already ticked, whatever phase it currently sits in. */
export function tickedSubtopicNames(
  phases: ReadonlyArray<Pick<Phase, 'topics'>>,
): Set<string> {
  return namesWhere(phases, (s) => Boolean(s.done));
}

/**
 * Every subtopic flagged for review.
 *
 * Carried across a rewrite for the same reason ticks are, and arguably a
 * stronger one: a mark is a judgement you made about yourself that nothing in
 * the plan can reconstruct. Losing it to a reorganisation would silently throw
 * away the revision list.
 */
export function markedSubtopicNames(
  phases: ReadonlyArray<Pick<Phase, 'topics'>>,
): Set<string> {
  return namesWhere(phases, (s) => Boolean(s.marked));
}

function namesWhere(
  phases: ReadonlyArray<Pick<Phase, 'topics'>>,
  keep: (sub: { done?: boolean; marked?: boolean }) => boolean,
): Set<string> {
  const names = new Set<string>();
  for (const phase of phases) {
    for (const topic of phase.topics ?? []) {
      for (const sub of topic.subtopics ?? []) {
        if (keep(sub)) names.add(normaliseConcept(sub.name));
      }
    }
  }
  return names;
}

/**
 * The new plan with previously-ticked subtopics ticked again.
 *
 * Topic and phase completion are recomputed rather than carried: they are
 * derived facts everywhere else in this codebase, and a rewritten phase that
 * gained a subtopic must reopen even if its old form was complete. That is the
 * honest outcome — the phase now contains work that has not been done.
 */
export function carryTicksForward(
  plan: readonly Phase[],
  ticked: ReadonlySet<string>,
  marked: ReadonlySet<string> = new Set(),
): Phase[] {
  return plan.map((phase) => {
    const topics = phase.topics.map((topic) => {
      const subtopics = topic.subtopics.map((sub) => {
        const key = normaliseConcept(sub.name);
        return {
          ...sub,
          done: ticked.has(key),
          marked: marked.has(key),
        };
      });
      const next = { ...topic, subtopics };
      return { ...next, done: topicDoneFromSubtopics(next) };
    });
    return {
      ...phase,
      topics,
      gatePassed: topics.length > 0 && topics.every((t) => t.done),
    };
  });
}

/** How much of the old track's progress the new plan still recognises. */
export interface CarryReport {
  /** Subtopics that were ticked before the rewrite. */
  tickedBefore: number;
  /** How many of those exist in the new plan and stayed ticked. */
  carried: number;
  /**
   * Ticked subtopics the new plan has no name for — work that was done and is
   * no longer on the roadmap. Not lost effort, but no longer counted, so it is
   * reported rather than silently dropped.
   */
  dropped: string[];
}

export function carryReport(
  plan: readonly Phase[],
  previous: ReadonlyArray<Pick<Phase, 'topics'>>,
): CarryReport {
  const ticked = tickedSubtopicNames(previous);
  const planNames = new Set(
    plan.flatMap((p) => p.topics.flatMap((t) => t.subtopics.map((s) => normaliseConcept(s.name)))),
  );
  const dropped: string[] = [];
  for (const phase of previous) {
    for (const topic of phase.topics ?? []) {
      for (const sub of topic.subtopics ?? []) {
        if (sub.done && !planNames.has(normaliseConcept(sub.name))) dropped.push(sub.name);
      }
    }
  }
  return {
    tickedBefore: ticked.size,
    carried: ticked.size - new Set(dropped.map(normaliseConcept)).size,
    dropped,
  };
}

/** Firestore payloads read back from the phases collection. */
export type StoredPhase = Pick<PhaseDoc, 'topics'>;
