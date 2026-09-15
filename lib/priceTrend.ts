import type { Review } from './types';

/**
 * Price trends from what students reported over time.
 *
 * Every review already carries `price_per_person` and `created_at`, so the data for
 * this has been accumulating since the feature shipped — the app was only ever
 * showing the mean across all of it. With Egyptian inflation where it is, "65 EGP in
 * March, 95 now" is more useful to a student than a single blended average that
 * silently mixes last year's prices into this week's.
 *
 * The hard part is not the arithmetic, it is refusing to report a trend that is not
 * there. Two students reporting different amounts is not inflation, it is two people
 * ordering different things. So:
 *
 *   - Each period compared needs `MIN_REPORTS_PER_PERIOD` reports, or there is no
 *     trend, only noise.
 *   - A change smaller than `MIN_MEANINGFUL_CHANGE` is reported as steady, because
 *     the sample is far too small to resolve it.
 *   - The periods must be genuinely separated in time, so a busy week does not get
 *     split into a fake "before and after".
 */

/** Below this, an apparent change is one person ordering a bigger meal. */
const MIN_REPORTS_PER_PERIOD = 3;

/** Percentage points. Under this the difference is not distinguishable from noise. */
const MIN_MEANINGFUL_CHANGE = 10;

/** The two periods must start at least this far apart to be worth comparing. */
const MIN_SPAN_DAYS = 30;

export type TrendDirection = 'up' | 'down' | 'steady' | 'unknown';

export interface PriceTrend {
  direction: TrendDirection;
  /** Signed percentage change, rounded. Null when direction is `unknown`. */
  changePercent: number | null;
  earlierAverage: number | null;
  recentAverage: number | null;
  earlierCount: number;
  recentCount: number;
  /** ISO date of the oldest report used, for "since March" style labelling. */
  since: string | null;
}

const UNKNOWN: PriceTrend = {
  direction: 'unknown',
  changePercent: null,
  earlierAverage: null,
  recentAverage: null,
  earlierCount: 0,
  recentCount: 0,
  since: null,
};

interface PricedReport {
  price: number;
  time: number;
  iso: string;
}

function average(values: number[]): number {
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

/**
 * Splits priced reports into an older and a newer half and compares them.
 *
 * A median split is used rather than fixed calendar months: venues get reviewed in
 * bursts around term time, and fixed buckets would leave most of them with one
 * populated month and no comparison at all.
 */
export function computePriceTrend(reviews: Review[]): PriceTrend {
  const reports: PricedReport[] = [];

  for (const review of reviews) {
    const price = review.price_per_person;
    if (price === null || !Number.isFinite(price) || price <= 0) continue;

    const time = new Date(review.created_at).getTime();
    if (!Number.isFinite(time)) continue;

    reports.push({ price, time, iso: review.created_at });
  }

  if (reports.length < MIN_REPORTS_PER_PERIOD * 2) return UNKNOWN;

  reports.sort((a, b) => a.time - b.time);

  const midpoint = Math.floor(reports.length / 2);
  const earlier = reports.slice(0, midpoint);
  const recent = reports.slice(midpoint);

  if (earlier.length < MIN_REPORTS_PER_PERIOD || recent.length < MIN_REPORTS_PER_PERIOD) {
    return UNKNOWN;
  }

  // Reports clustered into a few days say nothing about prices over time.
  const spanDays = (recent[recent.length - 1].time - earlier[0].time) / 86_400_000;
  if (spanDays < MIN_SPAN_DAYS) return UNKNOWN;

  const earlierAverage = Math.round(average(earlier.map((r) => r.price)));
  const recentAverage = Math.round(average(recent.map((r) => r.price)));

  if (earlierAverage <= 0) return UNKNOWN;

  const rawChange = ((recentAverage - earlierAverage) / earlierAverage) * 100;
  const changePercent = Math.round(rawChange);

  const direction: TrendDirection =
    Math.abs(rawChange) < MIN_MEANINGFUL_CHANGE ? 'steady' : rawChange > 0 ? 'up' : 'down';

  return {
    direction,
    changePercent,
    earlierAverage,
    recentAverage,
    earlierCount: earlier.length,
    recentCount: recent.length,
    since: earlier[0].iso,
  };
}

/**
 * A short, honest sentence for the UI.
 *
 * Returns null when there is no trend to report, so the caller renders nothing
 * rather than a hedged non-statement.
 */
export function describePriceTrend(trend: PriceTrend, locale = 'en-GB'): string | null {
  if (trend.direction === 'unknown' || trend.since === null) return null;

  const month = new Date(trend.since).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });

  if (trend.direction === 'steady') {
    return `Roughly steady since ${month}`;
  }

  const verb = trend.direction === 'up' ? 'Up' : 'Down';
  return `${verb} ${Math.abs(trend.changePercent ?? 0)}% since ${month}`;
}

/** Points for a sparkline, oldest first. Empty when there is nothing worth drawing. */
export function priceSeries(reviews: Review[]): { time: number; price: number }[] {
  return reviews
    .filter((r) => r.price_per_person !== null && (r.price_per_person ?? 0) > 0)
    .map((r) => ({ time: new Date(r.created_at).getTime(), price: r.price_per_person as number }))
    .filter((p) => Number.isFinite(p.time))
    .sort((a, b) => a.time - b.time);
}
