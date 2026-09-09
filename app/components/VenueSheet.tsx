'use client';

import { useEffect, useState } from 'react';
import {
  Check,
  Heart,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Share2,
  UtensilsCrossed,
  Wallet,
  X,
} from 'lucide-react';
import Modal from './Modal';
import VenueAvatar, { VenueWordmark } from './VenueLogo';
import ReviewForm from './ReviewForm';
import { StarsDisplay } from './Stars';
import { CATEGORY_STYLE, formatRating, priceInfo, relativeDate, reviewCountLabel } from '@/lib/format';
import { campusDistanceLabel, osmEmbedUrl, walkingMinutes } from '@/lib/geo';
import { LIMITS, type Review, type VenueWithStats } from '@/lib/types';

interface VenueSheetProps {
  /** Never null: the parent renders this only for an open venue, keyed by its id. */
  venue: VenueWithStats;
  studentName: string;
  isFavorite: boolean;
  onClose: () => void;
  onNeedName: () => void;
  onToggleFavorite: (id: string) => void;
  onReviewPosted: () => void;
}

const QUICK_ACTION =
  'flex flex-1 min-w-[72px] flex-col items-center gap-1 rounded-xl border border-hairline bg-card px-2 py-2.5 text-xs font-bold text-ink-soft transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 active:scale-95';

export default function VenueSheet({
  venue,
  studentName,
  isFavorite,
  onClose,
  onNeedName,
  onToggleFavorite,
  onReviewPosted,
}: VenueSheetProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  // Starts true: this component is remounted per venue, so there is always a fetch
  // in flight on first render and the spinner should not flash off and back on.
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [shared, setShared] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const venueId = venue.id;

  useEffect(() => {
    // AbortController, not a bare fetch: opening spot A then quickly spot B used to
    // race, and whichever response landed last won — frequently rendering A's
    // reviews under B's name.
    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch(
          `/api/reviews?restaurant_id=${encodeURIComponent(venueId)}&limit=${LIMITS.reviewsPageSize}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error(`Request failed (${response.status})`);

        const data: unknown = await response.json();
        setReviews(Array.isArray(data) ? (data as Review[]) : []);
        setLoadError('');
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error('Failed to load reviews:', err);
        setLoadError('Could not load reviews. Check your connection and try again.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [venueId]);

  const price = priceInfo(venue);
  const category = CATEGORY_STYLE[venue.category];
  const rated = venue.averageRating > 0;

  // Distribution over the reviews actually loaded (most recent page).
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const handleShare = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('spot', venue.id);
    const shareUrl = url.toString();

    try {
      if (navigator.share) {
        await navigator.share({ title: venue.name, text: `${venue.name} — ${venue.vicinity}`, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // User dismissed the share sheet, or the clipboard was blocked — not an error.
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={venue.name}
      subtitle={venue.vicinity}
      variant="sheet"
      size="lg"
      bareHeader
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {/* Hero */}
        <div className="flex items-start gap-3 px-5 pb-4 pt-4">
          <VenueAvatar venue={venue} size="lg" />

          <div className="min-w-0 flex-1">
            {/*
              The real brand mark, at its natural proportions. Most of these files are
              wide wordmarks that are unreadable in the square list avatar, so this is
              the one place they get shown properly.
            */}
            {venue.logoUrl && (
              <div className="mb-1.5">
                <VenueWordmark venue={venue} />
              </div>
            )}
            <h2 className="text-lg font-extrabold leading-tight text-ink">{venue.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className={`rounded-md px-1.5 py-0.5 font-bold ring-1 ${category.pill}`}>
                {venue.category}
              </span>
              <span className="text-ink-soft">{venue.vicinity}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {/* An unrated venue would otherwise be announced as "0 out of 5 stars". */}
              {rated && <StarsDisplay rating={Math.round(venue.averageRating)} />}
              <span className="text-sm font-bold text-ink">
                {rated ? formatRating(venue.averageRating) : 'Not rated yet'}
              </span>
              {rated && (
                <span className="text-xs text-ink-soft">· {reviewCountLabel(venue.reviewCount)}</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 shrink-0 rounded-xl p-2 text-ink-faint transition hover:bg-ink/5 hover:text-ink"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Quick actions. Call and Menu appear only when that data exists. */}
        <div className="flex gap-2 px-5">
          <a href={venue.directionsUrl} target="_blank" rel="noopener noreferrer" className={QUICK_ACTION}>
            <Navigation className="h-4 w-4" aria-hidden="true" />
            Directions
          </a>

          {venue.phone && (
            <a href={`tel:${venue.phone.replace(/\s+/g, '')}`} className={QUICK_ACTION}>
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call
            </a>
          )}

          {venue.menuUrl && (
            <a href={venue.menuUrl} target="_blank" rel="noopener noreferrer" className={QUICK_ACTION}>
              <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
              Menu
            </a>
          )}

          <button type="button" onClick={handleShare} className={QUICK_ACTION}>
            {shared ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
            {shared ? 'Copied' : 'Share'}
          </button>

          <button
            type="button"
            onClick={() => onToggleFavorite(venue.id)}
            aria-pressed={isFavorite}
            className={QUICK_ACTION}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-brand-600 text-brand-600' : ''}`} aria-hidden="true" />
            {isFavorite ? 'Saved' : 'Save'}
          </button>
        </div>

        {/* Info strip */}
        <dl className="mx-5 mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-surface p-4 text-sm">
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-bold text-ink-soft">
              <MapPin className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
              From campus
            </dt>
            <dd className="mt-1 font-bold text-ink">
              {campusDistanceLabel(venue.distanceMeters, venue.coordSource)}
              <span className="ml-1 text-xs font-medium text-ink-faint">
                · {walkingMinutes(venue.distanceMeters)} min walk
              </span>
              {/* The sheet has room to say why, instead of leaving a bare "~". */}
              {venue.coordSource === 'approx' && (
                <span className="mt-0.5 block text-xs font-medium text-ink-faint">
                  Approximate location
                </span>
              )}
            </dd>
          </div>

          <div>
            <dt className="flex items-center gap-1.5 text-xs font-bold text-ink-soft">
              <Wallet className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
              Per person
            </dt>
            <dd className="mt-1 font-bold text-ink">
              {price.text}
              <span className="ml-1 text-xs font-medium text-ink-faint">{price.note}</span>
            </dd>
          </div>

          {venue.phone && (
            <div className="col-span-2">
              <dt className="text-xs font-bold text-ink-soft">Phone</dt>
              <dd className="mt-1 font-bold text-ink">{venue.phone}</dd>
            </div>
          )}
        </dl>

        {/* Map preview — loaded only on demand so 100 sheets never preload 100 iframes. */}
        <div className="mx-5 mt-3 overflow-hidden rounded-2xl border border-hairline">
          {showMap ? (
            <>
              <iframe
                title={`Map showing ${venue.name}`}
                src={osmEmbedUrl(venue.lat, venue.lng)}
                className="h-48 w-full border-0 bg-surface"
                loading="lazy"
              />
              {/* The embed is a third-party frame and can be blocked by a network or
                  extension. This link always works, so the map is a bonus, not the
                  only way to see where the place is. */}
              <a
                href={venue.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 border-t border-hairline bg-card py-2.5 text-xs font-bold text-brand-700 transition hover:bg-brand-50"
              >
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                Open in Google Maps
              </a>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="flex h-20 w-full items-center justify-center gap-2 bg-surface text-xs font-bold text-brand-700 transition hover:bg-brand-50"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Show map preview
            </button>
          )}
        </div>

        {/* Rating breakdown, from the reviews on screen. */}
        {reviews.length > 0 && (
          <section className="mx-5 mt-5" aria-labelledby={`breakdown-${venue.id}`}>
            <h3 id={`breakdown-${venue.id}`} className="mb-2 text-xs font-bold text-ink">
              Rating breakdown
              {venue.reviewCount > reviews.length && (
                <span className="ml-1 font-medium text-ink-faint">
                  (latest {reviews.length} of {venue.reviewCount})
                </span>
              )}
            </h3>
            <div className="space-y-1">
              {distribution.map(({ star, count }) => {
                const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-8 shrink-0 font-bold text-ink-soft">{star}★</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                      <div className="h-full rounded-full bg-star" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 shrink-0 text-right font-medium text-ink-faint">{count}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Composer. `key` remounts it per venue, clearing any half-typed draft. */}
        <section className="mx-5 mt-5" aria-labelledby={`compose-${venue.id}`}>
          <h3 id={`compose-${venue.id}`} className="mb-2 text-sm font-extrabold text-ink">
            Rate this spot
          </h3>
          <ReviewForm
            key={venue.id}
            venue={venue}
            studentName={studentName}
            onNeedName={onNeedName}
            onSubmitted={(review) => {
              setReviews((current) => [review, ...current]);
              onReviewPosted();
            }}
          />
        </section>

        {/* Reviews feed */}
        <section className="mx-5 mb-6 mt-5" aria-labelledby={`reviews-${venue.id}`}>
          <h3 id={`reviews-${venue.id}`} className="mb-2 text-sm font-extrabold text-ink">
            Student reviews
          </h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-700" aria-label="Loading reviews" />
            </div>
          ) : loadError ? (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-900 ring-1 ring-red-200">
              {loadError}
            </p>
          ) : reviews.length === 0 ? (
            <p className="rounded-xl bg-surface p-4 text-center text-sm text-ink-soft">
              No reviews yet. Be the first to rate {venue.name}.
            </p>
          ) : (
            <ul className="space-y-3">
              {reviews.map((review) => (
                <li key={review.id} className="rounded-2xl bg-surface p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-bold text-brand-800">
                      {review.user_name || 'Anonymous Student'}
                    </span>
                    <span className="shrink-0 text-xs text-ink-faint">
                      {relativeDate(review.created_at)}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-2">
                    <StarsDisplay rating={review.rating} />
                    {review.price_per_person != null && (
                      <span className="rounded-md bg-card px-1.5 py-0.5 text-xs font-bold text-ink-soft ring-1 ring-hairline">
                        {review.price_per_person} EGP
                      </span>
                    )}
                  </div>

                  {review.comment && (
                    <p className="mt-2 text-sm leading-relaxed text-ink">{review.comment}</p>
                  )}

                  {review.image_url && (
                    // Plain <img>: these are arbitrary user uploads, and routing them
                    // through the Next image optimiser would need every future bucket
                    // host in remotePatterns. Sized and lazy-loaded instead.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={review.image_url}
                      alt={`Food at ${venue.name}`}
                      loading="lazy"
                      decoding="async"
                      className="mt-2 max-h-56 w-full rounded-xl object-cover ring-1 ring-hairline"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Modal>
  );
}
