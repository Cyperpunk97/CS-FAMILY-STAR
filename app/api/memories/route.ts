import { NextRequest, NextResponse } from 'next/server';
import { addInMemoryMemory, getInMemoryMemories, MEMORY_MOODS, MemoryMood } from '@/lib/memories';
import { validateImageUrl } from '@/lib/validation';
import { clientKey, rateLimit } from '@/lib/rateLimit';

/** 5 memories per minute per client — generous for honest use, useless for flooding. */
const POST_LIMIT = 5;
const POST_WINDOW_MS = 60_000;

const noStore = { 'Cache-Control': 'no-store, max-age=0' };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mood = searchParams.get('mood') || undefined;
  const venueId = searchParams.get('venueId') || undefined;

  const memories = getInMemoryMemories(mood, venueId);

  return NextResponse.json(memories, { headers: noStore });
}

export async function POST(req: NextRequest) {
  const limitResult = rateLimit(clientKey(req), POST_LIMIT, POST_WINDOW_MS);
  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: 'You are posting too quickly. Please wait a moment.' },
      {
        status: 429,
        headers: { ...noStore, 'Retry-After': String(limitResult.retryAfterSeconds) },
      }
    );
  }

  try {
    const body = await req.json();
    const { title, venueName, authorName, date, story, mood, venueId, faculty, photoUrl, photoCaption, tags } = body;

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return NextResponse.json({ error: 'Title is required (at least 3 characters)' }, { status: 400, headers: noStore });
    }
    if (!venueName || typeof venueName !== 'string' || venueName.trim().length < 2) {
      return NextResponse.json({ error: 'Where did you go out? Please provide a venue or spot name.' }, { status: 400, headers: noStore });
    }
    if (!authorName || typeof authorName !== 'string' || authorName.trim().length < 2) {
      return NextResponse.json({ error: 'Author name is required' }, { status: 400, headers: noStore });
    }
    if (!story || typeof story !== 'string' || story.trim().length < 5) {
      return NextResponse.json({ error: 'Please share a brief story of your outing' }, { status: 400, headers: noStore });
    }

    // Derived from the mood table itself, so adding a mood cannot leave this behind.
    const validMoods = Object.keys(MEMORY_MOODS) as MemoryMood[];
    const safeMood: MemoryMood = validMoods.includes(mood) ? mood : 'celebration';

    // Same rule as review photos: our storage bucket only. This field used to accept
    // `photoUrl.slice(0, 5000000)` — a 5 MB base64 image kept in the server's heap.
    const safePhotoUrl = validateImageUrl(photoUrl);
    if (safePhotoUrl === undefined) {
      return NextResponse.json(
        { error: 'Photos must be uploaded through the form, not linked from elsewhere.' },
        { status: 400, headers: noStore }
      );
    }

    const memory = addInMemoryMemory({
      title: title.trim().slice(0, 100),
      venueName: venueName.trim().slice(0, 80),
      venueId: venueId ? String(venueId).slice(0, 60) : undefined,
      authorName: authorName.trim().slice(0, 50),
      faculty: faculty ? String(faculty).slice(0, 50) : undefined,
      date: date ? String(date).slice(0, 20) : new Date().toISOString().split('T')[0],
      story: story.trim().slice(0, 1000),
      mood: safeMood,
      photoUrl: safePhotoUrl ?? undefined,
      photoCaption: photoCaption ? String(photoCaption).slice(0, 100) : undefined,
      tags: Array.isArray(tags) ? tags.map((t) => String(t).trim().slice(0, 30)).filter(Boolean).slice(0, 6) : [],
    });

    return NextResponse.json(memory, { status: 201, headers: noStore });
  } catch (error) {
    console.error('Failed to create memory:', error);
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 500, headers: noStore });
  }
}
