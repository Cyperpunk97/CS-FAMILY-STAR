import type { Venue } from './types';

/**
 * The venue catalog for the FUE campus area.
 *
 * This used to live inline inside `app/api/restaurants/route.ts`, which made it
 * impossible to add per-venue fields without editing a request handler. It is data,
 * so it lives here.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  HOW TO ADD A PHONE NUMBER, MENU LINK, OR LOGO
 * ─────────────────────────────────────────────────────────────────────────────
 *  Every venue below ships with `phone: null`, `menuUrl: null`, `logoUrl: null`.
 *  Nothing is invented — a wrong phone number sends students to a stranger, and a
 *  wrong menu link is worse than no link. Fill them in as you verify them.
 *
 *  Add ONE entry per brand and every branch of that chain picks it up:
 *
 *      const CONTACTS_BY_BRAND = {
 *        'Starbucks': { phone: '19005', menuUrl: 'https://...', logoUrl: '/logos/starbucks.png' },
 *      }
 *
 *  Need a single branch to differ? Add it to CONTACTS_BY_ID, which wins over brand:
 *
 *      const CONTACTS_BY_ID = {
 *        'fue-cilantro': { phone: '02 1234 5678' },
 *      }
 *
 *  Logos: drop image files in `public/logos/` and reference them as `/logos/name.png`.
 *  Any venue without a logo renders a coloured monogram instead, so the UI never breaks.
 *  Only use logos you have the right to use.
 * ─────────────────────────────────────────────────────────────────────────────
 */

interface ContactInfo {
  phone?: string;
  menuUrl?: string;
  logoUrl?: string;
  /** Written by `npm run logos:fetch`; lets the UI tell an icon from a wordmark. */
  logoWidth?: number;
  logoHeight?: number;
}

/**
 * Keyed by `brand` — applies to every branch of the chain.
 *
 * The logos below were downloaded by `npm run logos:fetch` from Wikimedia Commons
 * via each brand's Wikidata item. Licence and source for every file are recorded in
 * `public/logos/CREDITS.md`. Add `phone` and `menuUrl` here as you verify them.
 */
const CONTACTS_BY_BRAND: Record<string, ContactInfo> = {
  "Arby's": { logoUrl: '/logos/arbys.png', logoWidth: 330, logoHeight: 283 },
  'Baskin Robbins': { logoUrl: '/logos/baskin-robbins.png', logoWidth: 330, logoHeight: 187 },
  'Brioche Doree': { logoUrl: '/logos/brioche-doree.jpg', logoWidth: 200, logoHeight: 110 },
  'Burger King': { logoUrl: '/logos/burger-king.png', logoWidth: 330, logoHeight: 360 },
  'Caffe Pascucci': { logoUrl: '/logos/caffe-pascucci.png', logoWidth: 330, logoHeight: 330 },
  "Chili's": { logoUrl: '/logos/chilis.png', logoWidth: 330, logoHeight: 166 },
  Cinnabon: { logoUrl: '/logos/cinnabon.png', logoWidth: 330, logoHeight: 110 },
  'Costa Coffee': { logoUrl: '/logos/costa-coffee.png', logoWidth: 330, logoHeight: 87 },
  "Domino's Pizza": { logoUrl: '/logos/dominos-pizza.png', logoWidth: 330, logoHeight: 70 },
  "Dunkin'": { logoUrl: '/logos/dunkin.png', logoWidth: 330, logoHeight: 64 },
  Fuddruckers: { logoUrl: '/logos/fuddruckers.png', logoWidth: 330, logoHeight: 196 },
  "Hardee's": { logoUrl: '/logos/hardees.png', logoWidth: 330, logoHeight: 81 },
  KFC: { logoUrl: '/logos/kfc.png', logoWidth: 330, logoHeight: 103 },
  'Krispy Kreme': { logoUrl: '/logos/krispy-kreme.png', logoWidth: 330, logoHeight: 114 },
  "McDonald's": { logoUrl: '/logos/mcdonalds.png', logoWidth: 330, logoHeight: 459 },
  "Papa John's Pizza": { logoUrl: '/logos/papa-johns-pizza.png', logoWidth: 330, logoHeight: 61 },
  'Paul Bakery & Restaurant': {
    logoUrl: '/logos/paul-bakery-restaurant.png',
    logoWidth: 330,
    logoHeight: 329,
  },
  'Pizza Hut': { logoUrl: '/logos/pizza-hut.png', logoWidth: 330, logoHeight: 278 },
  'Second Cup': { logoUrl: '/logos/second-cup.webp', logoWidth: 330, logoHeight: 69 },
  Starbucks: { logoUrl: '/logos/starbucks.png', logoWidth: 330, logoHeight: 36 },
};

/** Keyed by venue `id` — overrides the brand entry for one specific branch. */
const CONTACTS_BY_ID: Record<string, ContactInfo> = {
  // 'fue-cilantro': { phone: '02 1234 5678', menuUrl: 'https://example.com/menu' },
};

/**
 * The catalog. Everything contact-related is merged in below from the two maps
 * above, so this list stays purely about where a place is and what kind it is.
 * `priceTier` is an editorial baseline; real student reports override it in the UI.
 *
 * ── On the repeated coordinates ─────────────────────────────────────────────
 * Every "Point 90 Mall" venue shares one coordinate, and so does every "Concord
 * Plaza" venue. That is deliberate, not a copy-paste slip.
 *
 * Their original coordinates were wrong by more than half a kilometre — the 29
 * Point 90 entries were sitting on the American University in Cairo campus, 573 m
 * from the real mall. They now carry the mall's own surveyed position from
 * OpenStreetMap:
 *
 *   Point 90 Mall   30.020271, 31.494781   (729 m from the FUE campus)
 *   Concord Plaza   30.024918, 31.482718   (816 m)
 *
 * OSM does not map the individual shops inside either mall, so the building is the
 * most precise thing that can honestly be said. They keep `coordSource: 'approx'`
 * for that reason and the UI shows "~" — the position is right to the building,
 * not to the shop unit. Please do not "deduplicate" these by nudging them apart;
 * that would invent precision.
 * ────────────────────────────────────────────────────────────────────────────
 */
type CatalogEntry = Omit<
  Venue,
  'phone' | 'menuUrl' | 'logoUrl' | 'logoWidth' | 'logoHeight' | 'coordSource'
> & {
  /**
   * Omitted means `'approx'`. That default is deliberate: hand-entered coordinates
   * are estimates unless someone has actually checked them, and the safe failure is
   * to under-claim precision rather than over-claim it. Only mark `'osm'` when the
   * coordinate came from the map — `npm run venues:discover` emits it for you.
   */
  coordSource?: Venue['coordSource'];
};

const CATALOG: CatalogEntry[] = [
  { id: 'fue-cilantro', name: 'Cilantro - FUE Campus', brand: 'Cilantro', vicinity: 'FUE Food Court, End of 90th St', category: 'Cafe', lat: 30.026, lng: 31.4911, priceTier: 1 },
  { id: 'fue-pasta2go', name: 'Pasta 2Go', brand: 'Pasta 2Go', vicinity: 'FUE Food Court, New Cairo', category: 'Fast Food', lat: 30.0262, lng: 31.4913, priceTier: 1 },
  { id: 'fue-gad', name: 'GAD - Dreams Mall 2', brand: 'GAD', vicinity: 'Dreams Mall 2, Next to FUE', category: 'Restaurant', lat: 30.0255, lng: 31.4905, priceTier: 2 },
  { id: 'fue-seven-days', name: 'Seven Days Cafe', brand: 'Seven Days Cafe', vicinity: 'FUE Campus, New Cairo', category: 'Cafe', lat: 30.0261, lng: 31.4908, priceTier: 1 },
  { id: 'fue-point90-starbucks', name: 'Starbucks - Point 90', brand: 'Starbucks', vicinity: 'Point 90 Mall, New Cairo', category: 'Cafe', lat: 30.020271, lng: 31.494781, priceTier: 2 },
  { id: 'fue-crave', name: 'Crave - Point 90', brand: 'Crave', vicinity: 'Point 90 Mall, New Cairo', category: 'Restaurant', lat: 30.020271, lng: 31.494781, priceTier: 2 },
  { id: 'fue-tbs', name: 'TBS (The Bakery Shop)', brand: 'TBS (The Bakery Shop)', vicinity: 'Point 90 Mall, New Cairo', category: 'Cafe', lat: 30.020271, lng: 31.494781, priceTier: 1 },
  { id: 'fue-mcdonalds', name: 'McDonald\'s - Point 90', brand: 'McDonald\'s', vicinity: 'Point 90 Mall, New Cairo', category: 'Fast Food', lat: 30.020271, lng: 31.494781, priceTier: 1 },
  { id: 'fue-cinnabon', name: 'Cinnabon - Point 90', brand: 'Cinnabon', vicinity: 'Point 90 Mall, New Cairo', category: 'Cafe', lat: 30.020271, lng: 31.494781, priceTier: 1 },
  { id: 'fue-caribou', name: 'Caribou Coffee', brand: 'Caribou Coffee', vicinity: 'The Spot Mall, Near FUE', category: 'Cafe', lat: 30.022, lng: 31.497, priceTier: 2 },
  { id: 'fue-bufalo-burger', name: 'Buffalo Burger', brand: 'Buffalo Burger', vicinity: 'The Spot Mall, New Cairo', category: 'Fast Food', lat: 30.0222, lng: 31.4975, priceTier: 2 },
  { id: 'fue-costa', name: 'Costa Coffee - Concord Plaza', brand: 'Costa Coffee', vicinity: 'Concord Plaza, 90th Street', category: 'Cafe', lat: 30.024918, lng: 31.482718, priceTier: 2 },
  { id: 'fue-second-cup', name: 'Second Cup', brand: 'Second Cup', vicinity: 'Concord Plaza, 90th Street', category: 'Cafe', lat: 30.024918, lng: 31.482718, priceTier: 2 },
  { id: 'fue-dunkin', name: 'Dunkin\' - Dreams Mall', brand: 'Dunkin\'', vicinity: 'Dreams Mall, Next to FUE', category: 'Cafe', lat: 30.0257, lng: 31.4902, priceTier: 1 },
  { id: 'fue-bazooka', name: 'Bazooka Fried Chicken', brand: 'Bazooka Fried Chicken', vicinity: '90th Street East, New Cairo', category: 'Fast Food', lat: 30.028, lng: 31.493, priceTier: 1 },
  { id: 'fue-kfc-p90', name: 'KFC - Point 90', brand: 'KFC', vicinity: 'Point 90 Mall, New Cairo', category: 'Fast Food', lat: 30.020271, lng: 31.494781, priceTier: 1 },
  { id: 'fue-pizza-hut', name: 'Pizza Hut - Point 90', brand: 'Pizza Hut', vicinity: 'Point 90 Mall, New Cairo', category: 'Fast Food', lat: 30.020271, lng: 31.494781, priceTier: 1 },
  { id: 'fue-hardees', name: 'Hardee\'s - Point 90', brand: 'Hardee\'s', vicinity: 'Point 90 Mall, New Cairo', category: 'Fast Food', lat: 30.020271, lng: 31.494781, priceTier: 1 },
  { id: 'fue-paul', name: 'Paul Bakery & Restaurant', brand: 'Paul Bakery & Restaurant', vicinity: 'Point 90 Mall, New Cairo', category: 'Restaurant', lat: 30.020271, lng: 31.494781, priceTier: 2 },
  { id: 'fue-casper', name: 'Casper & Gambini\'s', brand: 'Casper & Gambini\'s', vicinity: 'Point 90 Mall, New Cairo', category: 'Restaurant', lat: 30.020271, lng: 31.494781, priceTier: 2 },
  { id: 'fue-espresso-lab', name: 'Espresso Lab', brand: 'Espresso Lab', vicinity: 'Point 90 Mall, New Cairo', category: 'Cafe', lat: 30.020271, lng: 31.494781, priceTier: 2 },
  { id: 'fue-beanos', name: 'Beano\'s Cafe', brand: 'Beano\'s Cafe', vicinity: 'Concord Plaza, 90th Street', category: 'Cafe', lat: 30.024918, lng: 31.482718, priceTier: 2 },
  { id: 'fue-maine', name: 'Maine Burgers', brand: 'Maine Burgers', vicinity: 'The Spot Mall, New Cairo', category: 'Fast Food', lat: 30.0225, lng: 31.4972, priceTier: 2 },
  { id: 'fue-papa-johns', name: 'Papa John\'s Pizza', brand: 'Papa John\'s Pizza', vicinity: 'Concord Plaza, New Cairo', category: 'Fast Food', lat: 30.024918, lng: 31.482718, priceTier: 1 },
  { id: 'fue-heart-attack', name: 'Heart Attack Chicken', brand: 'Heart Attack Chicken', vicinity: '90th Street East, New Cairo', category: 'Fast Food', lat: 30.0283, lng: 31.4932, priceTier: 1 },
  { id: 'fue-tbs-waterway', name: 'TBS - The Waterway', brand: 'TBS', vicinity: 'The Waterway, New Cairo', category: 'Cafe', lat: 30.031, lng: 31.478, priceTier: 1 },
  { id: 'fue-starbucks-waterway', name: 'Starbucks - The Waterway', brand: 'Starbucks', vicinity: 'The Waterway, New Cairo', category: 'Cafe', lat: 30.0312, lng: 31.4785, priceTier: 2 },
  { id: 'fue-mince', name: 'Mince Burger', brand: 'Mince Burger', vicinity: 'The Waterway, New Cairo', category: 'Fast Food', lat: 30.0315, lng: 31.4788, priceTier: 2 },
  { id: 'fue-mori-sushi', name: 'Mori Sushi', brand: 'Mori Sushi', vicinity: 'The Waterway, New Cairo', category: 'Restaurant', lat: 30.0318, lng: 31.4791, priceTier: 3 },
  { id: 'fue-willows', name: 'Willow\'s', brand: 'Willow\'s', vicinity: 'The Waterway, New Cairo', category: 'Restaurant', lat: 30.032, lng: 31.4793, priceTier: 2 },
  { id: 'fue-dipndip', name: 'dipndip', brand: 'dipndip', vicinity: 'Point 90 Mall, New Cairo', category: 'Cafe', lat: 30.020271, lng: 31.494781, priceTier: 1 },
  { id: 'fue-kansas', name: 'Kansas Fried Chicken', brand: 'Kansas Fried Chicken', vicinity: '90th Street, New Cairo', category: 'Fast Food', lat: 30.0275, lng: 31.4918, priceTier: 1 },
  { id: 'fue-willys', name: 'Willy\'s Kitchen', brand: 'Willy\'s Kitchen', vicinity: 'Concord Plaza, New Cairo', category: 'Fast Food', lat: 30.024918, lng: 31.482718, priceTier: 1 },
  { id: 'fue-shaghaf', name: 'Shaghaf Co-working Cafe', brand: 'Shaghaf Co-working Cafe', vicinity: 'Near FUE Campus, New Cairo', category: 'Cafe', lat: 30.0258, lng: 31.4901, priceTier: 1 },
  { id: 'fue-mocha', name: 'Mocha Cafe', brand: 'Mocha Cafe', vicinity: 'Concord Plaza, New Cairo', category: 'Cafe', lat: 30.024918, lng: 31.482718, priceTier: 1 },
  { id: 'fue-spectra', name: 'Spectra Restaurant', brand: 'Spectra Restaurant', vicinity: 'Concord Plaza, New Cairo', category: 'Restaurant', lat: 30.024918, lng: 31.482718, priceTier: 2 },
  { id: 'fue-chickndip', name: 'Chick \'N Dip', brand: 'Chick \'N Dip', vicinity: 'The Spot Mall, New Cairo', category: 'Fast Food', lat: 30.0223, lng: 31.4971, priceTier: 1 },
  { id: 'fue-butchers', name: 'Butcher\'s Burger', brand: 'Butcher\'s Burger', vicinity: 'Concord Plaza, New Cairo', category: 'Fast Food', lat: 30.024918, lng: 31.482718, priceTier: 2 },
  { id: 'fue-cortigiano', name: 'Cortigiano Restaurant', brand: 'Cortigiano Restaurant', vicinity: 'Concord Plaza, New Cairo', category: 'Restaurant', lat: 30.024918, lng: 31.482718, priceTier: 2 },
  { id: 'fue-tap-east', name: 'The Tap East', brand: 'The Tap East', vicinity: 'Stella Di Mare, New Cairo', category: 'Restaurant', lat: 30.029, lng: 31.482, priceTier: 2 },
  { id: 'fue-one-oak', name: 'One Oak - Steak & Sushi', brand: 'One Oak', vicinity: 'Point 90 Mall, New Cairo', category: 'Restaurant', lat: 30.020271, lng: 31.494781, priceTier: 3 },
  { id: 'fue-tbs-express', name: 'TBS Express', brand: 'TBS Express', vicinity: 'Dreams Mall, Next to FUE', category: 'Cafe', lat: 30.0256, lng: 31.4904, priceTier: 1 },
  { id: 'fue-container', name: 'Container Cafe', brand: 'Container Cafe', vicinity: 'Near FUE, New Cairo', category: 'Cafe', lat: 30.0265, lng: 31.492, priceTier: 1 },
  { id: 'fue-qahwa', name: 'Qahwa Cafe', brand: 'Qahwa Cafe', vicinity: 'The Waterway, New Cairo', category: 'Cafe', lat: 30.0314, lng: 31.4782, priceTier: 1 },
  { id: 'fue-teds', name: 'Ted\'s Restaurant', brand: 'Ted\'s Restaurant', vicinity: 'Point 90 Mall, New Cairo', category: 'Restaurant', lat: 30.020271, lng: 31.494781, priceTier: 2 },
  { id: 'fue-burger-king', name: 'Burger King', brand: 'Burger King', vicinity: 'Point 90 Mall, New Cairo', category: 'Fast Food', lat: 30.020271, lng: 31.494781, priceTier: 1 },
  { id: 'fue-tabio', name: 'TABiO Tea & Coffee', brand: 'TABiO Tea & Coffee', vicinity: 'Near FUE, New Cairo', category: 'Cafe', lat: 30.0263, lng: 31.4915, priceTier: 1 },
  { id: 'fue-ashley', name: 'Ashley Cafe', brand: 'Ashley Cafe', vicinity: 'Concord Plaza, New Cairo', category: 'Cafe', lat: 30.024918, lng: 31.482718, priceTier: 1 },
  { id: 'fue-texas', name: 'Texas Chicken', brand: 'Texas Chicken', vicinity: 'Point 90 Mall, New Cairo', category: 'Fast Food', lat: 30.020271, lng: 31.494781, priceTier: 1 },
  { id: 'fue-cinnabon-concord', name: 'Cinnabon - Concord Plaza', brand: 'Cinnabon', vicinity: 'Concord Plaza, 90th Street', category: 'Cafe', lat: 30.024918, lng: 31.482718, priceTier: 1 },
  { id: 'fue-dunkin-concord', name: 'Dunkin\' - Concord Plaza', brand: 'Dunkin\'', vicinity: 'Concord Plaza, New Cairo', category: 'Cafe', lat: 30.024918, lng: 31.482718, priceTier: 1 },
  { id: 'fue-tbs-concord', name: 'TBS - Concord Plaza', brand: 'TBS', vicinity: 'Concord Plaza, New Cairo', category: 'Cafe', lat: 30.024918, lng: 31.482718, priceTier: 1 },
  { id: 'fue-starbucks-concord', name: 'Starbucks - Concord Plaza', brand: 'Starbucks', vicinity: 'Concord Plaza, New Cairo', category: 'Cafe', lat: 30.024918, lng: 31.482718, priceTier: 2 },
  { id: 'fue-caribou-waterway', name: 'Caribou Coffee - Waterway', brand: 'Caribou Coffee', vicinity: 'The Waterway, New Cairo', category: 'Cafe', lat: 30.0311, lng: 31.4784, priceTier: 2 },
  { id: 'fue-krispy-p90', name: 'Krispy Kreme - Point 90', brand: 'Krispy Kreme', vicinity: 'Point 90 Mall, New Cairo', category: 'Cafe', lat: 30.020271, lng: 31.494781, priceTier: 1 },
  { id: 'fue-baskin-p90', name: 'Baskin Robbins - Point 90', brand: 'Baskin Robbins', vicinity: 'Point 90 Mall, New Cairo', category: 'Cafe', lat: 30.020271, lng: 31.494781, priceTier: 1 },
  { id: 'fue-greco-waterway', name: 'Caffe Greco - Waterway', brand: 'Caffe Greco', vicinity: 'The Waterway, New Cairo', category: 'Cafe', lat: 30.0313, lng: 31.4786, priceTier: 2 },
  { id: 'fue-eatery', name: 'The Eatery', brand: 'The Eatery', vicinity: 'Festival City Mall Area', category: 'Restaurant', lat: 30.0285, lng: 31.481, priceTier: 2 },
  { id: 'fue-fuddruckers', name: 'Fuddruckers - Point 90', brand: 'Fuddruckers', vicinity: 'Point 90 Mall, New Cairo', category: 'Restaurant', lat: 30.020271, lng: 31.494781, priceTier: 2 },
  { id: 'fue-chilis', name: 'Chili\'s - Point 90', brand: 'Chili\'s', vicinity: 'Point 90 Mall, New Cairo', category: 'Restaurant', lat: 30.020271, lng: 31.494781, priceTier: 2 },
  { id: 'fue-studio-misr', name: 'Studio Misr', brand: 'Studio Misr', vicinity: 'Point 90 Mall, New Cairo', category: 'Restaurant', lat: 30.020271, lng: 31.494781, priceTier: 2 },
  { id: 'fue-abo-elsid', name: 'Abo El Sid', brand: 'Abo El Sid', vicinity: 'Point 90 Mall, New Cairo', category: 'Restaurant', lat: 30.020271, lng: 31.494781, priceTier: 2 },
  { id: 'fue-tamara', name: 'Tamara Lebanese Bistro', brand: 'Tamara Lebanese Bistro', vicinity: 'Point 90 Mall, New Cairo', category: 'Restaurant', lat: 30.020271, lng: 31.494781, priceTier: 2 },
  { id: 'fue-ovio', name: 'Ovio - Waterway', brand: 'Ovio', vicinity: 'The Waterway, New Cairo', category: 'Restaurant', lat: 30.0316, lng: 31.4789, priceTier: 2 },
  { id: 'fue-tableette', name: 'Tableette Cafe', brand: 'Tableette Cafe', vicinity: 'The Waterway, New Cairo', category: 'Cafe', lat: 30.0317, lng: 31.4787, priceTier: 2 },
  { id: 'fue-lyra', name: 'Lyra Cafe', brand: 'Lyra Cafe', vicinity: 'The Waterway, New Cairo', category: 'Cafe', lat: 30.0319, lng: 31.4785, priceTier: 2 },
  { id: 'fue-smokery', name: 'The Smokery', brand: 'The Smokery', vicinity: 'The Waterway, New Cairo', category: 'Restaurant', lat: 30.0321, lng: 31.4794, priceTier: 2 },
  { id: 'fue-zooba', name: 'Zooba - Waterway', brand: 'Zooba', vicinity: 'The Waterway, New Cairo', category: 'Fast Food', lat: 30.0322, lng: 31.4795, priceTier: 1 },
  { id: 'fue-kazoku', name: 'Kazoku Japanese Grill', brand: 'Kazoku Japanese Grill', vicinity: 'Swanlake, New Cairo', category: 'Restaurant', lat: 30.034, lng: 31.475, priceTier: 3 },
  { id: 'fue-gigi', name: 'Gigi Burger Bar', brand: 'Gigi Burger Bar', vicinity: 'The Spot Mall, New Cairo', category: 'Fast Food', lat: 30.0224, lng: 31.4974, priceTier: 2 },
  { id: 'fue-zakuski', name: 'Zakuski Cafe', brand: 'Zakuski Cafe', vicinity: 'Concord Plaza, New Cairo', category: 'Cafe', lat: 30.024918, lng: 31.482718, priceTier: 1 },
  { id: 'fue-beanos-waterway', name: 'Beano\'s - Waterway', brand: 'Beano\'s', vicinity: 'The Waterway, New Cairo', category: 'Cafe', lat: 30.0315, lng: 31.4781, priceTier: 2 },
  { id: 'fue-costa-p90', name: 'Costa Coffee - Point 90', brand: 'Costa Coffee', vicinity: 'Point 90 Mall, New Cairo', category: 'Cafe', lat: 30.020271, lng: 31.494781, priceTier: 2 },
  { id: 'fue-cinnabon-spot', name: 'Cinnabon - The Spot Mall', brand: 'Cinnabon', vicinity: 'The Spot Mall, New Cairo', category: 'Cafe', lat: 30.0221, lng: 31.4972, priceTier: 1 },
  { id: 'fue-dunkin-spot', name: 'Dunkin\' - The Spot Mall', brand: 'Dunkin\'', vicinity: 'The Spot Mall, New Cairo', category: 'Cafe', lat: 30.0223, lng: 31.4973, priceTier: 1 },
  { id: 'fue-starbucks-spot', name: 'Starbucks - The Spot Mall', brand: 'Starbucks', vicinity: 'The Spot Mall, New Cairo', category: 'Cafe', lat: 30.0226, lng: 31.4976, priceTier: 2 },
  { id: 'fue-cinnabon-waterway', name: 'Cinnabon - The Waterway', brand: 'Cinnabon', vicinity: 'The Waterway, New Cairo', category: 'Cafe', lat: 30.0312, lng: 31.4783, priceTier: 1 },
  { id: 'fue-krispy-concord', name: 'Krispy Kreme - Concord Plaza', brand: 'Krispy Kreme', vicinity: 'Concord Plaza, New Cairo', category: 'Cafe', lat: 30.024918, lng: 31.482718, priceTier: 1 },
  { id: 'fue-cilantro-concord', name: 'Cilantro - Concord Plaza', brand: 'Cilantro', vicinity: 'Concord Plaza, New Cairo', category: 'Cafe', lat: 30.024918, lng: 31.482718, priceTier: 1 },
  { id: 'fue-prezzo', name: 'Prezzo Pizza & Pasta', brand: 'Prezzo Pizza & Pasta', vicinity: 'Point 90 Mall, New Cairo', category: 'Restaurant', lat: 30.020271, lng: 31.494781, priceTier: 2 },
  { id: 'fue-lord-wings', name: 'Lord of the Wings', brand: 'Lord of the Wings', vicinity: 'Point 90 Mall, New Cairo', category: 'Fast Food', lat: 30.020271, lng: 31.494781, priceTier: 1 },
  { id: 'fue-max-burger', name: 'Max Burger', brand: 'Max Burger', vicinity: '90th Street East, New Cairo', category: 'Fast Food', lat: 30.0278, lng: 31.4922, priceTier: 1 },
  { id: 'fue-smash-burger', name: 'Smash Burger', brand: 'Smash Burger', vicinity: 'Concord Plaza, New Cairo', category: 'Fast Food', lat: 30.024918, lng: 31.482718, priceTier: 2 },
  { id: 'fue-bunster', name: 'Bunster Burger', brand: 'Bunster Burger', vicinity: 'The Spot Mall, New Cairo', category: 'Fast Food', lat: 30.0227, lng: 31.4978, priceTier: 1 },
  { id: 'fue-arbys', name: 'Arby\'s', brand: 'Arby\'s', vicinity: 'Point 90 Mall, New Cairo', category: 'Fast Food', lat: 30.020271, lng: 31.494781, priceTier: 1 },
  { id: 'fue-pizza-king', name: 'Pizza King', brand: 'Pizza King', vicinity: 'Dreams Mall, Next to FUE', category: 'Fast Food', lat: 30.0259, lng: 31.4906, priceTier: 1 },
  { id: 'fue-dominos', name: 'Domino\'s Pizza', brand: 'Domino\'s Pizza', vicinity: '90th Street, New Cairo', category: 'Fast Food', lat: 30.027, lng: 31.491, priceTier: 1 },
  { id: 'fue-pascucci', name: 'Caffe Pascucci', brand: 'Caffe Pascucci', vicinity: 'Concord Plaza, New Cairo', category: 'Cafe', lat: 30.024918, lng: 31.482718, priceTier: 2 },
  { id: 'fue-beanos-p90', name: 'Beano\'s - Point 90', brand: 'Beano\'s', vicinity: 'Point 90 Mall, New Cairo', category: 'Cafe', lat: 30.020271, lng: 31.494781, priceTier: 2 },
  { id: 'fue-brioche', name: 'Brioche Doree', brand: 'Brioche Doree', vicinity: 'Point 90 Mall, New Cairo', category: 'Cafe', lat: 30.020271, lng: 31.494781, priceTier: 2 },
  { id: 'fue-costa-waterway', name: 'Costa Coffee - Waterway', brand: 'Costa Coffee', vicinity: 'The Waterway, New Cairo', category: 'Cafe', lat: 30.0314, lng: 31.4787, priceTier: 2 },
  { id: 'fue-dunkin-waterway', name: 'Dunkin\' - Waterway', brand: 'Dunkin\'', vicinity: 'The Waterway, New Cairo', category: 'Cafe', lat: 30.0315, lng: 31.4788, priceTier: 1 },
  { id: 'fue-tbs-silverstar', name: 'TBS - Silver Star Mall', brand: 'TBS', vicinity: 'Silver Star Mall, New Cairo', category: 'Cafe', lat: 30.021, lng: 31.485, priceTier: 1 },
  { id: 'fue-cilantro-silverstar', name: 'Cilantro - Silver Star Mall', brand: 'Cilantro', vicinity: 'Silver Star Mall, New Cairo', category: 'Cafe', lat: 30.0212, lng: 31.4852, priceTier: 1 },
  { id: 'fue-starbucks-silverstar', name: 'Starbucks - Silver Star Mall', brand: 'Starbucks', vicinity: 'Silver Star Mall, New Cairo', category: 'Cafe', lat: 30.0214, lng: 31.4854, priceTier: 2 },
  { id: 'fue-costa-silverstar', name: 'Costa Coffee - Silver Star', brand: 'Costa Coffee', vicinity: 'Silver Star Mall, New Cairo', category: 'Cafe', lat: 30.0215, lng: 31.4855, priceTier: 2 },
  { id: 'fue-gad-concord', name: 'GAD - Concord Plaza', brand: 'GAD', vicinity: 'Concord Plaza, New Cairo', category: 'Restaurant', lat: 30.024918, lng: 31.482718, priceTier: 2 },
  { id: 'fue-cookdoor', name: 'Cook Door', brand: 'Cook Door', vicinity: 'Dreams Mall, Next to FUE', category: 'Fast Food', lat: 30.0254, lng: 31.4907, priceTier: 1 },
  { id: 'fue-momen', name: 'Mo\'men Fast Food', brand: 'Mo\'men Fast Food', vicinity: 'Dreams Mall, Next to FUE', category: 'Fast Food', lat: 30.0253, lng: 31.4908, priceTier: 1 },
  { id: 'fue-koshary-tahrir', name: 'Koshary El Tahrir', brand: 'Koshary El Tahrir', vicinity: 'Dreams Mall, Next to FUE', category: 'Restaurant', lat: 30.0252, lng: 31.4909, priceTier: 1 },

  // ── Added from OpenStreetMap via `npm run venues:discover` ──────────────────
  // Names and coordinates are surveyed map data, not estimates. `priceTier` is an
  // editorial guess and the only invented value here; student price reports
  // override it in the UI as soon as anyone submits one.
  { id: 'fue-coffeeshop-company', name: 'Coffeeshop Company', brand: 'Coffeeshop Company', vicinity: 'Next to FUE Campus', category: 'Cafe', lat: 30.0260287, lng: 31.4897782, coordSource: 'osm', priceTier: 2 },
  { id: 'fue-abou-shakra', name: 'Abou Shakra', brand: 'Abou Shakra', vicinity: 'Next to FUE Campus', category: 'Restaurant', lat: 30.0260701, lng: 31.4897024, coordSource: 'osm', priceTier: 2 },
  { id: 'fue-aroma-lounge', name: 'Aroma Lounge', brand: 'Aroma Lounge', vicinity: 'Next to FUE Campus', category: 'Cafe', lat: 30.0262049, lng: 31.4895707, coordSource: 'osm', priceTier: 1 },
  { id: 'fue-cafe-moods', name: 'Cafe Moods', brand: 'Cafe Moods', vicinity: 'New Cairo', category: 'Cafe', lat: 30.0294372, lng: 31.4967543, coordSource: 'osm', priceTier: 1 },
  { id: 'fue-cafe-supreme', name: 'Cafe Supreme', brand: 'Cafe Supreme', vicinity: 'New Cairo', category: 'Cafe', lat: 30.0292528, lng: 31.49721, coordSource: 'osm', priceTier: 1 },
  { id: 'fue-kimbo', name: 'Kimbo', brand: 'Kimbo', vicinity: '90th Street, New Cairo', category: 'Cafe', lat: 30.0204144, lng: 31.494929, coordSource: 'osm', priceTier: 2 },
  { id: 'fue-desoky-soda', name: 'Desoky & Soda', brand: 'Desoky & Soda', vicinity: '90th Street, New Cairo', category: 'Restaurant', lat: 30.0205834, lng: 31.495458, coordSource: 'osm', priceTier: 2 },
  { id: 'fue-tabali', name: 'Tabali', brand: 'Tabali', vicinity: '90th Street, New Cairo', category: 'Fast Food', lat: 30.0215727, lng: 31.4981663, coordSource: 'osm', priceTier: 1 },
  { id: 'fue-pasta-baby', name: 'Pasta Baby - Concord Mall', brand: 'Pasta Baby', vicinity: 'Concord Mall, 90th Street South', category: 'Restaurant', lat: 30.0249456, lng: 31.4821068, coordSource: 'osm', priceTier: 1 },
  { id: 'fue-super-bowl', name: 'The Super Bowl - Concord Mall', brand: 'The Super Bowl', vicinity: 'Concord Mall, 90th Street South', category: 'Restaurant', lat: 30.0249283, lng: 31.4820607, coordSource: 'osm', priceTier: 1 },
  { id: 'fue-caracas', name: 'Caracas', brand: 'Caracas', vicinity: 'Concord Plaza, New Cairo', category: 'Restaurant', lat: 30.0250806, lng: 31.481041, coordSource: 'osm', priceTier: 2 },
  { id: 'fue-haretna', name: 'Haretna', brand: 'Haretna', vicinity: 'Concord Plaza, New Cairo', category: 'Cafe', lat: 30.0250713, lng: 31.4809498, coordSource: 'osm', priceTier: 1 },
  { id: 'fue-relish', name: 'Relish', brand: 'Relish', vicinity: 'Point 90 Area, New Cairo', category: 'Restaurant', lat: 30.0192632, lng: 31.500527, coordSource: 'osm', priceTier: 2 },
  { id: 'fue-laroma', name: 'L\'Aroma Gourmet Coffee', brand: 'L\'Aroma', vicinity: 'Point 90 Area, New Cairo', category: 'Cafe', lat: 30.0200554, lng: 31.5012718, coordSource: 'osm', priceTier: 2 },
  { id: 'fue-euphoria', name: 'Euphoria', brand: 'Euphoria', vicinity: 'New Cairo', category: 'Cafe', lat: 30.0145773, lng: 31.5001122, coordSource: 'osm', priceTier: 1 },
  { id: 'fue-castry', name: 'Castry', brand: 'Castry', vicinity: 'Ahmed Okasha St, New Cairo', category: 'Fast Food', lat: 30.0339887, lng: 31.467398, coordSource: 'osm', priceTier: 1 },
];

/** The catalog with contact info merged in. Branch-specific entries win over brand entries. */
export const VENUES: Venue[] = CATALOG.map((v) => {
  const contact = { ...CONTACTS_BY_BRAND[v.brand], ...CONTACTS_BY_ID[v.id] };
  return {
    ...v,
    coordSource: v.coordSource ?? 'approx',
    phone: contact.phone ?? null,
    menuUrl: contact.menuUrl ?? null,
    logoUrl: contact.logoUrl ?? null,
    logoWidth: contact.logoWidth ?? null,
    logoHeight: contact.logoHeight ?? null,
  };
});

export const VENUES_BY_ID = new Map(VENUES.map((v) => [v.id, v]));

/**
 * Deterministic hue per brand, so a venue without a logo still gets a stable,
 * recognisable monogram colour. Must stay deterministic — a random colour would
 * differ between server and client render and cause a hydration mismatch.
 */
export function brandHue(brand: string): number {
  let hash = 0;
  for (let i = 0; i < brand.length; i++) {
    hash = (hash * 31 + brand.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

/** Up to two initials for the monogram fallback: "Costa Coffee" -> "CC". */
export function brandInitials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s'&-]/gu, ' ')
    .split(/[\s-]+/)
    .filter((w) => w.length > 0 && !/^(the|of|and|de|el|a)$/i.test(w));

  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
