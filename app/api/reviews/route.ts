import { NextResponse } from 'next/server';
import { createServerSupabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { addInMemoryReview, getInMemoryReviews } from '@/lib/inMemoryReviews';
import { parseReview } from '@/lib/validation';
import { clientKey, rateLimit } from '@/lib/rateLimit';
import { VENUES_BY_ID } from '@/lib/venues';
import { LIMITS } from '@/lib/types';

const SELECT_COLUMNS =
  'id, restaurant_id, rating, comment, user_name, image_url, price_per_person, recommended_dish, created_at';
const SELECT_COLUMNS_WITH_PRICE =
  'id, restaurant_id, rating, comment, user_name, image_url, price_per_person, created_at';
const SELECT_COLUMNS_LEGACY =
  'id, restaurant_id, rating, comment, user_name, image_url, created_at';

/** 5 reviews per minute per client, enough for honest use and not for spamming. */
const POST_LIMIT = 5;
const POST_WINDOW_MS = 60_000;

const noStore = { 'Cache-Control': 'no-store' };

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurant_id');

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Missing restaurant_id parameter' },
        { status: 400, headers: noStore }
      );
    }
    if (!VENUES_BY_ID.has(restaurantId)) {
      return NextResponse.json(
        { error: 'Unknown restaurant_id' },
        { status: 404, headers: noStore }
      );
    }

    // Bounded page size — an unbounded select would grow forever as reviews accumulate.
    const rawLimit = Number(searchParams.get('limit'));
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(Math.trunc(rawLimit), 1), LIMITS.reviewsPageSize)
      : LIMITS.reviewsPageSize;

    const rawOffset = Number(searchParams.get('offset'));
    const offset = Number.isFinite(rawOffset) ? Math.max(Math.trunc(rawOffset), 0) : 0;

    if (!isSupabaseConfigured()) {
      const memoryData = getInMemoryReviews(restaurantId, limit, offset);
      return NextResponse.json(memoryData, { headers: noStore });
    }

    const db = createServerSupabase();
    if (!db) {
      const memoryData = getInMemoryReviews(restaurantId, limit, offset);
      return NextResponse.json(memoryData, { headers: noStore });
    }

    const run = (columns: string) =>
      db
        .from('reviews')
        .select(columns)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    let { data, error } = await run(SELECT_COLUMNS);

    // If `recommended_dish` does not exist yet on Supabase, fall back
    if (error && /recommended_dish/.test(error.message)) {
      ({ data, error } = await run(SELECT_COLUMNS_WITH_PRICE));
    }

    // `price_per_person` only exists once supabase/schema.sql has been applied.
    if (error && /price_per_person/.test(error.message)) {
      ({ data, error } = await run(SELECT_COLUMNS_LEGACY));
    }

    if (error) {
      console.warn('Supabase review fetch failed, returning in-memory reviews:', error.message);
      const memoryData = getInMemoryReviews(restaurantId, limit, offset);
      return NextResponse.json(memoryData, { headers: noStore });
    }

    return NextResponse.json(data ?? [], { headers: noStore });
  } catch (err) {
    console.error('Unexpected error in GET /api/reviews:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: noStore }
    );
  }
}

export async function POST(request: Request) {
  try {
    const limitResult = rateLimit(clientKey(request), POST_LIMIT, POST_WINDOW_MS);
    if (!limitResult.allowed) {
      return NextResponse.json(
        { error: 'You are reviewing too quickly. Please wait a moment.' },
        {
          status: 429,
          headers: { ...noStore, 'Retry-After': String(limitResult.retryAfterSeconds) },
        }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Request body must be valid JSON.' },
        { status: 400, headers: noStore }
      );
    }

    const parsed = parseReview(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400, headers: noStore });
    }

    if (!isSupabaseConfigured()) {
      const saved = addInMemoryReview(parsed.value);
      return NextResponse.json(saved, { status: 201, headers: noStore });
    }

    const db = createServerSupabase();
    if (!db) {
      const saved = addInMemoryReview(parsed.value);
      return NextResponse.json(saved, { status: 201, headers: noStore });
    }

    let { data, error } = await db
      .from('reviews')
      .insert([parsed.value])
      .select(SELECT_COLUMNS);

    // Fall back if recommended_dish column does not exist yet on Supabase
    if (error && /recommended_dish/.test(error.message)) {
      const payloadWithoutDish = { ...parsed.value };
      delete (payloadWithoutDish as Partial<typeof payloadWithoutDish>).recommended_dish;
      ({ data, error } = await db.from('reviews').insert([payloadWithoutDish]).select(SELECT_COLUMNS_WITH_PRICE));
    }

    // Fall back to the pre-migration schema so the app keeps working either way.
    if (error && /price_per_person/.test(error.message)) {
      const legacy = { ...parsed.value };
      delete (legacy as Partial<typeof legacy>).recommended_dish;
      delete (legacy as Partial<typeof legacy>).price_per_person;
      ({ data, error } = await db.from('reviews').insert([legacy]).select(SELECT_COLUMNS_LEGACY));
    }

    if (error) {
      console.warn('Supabase insert failed, saving to local in-memory store:', error.message);
      const saved = addInMemoryReview(parsed.value);
      return NextResponse.json(saved, { status: 201, headers: noStore });
    }

    if (!data || data.length === 0) {
      // If RLS returned empty, save to memory store as backup
      const saved = addInMemoryReview(parsed.value);
      return NextResponse.json(saved, { status: 201, headers: noStore });
    }

    return NextResponse.json(data[0], { status: 201, headers: noStore });
  } catch (err) {
    console.error('Unexpected error in POST /api/reviews:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: noStore }
    );
  }
}

