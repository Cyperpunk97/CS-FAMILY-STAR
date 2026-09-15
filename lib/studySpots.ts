/**
 * Study-spot attributes.
 *
 * "Where can I sit with a laptop for three hours" is a different question from
 * "where is the food good", and nothing in the app answered it. These are
 * crowd-sourced rather than editorial for the usual reason: we do not know whether a
 * cafe has working sockets, and guessing sends someone across campus with a dying
 * laptop.
 *
 * Each attribute is a yes/no vote per student, aggregated into a ratio. The UI shows
 * the ratio and the sample size rather than a bare tick, because "4 of 5 students
 * found Wi-Fi" and "1 of 1" are very different claims.
 */

export const STUDY_ATTRIBUTES = [
  { id: 'wifi', label: 'Wi-Fi', question: 'Is there usable Wi-Fi?' },
  { id: 'power', label: 'Power outlets', question: 'Are there power outlets you can reach?' },
  { id: 'quiet', label: 'Quiet enough to work', question: 'Quiet enough to concentrate?' },
  { id: 'seating', label: 'Comfortable seating', question: 'Somewhere you could sit for hours?' },
  { id: 'aircon', label: 'Air conditioning', question: 'Is it air conditioned?' },
  { id: 'long_stay', label: 'No rush to leave', question: 'Can you stay without being moved on?' },
] as const;

export type StudyAttributeId = (typeof STUDY_ATTRIBUTES)[number]['id'];

export const STUDY_ATTRIBUTE_IDS = STUDY_ATTRIBUTES.map((a) => a.id) as StudyAttributeId[];

export function isStudyAttributeId(value: unknown): value is StudyAttributeId {
  return typeof value === 'string' && (STUDY_ATTRIBUTE_IDS as string[]).includes(value);
}

/** One row per venue per attribute, as returned by the aggregate view. */
export interface AttributeTally {
  venueId: string;
  attribute: StudyAttributeId;
  yesCount: number;
  totalCount: number;
}

export interface AttributeSummary {
  attribute: StudyAttributeId;
  label: string;
  yesCount: number;
  totalCount: number;
  /** 0–1, or null when nobody has voted. */
  ratio: number | null;
  /** Confident enough to state plainly rather than as "students are split". */
  confident: boolean;
}

/** Below this, a ratio is one person's opinion rather than a consensus. */
export const MIN_VOTES_FOR_CONFIDENCE = 3;

/** A clear majority either way. Between these bounds, students genuinely disagree. */
const CLEAR_YES = 0.7;
const CLEAR_NO = 0.3;

export function summarizeAttributes(tallies: AttributeTally[]): AttributeSummary[] {
  const byAttribute = new Map<StudyAttributeId, AttributeTally>();
  for (const tally of tallies) byAttribute.set(tally.attribute, tally);

  return STUDY_ATTRIBUTES.map((definition) => {
    const tally = byAttribute.get(definition.id);
    const totalCount = tally?.totalCount ?? 0;
    const yesCount = tally?.yesCount ?? 0;
    const ratio = totalCount > 0 ? yesCount / totalCount : null;

    return {
      attribute: definition.id,
      label: definition.label,
      yesCount,
      totalCount,
      ratio,
      confident:
        totalCount >= MIN_VOTES_FOR_CONFIDENCE &&
        ratio !== null &&
        (ratio >= CLEAR_YES || ratio <= CLEAR_NO),
    };
  });
}

/**
 * Short phrase for a summary, or null when there is nothing worth saying.
 *
 * Never returns a bare "Yes" off a single vote — the sample size is part of the
 * claim, not a detail to bury.
 */
export function describeAttribute(summary: AttributeSummary): string | null {
  if (summary.totalCount === 0 || summary.ratio === null) return null;

  if (!summary.confident) {
    return summary.totalCount < MIN_VOTES_FOR_CONFIDENCE
      ? `${summary.yesCount} of ${summary.totalCount} so far`
      : `Students are split (${summary.yesCount} of ${summary.totalCount})`;
  }

  return summary.ratio >= CLEAR_YES
    ? `Yes — ${summary.yesCount} of ${summary.totalCount}`
    : `No — ${summary.yesCount} of ${summary.totalCount}`;
}

/** Venues worth suggesting as study spots: confident yes on Wi-Fi and power. */
export function isGoodStudySpot(summaries: AttributeSummary[]): boolean {
  const required: StudyAttributeId[] = ['wifi', 'power'];

  return required.every((id) => {
    const summary = summaries.find((s) => s.attribute === id);
    return summary?.confident === true && (summary.ratio ?? 0) >= CLEAR_YES;
  });
}
