import { NextResponse } from 'next/server';
import { createServerSupabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { isStudyAttributeId, type AttributeTally } from '@/lib/studySpots';
import { clientKey, rateLimit } from '@/lib/rateLimit';
import { VENUES_BY_ID } from '@/lib/venues';

/** Voting is one tap, so the honest ceiling is higher than for writing a review. */
const POST_LIMIT = 20;
const POST_WINDOW_MS = 60_000;

const noStore = { 'Cache-Control': 'no-store' };

/**
 * Study-spot attribute votes.
 *
 * GET  /api/attributes                  -> tallies for every venue
 * GET  /api/attributes?venue_id=fue-...  -> tallies for one venue
 * POST /api/attributes                  -> cast or change a vote
 *
 * There is no in-memory fallback here, deliberately. The reviews route taught the
 * lesson: a fallback that accepts a write and stores it in one serverless instance's
 * memory reports success for data that is already gone. If the table is missing or
 * unreachable, this says so.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const venueId = searchParams.get('venue_id');

  if (venueId && !VENUES_BY_ID.has(venueId)) {
    return NextResponse.json({ error: 'Unknown venue_id' }, { status: 404, headers: noStore });
  }

  if (!isSupabaseConfigured()) {
    // Nothing is configured, so there are genuinely no votes — an empty list is
    // the truthful answer, not an error.
    return NextResponse.json([], { headers: noStore });
  }

  const db = createServerSupabase();
  if (!db) return NextResponse.json([], { headers: noStore });

  let query = db
    .from('venue_attribute_stats')
    .select('venue_id, attribute, yes_count, total_count');

  if (venueId) query = query.eq('venue_id', venueId);

  const { data, error } = await query;

  if (error) {
    // The table not existing yet is a setup state, not a failure: schema.sql has
    // not been re-run. Say so plainly rather than pretending there are no votes.
    console.warn('venue_attribute_stats unavailable:', error.message);
    return NextResponse.json(
      { error: 'Study-spot data is unavailable. Has supabase/schema.sql been re-run?' },
      { status: 503, headers: noStore }
    );
  }

  const tallies: AttributeTally[] = (data ?? []).map((row) => ({
    venueId: row.venue_id as string,
    attribute: row.attribute as AttributeTally['attribute'],
    yesCount: Number(row.yes_count) || 0,
    totalCount: Number(row.total_count) || 0,
  }));

  return NextResponse.json(tallies, { headers: noStore });
}

export async function POST(request: Request) {
  const limitResult = rateLimit(`attrs:${clientKey(request)}`, POST_LIMIT, POST_WINDOW_MS);
  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: 'You are voting too quickly. Please wait a moment.' },
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

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { error: 'Request body must be a JSON object.' },
      { status: 400, headers: noStore }
    );
  }

  const input = body as Record<string, unknown>;

  const venueId = typeof input.venue_id === 'string' ? input.venue_id : '';
  if (!VENUES_BY_ID.has(venueId)) {
    return NextResponse.json({ error: 'Unknown venue_id.' }, { status: 400, headers: noStore });
  }

  if (!isStudyAttributeId(input.attribute)) {
    return NextResponse.json({ error: 'Unknown attribute.' }, { status: 400, headers: noStore });
  }

  if (typeof input.value !== 'boolean') {
    return NextResponse.json(
      { error: 'Value must be true or false.' },
      { status: 400, headers: noStore }
    );
  }

  // Length-checked rather than format-checked: it is a de-duplication key, not an
  // identity, so the only thing that matters is that it is a sane size.
  const voterToken = typeof input.voter_token === 'string' ? input.voter_token.trim() : '';
  if (voterToken.length < 8 || voterToken.length > 64) {
    return NextResponse.json(
      { error: 'Missing or malformed voter token.' },
      { status: 400, headers: noStore }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Voting is unavailable because no database is configured.' },
      { status: 503, headers: noStore }
    );
  }

  const db = createServerSupabase();
  if (!db) {
    return NextResponse.json(
      { error: 'Voting is unavailable right now.' },
      { status: 503, headers: noStore }
    );
  }

  const { error } = await db.from('venue_attributes').upsert(
    {
      venue_id: venueId,
      attribute: input.attribute,
      value: input.value,
      voter_token: voterToken,
    },
    { onConflict: 'venue_id,attribute,voter_token' }
  );

  if (error) {
    console.error('Attribute vote failed:', error.message);
    return NextResponse.json(
      { error: 'Your vote could not be saved. Please try again in a moment.' },
      { status: 503, headers: noStore }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201, headers: noStore });
}
