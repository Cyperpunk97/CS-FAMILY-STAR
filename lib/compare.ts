import { campusDistanceLabel } from './geo';
import { priceInfo } from './format';
import type { VenueWithStats } from './types';

/**
 * Side-by-side comparison of two spots.
 *
 * The interesting design problem here is not laying out rows, it is deciding when a
 * difference is real. A 4.8 from two reviews does not beat a 4.4 from forty, and
 * highlighting it as a win would actively mislead — so a row is only marked when the
 * comparison is sound. Everything else renders as a tie, which is the honest reading
 * of "we cannot tell these apart".
 */

/** Below this many reviews an average is an anecdote, not a rating. */
const MIN_REVIEWS_TO_COMPARE = 3;

/** Ratings closer than this are a tie; star ratings are not precise to a decimal. */
const RATING_EPSILON = 0.3;

/** Distances within this are the same walk in practice. */
const DISTANCE_EPSILON_M = 50;

/** Price averages closer than this are noise given the sample sizes involved. */
const PRICE_EPSILON_EGP = 15;

export type Winner = 'a' | 'b' | 'tie';

export interface ComparisonRow {
  label: string;
  a: string;
  b: string;
  winner: Winner;
  /** Why no winner was declared, when that is not obvious. */
  note?: string;
}

function compareNumbers(
  a: number,
  b: number,
  epsilon: number,
  higherWins: boolean
): Winner {
  if (Math.abs(a - b) <= epsilon) return 'tie';
  const aWins = higherWins ? a > b : a < b;
  return aWins ? 'a' : 'b';
}

export function compareVenues(a: VenueWithStats, b: VenueWithStats): ComparisonRow[] {
  const rows: ComparisonRow[] = [];

  // ── Rating ────────────────────────────────────────────────────────────────
  const bothRated =
    a.reviewCount >= MIN_REVIEWS_TO_COMPARE && b.reviewCount >= MIN_REVIEWS_TO_COMPARE;

  rows.push({
    label: 'Rating',
    a: a.reviewCount > 0 ? `${a.averageRating} (${a.reviewCount})` : 'No reviews yet',
    b: b.reviewCount > 0 ? `${b.averageRating} (${b.reviewCount})` : 'No reviews yet',
    winner: bothRated
      ? compareNumbers(a.averageRating, b.averageRating, RATING_EPSILON, true)
      : 'tie',
    note: bothRated
      ? undefined
      : `Needs ${MIN_REVIEWS_TO_COMPARE}+ reviews on both sides to compare fairly`,
  });

  // ── Price ─────────────────────────────────────────────────────────────────
  const priceA = priceInfo(a);
  const priceB = priceInfo(b);
  const bothReported = priceA.isReported && priceB.isReported;

  rows.push({
    label: 'Typical spend',
    a: `${priceA.text} · ${priceA.note}`,
    b: `${priceB.text} · ${priceB.note}`,
    // Only compare like with like: a reported average against an editorial estimate
    // is not a comparison, it is a category error.
    winner:
      bothReported && a.averagePrice !== null && b.averagePrice !== null
        ? compareNumbers(a.averagePrice, b.averagePrice, PRICE_EPSILON_EGP, false)
        : 'tie',
    note: bothReported ? undefined : 'One of these is an estimate, not reported prices',
  });

  // ── Distance ──────────────────────────────────────────────────────────────
  rows.push({
    label: 'From campus',
    a: campusDistanceLabel(a.distanceMeters, a.coordSource),
    b: campusDistanceLabel(b.distanceMeters, b.coordSource),
    // Two estimated coordinates cannot be ranked against each other at this
    // resolution; the "~" in the label already says the number is approximate.
    winner:
      a.coordSource === 'osm' && b.coordSource === 'osm'
        ? compareNumbers(a.distanceMeters, b.distanceMeters, DISTANCE_EPSILON_M, false)
        : 'tie',
    note:
      a.coordSource === 'osm' && b.coordSource === 'osm'
        ? undefined
        : 'At least one position is approximate',
  });

  // ── Plain facts, never ranked ─────────────────────────────────────────────
  rows.push({
    label: 'Category',
    a: a.category,
    b: b.category,
    winner: 'tie',
  });

  rows.push({
    label: 'Top dish',
    a: a.topDishes?.[0] ?? '—',
    b: b.topDishes?.[0] ?? '—',
    winner: 'tie',
  });

  return rows;
}

/**
 * An overall read, or null when the rows do not support one.
 *
 * Deliberately conservative: it only speaks when one spot wins strictly more
 * comparable rows than the other. "It depends" is usually the true answer.
 */
export function overallVerdict(
  rows: ComparisonRow[],
  a: VenueWithStats,
  b: VenueWithStats
): string | null {
  const aWins = rows.filter((r) => r.winner === 'a').length;
  const bWins = rows.filter((r) => r.winner === 'b').length;

  if (aWins === 0 && bWins === 0) return null;
  if (aWins === bWins) return `${a.name} and ${b.name} each win on different things.`;

  const leader = aWins > bWins ? a : b;
  return `${leader.name} comes out ahead on more of what can be compared.`;
}
