import { PRICE_TIER_RANGE, type Category, type VenueWithStats } from './types';

/**
 * Price presentation.
 *
 * Two sources, and the UI is explicit about which one it is showing:
 *   - What students actually reported spending (real data, once anyone reports).
 *   - An editorial tier range, used until then and clearly labelled "approx".
 * Never present the estimate as if it were measured.
 */
export interface PriceInfo {
  /** e.g. "≈ 85 EGP" or "40–100 EGP" */
  text: string;
  /** e.g. "from 12 students" or "approx." */
  note: string;
  /** True when this comes from real student reports. */
  isReported: boolean;
  /** "$", "$$" or "$$$" */
  tierSymbol: string;
}

export function priceInfo(venue: VenueWithStats): PriceInfo {
  const tierSymbol = '$'.repeat(venue.priceTier);

  if (venue.averagePrice !== null && venue.priceReportCount > 0) {
    return {
      text: `≈ ${venue.averagePrice} EGP`,
      note:
        venue.priceReportCount === 1
          ? 'from 1 student'
          : `from ${venue.priceReportCount} students`,
      isReported: true,
      tierSymbol,
    };
  }

  const range = PRICE_TIER_RANGE[venue.priceTier];
  return {
    text: `${range.min}–${range.max} EGP`,
    note: 'approx.',
    isReported: false,
    tierSymbol,
  };
}

/** Rating shown to one decimal so "4" and "4.0" do not sit next to each other. */
export function formatRating(rating: number): string {
  return rating > 0 ? rating.toFixed(1) : '—';
}

export function reviewCountLabel(count: number): string {
  if (count === 0) return 'No reviews yet';
  return count === 1 ? '1 review' : `${count} reviews`;
}

/**
 * Category colour tokens in one place so pills, dots and inline labels never drift.
 * `text` is the quiet inline form used on list cards; `pill` is the loud form used
 * where the category needs to be a distinct object (the detail sheet hero).
 */
export const CATEGORY_STYLE: Record<Category, { pill: string; dot: string; text: string }> = {
  Cafe: {
    pill: 'bg-violet-50 text-violet-900 ring-violet-200',
    dot: 'bg-violet-600',
    text: 'text-cat-cafe',
  },
  Restaurant: {
    pill: 'bg-amber-50 text-amber-900 ring-amber-200',
    dot: 'bg-amber-600',
    text: 'text-cat-restaurant',
  },
  'Fast Food': {
    pill: 'bg-teal-50 text-teal-900 ring-teal-200',
    dot: 'bg-teal-600',
    text: 'text-cat-fastfood',
  },
};

/** Relative date for review timestamps: "today", "3 days ago", then a real date. */
export function relativeDate(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';

  const days = Math.floor((now - then) / 86_400_000);
  if (days < 0) return 'just now';
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;

  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
