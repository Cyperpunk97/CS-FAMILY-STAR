import 'server-only';

import { createServerSupabase, isSupabaseConfigured } from './supabaseClient';
import { getInMemoryReviewStats, getInMemoryTopDishes } from './inMemoryReviews';
import { VENUES } from './venues';
import { FUE_CAMPUS, haversineMeters, mapsDirectionsUrl, mapsPinUrl } from './geo';
import { fetchWikipediaLogo, isWorldwideRestaurant } from './wikipediaLogos';
import type { VenueWithStats } from './types';

/**
 * Builds the venue list with live review stats.
 *
 * Shared by the server-rendered page (first paint, no spinner) and by
 * `/api/restaurants` (refresh after a review is posted) so there is exactly one
 * implementation of the join.
 */

interface Stats {
  sum: number;
  count: number;
  priceSum: number;
  priceCount: number;
}

/** Supabase caps a single select at 1000 rows by default, so raw reads are paged. */
const PAGE_SIZE = 1000;
const MAX_PAGES = 50;

/**
 * Hard ceiling on how long the page render will wait for ratings.
 *
 * Without this, a slow or unreachable Supabase blocks the server render
 * indefinitely and the whole site hangs. The venue catalog is local data, so the
 * page can always render — ratings are the only thing that degrades.
 */
const STATS_TIMEOUT_MS = 4000;

type Db = NonNullable<ReturnType<typeof createServerSupabase>>;

async function loadStats(db: Db): Promise<Map<string, Stats>> {
  const stats = new Map<string, Stats>();

  // Fast path: Postgres aggregates, we do one round trip.
  const view = await db
    .from('review_stats')
    .select('restaurant_id, rating_sum, rating_count, price_sum, price_count')
    .abortSignal(AbortSignal.timeout(STATS_TIMEOUT_MS));

  if (!view.error && view.data) {
    for (const row of view.data) {
      stats.set(row.restaurant_id, {
        sum: Number(row.rating_sum) || 0,
        count: Number(row.rating_count) || 0,
        priceSum: Number(row.price_sum) || 0,
        priceCount: Number(row.price_count) || 0,
      });
    }
    return stats;
  }

  // Fallback for a database that has not had supabase/schema.sql applied yet.
  let hasPriceColumn = true;

  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;
    const columns = hasPriceColumn
      ? 'restaurant_id, rating, price_per_person'
      : 'restaurant_id, rating';

    const { data, error } = await db
      .from('reviews')
      .select(columns)
      .range(from, from + PAGE_SIZE - 1)
      .abortSignal(AbortSignal.timeout(STATS_TIMEOUT_MS));

    if (error) {
      if (hasPriceColumn && /price_per_person/.test(error.message)) {
        hasPriceColumn = false;
        page--; // retry the same page without the column
        continue;
      }
      console.warn('Supabase review stats query degraded, falling back to local store:', error.message);
      return getInMemoryReviewStats();
    }

    const rows = (data ?? []) as unknown as {
      restaurant_id: string;
      rating: number;
      price_per_person?: number | null;
    }[];
    if (rows.length === 0) break;

    for (const row of rows) {
      const entry = stats.get(row.restaurant_id) ?? {
        sum: 0,
        count: 0,
        priceSum: 0,
        priceCount: 0,
      };

      const rating = Number(row.rating);
      if (Number.isFinite(rating)) {
        entry.sum += rating;
        entry.count += 1;
      }

      const price = Number(row.price_per_person);
      if (Number.isFinite(price) && price > 0) {
        entry.priceSum += price;
        entry.priceCount += 1;
      }

      stats.set(row.restaurant_id, entry);
    }

    if (rows.length < PAGE_SIZE) break;
  }

  return stats;
}

export async function getVenuesWithStats(): Promise<VenueWithStats[]> {
  let stats = new Map<string, Stats>();

  try {
    if (isSupabaseConfigured()) {
      const db = createServerSupabase();
      if (db) {
        stats = await loadStats(db);
      } else {
        stats = getInMemoryReviewStats();
      }
    } else {
      stats = getInMemoryReviewStats();
    }
  } catch (err) {
    console.warn('Review stats unavailable from remote database, serving local store stats:', err);
    stats = getInMemoryReviewStats();
  }

  const inMemoryDishes = getInMemoryTopDishes();

  return Promise.all(
    VENUES.map(async (venue) => {
      const s = stats.get(venue.id);
      const crowdDishes = inMemoryDishes.get(venue.id) ?? [];
      const combinedDishes = venue.signatureDish
        ? Array.from(new Set([venue.signatureDish, ...crowdDishes]))
        : crowdDishes;

      let logoUrl = venue.logoUrl;
      let logoWidth = venue.logoWidth;
      let logoHeight = venue.logoHeight;

      // Auto-fetch logo from Wikipedia for worldwide restaurants only
      if (!logoUrl && isWorldwideRestaurant(venue.brand)) {
        const wikiInfo = await fetchWikipediaLogo(venue.brand);
        if (wikiInfo) {
          logoUrl = wikiInfo.logoUrl;
          logoWidth = wikiInfo.logoWidth;
          logoHeight = wikiInfo.logoHeight;
        }
      }

      return {
        ...venue,
        logoUrl,
        logoWidth,
        logoHeight,
        averageRating: s && s.count > 0 ? Number((s.sum / s.count).toFixed(1)) : 0,
        reviewCount: s?.count ?? 0,
        averagePrice: s && s.priceCount > 0 ? Math.round(s.priceSum / s.priceCount) : null,
        priceReportCount: s?.priceCount ?? 0,
        distanceMeters: haversineMeters(FUE_CAMPUS, venue),
        mapsUrl: mapsPinUrl(venue),
        directionsUrl: mapsDirectionsUrl(venue),
        topDishes: combinedDishes,
      };
    })
  );
}

