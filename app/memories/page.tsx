import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Heart, Sparkles } from 'lucide-react';
import MemoriesView from '../components/MemoriesView';
import { getInMemoryMemories } from '@/lib/memories';

export const metadata: Metadata = {
  title: 'Outing Memories',
  description:
    'Share and explore student memories, laughs, post-exam celebrations, and late-night food runs around the FUE campus.',
};

export const revalidate = 10;

export default async function MemoriesPage() {
  const initialMemories = getInMemoryMemories();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:px-6">
      <Suspense fallback={<MemoriesLoading />}>
        <MemoriesView initialMemories={initialMemories} />
      </Suspense>

      <footer className="mt-12 border-t border-amber-200/60 pt-5 text-center">
        <p className="flex items-center justify-center gap-1.5 text-xs text-ink-soft">
          <span>Crafted with</span>
          <Heart className="h-3 w-3 fill-amber-600 text-amber-600" aria-hidden="true" />
          <span>
            by <strong className="font-bold text-ink">Youssef Ahmed</strong> and{' '}
            <strong className="font-bold text-ink">Ahmed Abdelwahab</strong>
          </span>
        </p>
        <p className="mt-1.5 text-xs text-ink-faint">
          FUE Student Memories · Good food, late nights, and lasting friendships.
        </p>
      </footer>
    </main>
  );
}

function MemoriesLoading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
      <Sparkles className="h-8 w-8 text-amber-500 animate-spin" />
      <p className="mt-3 text-xs font-bold text-amber-950">Loading outing memories...</p>
    </div>
  );
}
