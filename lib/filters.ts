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
  favoritesOnly: boolean;
}

export const DEFAULT_FILTERS: Filters = {
  query: '',
  category: 'All',
  priceTiers: [],
  minRating: 0,
  walkableOnly: false,
  favoritesOnly: false,
};

/** How many filters are active, for the badge on the Filters button. */
export function activeFilterCount(filters: Filters): number {
  return (
    (filters.category !== 'All' ? 1 : 0) +
    (filters.priceTiers.length > 0 ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.walkableOnly ? 1 : 0) +
    (filters.favoritesOnly ? 1 : 0)
  );
}

/**
 * Effective price used for sorting: what students actually reported when we have it,
 * otherwise the midpoint of the venue's editorial tier. Keeps "cheapest first"
 * meaningful before any price reports exist.
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
      const haystack = `${venue.name} ${venue.vicinity} ${venue.brand} ${venue.category}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }

    if (filters.category !== 'All' && venue.category !== filters.category) return false;
    if (filters.priceTiers.length > 0 && !filters.priceTiers.includes(venue.priceTier)) return false;

    // An unrated venue has averageRating 0 and must not pass a "4.0+" filter.
    if (filters.minRating > 0 && venue.averageRating < filters.minRating) return false;

    if (filters.walkableOnly && venue.distanceMeters > WALKABLE_METERS) return false;
    if (filters.favoritesOnly && !favorites.has(venue.id)) return false;

    return true;
  });
}

export function sortVenues(venues: VenueWithStats[], sort: SortKey): VenueWithStats[] {
  // Copy first — Array.prototype.sort mutates, and this input is React state.
  const list = [...venues];

  switch (sort) {
    case 'nearest':
      return list.sort((a, b) => a.distanceMeters - b.distanceMeters || a.name.localeCompare(b.name));

    case 'rating':
      // Unrated venues sink to the bottom instead of tying at 0 with the worst ones.
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
