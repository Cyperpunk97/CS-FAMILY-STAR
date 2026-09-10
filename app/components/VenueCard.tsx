'use client';

import { memo, useState } from 'react';
import { Check, ChevronRight, Heart, Link2, Star } from 'lucide-react';
import VenueAvatar from './VenueLogo';
import { CATEGORY_STYLE, formatRating, priceInfo, reviewCountLabel } from '@/lib/format';
import { campusDistanceDescription, campusDistanceLabel, walkingMinutes } from '@/lib/geo';
import type { VenueWithStats } from '@/lib/types';

/**
 * One venue in the list.
 *
 * Deliberately calm. An earlier version carried a labelled meta grid plus a row of
 * Directions / Call / Menu / Save / Rate buttons — five controls per card, times a
 * hundred cards, which read as a wall. Everything actionable now lives in the detail
 * sheet; the card carries only what you scan by: who, how good, how far, how much.
 *
 * Actions:
 * - Card surface opens the detail sheet with dishes and reviews.
 * - 'Copy link' copies a shareable deep-link (?spot=<id>) directly to the clipboard.
 * - 'Heart' toggles favorite state.
 */

interface VenueCardProps {
  venue: VenueWithStats;
  index: number;
  isFavorite: boolean;
  onOpen: (venue: VenueWithStats) => void;
  onToggleFavorite: (id: string) => void;
}

function VenueCardImpl({ venue, index, isFavorite, onOpen, onToggleFavorite }: VenueCardProps) {
  const [copied, setCopied] = useState(false);
  const price = priceInfo(venue);
  const category = CATEGORY_STYLE[venue.category];
  const rated = venue.averageRating > 0;

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const url = new URL(window.location.origin + window.location.pathname);
      url.searchParams.set('spot', venue.id);
      const shareUrl = url.toString();

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy deep link:', err);
    }
  };

  return (
    <article
      // --i drives the staggered entrance; the utility caps the delay.
      style={{ '--i': index } as React.CSSProperties}
      className="stagger group relative flex items-center gap-1 rounded-[--radius-card] border border-hairline bg-card pr-2.5 transition duration-200 hover:border-brand-200 hover:shadow-[0_2px_16px_-4px_rgb(87_26_26/0.13)] cursor-pointer"
      onClick={() => onOpen(venue)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if ((e.target as HTMLElement).tagName !== 'BUTTON') {
            e.preventDefault();
            onOpen(venue);
          }
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${venue.name}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-3 text-left">
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
              {walkingMinutes(venue.distanceMeters)}m walk ({campusDistanceLabel(venue.distanceMeters, venue.coordSource)})
            </span>
            <span aria-hidden="true" className="shrink-0 text-ink-faint">·</span>
            <span className={`truncate ${price.isReported ? 'font-bold text-ink' : ''}`}>
              {price.text}
            </span>
          </span>

          {/* Must-try is reserved for vetted spots: rated with at least 4.0 stars */}
          {venue.reviewCount > 0 && venue.averageRating >= 4 && venue.topDishes && venue.topDishes.length > 0 && (
            <span className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-ink-soft">
              <span className="shrink-0 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200/60">
                Must-try
              </span>
              <span className="truncate font-medium text-ink-dark">{venue.topDishes[0]}</span>
            </span>
          )}

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
      </div>

      <div className="relative z-10 flex shrink-0 items-center gap-0.5">
        <button
          id={`copy-link-${venue.id}`}
          type="button"
          onClick={handleCopyLink}
          aria-label={copied ? `Link copied for ${venue.name}` : `Copy link to share ${venue.name}`}
          title={copied ? 'Link copied to clipboard!' : 'Copy link'}
          className={`group/btn relative rounded-lg p-2 transition ${
            copied
              ? 'bg-emerald-50 text-emerald-700'
              : 'text-ink-faint hover:bg-brand-50 hover:text-brand-700 active:scale-95'
          }`}
        >
          {copied ? (
            <Check className="h-4 w-4 animate-pop text-emerald-600" aria-hidden="true" />
          ) : (
            <Link2 className="h-4 w-4 transition-transform group-hover/btn:scale-110" aria-hidden="true" />
          )}
          <span className="sr-only">
            {copied ? `Link copied to clipboard for ${venue.name}` : `Copy link to ${venue.name}`}
          </span>
          {copied && (
            <span
              role="status"
              className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm animate-fade-in"
            >
              Copied!
            </span>
          )}
        </button>

        <button
          id={`save-btn-${venue.id}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(venue.id);
          }}
          aria-pressed={isFavorite}
          className="rounded-lg p-2 text-ink-faint transition hover:bg-brand-50 hover:text-brand-700 active:scale-95"
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
      </div>

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
