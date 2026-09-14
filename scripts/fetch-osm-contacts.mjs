/**
 * Look up real phone numbers and websites for the venue catalog from OpenStreetMap.
 *
 *   npm run osm:contacts
 *
 * Why this exists: no phone number in `lib/venues.ts` is invented. A wrong number
 * sends students to a stranger, so the catalog ships with `phone: null` and this
 * script fetches whatever OSM contributors have actually mapped. It prints entries
 * you can paste straight into `CONTACTS_BY_ID` in lib/venues.ts.
 *
 * It only ever prints — it never edits your files. Review every match before
 * pasting: OSM data is contributed by volunteers and can be stale or wrong, and the
 * name matching here is fuzzy.
 *
 * Overpass is a free, shared, rate-limited service. Run this occasionally, not in a
 * loop, and not from a request handler.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CAMPUS = { lat: 30.026, lng: 31.4911 };
const RADIUS_M = 6000;

/**
 * A match must be this close to the catalog's coordinates.
 *
 * This was 1200 m, which is nonsense for "is this the same shop" — a branch a
 * kilometre away is a different branch, or a different business entirely.
 */
const MAX_MATCH_M = 250;

/**
 * Shortest OSM name that may be used for matching.
 *
 * OSM contains truncated junk names like "Caf". With naive substring matching that
 * single entry matched twelve different venues ("ashley cafe".includes("caf") is
 * true) and would have written one unrelated phone number onto all of them.
 */
const MIN_NAME_LENGTH = 4;

/**
 * Overpass mirrors, tried in order. The main instance is free, shared and very
 * often returns 429 or 504 — a single endpoint makes this script fail most of the
 * time, which is why there are fallbacks.
 */
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.osm.jp/api/interpreter',
];

const QUERY = `
[out:json][timeout:60];
(
  nwr["amenity"~"restaurant|cafe|fast_food|food_court|ice_cream"](around:${RADIUS_M},${CAMPUS.lat},${CAMPUS.lng});
);
out center tags;
`;

/** Reads the catalog without importing TypeScript. */
function loadCatalog() {
  const source = readFileSync(path.join(ROOT, 'lib', 'venues.ts'), 'utf8');
  const pattern =
    /\{ id: '([^']+)', name: '((?:[^'\\]|\\.)*)', brand: '((?:[^'\\]|\\.)*)'[^}]*?lat: ([\d.]+), lng: ([\d.]+)/g;

  const rows = [...source.matchAll(pattern)].map((m) => ({
    id: m[1],
    name: m[2].replace(/\\'/g, "'"),
    brand: m[3].replace(/\\'/g, "'"),
    lat: parseFloat(m[4]),
    lng: parseFloat(m[5]),
  }));

  if (rows.length === 0) {
    throw new Error('Could not parse lib/venues.ts — has the catalog format changed?');
  }
  return rows;
}

const toRad = (d) => (d * Math.PI) / 180;

function metersBetween(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat));
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

/** Lowercase, strip punctuation and the branch suffix, so "Costa Coffee - P90" -> "costa coffee". */
function normalise(name) {
  return name
    .split(' - ')[0]
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Words that carry no identity — matching on these alone is meaningless. */
const STOP_WORDS = new Set([
  'cafe', 'caffe', 'coffee', 'restaurant', 'burger', 'burgers', 'pizza',
  'kitchen', 'grill', 'bakery', 'shop', 'bar', 'food', 'the', 'el', 'al',
]);

/**
 * Is this OSM entry the same business as this catalog entry?
 *
 * Strict on purpose. The earlier `a.includes(b) || b.includes(a)` produced
 * confidently wrong matches — the whole point of this script is to avoid writing a
 * wrong phone number into the app, so a missed match costs nothing and a false
 * match costs a student calling a stranger.
 */
function isSamePlace(catalogKey, osmKey) {
  if (osmKey.length < MIN_NAME_LENGTH || catalogKey.length < MIN_NAME_LENGTH) return false;
  if (catalogKey === osmKey) return true;

  const distinctive = (key) =>
    new Set(key.split(' ').filter((w) => w.length >= 3 && !STOP_WORDS.has(w)));

  const a = distinctive(catalogKey);
  const b = distinctive(osmKey);
  if (a.size === 0 || b.size === 0) return false;

  // Every distinctive word of the shorter name must appear in the longer one, as a
  // whole word. "starbucks" matches "starbucks coffee"; "cafe" matches nothing.
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const word of small) {
    if (!large.has(word)) return false;
  }
  return true;
}

async function main() {
  const catalog = loadCatalog();
  console.error(`Catalog: ${catalog.length} venues. Querying Overpass…`);

  let payload = null;
  const failures = [];

  for (const endpoint of OVERPASS_MIRRORS) {
    const host = new URL(endpoint).hostname;
    try {
      console.error(`  trying ${host}…`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          // Overpass asks for a descriptive agent so they can contact heavy users.
          'User-Agent': 'CSFamilyStar/1.0 (FUE student project; contact via repo)',
        },
        body: new URLSearchParams({ data: QUERY }),
        signal: AbortSignal.timeout(90_000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      payload = await response.json();
      console.error(`  ${host} answered.\n`);
      break;
    } catch (err) {
      failures.push(`${host}: ${err.message}`);
    }
  }

  if (!payload) {
    console.error('\nEvery Overpass mirror failed:');
    for (const line of failures) console.error(`  - ${line}`);
    console.error('\nThese are free shared services and are frequently overloaded.');
    console.error('Wait a few minutes and run `npm run osm:contacts` again.');
    process.exitCode = 1;
    return;
  }

  const elements = payload.elements ?? [];
  console.error(`Overpass returned ${elements.length} places.\n`);

  // Keep only OSM entries that carry contact details worth having.
  const withContacts = elements
    .map((el) => {
      const tags = el.tags ?? {};
      const phone = tags.phone ?? tags['contact:phone'] ?? tags['contact:mobile'] ?? null;
      const website = tags.website ?? tags['contact:website'] ?? null;
      const name = tags['name:en'] ?? tags.name ?? '';
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;

      if (!name || (!phone && !website) || lat == null || lng == null) return null;
      return { name, key: normalise(name), phone, website, lat, lng };
    })
    .filter(Boolean);

  console.error(`${withContacts.length} of them have a phone or website.\n`);

  const matches = [];
  for (const venue of catalog) {
    const key = normalise(venue.brand) || normalise(venue.name);
    if (key.length < MIN_NAME_LENGTH) continue;

    const candidates = withContacts
      .filter((c) => isSamePlace(key, c.key))
      .map((c) => ({ ...c, distance: metersBetween(venue, c) }))
      .filter((c) => c.distance <= MAX_MATCH_M)
      .sort((a, b) => a.distance - b.distance);

    if (candidates.length > 0) matches.push({ venue, best: candidates[0] });
  }

  if (matches.length === 0) {
    console.log('// No OSM entries matched the catalog with contact details.');
    console.log('// That is normal for New Cairo — most venues are simply not mapped with a phone.');
    return;
  }

  console.log('// ─────────────────────────────────────────────────────────────');
  console.log('// Candidate contacts from OpenStreetMap. REVIEW EACH ONE, then');
  console.log('// paste the ones you trust into CONTACTS_BY_ID in lib/venues.ts.');
  console.log('// OSM is volunteer-maintained: numbers can be stale or wrong.');
  console.log('// ─────────────────────────────────────────────────────────────');

  for (const { venue, best } of matches.sort((a, b) => a.venue.id.localeCompare(b.venue.id))) {
    const fields = [];
    if (best.phone) fields.push(`phone: '${best.phone.replace(/'/g, "\\'")}'`);
    if (best.website) fields.push(`menuUrl: '${best.website.replace(/'/g, "\\'")}'`);

    console.log(
      `  '${venue.id}': { ${fields.join(', ')} },` +
        `  // ${venue.name}  <-  OSM "${best.name}", ${Math.round(best.distance)} m away`
    );
  }

  console.error(`\n${matches.length} candidate(s) printed above.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
