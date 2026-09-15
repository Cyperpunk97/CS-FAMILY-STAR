import { NextRequest, NextResponse } from 'next/server';
import {
  extractTalabatMenuByName,
  extractTalabatMenuFromUrl,
  getAvailableTalabatBrands,
} from '@/lib/talabat';
import { clientKey, rateLimit } from '@/lib/rateLimit';

/**
 * This route makes an outbound request per call, so it is rate limited on both verbs.
 * 10 per minute is far more than a student browsing menus needs, and stops the route
 * being used to hammer a third party from our IP.
 */
const LOOKUP_LIMIT = 10;
const LOOKUP_WINDOW_MS = 60_000;

function tooMany(retryAfterSeconds: number) {
  return NextResponse.json(
    { success: false, error: 'Too many menu lookups. Please wait a moment.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  );
}

export async function GET(request: NextRequest) {
  const limitResult = rateLimit(`talabat:${clientKey(request)}`, LOOKUP_LIMIT, LOOKUP_WINDOW_MS);
  if (!limitResult.allowed) return tooMany(limitResult.retryAfterSeconds);

  const { searchParams } = new URL(request.url);

  if (searchParams.get('list') === 'true') {
    return NextResponse.json({
      success: true,
      brands: getAvailableTalabatBrands(),
    });
  }

  const name = searchParams.get('name');
  const url = searchParams.get('url');
  const venueId = searchParams.get('venueId') || undefined;
  const forceLive = searchParams.get('forceLive') === 'true';

  if (url) {
    const result = await extractTalabatMenuFromUrl(url, venueId || 'talabat-extracted', name || undefined);
    return NextResponse.json(result);
  }

  if (name) {
    const result = await extractTalabatMenuByName(name, {
      venueId,
      forceLive,
    });
    return NextResponse.json(result);
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Please provide either ?name=<restaurant-name> or ?url=<talabat-url>',
    },
    { status: 400 }
  );
}

export async function POST(request: NextRequest) {
  const limitResult = rateLimit(`talabat:${clientKey(request)}`, LOOKUP_LIMIT, LOOKUP_WINDOW_MS);
  if (!limitResult.allowed) return tooMany(limitResult.retryAfterSeconds);

  try {
    const body = await request.json();
    const { name, url, venueId, forceLive } = body || {};

    if (url) {
      const result = await extractTalabatMenuFromUrl(
        url,
        venueId || 'talabat-extracted',
        name || undefined
      );
      return NextResponse.json(result);
    }

    if (name) {
      const result = await extractTalabatMenuByName(name, {
        venueId,
        forceLive: !!forceLive,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Please provide "name" or "url" in request body.',
      },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request payload';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 }
    );
  }
}
