import { NextRequest, NextResponse } from 'next/server';
import {
  fetchWikipediaLogo,
  isWorldwideRestaurant,
  WORLDWIDE_RESTAURANT_CONFIG,
} from '@/lib/wikipediaLogos';
import { clientKey, rateLimit } from '@/lib/rateLimit';

/** This route calls the Wikipedia API, so it is throttled like any outbound lookup. */
const LOOKUP_LIMIT = 20;
const LOOKUP_WINDOW_MS = 60_000;

/**
 * API route to auto-fetch restaurant brand logos from Wikipedia.
 *
 * Strictly enforces: WORLDWIDE RESTAURANTS ONLY.
 * Local Egyptian eateries and campus cafes are intentionally rejected.
 */
export async function GET(req: NextRequest) {
  const limitResult = rateLimit(`logos:${clientKey(req)}`, LOOKUP_LIMIT, LOOKUP_WINDOW_MS);
  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many logo lookups. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(limitResult.retryAfterSeconds) } }
    );
  }

  const { searchParams } = new URL(req.url);
  const brand = searchParams.get('brand');

  if (!brand) {
    // If no brand specified, return list of recognized worldwide restaurants
    return NextResponse.json({
      message: 'Provide ?brand=<name> to fetch a logo. Wikipedia auto-fetching is restricted to worldwide restaurants only.',
      worldwideRestaurants: Object.keys(WORLDWIDE_RESTAURANT_CONFIG),
    });
  }

  // Strict boundary: reject local brands
  if (!isWorldwideRestaurant(brand)) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: `Logo auto-fetching from Wikipedia is restricted to worldwide restaurants only. "${brand}" is a local or domestic business and uses its authentic monogram avatar.`,
      },
      { status: 400 }
    );
  }

  const logoInfo = await fetchWikipediaLogo(brand);

  if (!logoInfo) {
    return NextResponse.json(
      {
        error: 'Not Found',
        message: `No suitable Wikipedia logo found for worldwide brand "${brand}".`,
      },
      { status: 404 }
    );
  }

  return NextResponse.json(logoInfo, {
    headers: {
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
