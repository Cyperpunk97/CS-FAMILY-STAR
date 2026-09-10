import type { CoordSource } from './types';

/** Geo helpers: distance from campus and Google Maps deep links. */

/** Future University in Egypt, New Cairo — the origin every distance is measured from. */
export const FUE_CAMPUS = { lat: 30.026, lng: 31.4911 } as const;

export interface FacultyLocation {
  id: string;
  name: string;
  shortName: string;
  building: string;
  lat: number;
  lng: number;
}

/** Specific faculty buildings on the FUE campus for accurate walking calculations. */
export const FUE_FACULTIES: FacultyLocation[] = [
  {
    id: 'fcit-cs',
    name: 'Faculty of Computers & Information Technology',
    shortName: 'CS / IT Building',
    building: 'Building 1 (North-West)',
    lat: 30.0268,
    lng: 31.4902,
  },
  {
    id: 'engineering',
    name: 'Faculty of Engineering & Technology',
    shortName: 'Engineering',
    building: 'Building 2 (West Wing)',
    lat: 30.0254,
    lng: 31.4897,
  },
  {
    id: 'pharmacy',
    name: 'Faculty of Pharmaceutical Sciences',
    shortName: 'Pharmacy',
    building: 'Building 3 (East Wing)',
    lat: 30.0265,
    lng: 31.4923,
  },
  {
    id: 'dental',
    name: 'Faculty of Oral & Dental Medicine',
    shortName: 'Dental Medicine',
    building: 'Building 4 & Hospital (North)',
    lat: 30.0273,
    lng: 31.4915,
  },
  {
    id: 'business',
    name: 'Faculty of Commerce & Business Administration',
    shortName: 'Business / Commerce',
    building: 'Building 5 (South Wing)',
    lat: 30.0248,
    lng: 31.4910,
  },
  {
    id: 'economics',
    name: 'Faculty of Economics & Political Science',
    shortName: 'Economics & Politics',
    building: 'Building 6 (South-East)',
    lat: 30.0251,
    lng: 31.4921,
  },
  {
    id: 'campus-center',
    name: 'Main Campus Center & Plaza',
    shortName: 'Campus Center',
    building: 'Central Gate & Plaza',
    lat: 30.0260,
    lng: 31.4911,
  },
];

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in metres. Straight-line, not walking distance. */
export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return Math.round(2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h)));
}

/** "450 m" under a kilometre, "2.3 km" above it. */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return '—';
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Distance from campus for display.
 *
 * Two things beyond plain formatting:
 *
 *  - Venues on the campus itself would round to "0 m", which reads as missing data
 *    rather than "you are already there".
 *  - An estimated coordinate gets a "~" and is rounded to the nearest 50 m. Most of
 *    the catalog's positions are hand-entered to roughly the right block, so
 *    printing "430 m" from them claims a precision the data does not have.
 */
export function campusDistanceLabel(meters: number, source: CoordSource = 'approx'): string {
  if (!Number.isFinite(meters)) return '—';
  if (meters < 60) return 'On campus';

  if (source === 'osm') return formatDistance(meters);

  // Granularity scales with distance. A flat 50 m bucket collapsed most of the
  // near-campus venues to an identical "~100 m", which hides real differences
  // between them; 25 m keeps them distinguishable without implying a surveyed
  // position, and coarsens naturally as the numbers grow.
  if (meters < 500) return `~${Math.round(meters / 25) * 25} m`;
  if (meters < 1000) return `~${Math.round(meters / 50) * 50} m`;
  return `~${(meters / 1000).toFixed(1)} km`;
}

/** Long form for screen readers and tooltips, where "~" would be read as "tilde". */
export function campusDistanceDescription(meters: number, source: CoordSource): string {
  if (!Number.isFinite(meters)) return 'Distance unknown';
  if (meters < 60) return 'On the campus itself';

  const value = campusDistanceLabel(meters, source).replace('~', '');
  return source === 'osm'
    ? `${value} from campus`
    : `About ${value} from campus, estimated`;
}

/**
 * Rough walking time at a 5 km/h campus pace. Straight-line, so it under-reads
 * on real streets — presented as an estimate, never as a routed ETA.
 */
export function walkingMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / 83));
}

/**
 * Google Maps links, using the documented `?api=1` scheme so no API key is needed.
 *
 * The destination depends on how good our coordinate is:
 *
 *  - `osm`    — send the coordinate. It is surveyed, so it lands on the building.
 *  - `approx` — send the venue's name and area as a search string instead, and let
 *               Google resolve the real place. Handing Maps a hand-estimated
 *               coordinate would route someone confidently to the wrong door; a
 *               name search lands on the business Google actually knows about.
 */
export interface MapTarget {
  lat: number;
  lng: number;
  coordSource: CoordSource;
  name: string;
  vicinity: string;
}

function destinationFor(target: MapTarget): string {
  if (target.coordSource === 'osm') return `${target.lat},${target.lng}`;
  return encodeURIComponent(`${target.name}, ${target.vicinity}`);
}

export function mapsPinUrl(target: MapTarget): string {
  return `https://www.google.com/maps/search/?api=1&query=${destinationFor(target)}`;
}

export function mapsDirectionsUrl(
  target: MapTarget,
  origin?: { lat: number; lng: number }
): string {
  const originParam = origin ? `&origin=${origin.lat},${origin.lng}` : '';
  return `https://www.google.com/maps/dir/?api=1&destination=${destinationFor(
    target
  )}${originParam}&travelmode=walking`;
}

/** Keyless OpenStreetMap embed used for the small map preview in the venue sheet. */
export function osmEmbedUrl(lat: number, lng: number, pad = 0.004): string {
  const bbox = [lng - pad, lat - pad / 2, lng + pad, lat + pad / 2].join('%2C');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}
