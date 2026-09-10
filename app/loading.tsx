import { VenuePageSkeleton } from './components/VenueListSkeleton';

/**
 * Next.js App Router loading skeleton.
 *
 * Rendered instantly while the server component `Home` fetches initial data
 * or during navigation and server revalidation.
 */
export default function Loading() {
  return <VenuePageSkeleton />;
}
