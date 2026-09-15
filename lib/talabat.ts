import type { MenuItem, RestaurantMenu } from './types';
import { isSpicyItem, isVegetarianItem } from './dietary';
import talabatCachedData from './talabatMenusData.json';

/**
 * Common Cairo area IDs used by Talabat Egypt for menu hydration.
 * Area 7845: Tagammoa 5 / New Cairo (Waterway / FUE area)
 * Area 7849: Tagammoa 5 / 90th Street Companies
 * Area 9660: Tagammoa 5 / AUC & Point 90 area
 * Area 7425: Mokattam / East Cairo
 * Area 7770: Downtown / Central Cairo
 * Area 8041: Zamalek / Mohandesin
 */
export const DEFAULT_CAIRO_AIDS = [7845, 7849, 9660, 7844, 7425, 7770, 8041, 7579, 7925, 8184];

/** Ceiling on any outbound menu fetch. An unbounded one holds a route handler open. */
const MENU_FETCH_TIMEOUT_MS = 8000;

/**
 * Normalises a raw Talabat price.
 *
 * Two things go wrong without this. Talabat serves prices as 32-bit floats, so
 * `337.40` arrives as `337.3999938964844` and was rendered verbatim. And items with
 * no fixed price — anything sold by the kilo — arrive as `0` or missing, which the
 * old `Number(it.price) || 0` turned into a confident "0 EGP".
 *
 * Returns `null` for "no fixed price", which the UI renders as "Ask in store".
 */
export function parseMenuPrice(raw: unknown): number | null {
  const value = typeof raw === 'string' ? Number(raw.replace(/[^\d.-]/g, '')) : Number(raw);
  if (!Number.isFinite(value) || value <= 0) return null;

  // Two decimal places, without the binary-float drift of toFixed round-tripping.
  return Math.round(value * 100) / 100;
}

/** Talabat menu pages are well under this; anything larger is not a menu page. */
const MENU_HTML_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Reads a response body but stops at `MENU_HTML_MAX_BYTES`.
 *
 * `res.text()` will happily buffer a multi-gigabyte body into the server's heap if
 * the far end sends one, which turns one request into an out-of-memory crash.
 */
async function readCappedText(res: Response, maxBytes = MENU_HTML_MAX_BYTES): Promise<string | null> {
  const reader = res.body?.getReader();
  if (!reader) return null;

  const decoder = new TextDecoder();
  let text = '';
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }

      // `stream: true` keeps a multi-byte character split across two chunks intact.
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }

  return text + decoder.decode();
}

/**
 * Normalized alias dictionary mapping student query strings or venue IDs to Talabat brand keys.
 */
export const BRAND_ALIASES: Record<string, string> = {
  // Costa
  costa: 'costa-coffee',
  'costa coffee': 'costa-coffee',
  'fue-costa-campus': 'costa-coffee',
  'costa-coffee-point-90': 'costa-coffee',
  'costa point 90': 'costa-coffee',
  'costa campus': 'costa-coffee',

  // Cilantro
  cilantro: 'cilantro',
  'fue-cilantro': 'cilantro',
  'cilantro cafe': 'cilantro',

  // Starbucks
  starbucks: 'starbucks',
  'starbucks coffee': 'starbucks',
  'starbucks-point-90': 'starbucks',

  // McDonalds
  mcdonalds: 'mcdonalds',
  "mcdonald's": 'mcdonalds',
  mcd: 'mcdonalds',
  'mcdonalds-point-90': 'mcdonalds',

  // Papa Johns
  papajohns: 'papa-johns',
  'papa johns': 'papa-johns',
  "papa john's": 'papa-johns',
  "papa john's pizza": 'papa-johns',
  'papa-johns-pizza': 'papa-johns',
  'papa-johns-point-90': 'papa-johns',

  // Hardees
  hardees: 'hardees',
  "hardee's": 'hardees',
  'hardees-point-90': 'hardees',

  // Pizza Hut
  pizzahut: 'pizza-hut',
  'pizza hut': 'pizza-hut',
  'pizza-hut-point-90': 'pizza-hut',

  // KFC
  kfc: 'kfc',
  'kentucky fried chicken': 'kfc',
  'kfc-point-90': 'kfc',

  // Buffalo Burger
  buffalo: 'buffalo-burger',
  'buffalo burger': 'buffalo-burger',
  'buffalo-burger': 'buffalo-burger',
  'fue-buffalo-campus': 'buffalo-burger',
  'buffalo-burger-point-90': 'buffalo-burger',

  // TBS
  tbs: 'tbs',
  'the bakery shop': 'tbs',
  'tbs (the bakery shop)': 'tbs',
  'fue-tbs-campus': 'tbs',
  'tbs-point-90': 'tbs',

  // Koshary El Tahrir
  tahrir: 'koshary-tahrir',
  'koshary el tahrir': 'koshary-tahrir',
  'koshary tahrir': 'koshary-tahrir',
  'fue-koshary-campus': 'koshary-tahrir',
  'koshary-el-tahrir-point-90': 'koshary-tahrir',

  // Dunkin
  dunkin: 'dunkin',
  "dunkin'": 'dunkin',
  'dunkin donuts': 'dunkin',
  'fue-dunkin-campus': 'dunkin',
  'dunkin-point-90': 'dunkin',

  // Cinnabon
  cinnabon: 'cinnabon',
  'cinnabon bakery': 'cinnabon',
  'fue-cinnabon-campus': 'cinnabon',
  'cinnabon-point-90': 'cinnabon',

  // Bazooka
  bazooka: 'bazooka',
  'bazooka fried chicken': 'bazooka',
  'bazooka-point-90': 'bazooka',

  // Willys
  willys: 'willys',
  "willy's": 'willys',
  "willy's kitchen": 'willys',
  'willys kitchen': 'willys',
  'willys-kitchen-point-90': 'willys',

  // Zooba
  zooba: 'zooba',
  'zooba-point-90': 'zooba',

  // El Dahan
  dahan: 'el-dahan',
  'el dahan': 'el-dahan',
  eldahan: 'el-dahan',
  'el-dahan-point-90': 'el-dahan',

  // Paul
  paul: 'paul',
  'paul bakery': 'paul',
  'paul bakery & restaurant': 'paul',
  'paul-point-90': 'paul',
};

/**
 * Venue-specific identity takes precedence over free-text matching.
 *
 * A brand can have several branches in Talabat, while the app's venue catalog
 * already knows which branch the student opened. Keeping this mapping explicit
 * prevents a Point 90 venue from accidentally receiving another branch's menu
 * when Talabat changes its search ordering.
 */
const TALABAT_VENUE_CONFIG: Record<string, { brandKey: string; searchName: string }> = {
  'fue-costa-campus': { brandKey: 'costa-coffee', searchName: 'Costa Coffee FUE Campus' },
  'fue-cilantro': { brandKey: 'cilantro', searchName: 'Cilantro FUE Campus' },
  'fue-tbs-campus': { brandKey: 'tbs', searchName: 'TBS FUE Campus' },
  'fue-cinnabon-campus': { brandKey: 'cinnabon', searchName: 'Cinnabon FUE Campus' },
  'fue-buffalo-campus': { brandKey: 'buffalo-burger', searchName: 'Buffalo Burger FUE Campus' },
  'fue-koshary-campus': { brandKey: 'koshary-tahrir', searchName: 'Koshary El Tahrir FUE Campus' },
  'fue-dunkin-campus': { brandKey: 'dunkin', searchName: 'Dunkin FUE Campus' },
  'p90-mcdonalds': { brandKey: 'mcdonalds', searchName: "McDonald's Point 90 Mall" },
  'p90-kfc': { brandKey: 'kfc', searchName: 'KFC Point 90 Mall' },
  'p90-hardees': { brandKey: 'hardees', searchName: "Hardee's Point 90 Mall" },
  'p90-pizza-hut': { brandKey: 'pizza-hut', searchName: 'Pizza Hut Point 90 Mall' },
  'p90-papa-johns': { brandKey: 'papa-johns', searchName: "Papa John's Point 90 Mall" },
  'p90-starbucks': { brandKey: 'starbucks', searchName: 'Starbucks Point 90 Mall' },
  'p90-costa': { brandKey: 'costa-coffee', searchName: 'Costa Coffee Point 90 Mall' },
  'p90-paul': { brandKey: 'paul', searchName: 'Paul Point 90 Mall' },
  'p90-bazooka': { brandKey: 'bazooka', searchName: 'Bazooka Point 90' },
  'p90-willys-kitchen': { brandKey: 'willys', searchName: "Willy's Kitchen Point 90" },
  'p90-zooba': { brandKey: 'zooba', searchName: 'Zooba New Cairo' },
  'p90-el-dahan': { brandKey: 'el-dahan', searchName: 'El Dahan New Cairo' },
};

function normalizeRestaurantText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function restaurantTokens(input: string): string[] {
  return normalizeRestaurantText(input).split(' ').filter(Boolean);
}

/**
 * Scores a Talabat result against the requested restaurant.
 *
 * Talabat search results often include nearby branches and similarly named
 * restaurants. Returning the first result made a query such as "Paul" depend
 * on Talabat's ordering rather than on the user's request.
 */
function scoreRestaurantMatch(
  query: string,
  candidate: { name?: string; brand?: string; slug?: string }
): number {
  const queryText = normalizeRestaurantText(query);
  const queryTokens = restaurantTokens(query);
  if (!queryText || queryTokens.length === 0) return 0;

  const fields = [candidate.name, candidate.brand, candidate.slug]
    .filter((value): value is string => Boolean(value))
    .map(normalizeRestaurantText)
    .filter(Boolean);
  if (fields.length === 0) return 0;

  let best = 0;
  for (const field of fields) {
    const fieldTokens = new Set(field.split(' '));
    const matchedTokens = queryTokens.filter((token) => fieldTokens.has(token)).length;
    const allTokensMatch = matchedTokens === queryTokens.length;

    if (field === queryText) best = Math.max(best, 100);
    else if (field.startsWith(`${queryText} `) || field.endsWith(` ${queryText}`)) {
      best = Math.max(best, 90);
    } else if (allTokensMatch) {
      best = Math.max(best, 80 + matchedTokens);
    } else if (field.includes(queryText)) {
      best = Math.max(best, 60);
    } else if (matchedTokens > 0) {
      best = Math.max(best, (matchedTokens / queryTokens.length) * 40);
    }
  }

  return best;
}

function pickBestRestaurant<T extends { name?: string; brand?: string; slug?: string }>(
  query: string,
  candidates: T[]
): T | null {
  let best: T | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = scoreRestaurantMatch(query, candidate);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  // A partial token match is not enough to silently load the wrong menu.
  // For example, "coffee" matches several brands and must not pick whichever
  // one Talabat happened to return first.
  return bestScore >= 80 ? best : null;
}

export interface CachedTalabatRestaurant {
  restaurantId: string;
  restaurantName: string;
  brand?: string;
  currency: string;
  lastUpdated?: string;
  sourceUrl?: string;
  categories: string[];
  items: MenuItem[];
}

const typedCachedData = talabatCachedData as unknown as Record<string, CachedTalabatRestaurant>;
interface TalabatRawItem {
  id: number | string;
  name: string;
  description?: string;
  price: number | string;
  image?: string;
  originalImage?: string;
  isTopRatedItem?: boolean;
}

interface TalabatRawCategory {
  name: string;
  items?: TalabatRawItem[];
}

interface TalabatMenuData {
  categories?: TalabatRawCategory[];
}

/**
 * Parses raw HTML from a Talabat Egypt restaurant page and extracts the menu.
 */
export function parseTalabatNextData(html: string): {
  menuData: TalabatMenuData | null;
  restaurantName?: string;
} {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match || !match[1]) {
    return { menuData: null };
  }

  try {
    const json = JSON.parse(match[1]);
    const pageProps = json.props?.pageProps;
    const initialMenuState = pageProps?.initialMenuState;
    const menuData = initialMenuState?.menuData || null;
    const restaurantName = initialMenuState?.restaurant?.name || pageProps?.restaurant?.name;

    return { menuData, restaurantName };
  } catch (err) {
    console.error('Failed to parse Talabat Next.js data JSON:', err);
    return { menuData: null };
  }
}

/**
 * Transforms Talabat categories & items into our clean RestaurantMenu format.
 */
export function transformTalabatMenu(
  menuData: TalabatMenuData,
  restaurantId: string,
  restaurantName: string,
  sourceUrl?: string
): RestaurantMenu {
  const rawCategories = menuData.categories || [];

  // Identify items that were highlighted under "Picks for you" so we can flag isPopular
  const picksCat = rawCategories.find((c) => c.name.toLowerCase().includes('pick'));
  const popularNames = new Set(
    (picksCat?.items || []).map((i) => i.name.trim().toLowerCase())
  );

  const categories: string[] = [];
  const items: MenuItem[] = [];
  const seenItemIds = new Set<string | number>();

  for (const cat of rawCategories) {
    const catName = cat.name.trim();
    // Exclude "Picks for you 🔥" as a separate category if standard categories exist
    if (catName.toLowerCase().includes('picks for you') && rawCategories.length > 1) {
      continue;
    }
    if (!cat.items || cat.items.length === 0) continue;

    categories.push(catName);

    for (const it of cat.items) {
      if (!it.name || seenItemIds.has(it.id)) continue;
      seenItemIds.add(it.id);

      // Classification lives in lib/dietary.ts so the parser and the cached data
      // can never drift apart. The old inline regexes flagged anything containing
      // "cheese" or "salad" as vegetarian — including Mixed Grill Platter — and
      // matched a bare "hot", which made Hot Chocolate spicy.
      const isSpicy = isSpicyItem(it.name, it.description, catName);
      const isVeg = isVegetarianItem(it.name, it.description, catName);
      const isPop = popularNames.has(it.name.trim().toLowerCase()) || !!it.isTopRatedItem;

      items.push({
        id: `talabat-${restaurantId}-${it.id}`,
        name: it.name.trim(),
        description: it.description?.trim() || undefined,
        price: parseMenuPrice(it.price),
        category: catName,
        isPopular: isPop || undefined,
        isSpicy: isSpicy || undefined,
        isVegetarian: isVeg || undefined,
        imageUrl: it.image || it.originalImage || null,
      });
    }
  }

  return {
    restaurantId,
    restaurantName,
    currency: 'EGP',
    lastUpdated: new Date().toISOString().split('T')[0],
    note: sourceUrl ? `Verified real menu extracted from Talabat.com Egypt` : undefined,
    categories,
    items,
  };
}

/**
 * Extracts a real menu by restaurant name or brand.
 * 1. Checks cached pre-extracted Talabat menus database.
 * 2. If not found or if forced, attempts dynamic live search & hydration from Talabat Egypt.
 */
export async function extractTalabatMenuByName(
  name: string,
  options?: {
    forceLive?: boolean;
    venueId?: string;
  }
): Promise<{
  success: boolean;
  menu?: RestaurantMenu;
  sourceUrl?: string;
  isLiveScraped?: boolean;
  error?: string;
}> {
  const rawQuery = name.trim();
  const query = normalizeRestaurantText(rawQuery);
  const venueConfig = options?.venueId ? TALABAT_VENUE_CONFIG[options.venueId] : undefined;
  const queryKey = BRAND_ALIASES[query] || null;
  const normalizedKey =
    queryKey ||
    venueConfig?.brandKey ||
    BRAND_ALIASES[normalizeRestaurantText(options?.venueId || '')] ||
    null;
  const matchQuery = queryKey ? rawQuery : venueConfig?.searchName || normalizedKey || rawQuery;

  // 1. Check local pre-extracted dataset if live scraping is not forced
  if (!options?.forceLive && normalizedKey) {
    const cached = typedCachedData[normalizedKey];
    if (cached && Array.isArray(cached.items) && cached.items.length > 0) {
      const cloned: RestaurantMenu = {
        restaurantId: options?.venueId || cached.restaurantId,
        restaurantName: cached.restaurantName,
        currency: cached.currency || 'EGP',
        lastUpdated: cached.lastUpdated,
        note: `Extracted from Talabat.com Egypt (${cached.items.length} items verified)`,
        categories: [...cached.categories],
        items: cached.items.map((it: MenuItem) => ({ ...it })),
      };

      return {
        success: true,
        menu: cloned,
        sourceUrl: cached.sourceUrl,
        isLiveScraped: false,
      };
    }
  }

  // 2. Direct fuzzy match against cached dataset brand names
  if (!options?.forceLive) {
    const cachedEntries = Object.entries(typedCachedData);
    const bestCached = pickBestRestaurant(
      matchQuery,
      cachedEntries.map(([key, cached]) => ({
        key,
        cached,
        name: cached.restaurantName,
        brand: cached.brand,
      }))
    );

    if (bestCached) {
      const cached = bestCached.cached;
      const cloned: RestaurantMenu = {
        restaurantId: options?.venueId || cached.restaurantId,
        restaurantName: cached.restaurantName,
        currency: cached.currency || 'EGP',
        lastUpdated: cached.lastUpdated,
        note: `Extracted from Talabat.com Egypt (${cached.items.length} items verified)`,
        categories: [...cached.categories],
        items: cached.items.map((it: MenuItem) => ({ ...it })),
      };
      return {
        success: true,
        menu: cloned,
        sourceUrl: cached.sourceUrl,
        isLiveScraped: false,
      };
    }
  }

  // 3. Fallback: Search Talabat Egypt dynamically via website
  try {
    const searchUrl = `https://www.talabat.com/egypt/restaurants?searchTerm=${encodeURIComponent(name)}`;
    const searchRes = await fetch(searchUrl, {
      signal: AbortSignal.timeout(MENU_FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

    const html = searchRes.ok ? await readCappedText(searchRes) : null;
    if (html) {
      const matchNext = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
      if (matchNext && matchNext[1]) {
        const json = JSON.parse(matchNext[1]);
        const vendors =
          json.props?.pageProps?.restaurants ||
          json.props?.pageProps?.initialState?.restaurants ||
          [];

        if (Array.isArray(vendors) && vendors.length > 0) {
          const vendorCandidates = vendors.filter(
            (vendor): vendor is {
              id: number | string;
              name: string;
              brand?: string;
              slug?: string;
            } =>
              vendor &&
              (typeof vendor.id === 'number' || typeof vendor.id === 'string') &&
              typeof vendor.name === 'string'
          );
          const topVendor = pickBestRestaurant(matchQuery, vendorCandidates);
          if (!topVendor) {
            return {
              success: false,
              error: `Talabat returned no reliable match for "${name}". Try the exact restaurant name or URL.`,
            };
          }
          const vendorId = topVendor.id;
          const slug =
            topVendor.slug || normalizeRestaurantText(topVendor.name).replace(/\s+/g, '-');

          // Attempt hydration using Cairo area IDs
          for (const aid of DEFAULT_CAIRO_AIDS) {
            const menuUrl = `https://www.talabat.com/egypt/restaurant/${vendorId}/${slug}?aid=${aid}`;
            const menuResult = await extractTalabatMenuFromUrl(
              menuUrl,
              options?.venueId || String(vendorId),
              topVendor.name || name
            );
            if (menuResult.success && menuResult.menu && menuResult.menu.items.length > 0) {
              return {
                ...menuResult,
                isLiveScraped: true,
              };
            }
          }
        }
      }
    }
  } catch (err) {
    console.error(`Live Talabat search failed for "${name}":`, err);
  }

  return {
    success: false,
    error: `Could not find a real menu for "${name}" on Talabat Egypt. Try providing an exact Talabat URL or pick a known campus branch.`,
  };
}

/**
 * Hosts this server is willing to fetch on a caller's behalf.
 *
 * `/api/talabat/extract` takes a `url` straight from the query string, so without
 * this list the route is a server-side request forgery primitive: anyone could aim
 * it at `http://169.254.169.254/`, at a service bound to localhost, or at a private
 * 10.x address, and read the outcome from the HTTP status in the error message. It
 * also made the app an open relay for hammering third parties from our IP.
 *
 * Match is on the exact host or a subdomain — `evil-talabat.com` and
 * `talabat.com.attacker.net` both fail, which a naive `includes('talabat.com')`
 * would not.
 */
const ALLOWED_MENU_HOSTS = ['talabat.com', 'www.talabat.com'];

function isAllowedMenuHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  return ALLOWED_MENU_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`)
  );
}

/**
 * Parses and vets a caller-supplied menu URL.
 *
 * Returns the normalized URL, or an error string explaining the rejection.
 */
export function vetTalabatUrl(rawUrl: string): { url: URL } | { error: string } {
  const trimmed = (rawUrl ?? '').trim();
  if (!trimmed) return { error: 'No URL provided.' };

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return { error: 'That is not a valid URL.' };
  }

  // Blocks `file:`, `data:`, `gopher:` and friends before the host check.
  if (url.protocol !== 'https:') {
    return { error: 'Menu URLs must use https.' };
  }

  if (!isAllowedMenuHost(url.hostname)) {
    return {
      error: `Only talabat.com menu links can be fetched. "${url.hostname}" is not allowed.`,
    };
  }

  // Credentials in the URL can be used to confuse host parsing downstream.
  if (url.username || url.password) {
    return { error: 'Menu URLs must not contain credentials.' };
  }

  return { url };
}

/**
 * Extracts a real menu directly from a Talabat Egypt restaurant URL.
 */
export async function extractTalabatMenuFromUrl(
  rawUrl: string,
  restaurantId = 'talabat-custom',
  preferredName?: string
): Promise<{
  success: boolean;
  menu?: RestaurantMenu;
  sourceUrl?: string;
  error?: string;
}> {
  try {
    const vetted = vetTalabatUrl(rawUrl);
    if ('error' in vetted) {
      return { success: false, error: vetted.error };
    }

    // Ensure an `aid` parameter exists; if missing, add Tagammoa 5 / New Cairo aid 7845
    if (!vetted.url.searchParams.has('aid')) {
      vetted.url.searchParams.set('aid', '7845');
    }
    const targetUrl = vetted.url.toString();

    const res = await fetch(targetUrl, {
      // A 302 to an internal address would walk straight past the host check above,
      // so follow nothing — a legitimate Talabat menu link resolves directly.
      redirect: 'manual',
      signal: AbortSignal.timeout(MENU_FETCH_TIMEOUT_MS),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

    if (res.status >= 300 && res.status < 400) {
      return {
        success: false,
        error: 'That menu link redirects elsewhere. Use the direct Talabat restaurant URL.',
      };
    }

    if (!res.ok) {
      return {
        success: false,
        error: `Talabat returned HTTP status ${res.status}. Check if the restaurant URL is valid.`,
      };
    }

    const html = await readCappedText(res);
    if (html === null) {
      return { success: false, error: 'That page is too large to read as a menu.' };
    }

    const { menuData, restaurantName } = parseTalabatNextData(html);

    if (!menuData || !menuData.categories || menuData.categories.length === 0) {
      return {
        success: false,
        error: `Menu data not found or branch is currently offline in this area.`,
      };
    }

    const finalName = preferredName || restaurantName || 'Restaurant Menu';
    const transformed = transformTalabatMenu(menuData, restaurantId, finalName, targetUrl);

    return {
      success: true,
      menu: transformed,
      sourceUrl: targetUrl,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to extract menu from the specified Talabat URL.';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Returns a list of all currently verified and pre-extracted Talabat Egypt restaurant brands.
 */
export function getAvailableTalabatBrands(): Array<{
  key: string;
  name: string;
  categoriesCount: number;
  itemsCount: number;
  sourceUrl: string;
}> {
  return Object.entries(typedCachedData).map(([key, data]) => ({
    key,
    name: data.restaurantName,
    categoriesCount: data.categories?.length || 0,
    itemsCount: data.items?.length || 0,
    sourceUrl: data.sourceUrl || '',
  }));
}
