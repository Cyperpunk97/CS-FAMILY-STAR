'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Flame,
  Heart,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Share2,
  Sparkles,
  UtensilsCrossed,
  Wallet,
  X,
} from 'lucide-react';
import Modal from './Modal';
import VenueAvatar, { VenueWordmark } from './VenueLogo';
import ReviewForm from './ReviewForm';
import { StarsDisplay } from './Stars';
import RaterBadge from './RaterBadge';
import { CATEGORY_STYLE, formatRating, priceInfo, relativeDate, reviewCountLabel } from '@/lib/format';
import { campusDistanceLabel, osmEmbedUrl, walkingMinutes, type FacultyLocation } from '@/lib/geo';
import { LIMITS, type Review, type VenueWithStats } from '@/lib/types';

interface VenueSheetProps {
  /** Never null: the parent renders this only for an open venue, keyed by its id. */
  venue: VenueWithStats;
  studentName: string;
  isFavorite: boolean;
  faculty?: FacultyLocation;
  onClose: () => void;
  onNeedName: () => void;
  onToggleFavorite: (id: string) => void;
  onReviewPosted: () => void;
  onChangeFaculty?: () => void;
}

const QUICK_ACTION =
  'flex flex-1 min-w-[72px] flex-col items-center gap-1 rounded-xl border border-hairline bg-card px-2 py-2.5 text-xs font-bold text-ink-soft transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 active:scale-95';

export default function VenueSheet({
  venue,
  studentName,
  isFavorite,
  faculty,
  onClose,
  onNeedName,
  onToggleFavorite,
  onReviewPosted,
  onChangeFaculty,
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

  // Aggregated top dishes from venue's signature item, catalog data, and student reviews
  const combinedTopDishes = useMemo(() => {
    const dishCounts = new Map<string, number>();

    if (venue.signatureDish) {
      dishCounts.set(venue.signatureDish, 1);
    }

    if (venue.topDishes) {
      for (const d of venue.topDishes) {
        dishCounts.set(d, (dishCounts.get(d) ?? 0) + 1);
      }
    }

    for (const r of reviews) {
      if (r.recommended_dish) {
        const trimmed = r.recommended_dish.trim();
        if (trimmed) {
          dishCounts.set(trimmed, (dishCounts.get(trimmed) ?? 0) + 1);
        }
      }
    }

    return Array.from(dishCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [venue.signatureDish, venue.topDishes, reviews]);

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
            <dt className="flex items-center justify-between text-xs font-bold text-ink-soft">
              <span className="flex items-center gap-1.5 truncate">
                <MapPin className="h-3.5 w-3.5 text-brand-600 shrink-0" aria-hidden="true" />
                From {faculty ? faculty.shortName : 'campus'}
              </span>
              {onChangeFaculty && (
                <button
                  type="button"
                  onClick={onChangeFaculty}
                  className="shrink-0 text-[11px] font-semibold text-brand-700 hover:text-brand-900 underline decoration-dotted ml-1"
                >
                  Change
                </button>
              )}
            </dt>
            <dd className="mt-1 font-bold text-ink">
              {campusDistanceLabel(venue.distanceMeters, venue.coordSource)}
              <span className="ml-1 text-xs font-medium text-ink-faint">
                · {walkingMinutes(venue.distanceMeters)} min walk
              </span>
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

        {/* Must-Try Dishes & Recommendations — only for vetted spots rated 4.0+ with reviews */}
        {venue.reviewCount > 0 && venue.averageRating >= 4 && combinedTopDishes.length > 0 && (
          <div className="mx-5 mt-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5">
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-amber-950">
              <Flame className="h-4 w-4 text-amber-600 fill-amber-500" aria-hidden="true" />
              Must-Try Dishes & Student Picks
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {combinedTopDishes.map((dish, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-xl border border-amber-200/90 bg-card px-2.5 py-1 text-xs font-semibold text-ink shadow-2xs"
                >
                  <span className="text-amber-600">✨</span>
                  <span>{dish.name}</span>
                  {dish.count > 1 && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-extrabold text-amber-900">
                      ×{dish.count}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

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

        {/* Outing Memories Callout */}
        <div className="mx-5 mt-5 flex items-center justify-between gap-3 rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/80 to-orange-50/70 p-3.5 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-base shadow-inner">
              📸
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-amber-950 truncate">Outing Memories at {venue.name}</h4>
              <p className="text-[11px] text-amber-900/80 truncate">Have photos or happy stories from here?</p>
            </div>
          </div>
          <Link
            href={`/memories?spot=${encodeURIComponent(venue.id)}&new=true`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:brightness-105 active:scale-95"
          >
            <Sparkles className="h-3 w-3" />
            <span>Share Memory</span>
          </Link>
        </div>

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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-brand-800">
                        {review.user_name || 'Anonymous Student'}
                      </span>
                      {review.user_name && (
                        <RaterBadge reviewCount={3} className="text-[10px] py-0 px-1.5" />
                      )}
                    </div>
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

                  {review.recommended_dish && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-200/80 bg-amber-50/80 px-2.5 py-1 text-xs text-amber-950 font-medium">
                      <UtensilsCrossed className="h-3 w-3 text-amber-700 shrink-0" aria-hidden="true" />
                      <span>
                        Recommended dish:{' '}
                        <strong className="font-bold text-amber-900">{review.recommended_dish}</strong>
                      </span>
                    </div>
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
