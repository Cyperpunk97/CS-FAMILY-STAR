/**
 * Shared contracts between the route handlers and the client.
 *
 * The client used to redeclare its own loose `Restaurant`/`Review` interfaces that
 * silently drifted from what the API actually returned. Everything now imports
 * from here so a change to the API shape is a compile error, not a runtime bug.
 */

export const CATEGORIES = ['Cafe', 'Restaurant', 'Fast Food'] as const;
export type Category = (typeof CATEGORIES)[number];

/** 1 = Budget, 2 = Mid-range, 3 = Premium. Editorial baseline, refined by real reviews. */
export type PriceTier = 1 | 2 | 3;

/** Typical per-person spend in EGP, used until enough students report real prices. */
export const PRICE_TIER_RANGE: Record<PriceTier, { min: number; max: number; label: string }> = {
  1: { min: 40, max: 100, label: 'Budget' },
  2: { min: 120, max: 250, label: 'Mid-range' },
  3: { min: 300, max: 600, label: 'Premium' },
};

/**
 * Where a venue's coordinates came from.
 *
 * `osm`     — surveyed data from OpenStreetMap, accurate to the building.
 * `approx`  — hand-entered. Right neighbourhood, estimated position within it.
 *
 * This exists because the original catalog's coordinates are estimates: the 30
 * "Point 90 Mall" venues sit on a perfect 0.0001° ladder, which no real row of shops
 * does. Distance is the app's default sort, so the UI marks estimated distances with
 * a "~" rather than quietly implying metre-level precision.
 */
export type CoordSource = 'osm' | 'approx';

/** A venue as authored in the catalog (lib/venues.ts). */
export interface Venue {
  id: string;
  name: string;
  /** Chain name without the branch suffix — groups branches for logos and contacts. */
  brand: string;
  vicinity: string;
  category: Category;
  lat: number;
  lng: number;
  coordSource: CoordSource;
  priceTier: PriceTier;
  /** Null unless a real, verified number has been supplied. Never invented. */
  phone: string | null;
  menuUrl: string | null;
  logoUrl: string | null;
  /**
   * Intrinsic size of the logo file. Roughly half the brand logos on Wikimedia are
   * wide wordmarks rather than square icons, and the UI needs to tell them apart:
   * a 9:1 wordmark is illegible in a list avatar but reads well in the venue sheet.
   */
  logoWidth: number | null;
  logoHeight: number | null;
}

/** Widest a logo may be before the square list avatar falls back to a monogram. */
export const AVATAR_MAX_ASPECT = 1.6;

/** A venue enriched with derived + crowdsourced data. This is what `/api/restaurants` returns. */
export interface VenueWithStats extends Venue {
  averageRating: number;
  reviewCount: number;
  /** Mean EGP-per-person reported by students, or null if nobody has reported yet. */
  averagePrice: number | null;
  priceReportCount: number;
  /** Straight-line metres from the FUE campus centre. */
  distanceMeters: number;
  /** Google Maps pin for the exact coordinates. */
  mapsUrl: string;
  /** Google Maps walking directions from the user's current location. */
  directionsUrl: string;
}

export interface Review {
  id: number;
  restaurant_id: string;
  rating: number;
  comment: string | null;
  user_name: string | null;
  image_url: string | null;
  /** EGP the student spent per person, if they reported it. */
  price_per_person: number | null;
  created_at: string;
}

/** Validation bounds, shared so the client and the API agree on what is acceptable. */
export const LIMITS = {
  ratingMin: 1,
  ratingMax: 5,
  commentMax: 500,
  userNameMax: 60,
  priceMin: 1,
  priceMax: 10_000,
  /** Cap on review-image upload size (5 MB). */
  imageBytesMax: 5 * 1024 * 1024,
  reviewsPageSize: 50,
} as const;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
