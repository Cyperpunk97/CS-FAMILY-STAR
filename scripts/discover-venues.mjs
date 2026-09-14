/**
 * Find food places near the FUE campus that are not in the catalog yet.
 *
 *   npm run venues:discover
 *   npm run venues:discover -- --radius 2000   # tighter search
 *
 * Queries OpenStreetMap for cafes, restaurants and fast food around campus, drops
 * anything already in `lib/venues.ts`, and prints the rest as catalog entries you can
 * review and paste in. It only prints — it never edits your files.
 *
 * Everything here is real OSM data: names and coordinates come from the map, not from
 * guesswork. What the script cannot know is the price tier, so every suggestion is
 * marked `priceTier: 1` and flagged for you to correct.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CAMPUS = { lat: 30.026, lng: 31.4911 };

const radiusArg = process.argv.indexOf('--radius');
const RADIUS_M =
  radiusArg !== -1 && Number.isFinite(Number(process.argv[radiusArg + 1]))
    ? Number(process.argv[radiusArg + 1])
    : 3000;

/** A suggestion this far from an existing venue with a similar name is a duplicate. */
const DUPLICATE_DISTANCE_M = 200;

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.osm.jp/api/interpreter',
];

const USER_AGENT = 'CSFamilyStar/1.0 (FUE student project; contact via repository)';

/** Words that carry no identity, so matching on them alone is meaningless. */
const STOP_WORDS = new Set([
  'cafe', 'caffe', 'coffee', 'restaurant', 'burger', 'burgers', 'pizza',
  'kitchen', 'grill', 'bakery', 'shop', 'bar', 'food', 'the', 'el', 'al',
]);

const toRad = (d) => (d * Math.PI) / 180;

function metersBetween(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat));
  return Math.round(2 * 6371000 * Math.asin(Math.sqrt(h)));
}

function normalise(name) {
  return name
    .split(' - ')[0]
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Same strict rule the contacts script uses. Naive substring matching once made a
 * place called "Caf" match twelve different cafes, so every distinctive word of the
 * shorter name must appear as a whole word in the longer one.
 */
function sameName(a0, b0) {
  if (!a0 || !b0) return false;
  if (a0 === b0) return true;

  const distinctive = (key) =>
    new Set(key.split(' ').filter((w) => w.length >= 3 && !STOP_WORDS.has(w)));

  const a = distinctive(a0);
  const b = distinctive(b0);
  if (a.size === 0 || b.size === 0) return false;

  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const word of small) if (!large.has(word)) return false;
  return true;
}

function loadCatalog() {
  const source = readFileSync(path.join(ROOT, 'lib', 'venues.ts'), 'utf8');
  const pattern =
    /\{ id: '([^']+)', name: '((?:[^'\\]|\\.)*)', brand: '((?:[^'\\]|\\.)*)'[^}]*?lat: ([\d.]+), lng: ([\d.]+)/g;

  const rows = [...source.matchAll(pattern)].map((m) => ({
    id: m[1],
    name: m[2].replace(/\\'/g, "'"),
    brand: m[3].replace(/\\'/g, "'"),
    key: normalise(m[2].replace(/\\'/g, "'")),
    lat: parseFloat(m[4]),
    lng: parseFloat(m[5]),
  }));

  if (rows.length === 0) throw new Error('Could not parse lib/venues.ts');
  return rows;
}

const QUERY = `
[out:json][timeout:90];
(
  nwr["amenity"~"^(restaurant|cafe|fast_food|food_court|ice_cream)$"](around:${RADIUS_M},${CAMPUS.lat},${CAMPUS.lng});
);
out center tags;
`;

async function fetchOverpass() {
  const failures = [];

  for (const endpoint of OVERPASS_MIRRORS) {
    const host = new URL(endpoint).hostname;
    try {
      console.error(`  trying ${host}…`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT,
        },
        body: new URLSearchParams({ data: QUERY }),
        signal: AbortSignal.timeout(120_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

      const json = await response.json();
      console.error(`  ${host} answered.\n`);
      return json.elements ?? [];
    } catch (err) {
      failures.push(`${host}: ${err.message}`);
    }
  }

  throw new Error(`every mirror failed:\n  - ${failures.join('\n  - ')}`);
}

const hasLatin = (s) => /[a-zA-Z]/.test(s);

/** Maps an OSM amenity tag onto the app's three categories. */
function categoryFor(tags) {
  const amenity = tags.amenity;
  if (amenity === 'cafe' || amenity === 'ice_cream') return 'Cafe';
  if (amenity === 'fast_food' || amenity === 'food_court') return 'Fast Food';
  return 'Restaurant';
}

function vicinityFor(tags) {
  const parts = [tags['addr:street'], tags['addr:suburb'] ?? tags['addr:city']].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'New Cairo';
}

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

const escape = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

async function main() {
  const catalog = loadCatalog();
  console.error(
    `Catalog has ${catalog.length} venues. Searching OSM within ${RADIUS_M} m of campus…`
  );

  let elements;
  try {
    elements = await fetchOverpass();
  } catch (err) {
    console.error(`\nOverpass failed — ${err.message}`);
    console.error('\nThese are free shared services. Wait a few minutes and try again.');
    process.exitCode = 1;
    return;
  }

  const arabicOnly = [];
  const unnamed = [];
  const candidates = [];

  for (const el of elements) {
    const tags = el.tags ?? {};
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) continue;

    const nameEn = tags['name:en'];
    const rawName = tags.name ?? '';
    const name = nameEn && hasLatin(nameEn) ? nameEn : hasLatin(rawName) ? rawName : '';

    if (!name) {
      if (rawName) arabicOnly.push({ name: rawName, lat, lng, tags });
      else unnamed.push({ lat, lng });
      continue;
    }

    candidates.push({
      name: name.trim(),
      key: normalise(name),
      lat,
      lng,
      tags,
      distance: metersBetween(CAMPUS, { lat, lng }),
    });
  }

  console.error(
    `${elements.length} OSM places: ${candidates.length} named in Latin script, ` +
      `${arabicOnly.length} Arabic-only, ${unnamed.length} unnamed.\n`
  );

  /*
   * Three outcomes, not two:
   *   - already in the catalog at the same spot -> ignore
   *   - the catalog knows this name but puts it somewhere else -> a conflict worth
   *     reviewing, because it is either a second branch or a wrong coordinate, and
   *     the app sorts by distance so wrong coordinates matter
   *   - genuinely unknown -> a suggestion
   */
  const fresh = [];
  const conflicts = [];
  const seen = [];

  for (const c of candidates.sort((a, b) => a.distance - b.distance)) {
    const sameNamed = catalog.filter((v) => sameName(c.key, v.key));

    if (sameNamed.length > 0) {
      const nearest = sameNamed
        .map((v) => ({ v, gap: metersBetween(c, v) }))
        .sort((a, b) => a.gap - b.gap)[0];

      if (nearest.gap <= DUPLICATE_DISTANCE_M) continue; // Same place, already listed.
      conflicts.push({ osm: c, catalog: nearest.v, gap: nearest.gap });
      continue;
    }

    const alreadySuggested = seen.some(
      (s) => sameName(c.key, s.key) && metersBetween(c, s) <= DUPLICATE_DISTANCE_M
    );
    if (alreadySuggested) continue;

    seen.push(c);
    fresh.push(c);
  }

  if (conflicts.length > 0) {
    console.error(
      `${conflicts.length} brand(s) appear in both the catalog and OSM, but at different\n` +
        'places. Either there are two branches, or the catalog coordinate is wrong —\n' +
        'and the app sorts by distance, so a wrong coordinate is a visible bug:\n'
    );
    for (const { osm, catalog: v, gap } of conflicts.sort((a, b) => b.gap - a.gap)) {
      console.error(
        `  ${String(gap).padStart(5)} m apart  ${v.name.padEnd(30)} ` +
          `catalog says ${v.lat},${v.lng} | OSM says ${osm.lat.toFixed(5)},${osm.lng.toFixed(5)} ` +
          `(${osm.distance} m from campus)`
      );
    }
    console.error('');
  }

  if (fresh.length === 0) {
    console.log('// Nothing new — every OSM place nearby is already in the catalog.');
    return;
  }

  console.log('// ─────────────────────────────────────────────────────────────');
  console.log(`// ${fresh.length} places near campus that are NOT in the catalog.`);
  console.log('// Source: OpenStreetMap. Names and coordinates are real map data.');
  console.log('//');
  console.log('// REVIEW BEFORE PASTING into CATALOG in lib/venues.ts:');
  console.log('//  - priceTier is a guess (1 = budget). Set 2 for mid-range, 3 for premium.');
  console.log('//  - OSM can be out of date; a place listed here may have closed.');
  console.log('// ─────────────────────────────────────────────────────────────');

  for (const c of fresh) {
    const brand = c.tags.brand ?? c.name.split(' - ')[0];
    const extras = [
      c.tags.cuisine ? `cuisine: ${c.tags.cuisine}` : null,
      c.tags.phone ?? c.tags['contact:phone'] ? 'has phone in OSM' : null,
      c.tags.website ? 'has website' : null,
    ]
      .filter(Boolean)
      .join(', ');

    // coordSource: 'osm' marks this as surveyed, so the UI shows an exact distance
    // rather than the "~" it uses for the catalog's hand-estimated positions.
    console.log(
      `  { id: 'fue-${slugify(c.name)}', name: '${escape(c.name)}', brand: '${escape(brand)}', ` +
        `vicinity: '${escape(vicinityFor(c.tags))}', category: '${categoryFor(c.tags)}', ` +
        `lat: ${c.lat}, lng: ${c.lng}, coordSource: 'osm', priceTier: 1 },` +
        `  // ${c.distance} m from campus${extras ? ` — ${extras}` : ''}`
    );
  }

  if (arabicOnly.length > 0) {
    console.error(
      `\n${arabicOnly.length} nearby places have Arabic-only names and were skipped ` +
        '(the app is English). The closest few:'
    );
    for (const a of arabicOnly
      .map((a) => ({ ...a, distance: metersBetween(CAMPUS, a) }))
      .sort((x, y) => x.distance - y.distance)
      .slice(0, 12)) {
      console.error(`  ${String(a.distance).padStart(5)} m  ${a.name}`);
    }
    console.error('Add any of these by hand with an English name if you want them.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
