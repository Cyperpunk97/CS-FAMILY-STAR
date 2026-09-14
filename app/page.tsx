import { Heart } from 'lucide-react';
import VenueList from './components/VenueList';
import { getVenuesWithStats } from '@/lib/venueStats';

/**
 * Server Component.
 *
 * The venue list is fetched on the server and handed to the client already
 * populated. Previously the whole page was `'use client'` and hit /api/restaurants
 * from a `useEffect`, so every visitor saw a spinner while the browser made a second
 * round trip for data the server already had.
 */
/**
 * Rebuild this page at most every 30 seconds.
 *
 * Without this the route is prerendered once at build time and every visitor sees
 * the ratings frozen as they were when the app was deployed. 30s keeps the first
 * paint fast and served from cache, while a student who posts a review sees it
 * immediately because the client refetches `/api/restaurants`, which is uncached.
 * Must stay a literal — Next requires this value to be statically analyzable.
 */
export const revalidate = 30;

export default async function Home() {
  const venues = await getVenuesWithStats();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:px-6">
      <VenueList initialVenues={venues} />

      <footer className="mt-10 border-t border-hairline pt-5 text-center">
        <p className="flex items-center justify-center gap-1.5 text-xs text-ink-soft">
          <span>Crafted with</span>
          <Heart className="h-3 w-3 fill-brand-700 text-brand-700" aria-hidden="true" />
          <span>
            by <strong className="font-bold text-ink">Youssef Ahmed</strong> and{' '}
            <strong className="font-bold text-ink">Ahmed Abdelwahab</strong>
          </span>
        </p>
        <p className="mt-1.5 text-xs text-ink-faint">
          Distances are straight-line from the FUE campus. Prices are what students report.
        </p>
      </footer>
    </main>
  );
}
