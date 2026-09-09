/**
 * Download brand logos from Wikidata / Wikimedia Commons.
 *
 *   npm run logos:fetch            # download what it can find
 *   npm run logos:fetch -- --dry   # report matches without downloading
 *
 * Why Wikimedia and not a logo API: files on Commons carry an explicit licence, and
 * this script records that licence and the source URL for every file it saves, in
 * `public/logos/CREDITS.md`. Nothing is scraped and nothing is guessed.
 *
 * IMPORTANT — a licence is not the whole story. A logo can be free of copyright
 * (most simple wordmarks are "below the threshold of originality") and still be an
 * active trademark. Using one to identify a real branch in a listing is normally
 * fine; altering it, or implying the brand endorses this app, is not. Review
 * CREDITS.md and delete anything you are not comfortable shipping.
 *
 * Shape of the work: ONE SPARQL query for all brands, then one batched Commons call
 * per 40 files for licences, then plain CDN downloads. An earlier version made two
 * API calls per brand and Wikidata throttled it to a standstill (429s with 50-second
 * Retry-After headers) after three brands.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOGO_DIR = path.join(ROOT, 'public', 'logos');

const DRY_RUN = process.argv.includes('--dry');

/**
 * Wikimedia blocks clients that do not identify themselves.
 * ASCII only: HTTP header values are ByteStrings, so a stray em dash here throws
 * "Cannot convert argument to a ByteString" on every single request.
 */
const USER_AGENT = 'CSFamilyStar/1.0 (FUE student project; contact via repository)';

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

/** Rendered logo width. SVG sources come back as PNG at this size. */
const LOGO_WIDTH = 256;

/** The Commons API accepts up to 50 titles per request; stay under it. */
const LICENCE_BATCH = 40;

/**
 * Brands that are local businesses with no Wikidata item. Listed explicitly so the
 * report distinguishes "we know there is nothing to find" from "lookup failed".
 */
const LOCAL_ONLY = new Set([
  'Kazoku Japanese Grill', 'Shaghaf Co-working Cafe', 'Seven Days Cafe',
  'Container Cafe', 'Mocha Cafe', 'Ashley Cafe', 'Qahwa Cafe', 'Lyra Cafe',
  'Zakuski Cafe', 'Tableette Cafe', 'The Eatery', 'The Smokery', 'The Tap East',
  'Spectra Restaurant', 'Cortigiano Restaurant', "Ted's Restaurant",
  'Heart Attack Chicken', 'Kansas Fried Chicken', 'Max Burger', 'Bunster Burger',
  'Gigi Burger Bar', 'Pizza King', 'Studio Misr', 'Crave', 'Ovio', "Willow's",
  'One Oak', 'Pasta 2Go', 'TABiO Tea & Coffee', 'Smash Burger', 'Mince Burger',
  'Maine Burgers', "Butcher's Burger", "Chick 'N Dip", "Willy's Kitchen",
]);

/** Extra label spellings to try for brands whose catalog name is not the Wikidata label. */
const EXTRA_LABELS = {
  'TBS (The Bakery Shop)': ['The Bakery Shop'],
  TBS: ['The Bakery Shop'],
  'TBS Express': ['The Bakery Shop'],
  "Dunkin'": ['Dunkin', "Dunkin' Donuts", 'Dunkin Donuts'],
  'Baskin Robbins': ['Baskin-Robbins'],
  'Paul Bakery & Restaurant': ['Paul'],
  'Prezzo Pizza & Pasta': ['Prezzo'],
  "Papa John's Pizza": ["Papa John's"],
  "Domino's Pizza": ["Domino's"],
  "Mo'men Fast Food": ["Mo'men"],
  'Caffe Pascucci': ['Pascucci'],
  'Tamara Lebanese Bistro': ['Tamara'],
  'Bazooka Fried Chicken': ['Bazooka'],
  'Texas Chicken': ["Church's Chicken"],
  'Brioche Doree': ['Brioche Dorée'],
  "Casper & Gambini's": ['Casper & Gambini'],
  'Espresso Lab': [],
  'Second Cup': ['Second Cup Coffee Co.'],
};

/**
 * Words that mark a Wikidata item as an actual food business.
 *
 * Without this check the script took the first row SPARQL happened to return, which
 * gave "Burger King -> former Canadian restaurant chain" (Q28419676) instead of the
 * real chain (Q177054), and "TBS -> American television channel".
 */
const FOOD_HINTS = [
  'restaurant', 'coffee', 'coffeehouse', 'cafe', 'café', 'food', 'bakery',
  'pizza', 'burger', 'hamburger', 'doughnut', 'donut', 'ice cream', 'chocolate',
  'sushi', 'chicken', 'sandwich', 'confectioner', 'patisserie', 'juice', 'tea',
];

/** Descriptions that mean we matched something that merely shares the name. */
const NOT_A_FOOD_BRAND = [
  'television', 'tv network', 'tv station', 'media', 'broadcast', 'film', 'movie',
  'album', 'song', 'band', 'musician', 'video game', 'software', 'village',
  'municipality', 'river', 'genus', 'species', 'disorder', 'protein', 'gene',
];

/**
 * How strongly does this Wikidata item look like the food brand we want?
 * Returns 0 or less to mean "do not use this".
 */
function foodBrandScore(description) {
  const text = (description ?? '').toLowerCase();
  if (!text) return 0; // No description is no evidence.
  if (NOT_A_FOOD_BRAND.some((bad) => text.includes(bad))) return -10;

  let score = FOOD_HINTS.filter((hint) => text.includes(hint)).length;
  // "former ..." is usually a defunct predecessor rather than the chain we mean.
  if (text.startsWith('former')) score -= 2;
  if (/\bchain\b|\bcompany\b|\bfranchise\b|\bretailer\b/.test(text)) score += 1;
  return score;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Reads brands out of the catalog without importing TypeScript. */
function loadBrands() {
  const source = readFileSync(path.join(ROOT, 'lib', 'venues.ts'), 'utf8');
  const pattern = /\{ id: '[^']+', name: '(?:[^'\\]|\\.)*', brand: '((?:[^'\\]|\\.)*)'/g;

  const counts = new Map();
  for (const match of source.matchAll(pattern)) {
    const brand = match[1].replace(/\\'/g, "'");
    counts.set(brand, (counts.get(brand) ?? 0) + 1);
  }
  if (counts.size === 0) throw new Error('Could not parse brands from lib/venues.ts');

  return [...counts.entries()]
    .map(([brand, branches]) => ({ brand, branches }))
    .sort((a, b) => b.branches - a.branches || a.brand.localeCompare(b.brand));
}

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** SPARQL string literals need quotes and backslashes escaped. */
const sparqlLiteral = (s) => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"@en`;

/**
 * One query for every brand at once.
 *
 * Matches on both the main label and alternative labels (skos:altLabel), which is how
 * "Dunkin Donuts" resolves to the item now labelled "Dunkin'".
 */
async function queryWikidata(labels) {
  const values = labels.map(sparqlLiteral).join(' ');

  const query = `
    SELECT DISTINCT ?name ?item ?itemLabel ?itemDescription ?logo WHERE {
      VALUES ?name { ${values} }
      { ?item rdfs:label ?name } UNION { ?item skos:altLabel ?name }
      ?item wdt:P154 ?logo .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
  `;

  const url = new URL(SPARQL_ENDPOINT);
  url.searchParams.set('query', query);

  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/sparql-results+json' },
    signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) {
    throw new Error(`SPARQL endpoint returned HTTP ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  return (json.results?.bindings ?? []).map((row) => ({
    matchedLabel: row.name?.value ?? '',
    itemId: (row.item?.value ?? '').split('/').pop(),
    itemLabel: row.itemLabel?.value ?? '',
    description: row.itemDescription?.value ?? '',
    // P154 comes back as a Special:FilePath URL; the filename is the last segment.
    filename: decodeURIComponent((row.logo?.value ?? '').split('/').pop() ?? ''),
  }));
}

/** Licences for many files in one request. */
async function fetchLicences(filenames) {
  const licences = new Map();

  for (let i = 0; i < filenames.length; i += LICENCE_BATCH) {
    const batch = filenames.slice(i, i + LICENCE_BATCH);
    const url = new URL(COMMONS_API);
    url.search = new URLSearchParams({
      action: 'query',
      titles: batch.map((f) => `File:${f}`).join('|'),
      prop: 'imageinfo',
      iiprop: 'extmetadata|url',
      format: 'json',
    }).toString();

    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(45_000),
    });
    if (!response.ok) throw new Error(`Commons API returned HTTP ${response.status}`);

    const json = await response.json();
    const strip = (html) =>
      html ? String(html).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : '';

    for (const page of Object.values(json.query?.pages ?? {})) {
      const info = page.imageinfo?.[0];
      const meta = info?.extmetadata ?? {};
      const title = String(page.title ?? '').replace(/^File:/, '');

      licences.set(title, {
        licence: strip(meta.LicenseShortName?.value) || 'unknown',
        artist: strip(meta.Artist?.value) || 'unknown',
        descriptionUrl:
          info?.descriptionurl ??
          `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(title)}`,
      });
    }

    if (i + LICENCE_BATCH < filenames.length) await sleep(500);
  }

  return licences;
}

/**
 * Sanity ceiling only. Anything wider than this is a banner, not a logo.
 *
 * Half of these files are wordmarks rather than icons — the Starbucks logo on
 * Commons is 330x36, a 9:1 strip. Those are unreadable in a square list avatar, but
 * they are fine in the venue sheet, which has room for a wide mark. So the aspect
 * ratio is recorded rather than used to reject: the UI decides per surface.
 */
const MAX_ASPECT_RATIO = 12;

/** Image dimensions straight from the file header — no image library needed. */
function imageSize(buffer, kind) {
  try {
    if (kind === 'png') return { w: buffer.readUInt32BE(16), h: buffer.readUInt32BE(20) };

    if (kind === 'jpg') {
      let off = 2;
      while (off < buffer.length - 8) {
        if (buffer[off] !== 0xff) { off++; continue; }
        const marker = buffer[off + 1];
        const len = buffer.readUInt16BE(off + 2);
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { h: buffer.readUInt16BE(off + 5), w: buffer.readUInt16BE(off + 7) };
        }
        off += 2 + len;
      }
      return null;
    }

    if (kind === 'webp') {
      const fmt = buffer.subarray(12, 16).toString('latin1');
      if (fmt === 'VP8X') return { w: 1 + buffer.readUIntLE(24, 3), h: 1 + buffer.readUIntLE(27, 3) };
      if (fmt === 'VP8L') {
        const bits = buffer.readUInt32LE(21);
        return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
      }
      if (fmt === 'VP8 ') {
        return { w: buffer.readUInt16LE(26) & 0x3fff, h: buffer.readUInt16LE(28) & 0x3fff };
      }
    }
  } catch {
    return null;
  }
  return null;
}

/** PNG, JPEG, GIF or WebP magic bytes — guards against saving an HTML error page. */
function detectImage(buffer) {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'jpg';
  if (buffer.subarray(0, 3).toString('latin1') === 'GIF') return 'gif';
  if (
    buffer.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buffer.subarray(8, 12).toString('latin1') === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

async function downloadLogo(filename, slug) {
  // `width` makes Commons render SVG sources to PNG, so every saved file is a bitmap.
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    filename
  )}?width=${LOGO_WIDTH}`;

  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    redirect: 'follow',
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} downloading the file`);

  const buffer = Buffer.from(await response.arrayBuffer());
  const kind = detectImage(buffer);
  if (!kind) throw new Error('downloaded bytes are not an image');
  if (buffer.length > 400_000) throw new Error(`file too large (${buffer.length} bytes)`);

  const size = imageSize(buffer, kind);
  if (size && size.h > 0) {
    const ratio = size.w / size.h;
    if (ratio > MAX_ASPECT_RATIO) {
      throw new Error(`not a logo, a banner (${size.w}x${size.h}, ${ratio.toFixed(1)}:1)`);
    }
  }

  const outName = `${slug}.${kind}`;
  if (!DRY_RUN) await writeFile(path.join(LOGO_DIR, outName), buffer);
  return { outName, bytes: buffer.length, size };
}

async function main() {
  const brands = loadBrands();
  const searchable = brands.filter((b) => !LOCAL_ONLY.has(b.brand));

  console.error(
    `${brands.length} distinct brands; ${LOCAL_ONLY.size} known to be local businesses.\n` +
      `Querying Wikidata for ${searchable.length} brands in one request…` +
      (DRY_RUN ? ' (dry run)\n' : '\n')
  );

  // Every label spelling we are willing to accept, mapped back to its brand.
  const labelToBrand = new Map();
  for (const { brand } of searchable) {
    for (const label of [brand, ...(EXTRA_LABELS[brand] ?? [])]) {
      if (!labelToBrand.has(label)) labelToBrand.set(label, brand);
    }
  }

  let rows;
  try {
    rows = await queryWikidata([...labelToBrand.keys()]);
  } catch (err) {
    console.error(`\nWikidata query failed: ${err.message}`);
    console.error('The SPARQL endpoint is free and sometimes busy. Try again shortly.');
    process.exitCode = 1;
    return;
  }
  console.error(`Wikidata returned ${rows.length} items with a logo.\n`);

  /*
   * Pick the best-scoring item per brand, not the first one SPARQL returned.
   * "Burger King" alone matches the real chain, a defunct Canadian chain, and a
   * single shop in Kent; only the description tells them apart.
   */
  const best = new Map();
  const rejected = new Map();

  for (const row of rows) {
    const brand = labelToBrand.get(row.matchedLabel);
    if (!brand || !row.filename) continue;

    const score = foodBrandScore(row.description);
    if (score <= 0) {
      if (!rejected.has(brand)) rejected.set(brand, []);
      rejected.get(brand).push(row);
      continue;
    }
    const current = best.get(brand);
    if (!current || score > current.score) best.set(brand, { row, score });
  }

  const picked = new Map([...best].map(([brand, v]) => [brand, v.row]));

  for (const [brand, rows_] of rejected) {
    if (picked.has(brand)) continue;
    console.error(
      `  skip  ${brand.padEnd(26)} no food-brand item; closest was "${rows_[0].itemLabel}"` +
        ` (${rows_[0].description || 'no description'})`.slice(0, 70)
    );
  }

  if (picked.size === 0) {
    console.error('No brand matched a Wikidata item that has a logo.');
    return;
  }

  const licences = await fetchLicences([...new Set([...picked.values()].map((r) => r.filename))]);

  if (!DRY_RUN) await mkdir(LOGO_DIR, { recursive: true });

  const found = [];
  const failed = [];

  for (const { brand, branches } of searchable) {
    const row = picked.get(brand);
    if (!row) continue;

    try {
      const licence = licences.get(row.filename) ?? {
        licence: 'unknown',
        artist: 'unknown',
        descriptionUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(row.filename)}`,
      };
      const { outName, bytes, size } = await downloadLogo(row.filename, slugify(brand));

      found.push({ brand, branches, row, licence, outName, bytes, size });
      console.error(
        `  ok    ${brand.padEnd(26)} ${outName.padEnd(24)} ${licence.licence.slice(0, 28).padEnd(28)} ${row.description.slice(0, 40)}`
      );
    } catch (err) {
      failed.push({ brand, branches, reason: err.message });
      console.error(`  fail  ${brand.padEnd(26)} ${err.message}`);
    }
  }

  const covered = found.reduce((sum, f) => sum + f.branches, 0);
  console.error(
    `\n${found.length} logos${DRY_RUN ? ' found' : ' downloaded'}, covering ${covered} of 100 venues.\n`
  );

  if (found.length === 0) return;

  console.log('// ─────────────────────────────────────────────────────────────');
  console.log('// Paste into CONTACTS_BY_BRAND in lib/venues.ts.');
  console.log('// Check the description on each line is really the food brand,');
  console.log('// then review public/logos/CREDITS.md before shipping.');
  console.log('// ─────────────────────────────────────────────────────────────');
  for (const f of [...found].sort((a, b) => a.brand.localeCompare(b.brand))) {
    const key = f.brand.replace(/'/g, "\\'");
    const note = f.row.description ? `  // ${f.row.description.slice(0, 46)}` : '';
    // Dimensions travel with the URL so the UI can tell an icon from a wordmark:
    // square-ish marks go in the list avatar, wide ones only in the venue sheet.
    const dims = f.size ? `, logoWidth: ${f.size.w}, logoHeight: ${f.size.h}` : '';
    console.log(`  '${key}': { logoUrl: '/logos/${f.outName}'${dims} },${note}`);
  }

  if (DRY_RUN) return;

  const credits = [
    '# Logo credits',
    '',
    'Generated by `npm run logos:fetch`. Every file below came from Wikimedia Commons',
    "via the brand's Wikidata item (property P154, \"logo image\").",
    '',
    '**A licence is not the whole story.** A wordmark can be free of copyright and',
    'still be an active trademark. Using one to identify a real branch in a listing is',
    'normally fine; altering it, or implying the brand endorses this app, is not.',
    'Delete any file here you are not comfortable shipping, and remove its entry from',
    '`CONTACTS_BY_BRAND` in `lib/venues.ts`.',
    '',
    '| File | Brand | Wikidata | Licence | Author | Source |',
    '| --- | --- | --- | --- | --- | --- |',
    ...[...found]
      .sort((a, b) => a.brand.localeCompare(b.brand))
      .map(
        (f) =>
          `| \`${f.outName}\` | ${f.brand} | [${f.row.itemId}](https://www.wikidata.org/wiki/${f.row.itemId}) ` +
          `| ${f.licence.licence} | ${f.licence.artist} | [Commons](${f.licence.descriptionUrl}) |`
      ),
    '',
  ].join('\n');

  await writeFile(path.join(LOGO_DIR, 'CREDITS.md'), credits);
  console.error('Wrote public/logos/CREDITS.md — review it before shipping.');

  const noMatch = searchable.filter((b) => !picked.has(b.brand));
  if (noMatch.length > 0) {
    console.error(`\nNo Wikidata logo for ${noMatch.length} brands:`);
    console.error('  ' + noMatch.map((b) => b.brand).join(', '));
  }
  if (failed.length > 0) {
    console.error(`\nDownload failed for: ${failed.map((f) => f.brand).join(', ')}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
