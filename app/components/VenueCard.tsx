'use client';

import { memo } from 'react';
import { ChevronRight, Heart, Star } from 'lucide-react';
import VenueAvatar from './VenueLogo';
import { CATEGORY_STYLE, formatRating, priceInfo, reviewCountLabel } from '@/lib/format';
import { campusDistanceDescription, campusDistanceLabel } from '@/lib/geo';
import type { VenueWithStats } from '@/lib/types';

/**
 * One venue in the list.
 *
 * Deliberately calm. An earlier version carried a labelled meta grid plus a row of
 * Directions / Call / Menu / Save / Rate buttons — five controls per card, times a
 * hundred cards, which read as a wall. Everything actionable now lives in the detail
 * sheet; the card carries only what you scan by: who, how good, how far, how much.
 *
 * Click target: the card button's `::after` stretches over the whole article, so the
 * entire surface opens the sheet. Save sits above it with `z-10`, which keeps the two
 * controls siblings rather than nesting one button inside another.
 */

interface VenueCardProps {
  venue: VenueWithStats;
  index: number;
  isFavorite: boolean;
  onOpen: (venue: VenueWithStats) => void;
  onToggleFavorite: (id: string) => void;
}

function VenueCardImpl({ venue, index, isFavorite, onOpen, onToggleFavorite }: VenueCardProps) {
  const price = priceInfo(venue);
  const category = CATEGORY_STYLE[venue.category];
  const rated = venue.averageRating > 0;

  return (
    <article
      // --i drives the staggered entrance; the utility caps the delay.
      style={{ '--i': index } as React.CSSProperties}
      className="stagger group relative flex items-center gap-1 rounded-[--radius-card] border border-hairline bg-card pr-2.5 transition duration-200 hover:border-brand-200 hover:shadow-[0_2px_16px_-4px_rgb(87_26_26/0.13)]"
    >
      <button
        type="button"
        onClick={() => onOpen(venue)}
        className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-3 text-left after:absolute after:inset-0 after:content-['']"
      >
        <VenueAvatar venue={venue} />

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="min-w-0 truncate text-[0.95rem] font-bold leading-snug text-ink transition-colors group-hover:text-brand-700">
              {venue.name}
            </span>

            {rated ? (
              <span className="flex shrink-0 items-center gap-0.5 text-sm font-bold text-ink">
                <Star className="h-3.5 w-3.5 fill-star text-star" aria-hidden="true" />
                {formatRating(venue.averageRating)}
              </span>
            ) : (
              <span className="shrink-0 rounded-md bg-surface px-1.5 py-0.5 text-xs font-bold text-ink-faint">
                New
              </span>
            )}
          </span>

          {/* One quiet meta line instead of a grid of labelled stats. It never wraps —
              a second line here is what made the old list feel like a wall. */}
          <span className="mt-0.5 flex items-center gap-1.5 truncate whitespace-nowrap text-xs text-ink-soft">
            <span className={`shrink-0 font-bold ${category.text}`}>{venue.category}</span>
            <span aria-hidden="true" className="shrink-0 text-ink-faint">·</span>
            <span className="shrink-0">
              {campusDistanceLabel(venue.distanceMeters, venue.coordSource)}
            </span>
            <span aria-hidden="true" className="shrink-0 text-ink-faint">·</span>
            <span className={`truncate ${price.isReported ? 'font-bold text-ink' : ''}`}>
              {price.text}
            </span>
          </span>

          {/* Spoken as a sentence — the star icons above are decorative, and a
              screen reader would otherwise announce the "~" as "tilde". */}
          <span className="sr-only">
            {campusDistanceDescription(venue.distanceMeters, venue.coordSource)}.{' '}
            {rated
              ? `Rated ${venue.averageRating} out of 5 from ${reviewCountLabel(venue.reviewCount)}.`
              : 'Not rated yet.'}{' '}
            {price.isReported
              ? `Students report about ${venue.averagePrice} EGP per person.`
              : `Estimated ${price.text} per person.`}
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => onToggleFavorite(venue.id)}
        aria-pressed={isFavorite}
        className="relative z-10 shrink-0 rounded-lg p-2 text-ink-faint transition hover:bg-brand-50 hover:text-brand-700"
      >
        <Heart
          className={`h-4 w-4 transition ${
            isFavorite ? 'animate-pop fill-brand-600 text-brand-600' : ''
          }`}
          aria-hidden="true"
        />
        <span className="sr-only">
          {isFavorite ? `Remove ${venue.name} from saved` : `Save ${venue.name}`}
        </span>
      </button>

      <ChevronRight
        className="pointer-events-none h-4 w-4 shrink-0 text-ink-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand-600"
        aria-hidden="true"
      />
    </article>
  );
}

/**
 * Memoised: the list re-renders on every keystroke in the search box, and without
 * this all 100 cards reconcile on each one.
 */
export default memo(VenueCardImpl);
