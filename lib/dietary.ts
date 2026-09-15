/**
 * Dietary flags for menu items.
 *
 * These were previously derived inline in the Talabat parser by a regex that flagged
 * anything containing "cheese" or "salad" as vegetarian, with a meat exclusion list
 * missing pepperoni, sausage, kofta, kebab, shawarma, tuna, grill and much else. The
 * result was that 23% of items labelled vegetarian contained an obvious meat word —
 * "Large Mixed Grill Platter", "Pepperoni Pizza", "Mutton Kebab And Kofta". The spicy
 * flag matched a bare "hot", so "Hot Chocolate" was labelled spicy.
 *
 * A wrong vegetarian label is not a cosmetic bug. Someone who does not eat meat, for
 * religious or ethical reasons, may act on it. So this module is deliberately
 * asymmetric: it is cheap to miss a vegetarian dish (the student reads the menu), and
 * expensive to label a meat dish vegetarian. Everything below is built around that.
 *
 * Even so, these flags are **inferred from item names, not declared by the vendor**.
 * They cannot account for chicken stock, animal rennet or a shared fryer. The UI
 * should present them as a hint and never as a guarantee.
 */

/**
 * Anything that rules out "vegetarian" outright.
 *
 * Arabic terms are included because Egyptian menus mix scripts freely and roughly a
 * third of cached item names contain Arabic.
 */
const MEAT_TERMS = [
  // Poultry and red meat
  'chicken', 'beef', 'meat', 'lamb', 'mutton', 'veal', 'steak', 'burger', 'turkey',
  'duck', 'pastrami', 'bacon', 'ham', 'pepperoni', 'sausage', 'salami', 'liver',
  'kofta', 'kebab', 'kabab', 'shawarma', 'shawerma', 'tawook', 'shish', 'hawawshi',
  'mixed grill', 'mix grill', 'grill platter', 'grills by kilo', 'grilled meat',
  'ribs', 'wings', 'nugget', 'strips', 'fillet',
  'zinger', 'crispy chicken', 'rotisserie', 'escalope', 'basterma', 'sujuk', 'sucuk',
  'mortadella', 'frankfurter', 'hotdog', 'hot dog', 'pork', 'gelatin', 'lard',
  // Fish and seafood
  'fish', 'tuna', 'salmon', 'shrimp', 'prawn', 'crab', 'lobster', 'calamari',
  'squid', 'anchov', 'seafood', 'oyster', 'mussel', 'tilapia', 'cod',
  // Arabic
  'فراخ', 'دجاج', 'لحم', 'لحمة', 'كفتة', 'كباب', 'شاورما', 'سجق', 'بسطرمة',
  'سمك', 'جمبري', 'تونة', 'بانيه', 'مشوي', 'مشويات', 'حواوشي', 'ريش', 'كبد',
];

/** Explicit, trustworthy vegetarian signals. */
const VEGETARIAN_TERMS = [
  'vegetarian', 'veggie', 'vegan', 'plant based', 'plant-based',
  'falafel', 'taameya', "ta'ameya", 'halloumi', 'foul', 'ful medames',
  'koshary', 'kushari', 'molokhia bel zeit', 'mahshi',
  'نباتي', 'فلافل', 'طعمية', 'فول', 'حلومي',
];

/**
 * Foods that are vegetarian when nothing else is going on — but only used as a
 * signal, never on their own against a meat term. "Caesar salad" is a salad.
 */
const LIKELY_VEGETARIAN_TERMS = [
  'cheese pizza', 'margherita', 'margarita pizza', 'four cheese', 'quattro formaggi',
  'caprese', 'hummus', 'baba ganoush', 'tahini', 'tabbouleh', 'fattoush',
  'french fries', 'potato wedges', 'onion rings', 'mozzarella sticks',
  'garden salad', 'green salad', 'greek salad', 'rocket salad',
  'pasta pomodoro', 'penne arrabbiata', 'mac and cheese', 'mac & cheese',
  'grilled cheese', 'cheese sandwich', 'cheese croissant', 'spinach pie',
  'grilled halloumi', 'halloumi sandwich', 'triple cheese', 'cheese roll',
  'matcha latte', 'vegetable', 'veggie wrap', 'mushroom',
  'حمص', 'بابا غنوج', 'طحينة', 'تبولة', 'فتوش', 'بطاطس',
];

/** Genuine heat signals. A bare "hot" is excluded — it means temperature far more often. */
const SPICY_TERMS = [
  'spicy', 'chili', 'chilli', 'jalapeno', 'jalapeño', 'habanero', 'sriracha',
  'harissa', 'shatta', 'peri peri', 'peri-peri', 'piri piri', 'buffalo sauce',
  'hot sauce', 'hot wings', 'fiery', 'flamin', 'nashville hot', 'zinger',
  'extra hot', 'volcano', 'inferno', 'cayenne', 'tabasco',
  'حار', 'حراق', 'سبايسي', 'شطة',
];

function normalize(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ').toLowerCase();
}

function containsAny(haystack: string, terms: string[]): boolean {
  return terms.some((term) => haystack.includes(term));
}

/** True when any meat or fish term appears. Used as a hard veto. */
export function containsMeat(name: string, description?: string | null, category?: string | null): boolean {
  return containsAny(normalize(name, description, category), MEAT_TERMS);
}

/**
 * Vegetarian only when there is positive evidence *and* no meat term anywhere,
 * including in the category — an item under "Bazooka Sandwiches Beef" is not
 * vegetarian however its own name reads.
 */
export function isVegetarianItem(
  name: string,
  description?: string | null,
  category?: string | null
): boolean {
  const haystack = normalize(name, description, category);

  if (containsAny(haystack, MEAT_TERMS)) return false;

  return containsAny(haystack, VEGETARIAN_TERMS) || containsAny(haystack, LIKELY_VEGETARIAN_TERMS);
}

/** Spicy only on a real heat word, never on temperature. */
export function isSpicyItem(
  name: string,
  description?: string | null,
  category?: string | null
): boolean {
  return containsAny(normalize(name, description, category), SPICY_TERMS);
}
