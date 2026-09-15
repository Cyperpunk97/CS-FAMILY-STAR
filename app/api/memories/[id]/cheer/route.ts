import { NextRequest, NextResponse } from 'next/server';
import { cheerInMemoryMemory } from '@/lib/memories';
import { clientKey, rateLimit } from '@/lib/rateLimit';

/**
 * 30 cheers per minute per client. Cheering is one tap, so the honest ceiling is
 * high — but without any limit this endpoint let one client inflate a count forever.
 */
const CHEER_LIMIT = 30;
const CHEER_WINDOW_MS = 60_000;

const noStore = { 'Cache-Control': 'no-store' };

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const limitResult = rateLimit(`cheer:${clientKey(req)}`, CHEER_LIMIT, CHEER_WINDOW_MS);
  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many cheers. Please slow down.' },
      {
        status: 429,
        headers: { ...noStore, 'Retry-After': String(limitResult.retryAfterSeconds) },
      }
    );
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Missing memory ID' }, { status: 400, headers: noStore });
  }

  const result = cheerInMemoryMemory(id);
  if (!result) {
    return NextResponse.json({ error: 'Memory not found' }, { status: 404, headers: noStore });
  }

  return NextResponse.json(result, { headers: noStore });
}
