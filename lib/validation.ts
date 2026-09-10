import { LIMITS } from './types';
import { VENUES_BY_ID } from './venues';

/**
 * Server-side validation for review submissions.
 *
 * The POST handler previously passed `request.json()` straight into an insert, so a
 * client could send any rating (10000, -5, "abc"), a megabyte-long comment, an
 * arbitrary `image_url` pointing anywhere on the internet, or a `restaurant_id` for a
 * venue that does not exist. All of that reached the database unchecked.
 */

export interface ValidReview {
  restaurant_id: string;
  rating: number;
  comment: string | null;
  user_name: string;
  image_url: string | null;
  price_per_person: number | null;
  recommended_dish: string | null;
}

export type ValidationResult =
  | { ok: true; value: ValidReview }
  | { ok: false; error: string };

const SPACE = 0x20;
const DEL = 0x7f;

/**
 * Replaces control characters with spaces, collapses whitespace, trims and truncates.
 * Control characters are stripped because they can be used to spoof layout in the
 * reviews feed (a lone carriage return can hide text from a reader).
 */
function clean(input: unknown, max: number): string {
  if (typeof input !== 'string') return '';

  let out = '';
  for (const ch of input) {
    const code = ch.codePointAt(0) ?? SPACE;
    out += code < SPACE || code === DEL ? ' ' : ch;
  }

  return out.replace(/\s+/g, ' ').trim().slice(0, max);
}

/**
 * An image URL is only accepted if it points at our own public storage bucket.
 * Without this check a client could attach any URL to a review, turning every
 * reader's browser into a request to a third-party server of the attacker's choosing.
 *
 * Returns `undefined` for "invalid", which is distinct from `null` for "no image".
 */
function validateImageUrl(input: unknown): string | null | undefined {
  if (input === null || input === undefined || input === '') return null;
  if (typeof input !== 'string') return undefined;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return undefined;

  let url: URL;
  let allowed: URL;
  try {
    url = new URL(input);
    allowed = new URL('/storage/v1/object/public/review-images/', base);
  } catch {
    return undefined;
  }

  if (url.protocol !== 'https:') return undefined;
  if (url.origin !== allowed.origin) return undefined;
  if (!url.pathname.startsWith(allowed.pathname)) return undefined;

  return url.toString();
}

export function parseReview(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const input = body as Record<string, unknown>;

  // restaurant_id must name a venue we actually know about.
  const restaurantId = typeof input.restaurant_id === 'string' ? input.restaurant_id : '';
  if (!VENUES_BY_ID.has(restaurantId)) {
    return { ok: false, error: 'Unknown restaurant_id.' };
  }

  // rating must be a whole number in range — not 4.7, not 100, not the string "5".
  const rating = typeof input.rating === 'number' ? input.rating : NaN;
  if (!Number.isInteger(rating) || rating < LIMITS.ratingMin || rating > LIMITS.ratingMax) {
    return {
      ok: false,
      error: `Rating must be a whole number from ${LIMITS.ratingMin} to ${LIMITS.ratingMax}.`,
    };
  }

  // Reject absurd payloads outright rather than silently truncating them.
  if (typeof input.comment === 'string' && input.comment.length > LIMITS.commentMax * 4) {
    return { ok: false, error: `Comment is too long (max ${LIMITS.commentMax} characters).` };
  }
  const comment = clean(input.comment, LIMITS.commentMax);
  const userName = clean(input.user_name, LIMITS.userNameMax) || 'Anonymous Student';

  const imageUrl = validateImageUrl(input.image_url);
  if (imageUrl === undefined) {
    return { ok: false, error: 'Image URL must point to this project’s review-images bucket.' };
  }

  let price: number | null = null;
  const rawPrice = input.price_per_person;
  if (rawPrice !== null && rawPrice !== undefined && rawPrice !== '') {
    const parsed = Number(rawPrice);
    if (!Number.isFinite(parsed) || parsed < LIMITS.priceMin || parsed > LIMITS.priceMax) {
      return {
        ok: false,
        error: `Price must be between ${LIMITS.priceMin} and ${LIMITS.priceMax} EGP.`,
      };
    }
    price = Math.round(parsed);
  }

  const recommendedDish = clean(input.recommended_dish, LIMITS.dishNameMax);

  return {
    ok: true,
    value: {
      restaurant_id: restaurantId,
      rating,
      comment: comment || null,
      user_name: userName,
      image_url: imageUrl,
      price_per_person: price,
      recommended_dish: recommendedDish || null,
    },
  };
}
