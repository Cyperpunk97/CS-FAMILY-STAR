import type { VenueWithStats } from './types';

/**
 * "Surprise me" — picks a spot when nobody can decide.
 *
 * Two deliberate choices.
 *
 * It picks from the *filtered* list, not the whole catalog. If someone has set
 * "walking distance" and "under 100 EGP", a surprise 3 km away at 400 EGP is not a
 * surprise, it is a bug. The caller passes whatever is currently on screen.
 *
 * And the pick is uniform, not weighted toward highly-rated spots. A weighted pick
 * would quietly return the same four venues and stop being a surprise — the ratings
 * sort already exists for people who want the best rather than the unexpected.
 */

/** Avoid handing back the same venue twice in a row, which reads as a broken button. */
export function pickSurprise(
  venues: VenueWithStats[],
  previousId?: string | null,
  /** Injectable for tests; defaults to Math.random. */
  random: () => number = Math.random
): VenueWithStats | null {
  if (venues.length === 0) return null;
  if (venues.length === 1) return venues[0];

  const candidates = previousId ? venues.filter((v) => v.id !== previousId) : venues;

  // Every candidate was excluded (the list is a single repeated id); fall back.
  const pool = candidates.length > 0 ? candidates : venues;

  const index = Math.min(Math.floor(random() * pool.length), pool.length - 1);
  return pool[index];
}
