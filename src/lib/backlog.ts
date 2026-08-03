import type { BacklogItem, Phase, TrackId, WeekEntry } from '../types';
import { REST_DAY_INDEX } from '../data/gateLinks';
import {
  dayBody,
  dayLabel,
  isPhaseComplete,
  weekDayHours,
  weekIsComplete,
  weekWasLive,
} from '../types';

/**
 * What is behind, and why.
 *
 * The two tracks answer "behind" differently because only one of them has
 * dates. GATE compares a campaign week against the calendar: the week ended,
 * the days were not all ticked, so it slipped — and `missedAt`, written once by
 * the sweep in db.ts, keeps that on the record even after you catch up.
 *
 * The backend track has no dates at all, so being behind is positional instead:
 * anything still unticked in a phase you have already moved past. It clears
 * itself the moment you go back and tick it, since there is no date to have
 * missed.
 */

/** Campaign weeks that slipped, plus the individual days still outstanding. */
function gateBacklog(weeks: WeekEntry[], now: number): BacklogItem[] {
  const items: BacklogItem[] = [];

  for (const w of weeks) {
    const ended = new Date(`${w.end}T23:59:59`).getTime() < now;
    const complete = weekIsComplete(w);
    // `missedAt` is authoritative once written; the date check covers the gap
    // between a week ending and the next sweep running. A week swapped onto
    // dates that had already passed never had the chance to run, so it is only
    // behind if it was already carrying a slip before the move.
    const missed = weekWasLive(w) && (Boolean(w.missedAt) || (ended && !complete));
    if (!missed) continue;

    const hours = weekDayHours(w);
    const done = w.dayDone ?? [];
    const outstanding = w.days
      .map((d, i) => ({ d, i }))
      .filter(({ i }) => i !== REST_DAY_INDEX && !(done[i] ?? false));

    items.push({
      id: `week:${w.id}`,
      kind: 'week',
      title: `${w.id} · ${w.title}`,
      detail: complete
        ? `${w.dates} — finished after the week closed.`
        : `${w.dates} — ${outstanding.length} of 6 study days still open.`,
      hours: outstanding.reduce((s, { i }) => s + (hours[i] ?? 0), 0),
      weekId: w.id,
      missedAt: w.missedAt ?? new Date(`${w.end}T23:59:59`).getTime(),
      completedLate: complete,
    });

    for (const { d, i } of outstanding) {
      items.push({
        id: `day:${w.id}:${i}`,
        kind: 'day',
        title: `${w.id} ${dayLabel(d, i)} — ${dayBody(d)}`,
        detail: `${w.dates} · ${w.title}`,
        hours: hours[i] ?? 0,
        weekId: w.id,
        missedAt: w.missedAt ?? new Date(`${w.end}T23:59:59`).getTime(),
        completedLate: false,
      });
    }
  }

  return items;
}

/** Any work started, whether or not the unit is finished. */
function hasProgress(phase: Phase): boolean {
  return (
    isPhaseComplete(phase) ||
    phase.topics.some((t) => t.done || t.subtopics.some((s) => s.done))
  );
}

/**
 * Anything unticked in a unit you have already moved past — "past" meaning a
 * later unit has been started or finished. Note this is deliberately not "every
 * unit before the first incomplete one": that set is complete by definition and
 * would always be empty.
 */
function positionalBacklog(phases: Phase[]): BacklogItem[] {
  let lastActive = -1;
  phases.forEach((p, i) => {
    if (hasProgress(p)) lastActive = i;
  });
  // Nothing started, or only the first unit touched: nothing left behind yet.
  if (lastActive <= 0) return [];

  const items: BacklogItem[] = [];
  for (const phase of phases.slice(0, lastActive)) {
    if (isPhaseComplete(phase)) continue;
    phase.topics.forEach((topic) => {
      topic.subtopics.forEach((s) => {
        if (s.done) return;
        items.push({
          id: `sub:${phase.id}:${topic.name}:${s.name}`,
          kind: 'subtopic',
          title: s.name,
          detail: `${phase.title} · ${topic.name}`,
          hours: s.hours,
          unitId: phase.id,
          missedAt: null,
          completedLate: false,
        });
      });
    });
  }
  return items;
}

/**
 * The backlog for a track. GATE gets both: the campaign weeks it missed, and
 * anything left behind in a subject it has moved past.
 */
export function buildBacklog(
  track: TrackId,
  phases: Phase[],
  weeks: WeekEntry[],
  now = Date.now(),
): BacklogItem[] {
  const items =
    track === 'gate'
      ? [...gateBacklog(weeks, now), ...positionalBacklog(phases)]
      : positionalBacklog(phases);

  // Oldest miss first: the thing you have been avoiding longest goes on top.
  return items.sort((a, b) => (a.missedAt ?? Infinity) - (b.missedAt ?? Infinity));
}

/** Hours of work sitting in the backlog, ignoring weeks already caught up. */
export function backlogHours(items: BacklogItem[]): number {
  return items
    .filter((i) => i.kind !== 'week' && !i.completedLate)
    .reduce((s, i) => s + i.hours, 0);
}
