import { getMenuForRestaurant } from './menus';
import { VENUES } from './venues';
import type { CoordSource, MenuItem, VenueWithStats } from './types';

/**
 * Search across every dish on every menu.
 *
 * The app could already tell a student which venues exist and what they cost on
 * average, but not what to actually eat — the 1,500-odd priced items in
 * `menus.ts` and `talabatMenusData.json` were only ever reachable by opening one
 * venue at a time. This answers the question students actually ask: "who has
 * koshary", and "what can I get for 80 pounds".
 *
 * The index is built once per process from the same `getMenuForRestaurant` the
 * venue sheet uses, so search results and the menu a student then opens can never
 * disagree.
 */

export interface DishHit {
  item: MenuItem;
  venueId: string;
  venueName: string;
  brand: string;
  currency: string;
  /** Straight-line metres from campus, carried through for sorting. */
  distanceMeters: number;
  /**
   * Carried so results can use `campusDistanceLabel`, which marks estimated
   * positions with a "~". Printing a bare "430 m" off a hand-entered coordinate
   * would claim precision the catalog does not have.
   */
  coordSource: CoordSource;
  /** Lower is better. Exposed for tests, not shown to the user. */
  score: number;
}

export interface DishSearchOptions {
  /** Maximum EGP per dish. `null` means no budget cap. */
  maxPrice?: number | null;
  /** Only dishes at venues within this many metres of campus. */
  maxDistanceMeters?: number | null;
  /** Only venues currently in the filtered list, when the user has narrowed things. */
  venueIds?: Set<string> | null;
  limit?: number;
}

interface IndexedDish {
  item: MenuItem;
  venueId: string;
  venueName: string;
  brand: string;
  currency: string;
  /** Pre-lowercased haystack: English name, Arabic name, description, category. */
  haystack: string;
  /** Lowercased name alone, so an exact name match can outrank a description match. */
  name: string;
  nameAr: string;
}

let INDEX: IndexedDish[] | null = null;

/**
 * Arabic normalisation.
 *
 * A student typing "شاورما" should match "شاورمة", and nobody types the diacritics.
 * Without this, Arabic search only works when the spelling matches exactly — which
 * for Egyptian menu text it frequently does not.
 */
export function normalizeArabic(input: string): string {
  return input
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '') // harakat and tatweel
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627') // alef variants -> ا
    .replace(/\u0629/g, '\u0647') // ta marbuta -> ه
    .replace(/[\u0649]/g, '\u064A'); // alef maqsura -> ي
}

/**
 * Egyptian menu Arabic spells the same word several ways — شاورما, شاورمة, شاورمه —
 * and the difference is the final letter, which diacritic stripping does not touch.
 * Dropping a trailing ا/ه/ي from words of four letters or more collapses all three
 * to شاورم. The length guard keeps short words like مياه from being mangled.
 */
function stemArabicWord(word: string): string {
  if (word.length >= 4 && /[\u0627\u0647\u064A]$/.test(word)) return word.slice(0, -1);
  return word;
}

export function normalizeQuery(input: string): string {
  return normalizeArabic(input.toLowerCase().trim())
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(stemArabicWord)
    .join(' ');
}

function buildIndex(): IndexedDish[] {
  const dishes: IndexedDish[] = [];
  const seen = new Set<string>();

  for (const venue of VENUES) {
    const menu = getMenuForRestaurant(venue.id, venue.name);

    for (const item of menu.items) {
      // The same brand menu is reused across branches; one entry per venue is
      // correct, but an identical dish id twice at one venue is not.
      const key = `${venue.id}::${item.id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const name = normalizeQuery(item.name);
      const nameAr = item.nameAr ? normalizeQuery(item.nameAr) : '';

      dishes.push({
        item,
        venueId: venue.id,
        venueName: venue.name,
        brand: venue.brand,
        currency: menu.currency || 'EGP',
        name,
        nameAr,
        haystack: normalizeQuery(
          [item.name, item.nameAr ?? '', item.description ?? '', item.category].join(' ')
        ),
      });
    }
  }

  return dishes;
}

/** Built lazily so importing this module costs nothing until someone searches. */
function getIndex(): IndexedDish[] {
  if (INDEX === null) INDEX = buildIndex();
  return INDEX;
}

/** Test seam — the catalog is static at runtime, so this is only for tests. */
export function resetDishIndex(): void {
  INDEX = null;
}

/**
 * Ranks a dish against a query. Lower is better; `null` means no match.
 *
 * Every term must appear somewhere, so "chicken shawarma" does not return every
 * chicken dish on campus.
 */
function scoreDish(dish: IndexedDish, terms: string[]): number | null {
  let score = 0;

  for (const term of terms) {
    if (dish.name.startsWith(term) || dish.nameAr.startsWith(term)) {
      score += 0;
    } else if (dish.name.includes(term) || dish.nameAr.includes(term)) {
      score += 1;
    } else if (dish.haystack.includes(term)) {
      score += 3;
    } else {
      return null;
    }
  }

  return score;
}

export function searchDishes(
  query: string,
  venues: VenueWithStats[],
  options: DishSearchOptions = {}
): DishHit[] {
  const { maxPrice = null, maxDistanceMeters = null, venueIds = null, limit = 60 } = options;

  const normalized = normalizeQuery(query);
  const terms = normalized.split(' ').filter(Boolean);

  // A budget on its own is a valid search: "show me anything under 60 EGP".
  if (terms.length === 0 && maxPrice === null) return [];

  const venueById = new Map(venues.map((v) => [v.id, v]));
  const hits: DishHit[] = [];

  for (const dish of getIndex()) {
    if (venueIds && !venueIds.has(dish.venueId)) continue;

    // An "Ask in store" dish has no price, so it cannot honestly be claimed to fit
    // a budget. It is excluded from budget searches rather than assumed cheap.
    const price = dish.item.price;
    if (maxPrice !== null && (price === null || price > maxPrice)) continue;

    const venue = venueById.get(dish.venueId);
    if (venue === undefined) continue;
    const distanceMeters = venue.distanceMeters;
    if (maxDistanceMeters !== null && distanceMeters > maxDistanceMeters) continue;

    const score = terms.length === 0 ? 0 : scoreDish(dish, terms);
    if (score === null) continue;

    hits.push({
      item: dish.item,
      venueId: dish.venueId,
      venueName: dish.venueName,
      brand: dish.brand,
      currency: dish.currency,
      distanceMeters,
      coordSource: venue.coordSource,
      score,
    });
  }

  // With no search terms the only ranking signal is price, and ascending order fills
  // the screen with ketchup packets and extra bread. Someone asking what they can eat
  // for 60 EGP wants the most food that fits, so a pure budget search counts down.
  const budgetOnly = terms.length === 0;

  hits.sort(
    (a, b) =>
      a.score - b.score ||
      (budgetOnly
        ? (b.item.price ?? 0) - (a.item.price ?? 0)
        : (a.item.price ?? Infinity) - (b.item.price ?? Infinity)) ||
      a.distanceMeters - b.distanceMeters ||
      a.item.name.localeCompare(b.item.name)
  );

  return hits.slice(0, limit);
}

/** Groups hits by venue, preserving rank order, for a "3 spots have this" summary. */
export function groupHitsByVenue(hits: DishHit[]): { venueId: string; venueName: string; hits: DishHit[] }[] {
  const groups = new Map<string, { venueId: string; venueName: string; hits: DishHit[] }>();

  for (const hit of hits) {
    const existing = groups.get(hit.venueId);
    if (existing) {
      existing.hits.push(hit);
    } else {
      groups.set(hit.venueId, { venueId: hit.venueId, venueName: hit.venueName, hits: [hit] });
    }
  }

  return [...groups.values()];
}