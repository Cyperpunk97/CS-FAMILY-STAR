/**
 * Wikipedia Logo Auto-Fetcher for Worldwide Restaurants.
 *
 * Enforces the strict constraint: only recognized worldwide/international
 * restaurant chains have their logos fetched from Wikipedia.
 *
 * Local restaurants, Egyptian street food spots, and campus-specific cafes
 * are intentionally excluded and display their branded monogram avatars.
 */

export interface WikipediaLogoInfo {
  brand: string;
  logoUrl: string;
  logoWidth: number;
  logoHeight: number;
  source: 'wikipedia' | 'local_file';
  articleTitle: string;
}

/**
 * Strict registry of recognized worldwide / multinational restaurant brands in the FUE area.
 * Local Egyptian spots (e.g. GAD, Koshary El Tahrir, Abou Shakra, Desoky & Soda, Zooba,
 * Tabali, Willy's Kitchen, Butcher's Burger, Shaghaf, TBS, Cilantro, Pasta 2Go, etc.)
 * are deliberately NOT in this registry.
 */
export const WORLDWIDE_RESTAURANT_CONFIG: Record<
  string,
  {
    wikiTitle: string;
    localLogo?: { url: string; width: number; height: number };
    preferredFile?: string;
  }
> = {
  "McDonald's": {
    wikiTitle: "McDonald's",
    localLogo: { url: '/logos/mcdonalds.png', width: 330, height: 459 },
    preferredFile: "McDonald's Golden Arches.svg",
  },
  KFC: {
    wikiTitle: 'KFC',
    localLogo: { url: '/logos/kfc.png', width: 330, height: 103 },
    preferredFile: 'KFC 2026 (wordmark).svg',
  },
  'Burger King': {
    wikiTitle: 'Burger King',
    localLogo: { url: '/logos/burger-king.png', width: 330, height: 360 },
    preferredFile: 'Burger King 2020.svg',
  },
  'Pizza Hut': {
    wikiTitle: 'Pizza Hut',
    localLogo: { url: '/logos/pizza-hut.png', width: 330, height: 278 },
    preferredFile: 'Pizza Hut 2025.svg',
  },
  "Domino's Pizza": {
    wikiTitle: "Domino's",
    localLogo: { url: '/logos/dominos-pizza.png', width: 330, height: 70 },
    preferredFile: "Domino's 2025.svg",
  },
  "Hardee's": {
    wikiTitle: "Hardee's",
    localLogo: { url: '/logos/hardees.png', width: 330, height: 81 },
    preferredFile: 'Hardee brand logo.svg',
  },
  "Papa John's Pizza": {
    wikiTitle: 'Papa Johns',
    localLogo: { url: '/logos/papa-johns-pizza.png', width: 330, height: 61 },
    preferredFile: 'Papa Johns logo.svg',
  },
  Starbucks: {
    wikiTitle: 'Starbucks',
    localLogo: { url: '/logos/starbucks.png', width: 330, height: 36 },
    preferredFile: 'Starbucks Corporation Logo 2011.svg',
  },
  'Costa Coffee': {
    wikiTitle: 'Costa Coffee',
    localLogo: { url: '/logos/costa-coffee.png', width: 330, height: 87 },
    preferredFile: 'Costa Coffee logo.svg',
  },
  "Dunkin'": {
    wikiTitle: "Dunkin'",
    localLogo: { url: '/logos/dunkin.png', width: 330, height: 64 },
    preferredFile: "Dunkin' 2022.svg",
  },
  'Krispy Kreme': {
    wikiTitle: 'Krispy Kreme',
    localLogo: { url: '/logos/krispy-kreme.png', width: 330, height: 114 },
    preferredFile: 'Logo.KrispyKreme.svg',
  },
  'Baskin Robbins': {
    wikiTitle: 'Baskin-Robbins',
    localLogo: { url: '/logos/baskin-robbins.png', width: 330, height: 187 },
    preferredFile: 'Baskin-Robbins logo 2022.svg',
  },
  Cinnabon: {
    wikiTitle: 'Cinnabon',
    localLogo: { url: '/logos/cinnabon.png', width: 330, height: 110 },
    preferredFile: 'Cinnabon logo.svg',
  },
  'Paul Bakery & Restaurant': {
    wikiTitle: 'Paul (bakery)',
    localLogo: { url: '/logos/paul-bakery-restaurant.png', width: 330, height: 329 },
    preferredFile: 'Logo Paul.png',
  },
  'Brioche Doree': {
    wikiTitle: 'Brioche Dorée',
    localLogo: { url: '/logos/brioche-doree.jpg', width: 200, height: 110 },
    preferredFile: 'Brioche Doree.jpg',
  },
  'Caffe Pascucci': {
    wikiTitle: 'Caffè Pascucci',
    localLogo: { url: '/logos/caffe-pascucci.png', width: 330, height: 330 },
    preferredFile: 'Pascucci Logo.png',
  },
  'Second Cup': {
    wikiTitle: 'Second Cup Coffee Co.',
    localLogo: { url: '/logos/second-cup.webp', width: 330, height: 69 },
    preferredFile: 'Second-cup-logo-1.webp',
  },
  "Arby's": {
    wikiTitle: "Arby's",
    localLogo: { url: '/logos/arbys.png', width: 330, height: 283 },
    preferredFile: "Arby's logo.svg",
  },
  "Chili's": {
    wikiTitle: "Chili's",
    localLogo: { url: '/logos/chilis.png', width: 330, height: 166 },
    preferredFile: "Chili's Logo.svg",
  },
  Fuddruckers: {
    wikiTitle: 'Fuddruckers',
    localLogo: { url: '/logos/fuddruckers.png', width: 330, height: 196 },
    preferredFile: 'Logo of Fuddruckers.svg',
  },
  'Caribou Coffee': {
    wikiTitle: 'Caribou Coffee',
    localLogo: { url: '/logos/caribou-coffee.png', width: 330, height: 330 },
    preferredFile: 'Caribou1.svg',
  },
  'Texas Chicken': {
    wikiTitle: "Church's Texas Chicken",
    localLogo: { url: '/logos/texas-chicken.png', width: 330, height: 330 },
    preferredFile: 'Churchs-logo.svg',
  },
  'Smash Burger': {
    wikiTitle: 'Smashburger (restaurant chain)',
    localLogo: { url: '/logos/smash-burger.jpg', width: 330, height: 187 },
    preferredFile: 'Smashburgerlogo.jpg',
  },
  'Prezzo Pizza & Pasta': {
    wikiTitle: 'Prezzo (restaurant)',
    preferredFile: 'Prezzo logo.svg',
  },
  dipndip: {
    wikiTitle: 'Dipndip',
    preferredFile: 'Dipndip logo.svg',
  },
  'Coffeeshop Company': {
    wikiTitle: 'Coffeeshop Company',
    preferredFile: 'Coffeeshop Company logo.svg',
  },
  'Lord of the Wings': {
    wikiTitle: 'Lord of the Wings',
    preferredFile: 'Lord of the Wings logo.svg',
  },
  Kimbo: {
    wikiTitle: 'Kimbo Caffè',
    preferredFile: 'Kimbo logo.svg',
  },
};

const USER_AGENT = 'CSFamilyStar/1.0 (https://fue.edu.eg; student-food-guide@fuestudent.edu)';

/** In-memory cache to prevent redundant external queries during runtime. */
const LOGO_CACHE = new Map<string, WikipediaLogoInfo | null>();

/**
 * Checks whether a given brand is recognized as an international/worldwide restaurant chain.
 */
export function isWorldwideRestaurant(brand: string): boolean {
  return Object.prototype.hasOwnProperty.call(WORLDWIDE_RESTAURANT_CONFIG, brand);
}

/**
 * Auto-fetches logo information from Wikipedia for worldwide restaurants only.
 * Returns null immediately for any local/domestic spot.
 */
export async function fetchWikipediaLogo(brand: string): Promise<WikipediaLogoInfo | null> {
  // Strict boundary: worldwide restaurants only
  if (!isWorldwideRestaurant(brand)) {
    return null;
  }

  if (LOGO_CACHE.has(brand)) {
    return LOGO_CACHE.get(brand) ?? null;
  }

  const config = WORLDWIDE_RESTAURANT_CONFIG[brand];
  if (!config) return null;

  // If local verified file already exists, use it first as fast local cache
  if (config.localLogo) {
    const info: WikipediaLogoInfo = {
      brand,
      logoUrl: config.localLogo.url,
      logoWidth: config.localLogo.width,
      logoHeight: config.localLogo.height,
      source: 'local_file',
      articleTitle: config.wikiTitle,
    };
    LOGO_CACHE.set(brand, info);
    return info;
  }

  try {
    // 1. Try querying Wikipedia page thumbnail / lead image
    const pageUrl = `https://en.wikipedia.org/w/api.php?${new URLSearchParams({
      action: 'query',
      titles: config.wikiTitle,
      prop: 'pageimages',
      piprop: 'thumbnail|original',
      pithumbsize: '400',
      format: 'json',
      origin: '*',
    }).toString()}`;

    const res = await fetch(pageUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      const pages = data.query?.pages || {};
      for (const key of Object.keys(pages)) {
        const page = pages[key];
        if (page?.thumbnail?.source) {
          const info: WikipediaLogoInfo = {
            brand,
            logoUrl: page.thumbnail.source,
            logoWidth: page.thumbnail.width || 330,
            logoHeight: page.thumbnail.height || 330,
            source: 'wikipedia',
            articleTitle: config.wikiTitle,
          };
          LOGO_CACHE.set(brand, info);
          return info;
        }
      }
    }

    // 2. Fallback: try direct image file if preferred file name is declared
    if (config.preferredFile) {
      const fileUrl = `https://en.wikipedia.org/w/api.php?${new URLSearchParams({
        action: 'query',
        titles: `File:${config.preferredFile}`,
        prop: 'imageinfo',
        iiprop: 'url|size',
        iiurlwidth: '400',
        format: 'json',
        origin: '*',
      }).toString()}`;

      const fileRes = await fetch(fileUrl, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(6000),
      });

      if (fileRes.ok) {
        const fileData = await fileRes.json();
        const filePages = fileData.query?.pages || {};
        for (const fKey of Object.keys(filePages)) {
          const infoItem = filePages[fKey]?.imageinfo?.[0];
          if (infoItem?.thumburl || infoItem?.url) {
            const info: WikipediaLogoInfo = {
              brand,
              logoUrl: infoItem.thumburl || infoItem.url,
              logoWidth: infoItem.thumbwidth || 330,
              logoHeight: infoItem.thumbheight || 330,
              source: 'wikipedia',
              articleTitle: config.wikiTitle,
            };
            LOGO_CACHE.set(brand, info);
            return info;
          }
        }
      }
    }
  } catch (error) {
    console.warn(`[Wikipedia Logo Fetcher] Could not auto-fetch logo for worldwide brand "${brand}":`, error);
  }

  // Record negative hit in cache to prevent repeat failing requests
  LOGO_CACHE.set(brand, null);
  return null;
}
