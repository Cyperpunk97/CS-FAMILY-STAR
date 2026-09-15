/**
 * Command-line tool to auto-fetch Wikipedia logos for worldwide restaurants only.
 *
 * Usage:
 *   npm run logos:wikipedia
 *   npm run logos:wikipedia -- --dry
 */

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOGO_DIR = path.join(ROOT, 'public', 'logos');
const DRY_RUN = process.argv.includes('--dry');
const USER_AGENT = 'CSFamilyStar/1.0 (https://fue.edu.eg; student-food-guide@fuestudent.edu)';

const WORLDWIDE_TARGETS = {
  'Caribou Coffee': {
    wikiFile: 'Caribou1.svg',
    slug: 'caribou-coffee',
  },
  'Texas Chicken': {
    wikiFile: 'Churchs-logo.svg',
    slug: 'texas-chicken',
  },
  'Smash Burger': {
    wikiFile: 'Smashburgerlogo.jpg',
    slug: 'smash-burger',
  },
};

async function getImageUrl(fileTitle) {
  const url = `https://en.wikipedia.org/w/api.php?${new URLSearchParams({
    action: 'query',
    titles: `File:${fileTitle}`,
    prop: 'imageinfo',
    iiprop: 'url|size',
    iiurlwidth: '330',
    format: 'json',
  }).toString()}`;

  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const pages = json.query?.pages || {};
  for (const k of Object.keys(pages)) {
    const info = pages[k]?.imageinfo?.[0];
    if (info) return info;
  }
  return null;
}

async function main() {
  console.log('Auto-fetching logos from Wikipedia for worldwide restaurants only...\n');
  await mkdir(LOGO_DIR, { recursive: true });

  for (const [brand, { wikiFile, slug }] of Object.entries(WORLDWIDE_TARGETS)) {
    try {
      const info = await getImageUrl(wikiFile);
      if (!info) {
        console.warn(`  [!] No image info found on Wikipedia for ${brand} (${wikiFile})`);
        continue;
      }

      const fetchUrl = info.thumburl || info.url;
      console.log(`  [+] ${brand.padEnd(20)} -> ${fetchUrl}`);

      if (!DRY_RUN) {
        const imgRes = await fetch(fetchUrl, { headers: { 'User-Agent': USER_AGENT } });
        if (!imgRes.ok) throw new Error(`Download HTTP ${imgRes.status}`);
        const buf = Buffer.from(await imgRes.arrayBuffer());
        const ext = fetchUrl.includes('.jpg') || fetchUrl.includes('.jpeg') ? 'jpg' : 'png';
        const dest = path.join(LOGO_DIR, `${slug}.${ext}`);
        await writeFile(dest, buf);
        console.log(`      Saved ${slug}.${ext} (${buf.length} bytes, ${info.thumbwidth || 330}x${info.thumbheight || 330})`);
      }
    } catch (err) {
      console.error(`  [-] Failed for ${brand}:`, err.message);
    }
  }

  console.log('\nCompleted Wikipedia worldwide restaurant logo auto-fetch.');
}

main().catch(console.error);
