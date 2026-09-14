import type { Category, PriceTier, VenueWithStats } from './types';

/** Sorting and filtering, kept as pure functions so the UI stays presentational. */

export const SORT_OPTIONS = [
  { value: 'nearest', label: 'Nearest to campus' },
  { value: 'rating', label: 'Top rated' },
  { value: 'reviews', label: 'Most reviewed' },
  { value: 'cheapest', label: 'Cheapest first' },
  { value: 'priciest', label: 'Most expensive' },
  { value: 'name', label: 'Name (A–Z)' },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]['value'];

/** "Walking distance" for the campus — about a 7 minute walk. */
export const WALKABLE_METERS = 600;

export interface Filters {
  query: string;
  category: Category | 'All';
  /** Empty means "any price". */
  priceTiers: PriceTier[];
  /** 0 means "any rating". */
  minRating: 0 | 3 | 4 | 4.5;
  walkableOnly: boolean;
  onCampusOnly: boolean;
  favoritesOnly: boolean;
  /**
   * Show only venues known to be open.
   *
   * Venues with unknown hours are excluded while this is on, because the filter
   * promises "open now" and we cannot honestly claim that of them. The UI says how
   * many were hidden rather than letting them vanish silently.
   */
  openNowOnly: boolean;
}

export const DEFAULT_FILTERS: Filters = {
  query: '',
  category: 'All',
  priceTiers: [],
  minRating: 0,
  walkableOnly: false,
  onCampusOnly: false,
  favoritesOnly: false,
  openNowOnly: false,
};

/** How many filters are active, for the badge on the Filters button. */
export function activeFilterCount(filters: Filters): number {
  return (
    (filters.category !== 'All' ? 1 : 0) +
    (filters.priceTiers.length > 0 ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.walkableOnly ? 1 : 0) +
    (filters.onCampusOnly ? 1 : 0) +
    (filters.favoritesOnly ? 1 : 0) +
    (filters.openNowOnly ? 1 : 0)
  );
}

/**
 * Effective price used for sorting: what students actually reported when we have it,
 * otherwise the midpoint of the venue's editorial tier.
 */
function sortPrice(venue: VenueWithStats): number {
  if (venue.averagePrice !== null) return venue.averagePrice;
  return venue.priceTier * 100;
}

export function filterVenues(
  venues: VenueWithStats[],
  filters: Filters,
  /** Readonly: this function only reads the set, it never mutates it. */
  favorites: ReadonlySet<string>
): VenueWithStats[] {
  const needle = filters.query.trim().toLowerCase();

  return venues.filter((venue) => {
    if (needle) {
      const haystack = `${venue.name} ${venue.vicinity} ${venue.brand} ${venue.category} ${venue.signatureDish ?? ''}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }

    if (filters.category !== 'All' && venue.category !== filters.category) return false;
    if (filters.priceTiers.length > 0 && !filters.priceTiers.includes(venue.priceTier)) return false;

    // An unrated venue has averageRating 0 and must not pass a "4.0+" filter.
    if (filters.minRating > 0 && venue.averageRating < filters.minRating) return false;

    if (filters.onCampusOnly && !venue.isOnCampus) return false;
    if (filters.walkableOnly && venue.distanceMeters > WALKABLE_METERS) return false;
    if (filters.favoritesOnly && !favorites.has(venue.id)) return false;
    if (filters.openNowOnly && venue.openState !== 'open') return false;

    return true;
  });
}

/**
 * How many venues the "open now" filter is hiding purely because their hours are
 * unknown, as opposed to being genuinely closed.
 *
 * The UI shows this so a student understands the list is incomplete rather than
 * concluding nothing is open. With no hours data at all, that count is every venue.
 */
export function unknownHoursHiddenCount(
  venues: VenueWithStats[],
  filters: Filters
): number {
  if (!filters.openNowOnly) return 0;
  return venues.filter((v) => v.openState === 'unknown').length;
}

export function sortVenues(venues: VenueWithStats[], sort: SortKey): VenueWithStats[] {
  const list = [...venues];

  switch (sort) {
    case 'nearest':
      return list.sort((a, b) => a.distanceMeters - b.distanceMeters || a.name.localeCompare(b.name));

    case 'rating':
      return list.sort(
        (a, b) =>
          b.averageRating - a.averageRating ||
          b.reviewCount - a.reviewCount ||
          a.distanceMeters - b.distanceMeters
      );

    case 'reviews':
      return list.sort((a, b) => b.reviewCount - a.reviewCount || b.averageRating - a.averageRating);

    case 'cheapest':
      return list.sort((a, b) => sortPrice(a) - sortPrice(b) || a.distanceMeters - b.distanceMeters);

    case 'priciest':
      return list.sort((a, b) => sortPrice(b) - sortPrice(a) || a.distanceMeters - b.distanceMeters);

    case 'name':
      return list.sort((a, b) => a.name.localeCompare(b.name));

    default:
      return list;
  }
}
