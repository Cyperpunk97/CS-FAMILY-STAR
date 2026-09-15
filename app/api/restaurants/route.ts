import { NextResponse } from 'next/server';
import { getVenuesWithStats } from '@/lib/venueStats';

/**
 * Venue list with live review stats.
 *
 * This file used to hold 100 hardcoded venues (now `lib/venues.ts`) plus an
 * Overpass OSM call on every request whose results were unconditionally discarded
 * by a `.slice(0, 100)` on a list whose first 100 entries were already the fallback.
 * The catalog is authored data; OSM contact lookup is a one-off script
 * (`npm run osm:contacts`), not a per-request dependency.
 *
 * The page server-renders this same data directly, so this route exists for the
 * client to refresh stats after someone posts a review.
 */
export async function GET() {
  const venues = await getVenuesWithStats();

  // Ratings change constantly — never let a CDN hold on to this.
  return NextResponse.json(venues, { headers: { 'Cache-Control': 'no-store' } });
}
