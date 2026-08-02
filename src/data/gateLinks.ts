import { GATE_SUBJECTS } from './gateData';
import { GATE_WEEKS } from './gateWeeks';

/**
 * The same day of study appears twice in the GATE track: once on the Timeline
 * as a day of a campaign week, and once inside its subject as a subtopic. They
 * are authored in two files, so this builds the link between them and lets a
 * tick in either place complete the other.
 *
 * The link is positional, not textual. Every campaign week has seven days
 * (Mon–Sat study, Sunday protected rest) and every core-week topic has exactly
 * six subtopics, so day 0–5 maps onto subtopic 0–5 and Sunday has no
 * counterpart. Subject topics carry their week id in the name — "W7 · Sorting
 * and searching" — which is what ties the two sides together.
 *
 * Only the 18 core weeks link. Setup (W0), revision, mock and taper weeks are
 * campaign-only and deliberately have no subject behind them.
 */

/** The rest day: index 6 of every week, with no subtopic behind it. */
export const REST_DAY_INDEX = 6;

export interface DayLink {
  weekId: string;
  /** Index into WeekEntry.days. */
  dayIndex: number;
  /** Subject id on the GATE track. */
  unitId: number;
  topicIndex: number;
  subtopicIndex: number;
}

function build(): DayLink[] {
  const weekIds = new Set(GATE_WEEKS.map((w) => w.id));
  const links: DayLink[] = [];

  for (const subject of GATE_SUBJECTS) {
    subject.topics.forEach((topic, topicIndex) => {
      const match = /^(W\d+)\s/.exec(topic.name);
      if (!match) return;
      const weekId = match[1];
      if (!weekIds.has(weekId)) return;

      // Positional only where the shape is what we expect; anything else is
      // left unlinked rather than guessed at.
      const week = GATE_WEEKS.find((w) => w.id === weekId);
      if (!week || week.days.length !== 7 || topic.subtopics.length !== 6) return;

      for (let i = 0; i < REST_DAY_INDEX; i++) {
        links.push({
          weekId,
          dayIndex: i,
          unitId: subject.id,
          topicIndex,
          subtopicIndex: i,
        });
      }
    });
  }
  return links;
}

const LINKS: DayLink[] = build();

const BY_DAY = new Map<string, DayLink>(
  LINKS.map((l) => [`${l.weekId}:${l.dayIndex}`, l]),
);
const BY_SUBTOPIC = new Map<string, DayLink>(
  LINKS.map((l) => [`${l.unitId}:${l.topicIndex}:${l.subtopicIndex}`, l]),
);

/** The subject subtopic behind a campaign day, if there is one. */
export function linkForDay(weekId: string, dayIndex: number): DayLink | null {
  return BY_DAY.get(`${weekId}:${dayIndex}`) ?? null;
}

/** The campaign day a subject subtopic belongs to, if there is one. */
export function linkForSubtopic(
  unitId: number,
  topicIndex: number,
  subtopicIndex: number,
): DayLink | null {
  return BY_SUBTOPIC.get(`${unitId}:${topicIndex}:${subtopicIndex}`) ?? null;
}

/** Week ids that have a subject behind them. */
export function linkedWeekIds(): Set<string> {
  return new Set(LINKS.map((l) => l.weekId));
}

export const DAY_LINK_COUNT = LINKS.length;
