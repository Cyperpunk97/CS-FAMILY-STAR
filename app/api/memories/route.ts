import { NextRequest, NextResponse } from 'next/server';
import { addInMemoryMemory, getInMemoryMemories, MemoryMood } from '@/lib/memories';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mood = searchParams.get('mood') || undefined;
  const venueId = searchParams.get('venueId') || undefined;

  const memories = getInMemoryMemories(mood, venueId);

  return NextResponse.json(memories, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, venueName, authorName, date, story, mood, venueId, faculty, photoUrl, photoCaption, tags } = body;

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return NextResponse.json({ error: 'Title is required (at least 3 characters)' }, { status: 400 });
    }
    if (!venueName || typeof venueName !== 'string' || venueName.trim().length < 2) {
      return NextResponse.json({ error: 'Where did you go out? Please provide a venue or spot name.' }, { status: 400 });
    }
    if (!authorName || typeof authorName !== 'string' || authorName.trim().length < 2) {
      return NextResponse.json({ error: 'Author name is required' }, { status: 400 });
    }
    if (!story || typeof story !== 'string' || story.trim().length < 5) {
      return NextResponse.json({ error: 'Please share a brief story of your outing' }, { status: 400 });
    }

    const validMoods: MemoryMood[] = [
      'celebration',
      'exam_relief',
      'midnight_run',
      'chill_latte',
      'laughing_fit',
      'study_crunch',
      'golden_hour',
    ];

    const safeMood: MemoryMood = validMoods.includes(mood) ? mood : 'celebration';

    const memory = addInMemoryMemory({
      title: title.trim().slice(0, 100),
      venueName: venueName.trim().slice(0, 80),
      venueId: venueId ? String(venueId).slice(0, 60) : undefined,
      authorName: authorName.trim().slice(0, 50),
      faculty: faculty ? String(faculty).slice(0, 50) : undefined,
      date: date ? String(date).slice(0, 20) : new Date().toISOString().split('T')[0],
      story: story.trim().slice(0, 1000),
      mood: safeMood,
      photoUrl: photoUrl && typeof photoUrl === 'string' ? photoUrl.slice(0, 5000000) : undefined,
      photoCaption: photoCaption ? String(photoCaption).slice(0, 100) : undefined,
      tags: Array.isArray(tags) ? tags.map((t) => String(t).trim().slice(0, 30)).filter(Boolean).slice(0, 6) : [],
    });

    return NextResponse.json(memory, { status: 201 });
  } catch (error) {
    console.error('Failed to create memory:', error);
    return NextResponse.json({ error: 'Failed to create memory' }, { status: 500 });
  }
}
