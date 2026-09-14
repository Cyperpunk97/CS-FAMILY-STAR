import type { Venue } from './types';

/**
 * The full venue catalog for the FUE campus area & New Cairo (Point 90, 90th Street, Campus).
 */

interface ContactInfo {
  phone?: string;
  menuUrl?: string;
  logoUrl?: string;
  logoWidth?: number;
  logoHeight?: number;
  signatureDish?: string;
}

/**
 * Keyed by `brand` — applies to branches of the chain.
 */
const CONTACTS_BY_BRAND: Record<string, ContactInfo> = {
  "Arby's": { logoUrl: '/logos/arbys.png', logoWidth: 330, logoHeight: 283, signatureDish: "Beef 'n Cheddar Classic & Curly Fries" },
  'Baskin Robbins': { logoUrl: '/logos/baskin-robbins.png', logoWidth: 330, logoHeight: 187, signatureDish: "Pralines 'n Cream Waffle Cone" },
  'Brioche Doree': { logoUrl: '/logos/brioche-doree.jpg', logoWidth: 200, logoHeight: 110, signatureDish: 'Almond Butter Croissant & Cafe Au Lait' },
  'Burger King': { logoUrl: '/logos/burger-king.png', logoWidth: 330, logoHeight: 360, signatureDish: 'Double Whopper with Cheese' },
  'Caffe Pascucci': { logoUrl: '/logos/caffe-pascucci.png', logoWidth: 330, logoHeight: 330, signatureDish: 'Espresso Freddo & Tiramisu' },
  'Caribou Coffee': { logoUrl: '/logos/caribou-coffee.png', logoWidth: 330, logoHeight: 80, signatureDish: 'Campfire Mocha & Berry Muffin' },
  "Chili's": { logoUrl: '/logos/chilis.png', logoWidth: 330, logoHeight: 166, signatureDish: 'Molten Chocolate Cake & Fajitas' },
  Cinnabon: { logoUrl: '/logos/cinnabon.png', logoWidth: 330, logoHeight: 110, signatureDish: 'Caramel Pecanbon Roll' },
  'Costa Coffee': { logoUrl: '/logos/costa-coffee.png', logoWidth: 330, logoHeight: 87, signatureDish: 'Iced Flat White & Carrot Cake' },
  "Domino's Pizza": { logoUrl: '/logos/dominos-pizza.png', logoWidth: 330, logoHeight: 70, signatureDish: 'ExtravaganZZa Cheesy Crust Pizza' },
  "Dunkin'": { logoUrl: '/logos/dunkin.png', logoWidth: 330, logoHeight: 64, signatureDish: 'Boston Kreme & Iced Coffee' },
  Fuddruckers: { logoUrl: '/logos/fuddruckers.png', logoWidth: 330, logoHeight: 196, signatureDish: '1/3 lb Bacon Cheddar Burger' },
  "Hardee's": { logoUrl: '/logos/hardees.png', logoWidth: 330, logoHeight: 81, signatureDish: 'Mushroom & Swiss Angus Thickburger' },
  KFC: { logoUrl: '/logos/kfc.png', logoWidth: 330, logoHeight: 103, signatureDish: 'Mighty Zinger Box & Twister' },
  'Krispy Kreme': { logoUrl: '/logos/krispy-kreme.png', logoWidth: 330, logoHeight: 114, signatureDish: 'Original Glazed Dozen' },
  "McDonald's": { logoUrl: '/logos/mcdonalds.png', logoWidth: 330, logoHeight: 459, signatureDish: 'Big Mac Combo with Fries' },
  "Papa John's Pizza": { logoUrl: '/logos/papa-johns-pizza.png', logoWidth: 330, logoHeight: 61, signatureDish: 'Super Papa Special with Garlic Sauce' },
  'Paul Bakery & Restaurant': {
    logoUrl: '/logos/paul-bakery-restaurant.png',
    logoWidth: 330,
    logoHeight: 329,
    signatureDish: 'Pain au Chocolat & French Hot Chocolate',
  },
  'Pizza Hut': { logoUrl: '/logos/pizza-hut.png', logoWidth: 330, logoHeight: 278, signatureDish: 'Stuffed Crust Super Supreme Pizza' },
  'Second Cup': { logoUrl: '/logos/second-cup.webp', logoWidth: 330, logoHeight: 69, signatureDish: 'Caramel Corretto Frappé' },
  'Smash Burger': { logoUrl: '/logos/smash-burger.jpg', logoWidth: 200, logoHeight: 100, signatureDish: 'Classic Double Smash with SmashFries' },
  Starbucks: { logoUrl: '/logos/starbucks.png', logoWidth: 330, logoHeight: 36, signatureDish: 'Iced Caramel Macchiato & White Mocha' },
  'TBS (The Bakery Shop)': { signatureDish: 'Almond Butter Croissant & Halloumi Focaccia' },
  'Texas Chicken': { logoUrl: '/logos/texas-chicken.png', logoWidth: 200, logoHeight: 100, signatureDish: 'Spicy 3pc Combo with Honey Butter Biscuits' },
  'Buffalo Burger': { signatureDish: 'Shiitake Mushroom Burger & Cheesy Fries' },
  'Uncle Tonny': { signatureDish: 'Uncle Tonny Double Smashed Burger & Crispy Tender Wrap' },
  Vivo: { signatureDish: 'Neapolitan Margherita Pizza & Chicken Alfredo Penne' },
  'Juice Me Up': { signatureDish: 'Mango Passion Smoothie & Fresh Pomegranate Booster' },
  'Bouza Roll': { signatureDish: 'Lotus Biscoff Rolled Ice Cream & Nutella Strawberry Roll' },
  Saladero: { signatureDish: 'Grilled Chicken Caesar Bowl & Mexican Quinoa Salad' },
  'Koshary El Tahrir': { signatureDish: 'Tahrir Mega Box with Garlic Da’ah' },
  Cilantro: { signatureDish: 'Iced Spanish Latte & Emmental Croissant' },
  Pasta2Go: { signatureDish: 'Crispy Chicken Alfredo Pasta' },
  'Seven Days Cafe': { signatureDish: 'Iced Caramel Macchiato & Student Toastie' },
  'FUE Central Cafeteria': { signatureDish: 'Grilled Shish Tawook Plate Meal' },
  'Container Cafe': { signatureDish: 'Double Shot Spanish Latte & Bubble Waffle' },
  'TABiO Tea': { signatureDish: 'Brown Sugar Tiger Milk Boba' },
  'Shaghaf Cafe': { signatureDish: 'Double Shot Flat White & Turkey Panini' },
  'Abou Shakra': { signatureDish: 'Charcoal Kofta Sandwich Roll' },
  'Coffeeshop Company': { signatureDish: 'Viennese Melange & Roast Beef Ciabatta' },
  Sugo: { signatureDish: 'حواوشي بالجبنة & سجق شرقي' },
  'B&W (Burgers & Wings)': { signatureDish: 'Classic Beef Burger, Fire Wings & Loaded Grilled Chicken' },
  Bimbo: { signatureDish: 'Waffles, Crepes, Ice Cream & Fresh Milkshakes' },
  'Heart Attack': { signatureDish: 'Dynamite Stuffed Fried Chicken & Cheesy Fries' },
  Bazooka: { signatureDish: 'Bazooka Crunch Box & Crispy Strips' },
  "Willy's Kitchen": { signatureDish: 'Nacho Burger & Melted Cheese Syringe' },
  'Mince Burger': { signatureDish: 'Juicy Lucy Burger & Rosemary Truffle Fries' },
  Zooba: { signatureDish: 'Spicy Sausage Hawawshi & Gourmet Falafel' },
  "Auntie Anne's": { signatureDish: 'Cinnamon Sugar Pretzel & Cheesy Pretzel Dog' },
  Dipndip: { signatureDish: 'Triple Chocolate Crepe & Brownie Skillet' },
  'El Dahan': { signatureDish: 'Kabab & Kofta Mixed Grill Platter' },
  'Man\'ousha Street': { signatureDish: 'Zaatar & Cheese Oven Baked Manouche' },
};

/** Keyed by venue `id` — overrides the brand entry for one specific branch. */
const CONTACTS_BY_ID: Record<string, ContactInfo> = {
  'fue-seven-days': { signatureDish: 'Iced Caramel Macchiato & Student Toastie' },
  'fue-uncle-tonny': { signatureDish: 'Uncle Tonny Double Smashed Burger & Crispy Tender Wrap' },
  'fue-cilantro': { signatureDish: 'Iced Spanish Latte & Emmental Croissant' },
  'fue-costa-campus': { logoUrl: '/logos/costa-coffee.png', logoWidth: 330, logoHeight: 87, signatureDish: 'Iced Flat White & Chocolate Muffin' },
  'fue-vivo': { signatureDish: 'Neapolitan Margherita Pizza & Chicken Alfredo Penne' },
  'fue-pasta2go': { signatureDish: 'Crispy Chicken Alfredo Pasta' },
  'fue-juice-me-up': { signatureDish: 'Mango Passion Smoothie & Fresh Pomegranate Booster' },
  'fue-bouza-roll': { signatureDish: 'Lotus Biscoff Rolled Ice Cream & Nutella Strawberry Roll' },
  'fue-saladero': { signatureDish: 'Grilled Chicken Caesar Bowl & Mexican Quinoa Salad' },
  'fue-bimbo': { signatureDish: 'Nutella Waffle, Lotus Crepe & Oreo Shake' },
  'fue-bw-burger': { signatureDish: 'Classic Beef Burger, Fire Wings & Loaded Grilled Chicken' },
  'fue-sugo': { signatureDish: 'حواوشي بالجبنة & سجق شرقي' },
  'fue-tbs-campus': { signatureDish: 'Almond Butter Croissant & Halloumi Focaccia' },
  'fue-cinnabon-campus': { logoUrl: '/logos/cinnabon.png', logoWidth: 330, logoHeight: 110, signatureDish: 'Caramel Pecanbon Roll & Minibon' },
  'fue-buffalo-campus': { signatureDish: 'Shiitake Mushroom Burger & Cheesy Fries' },
  'fue-koshary-campus': { signatureDish: 'Tahrir Mega Box with Garlic Da’ah' },
  'fue-dunkin-campus': { logoUrl: '/logos/dunkin.png', logoWidth: 330, logoHeight: 64, signatureDish: 'Boston Kreme Donut & Iced Caramel Coffee' },
  'fue-central-cafeteria': { signatureDish: 'Grilled Shish Tawook Plate Meal' },
  'fue-container-campus': { signatureDish: 'Double Shot Spanish Latte & Bubble Waffle' },
  'fue-tabio-campus': { signatureDish: 'Brown Sugar Tiger Milk Boba' },
  'fue-shaghaf-campus': { signatureDish: 'Double Shot Flat White & Turkey Panini' },
  'fue-abou-shakra-campus': { signatureDish: 'Charcoal Kofta Sandwich Roll' },
  'fue-coffeeshop-company': { signatureDish: 'Viennese Melange & Roast Beef Ciabatta' },
};

type CatalogEntry = Omit<
  Venue,
  'phone' | 'menuUrl' | 'logoUrl' | 'logoWidth' | 'logoHeight' | 'coordSource'
> & {
  coordSource?: Venue['coordSource'];
  isOnCampus?: boolean;
};

const CATALOG: CatalogEntry[] = [
  // ─── ONLY ON-CAMPUS VENUES (FUE Campus Grounds, Food Court, Plaza) ─────────
  { id: 'fue-seven-days', name: 'Seven Days Cafe', brand: 'Seven Days Cafe', vicinity: 'FUE Campus Courtyard', category: 'Cafe', lat: 30.0261, lng: 31.4908, coordSource: 'osm', priceTier: 1, isOnCampus: true },
  { id: 'fue-uncle-tonny', name: 'Uncle Tonny', brand: 'Uncle Tonny', vicinity: 'FUE Campus Food Court, Main Plaza', category: 'Fast Food', lat: 30.0261, lng: 31.4912, coordSource: 'osm', priceTier: 1, isOnCampus: true },
  { id: 'fue-cilantro', name: 'Cilantro', brand: 'Cilantro', vicinity: 'FUE Campus Food Court, Main Building', category: 'Cafe', lat: 30.0260, lng: 31.4911, coordSource: 'osm', priceTier: 1, isOnCampus: true },
  { id: 'fue-costa-campus', name: 'Costa Coffee - FUE Campus', brand: 'Costa Coffee', vicinity: 'FUE Campus Engineering Plaza & Library Walk', category: 'Cafe', lat: 30.0262, lng: 31.4915, coordSource: 'osm', priceTier: 2, isOnCampus: true },
  { id: 'fue-vivo', name: 'Vivo', brand: 'Vivo', vicinity: 'FUE Campus Food Court & Plaza', category: 'Restaurant', lat: 30.0260, lng: 31.4914, coordSource: 'osm', priceTier: 1, isOnCampus: true },
  { id: 'fue-pasta2go', name: 'Pasta 2Go', brand: 'Pasta2Go', vicinity: 'FUE Student Food Court', category: 'Fast Food', lat: 30.0262, lng: 31.4913, coordSource: 'osm', priceTier: 1, isOnCampus: true },
  { id: 'fue-juice-me-up', name: 'Juice Me Up', brand: 'Juice Me Up', vicinity: 'FUE Student Plaza & Courtyard', category: 'Cafe', lat: 30.0259, lng: 31.4909, coordSource: 'osm', priceTier: 1, isOnCampus: true },
  { id: 'fue-bouza-roll', name: 'Bouza Roll', brand: 'Bouza Roll', vicinity: 'FUE Campus Food Court Kiosk', category: 'Cafe', lat: 30.0262, lng: 31.4916, coordSource: 'osm', priceTier: 1, isOnCampus: true },
  { id: 'fue-saladero', name: 'Saladero', brand: 'Saladero', vicinity: 'FUE Campus Food Court & Healthy Bar', category: 'Restaurant', lat: 30.0261, lng: 31.4910, coordSource: 'osm', priceTier: 1, isOnCampus: true },

  // ─── OFF-CAMPUS / SURROUNDING VENUES ───────────────────────────────────────
  { id: 'fue-tbs-campus', name: 'TBS (The Bakery Shop)', brand: 'TBS (The Bakery Shop)', vicinity: 'FUE Engineering Building Plaza', category: 'Cafe', lat: 30.0259, lng: 31.4915, coordSource: 'osm', priceTier: 1, isOnCampus: false },
  { id: 'fue-cinnabon-campus', name: 'Cinnabon & Seattle’s Best', brand: 'Cinnabon', vicinity: 'FUE Student Center Kiosk', category: 'Cafe', lat: 30.0263, lng: 31.4910, coordSource: 'osm', priceTier: 1, isOnCampus: false },
  { id: 'fue-buffalo-campus', name: 'Buffalo Burger Express', brand: 'Buffalo Burger', vicinity: 'FUE Central Food Court', category: 'Fast Food', lat: 30.0261, lng: 31.4914, coordSource: 'osm', priceTier: 2, isOnCampus: false },
  { id: 'fue-koshary-campus', name: 'Koshary El Tahrir', brand: 'Koshary El Tahrir', vicinity: 'FUE Student Food Court', category: 'Restaurant', lat: 30.0258, lng: 31.4912, coordSource: 'osm', priceTier: 1, isOnCampus: false },
  { id: 'fue-dunkin-campus', name: 'Dunkin\'', brand: 'Dunkin\'', vicinity: 'FUE Student Plaza', category: 'Cafe', lat: 30.0257, lng: 31.4905, coordSource: 'osm', priceTier: 1, isOnCampus: false },
  { id: 'fue-central-cafeteria', name: 'FUE Central Cafeteria & Grill', brand: 'FUE Central Cafeteria', vicinity: 'FUE Main Student Building (Ground Floor)', category: 'Restaurant', lat: 30.0260, lng: 31.4907, coordSource: 'osm', priceTier: 1, isOnCampus: false },
  { id: 'fue-container-campus', name: 'Container Cafe', brand: 'Container Cafe', vicinity: 'FUE Open Air Campus Yard', category: 'Cafe', lat: 30.0265, lng: 31.4920, coordSource: 'osm', priceTier: 1, isOnCampus: false },
  { id: 'fue-tabio-campus', name: 'TABiO Tea & Boba', brand: 'TABiO Tea', vicinity: 'FUE Pharmacy Building Promenade', category: 'Cafe', lat: 30.0263, lng: 31.4918, coordSource: 'osm', priceTier: 1, isOnCampus: false },
  { id: 'fue-sugo', name: 'Sugo (سوجو)', brand: 'Sugo', vicinity: 'FUE Student Food Court', category: 'Restaurant', lat: 30.0261, lng: 31.4912, coordSource: 'osm', priceTier: 1, isOnCampus: false },
  { id: 'fue-bw-burger', name: 'B&W (Burgers & Wings)', brand: 'B&W (Burgers & Wings)', vicinity: 'FUE Student Food Court', category: 'Fast Food', lat: 30.0262, lng: 31.4915, coordSource: 'osm', priceTier: 2, isOnCampus: false },
  { id: 'fue-bimbo', name: 'Bimbo', brand: 'Bimbo', vicinity: 'FUE Student Food Court Kiosk', category: 'Cafe', lat: 30.0261, lng: 31.4916, coordSource: 'osm', priceTier: 1, isOnCampus: false },
  { id: 'fue-shaghaf-campus', name: 'Shaghaf Cafe & Study Corner', brand: 'Shaghaf Cafe', vicinity: 'FUE Library Annex', category: 'Cafe', lat: 30.0258, lng: 31.4901, coordSource: 'osm', priceTier: 1, isOnCampus: false },
  { id: 'fue-abou-shakra-campus', name: 'Abou Shakra Express', brand: 'Abou Shakra', vicinity: 'FUE Student Food Court', category: 'Restaurant', lat: 30.0261, lng: 31.4911, coordSource: 'osm', priceTier: 2, isOnCampus: false },
  { id: 'fue-coffeeshop-company', name: 'Coffeeshop Company', brand: 'Coffeeshop Company', vicinity: 'FUE Campus Gate 1 Plaza', category: 'Cafe', lat: 30.0260, lng: 31.4898, coordSource: 'osm', priceTier: 2, isOnCampus: false },

  // ─── SURROUNDING AREA / POINT 90 MALL / 90TH STREET RESTAURANTS ────────────
  { id: 'p90-mcdonalds', name: "McDonald's - Point 90 Mall", brand: "McDonald's", vicinity: 'Point 90 Mall, Ground Floor, New Cairo', category: 'Fast Food', lat: 30.0185, lng: 31.4988, coordSource: 'approx', priceTier: 1, isOnCampus: false },
  { id: 'p90-kfc', name: 'KFC - Point 90 Mall', brand: 'KFC', vicinity: 'Point 90 Mall, Food Court, New Cairo', category: 'Fast Food', lat: 30.0187, lng: 31.4990, coordSource: 'approx', priceTier: 1, isOnCampus: false },
  { id: 'p90-burger-king', name: 'Burger King - Point 90 Mall', brand: 'Burger King', vicinity: 'Point 90 Mall, Food Court, New Cairo', category: 'Fast Food', lat: 30.0189, lng: 31.4986, coordSource: 'approx', priceTier: 1, isOnCampus: false },
  { id: 'p90-hardees', name: "Hardee's - Point 90 Mall", brand: "Hardee's", vicinity: 'Point 90 Mall, Food Court, New Cairo', category: 'Fast Food', lat: 30.0191, lng: 31.4984, coordSource: 'approx', priceTier: 1, isOnCampus: false },
  { id: 'p90-pizza-hut', name: 'Pizza Hut - Point 90 Mall', brand: 'Pizza Hut', vicinity: 'Point 90 Mall, 1st Floor, New Cairo', category: 'Fast Food', lat: 30.0184, lng: 31.4992, coordSource: 'approx', priceTier: 1, isOnCampus: false },
  { id: 'p90-dominos', name: "Domino's Pizza - Point 90 Mall", brand: "Domino's Pizza", vicinity: 'Point 90 Mall, 1st Floor, New Cairo', category: 'Fast Food', lat: 30.0186, lng: 31.4995, coordSource: 'approx', priceTier: 1, isOnCampus: false },
  { id: 'p90-papa-johns', name: "Papa John's Pizza - Point 90 Mall", brand: "Papa John's Pizza", vicinity: 'Point 90 Mall, Food Court, New Cairo', category: 'Fast Food', lat: 30.0188, lng: 31.4997, coordSource: 'approx', priceTier: 1, isOnCampus: false },
  { id: 'p90-starbucks', name: 'Starbucks - Point 90 Mall', brand: 'Starbucks', vicinity: 'Point 90 Mall, Main Entrance, New Cairo', category: 'Cafe', lat: 30.0183, lng: 31.4985, coordSource: 'approx', priceTier: 2, isOnCampus: false },
  { id: 'p90-costa', name: 'Costa Coffee - Point 90 Mall', brand: 'Costa Coffee', vicinity: 'Point 90 Mall, Plaza Level, New Cairo', category: 'Cafe', lat: 30.0182, lng: 31.4987, coordSource: 'approx', priceTier: 2, isOnCampus: false },
  { id: 'p90-caribou', name: 'Caribou Coffee - Point 90 Mall', brand: 'Caribou Coffee', vicinity: 'Point 90 Mall, 2nd Floor Terrace, New Cairo', category: 'Cafe', lat: 30.0181, lng: 31.4989, coordSource: 'approx', priceTier: 2, isOnCampus: false },
  { id: 'p90-paul', name: 'Paul Bakery & Restaurant - Point 90', brand: 'Paul Bakery & Restaurant', vicinity: 'Point 90 Mall, Ground Floor Patio, New Cairo', category: 'Restaurant', lat: 30.0180, lng: 31.4983, coordSource: 'approx', priceTier: 3, isOnCampus: false },
  { id: 'p90-chilis', name: "Chili's Grill & Bar - Point 90", brand: "Chili's", vicinity: 'Point 90 Mall, Level 1, New Cairo', category: 'Restaurant', lat: 30.0189, lng: 31.4999, coordSource: 'approx', priceTier: 2, isOnCampus: false },
  { id: 'p90-fuddruckers', name: 'Fuddruckers - Point 90 Mall', brand: 'Fuddruckers', vicinity: 'Point 90 Mall, Level 2, New Cairo', category: 'Restaurant', lat: 30.0192, lng: 31.4998, coordSource: 'approx', priceTier: 2, isOnCampus: false },
  { id: 'p90-arbys', name: "Arby's - Point 90 Mall", brand: "Arby's", vicinity: 'Point 90 Mall, Food Court, New Cairo', category: 'Fast Food', lat: 30.0190, lng: 31.4982, coordSource: 'approx', priceTier: 2, isOnCampus: false },
  { id: 'p90-brioche-doree', name: 'Brioche Doree - Point 90', brand: 'Brioche Doree', vicinity: 'Point 90 Mall, Floor 1, New Cairo', category: 'Cafe', lat: 30.0184, lng: 31.4981, coordSource: 'approx', priceTier: 2, isOnCampus: false },
  { id: 'p90-baskin-robbins', name: 'Baskin Robbins - Point 90', brand: 'Baskin Robbins', vicinity: 'Point 90 Mall, Food Court, New Cairo', category: 'Cafe', lat: 30.0186, lng: 31.4979, coordSource: 'approx', priceTier: 1, isOnCampus: false },
  { id: 'p90-krispy-kreme', name: 'Krispy Kreme - Point 90 Mall', brand: 'Krispy Kreme', vicinity: 'Point 90 Mall, Ground Floor, New Cairo', category: 'Cafe', lat: 30.0185, lng: 31.4980, coordSource: 'approx', priceTier: 1, isOnCampus: false },
  { id: 'p90-texas-chicken', name: 'Texas Chicken - Point 90 Mall', brand: 'Texas Chicken', vicinity: 'Point 90 Mall, Food Court, New Cairo', category: 'Fast Food', lat: 30.0187, lng: 31.4981, coordSource: 'approx', priceTier: 1, isOnCampus: false },
  { id: 'p90-caffe-pascucci', name: 'Caffe Pascucci - Point 90', brand: 'Caffe Pascucci', vicinity: 'Point 90 Mall, Outdoor Plaza, New Cairo', category: 'Cafe', lat: 30.0183, lng: 31.4977, coordSource: 'approx', priceTier: 2, isOnCampus: false },
  { id: 'p90-second-cup', name: 'Second Cup - Point 90', brand: 'Second Cup', vicinity: 'Point 90 Mall, Level 1, New Cairo', category: 'Cafe', lat: 30.0182, lng: 31.4978, coordSource: 'approx', priceTier: 2, isOnCampus: false },
  { id: 'p90-smash-burger', name: 'Smash Burger - Point 90 Mall', brand: 'Smash Burger', vicinity: 'Point 90 Mall, Food Court, New Cairo', category: 'Fast Food', lat: 30.0189, lng: 31.4976, coordSource: 'approx', priceTier: 2, isOnCampus: false },
  { id: 'p90-heart-attack', name: 'Heart Attack - New Cairo Plaza', brand: 'Heart Attack', vicinity: '90th Street North, Near Point 90, New Cairo', category: 'Fast Food', lat: 30.0205, lng: 31.4950, coordSource: 'approx', priceTier: 2, isOnCampus: false },
  { id: 'p90-bazooka', name: 'Bazooka Fried Chicken - 90th Street', brand: 'Bazooka', vicinity: '90th Street, New Cairo', category: 'Fast Food', lat: 30.0210, lng: 31.4942, coordSource: 'approx', priceTier: 2, isOnCampus: false },
  { id: 'p90-willys-kitchen', name: "Willy's Kitchen - Point 90 Area", brand: "Willy's Kitchen", vicinity: 'AUC & Point 90 Promenade, New Cairo', category: 'Fast Food', lat: 30.0195, lng: 31.4965, coordSource: 'approx', priceTier: 2, isOnCampus: false },
  { id: 'p90-mince-burger', name: 'Mince Burgers - Point 90', brand: 'Mince Burger', vicinity: 'Point 90 Mall, Ground Floor, New Cairo', category: 'Restaurant', lat: 30.0184, lng: 31.4984, coordSource: 'approx', priceTier: 2, isOnCampus: false },
  { id: 'p90-zooba', name: 'Zooba - New Cairo', brand: 'Zooba', vicinity: '90th Street Promenade, New Cairo', category: 'Restaurant', lat: 30.0215, lng: 31.4930, coordSource: 'approx', priceTier: 2, isOnCampus: false },
  { id: 'p90-auntie-annes', name: "Auntie Anne's - Point 90 Mall", brand: "Auntie Anne's", vicinity: 'Point 90 Mall, Cinema Level, New Cairo', category: 'Cafe', lat: 30.0187, lng: 31.4991, coordSource: 'approx', priceTier: 1, isOnCampus: false },
  { id: 'p90-dipndip', name: 'Dipndip - Point 90 Mall', brand: 'Dipndip', vicinity: 'Point 90 Mall, 1st Floor, New Cairo', category: 'Cafe', lat: 30.0185, lng: 31.4988, coordSource: 'approx', priceTier: 2, isOnCampus: false },
  { id: 'p90-el-dahan', name: 'El Dahan Grills - New Cairo', brand: 'El Dahan', vicinity: '90th Street East, New Cairo', category: 'Restaurant', lat: 30.0220, lng: 31.4925, coordSource: 'approx', priceTier: 2, isOnCampus: false },
  { id: 'p90-manousha', name: "Man'ousha Street - Point 90", brand: "Man'ousha Street", vicinity: 'Point 90 Area Promenade, New Cairo', category: 'Fast Food', lat: 30.0190, lng: 31.4970, coordSource: 'approx', priceTier: 1, isOnCampus: false },
];

/** The catalog with contact info merged in. Branch-specific entries win over brand entries. */
export const VENUES: Venue[] = CATALOG.map((v) => {
  const contact = { ...CONTACTS_BY_BRAND[v.brand], ...CONTACTS_BY_ID[v.id] };
  return {
    ...v,
    // `approx` is the default on purpose: a venue added by hand must never silently
    // claim surveyed precision. Distance is the default sort, and an `osm` coordinate
    // is handed to Google Maps directly, so a wrong default routes someone to the
    // wrong door. Only set `'osm'` when the coordinate actually came from the map.
    coordSource: v.coordSource ?? 'approx',
    isOnCampus: v.isOnCampus ?? false,
    phone: contact.phone ?? null,
    menuUrl: contact.menuUrl ?? null,
    logoUrl: contact.logoUrl ?? null,
    logoWidth: contact.logoWidth ?? null,
    logoHeight: contact.logoHeight ?? null,
    signatureDish: contact.signatureDish ?? null,
  };
});

export const VENUES_BY_ID = new Map(VENUES.map((v) => [v.id, v]));

/**
 * Deterministic hue per brand, so a venue without a logo still gets a stable,
 * recognisable monogram colour.
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
