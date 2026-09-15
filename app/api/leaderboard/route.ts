import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/leaderboard';

export const dynamic = 'force-dynamic';

const noStore = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
};

export async function GET() {
  try {
    const data = await getLeaderboard();
    return NextResponse.json(data, { headers: noStore });
  } catch {
    return NextResponse.json({ error: 'Failed to load leaderboard' }, { status: 500, headers: noStore });
  }
}
