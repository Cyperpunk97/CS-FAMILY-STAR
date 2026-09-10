import { NextRequest, NextResponse } from 'next/server';
import { cheerInMemoryMemory } from '@/lib/memories';

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: 'Missing memory ID' }, { status: 400 });
  }

  const result = cheerInMemoryMemory(id);
  if (!result) {
    return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
  }

  return NextResponse.json(result);
}
