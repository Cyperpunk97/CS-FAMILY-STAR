import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  const lat = 30.0260;
  const lng = 31.4911;
  const radiusMeters = 6000;

  // 100 Curated English food spots surrounding FUE Campus & New Cairo
  const fallbackRestaurants = [
    { place_id: 'fue-cilantro', name: 'Cilantro - FUE Campus', vicinity: 'FUE Food Court, End of 90th St', category: 'Cafe', geometry: { location: { lat: 30.0260, lng: 31.4911 } } },
    { place_id: 'fue-pasta2go', name: 'Pasta 2Go', vicinity: 'FUE Food Court, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0262, lng: 31.4913 } } },
    { place_id: 'fue-gad', name: 'GAD - Dreams Mall 2', vicinity: 'Dreams Mall 2, Next to FUE', category: 'Restaurant', geometry: { location: { lat: 30.0255, lng: 31.4905 } } },
    { place_id: 'fue-seven-days', name: 'Seven Days Cafe', vicinity: 'FUE Campus, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0261, lng: 31.4908 } } },
    { place_id: 'fue-point90-starbucks', name: 'Starbucks - Point 90', vicinity: 'Point 90 Mall, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0175, lng: 31.4998 } } },
    { place_id: 'fue-crave', name: 'Crave - Point 90', vicinity: 'Point 90 Mall, New Cairo', category: 'Restaurant', geometry: { location: { lat: 30.0178, lng: 31.5002 } } },
    { place_id: 'fue-tbs', name: 'TBS (The Bakery Shop)', vicinity: 'Point 90 Mall, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0173, lng: 31.4995 } } },
    { place_id: 'fue-mcdonalds', name: "McDonald's - Point 90", vicinity: 'Point 90 Mall, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0170, lng: 31.5000 } } },
    { place_id: 'fue-cinnabon', name: 'Cinnabon - Point 90', vicinity: 'Point 90 Mall, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0172, lng: 31.4991 } } },
    { place_id: 'fue-caribou', name: 'Caribou Coffee', vicinity: 'The Spot Mall, Near FUE', category: 'Cafe', geometry: { location: { lat: 30.0220, lng: 31.4970 } } },
    { place_id: 'fue-bufalo-burger', name: 'Buffalo Burger', vicinity: 'The Spot Mall, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0222, lng: 31.4975 } } },
    { place_id: 'fue-costa', name: 'Costa Coffee - Concord Plaza', vicinity: 'Concord Plaza, 90th Street', category: 'Cafe', geometry: { location: { lat: 30.0240, lng: 31.4880 } } },
    { place_id: 'fue-second-cup', name: 'Second Cup', vicinity: 'Concord Plaza, 90th Street', category: 'Cafe', geometry: { location: { lat: 30.0242, lng: 31.4885 } } },
    { place_id: 'fue-dunkin', name: "Dunkin' - Dreams Mall", vicinity: 'Dreams Mall, Next to FUE', category: 'Cafe', geometry: { location: { lat: 30.0257, lng: 31.4902 } } },
    { place_id: 'fue-bazooka', name: 'Bazooka Fried Chicken', vicinity: '90th Street East, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0280, lng: 31.4930 } } },
    { place_id: 'fue-kfc-p90', name: 'KFC - Point 90', vicinity: 'Point 90 Mall, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0171, lng: 31.5001 } } },
    { place_id: 'fue-pizza-hut', name: 'Pizza Hut - Point 90', vicinity: 'Point 90 Mall, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0174, lng: 31.5003 } } },
    { place_id: 'fue-hardees', name: "Hardee's - Point 90", vicinity: 'Point 90 Mall, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0176, lng: 31.4999 } } },
    { place_id: 'fue-paul', name: 'Paul Bakery & Restaurant', vicinity: 'Point 90 Mall, New Cairo', category: 'Restaurant', geometry: { location: { lat: 30.0180, lng: 31.5005 } } },
    { place_id: 'fue-casper', name: "Casper & Gambini's", vicinity: 'Point 90 Mall, New Cairo', category: 'Restaurant', geometry: { location: { lat: 30.0181, lng: 31.5008 } } },
    { place_id: 'fue-espresso-lab', name: 'Espresso Lab', vicinity: 'Point 90 Mall, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0177, lng: 31.4993 } } },
    { place_id: 'fue-beanos', name: "Beano's Cafe", vicinity: 'Concord Plaza, 90th Street', category: 'Cafe', geometry: { location: { lat: 30.0245, lng: 31.4882 } } },
    { place_id: 'fue-maine', name: 'Maine Burgers', vicinity: 'The Spot Mall, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0225, lng: 31.4972 } } },
    { place_id: 'fue-papa-johns', name: "Papa John's Pizza", vicinity: 'Concord Plaza, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0241, lng: 31.4889 } } },
    { place_id: 'fue-heart-attack', name: 'Heart Attack Chicken', vicinity: '90th Street East, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0283, lng: 31.4932 } } },
    { place_id: 'fue-tbs-waterway', name: 'TBS - The Waterway', vicinity: 'The Waterway, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0310, lng: 31.4780 } } },
    { place_id: 'fue-starbucks-waterway', name: 'Starbucks - The Waterway', vicinity: 'The Waterway, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0312, lng: 31.4785 } } },
    { place_id: 'fue-mince', name: 'Mince Burger', vicinity: 'The Waterway, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0315, lng: 31.4788 } } },
    { place_id: 'fue-mori-sushi', name: 'Mori Sushi', vicinity: 'The Waterway, New Cairo', category: 'Restaurant', geometry: { location: { lat: 30.0318, lng: 31.4791 } } },
    { place_id: 'fue-willows', name: "Willow's", vicinity: 'The Waterway, New Cairo', category: 'Restaurant', geometry: { location: { lat: 30.0320, lng: 31.4793 } } },
    { place_id: 'fue-dipndip', name: 'dipndip', vicinity: 'Point 90 Mall, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0179, lng: 31.4996 } } },
    { place_id: 'fue-kansas', name: 'Kansas Fried Chicken', vicinity: '90th Street, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0275, lng: 31.4918 } } },
    { place_id: 'fue-willys', name: "Willy's Kitchen", vicinity: 'Concord Plaza, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0248, lng: 31.4886 } } },
    { place_id: 'fue-shaghaf', name: 'Shaghaf Co-working Cafe', vicinity: 'Near FUE Campus, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0258, lng: 31.4901 } } },
    { place_id: 'fue-mocha', name: 'Mocha Cafe', vicinity: 'Concord Plaza, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0244, lng: 31.4881 } } },
    { place_id: 'fue-spectra', name: 'Spectra Restaurant', vicinity: 'Concord Plaza, New Cairo', category: 'Restaurant', geometry: { location: { lat: 30.0246, lng: 31.4884 } } },
    { place_id: 'fue-chickndip', name: "Chick 'N Dip", vicinity: 'The Spot Mall, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0223, lng: 31.4971 } } },
    { place_id: 'fue-butchers', name: "Butcher's Burger", vicinity: 'Concord Plaza, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0243, lng: 31.4887 } } },
    { place_id: 'fue-cortigiano', name: 'Cortigiano Restaurant', vicinity: 'Concord Plaza, New Cairo', category: 'Restaurant', geometry: { location: { lat: 30.0247, lng: 31.4883 } } },
    { place_id: 'fue-tap-east', name: 'The Tap East', vicinity: 'Stella Di Mare, New Cairo', category: 'Restaurant', geometry: { location: { lat: 30.0290, lng: 31.4820 } } },
    { place_id: 'fue-one-oak', name: 'One Oak - Steak & Sushi', vicinity: 'Point 90 Mall, New Cairo', category: 'Restaurant', geometry: { location: { lat: 30.0182, lng: 31.5001 } } },
    { place_id: 'fue-tbs-express', name: 'TBS Express', vicinity: 'Dreams Mall, Next to FUE', category: 'Cafe', geometry: { location: { lat: 30.0256, lng: 31.4904 } } },
    { place_id: 'fue-container', name: 'Container Cafe', vicinity: 'Near FUE, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0265, lng: 31.4920 } } },
    { place_id: 'fue-qahwa', name: 'Qahwa Cafe', vicinity: 'The Waterway, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0314, lng: 31.4782 } } },
    { place_id: 'fue-teds', name: "Ted's Restaurant", vicinity: 'Point 90 Mall, New Cairo', category: 'Restaurant', geometry: { location: { lat: 30.0183, lng: 31.5004 } } },
    { place_id: 'fue-burger-king', name: 'Burger King', vicinity: 'Point 90 Mall, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0171, lng: 31.4997 } } },
    { place_id: 'fue-tabio', name: 'TABiO Tea & Coffee', vicinity: 'Near FUE, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0263, lng: 31.4915 } } },
    { place_id: 'fue-ashley', name: 'Ashley Cafe', vicinity: 'Concord Plaza, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0249, lng: 31.4888 } } },
    { place_id: 'fue-texas', name: 'Texas Chicken', vicinity: 'Point 90 Mall, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0172, lng: 31.5002 } } },
    { place_id: 'fue-cinnabon-concord', name: 'Cinnabon - Concord Plaza', vicinity: 'Concord Plaza, 90th Street', category: 'Cafe', geometry: { location: { lat: 30.0241, lng: 31.4882 } } },
    // Additional 50 English Places
    { place_id: 'fue-dunkin-concord', name: "Dunkin' - Concord Plaza", vicinity: 'Concord Plaza, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0243, lng: 31.4881 } } },
    { place_id: 'fue-tbs-concord', name: 'TBS - Concord Plaza', vicinity: 'Concord Plaza, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0242, lng: 31.4884 } } },
    { place_id: 'fue-starbucks-concord', name: 'Starbucks - Concord Plaza', vicinity: 'Concord Plaza, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0240, lng: 31.4886 } } },
    { place_id: 'fue-caribou-waterway', name: 'Caribou Coffee - Waterway', vicinity: 'The Waterway, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0311, lng: 31.4784 } } },
    { place_id: 'fue-krispy-p90', name: 'Krispy Kreme - Point 90', vicinity: 'Point 90 Mall, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0174, lng: 31.4994 } } },
    { place_id: 'fue-baskin-p90', name: 'Baskin Robbins - Point 90', vicinity: 'Point 90 Mall, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0176, lng: 31.4992 } } },
    { place_id: 'fue-greco-waterway', name: 'Caffe Greco - Waterway', vicinity: 'The Waterway, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0313, lng: 31.4786 } } },
    { place_id: 'fue-eatery', name: 'The Eatery', vicinity: 'Festival City Mall Area', category: 'Restaurant', geometry: { location: { lat: 30.0285, lng: 31.4810 } } },
    { place_id: 'fue-fuddruckers', name: 'Fuddruckers - Point 90', vicinity: 'Point 90 Mall, New Cairo', category: 'Restaurant', geometry: { location: { lat: 30.0184, lng: 31.5002 } } },
    { place_id: 'fue-chilis', name: "Chili's - Point 90", vicinity: 'Point 90 Mall, New Cairo', category: 'Restaurant', geometry: { location: { lat: 30.0185, lng: 31.5006 } } },
    { place_id: 'fue-studio-misr', name: 'Studio Misr', vicinity: 'Point 90 Mall, New Cairo', category: 'Restaurant', geometry: { location: { lat: 30.0186, lng: 31.5007 } } },
    { place_id: 'fue-abo-elsid', name: 'Abo El Sid', vicinity: 'Point 90 Mall, New Cairo', category: 'Restaurant', geometry: { location: { lat: 30.0187, lng: 31.5009 } } },
    { place_id: 'fue-tamara', name: 'Tamara Lebanese Bistro', vicinity: 'Point 90 Mall, New Cairo', category: 'Restaurant', geometry: { location: { lat: 30.0188, lng: 31.5010 } } },
    { place_id: 'fue-ovio', name: 'Ovio - Waterway', vicinity: 'The Waterway, New Cairo', category: 'Restaurant', geometry: { location: { lat: 30.0316, lng: 31.4789 } } },
    { place_id: 'fue-tableette', name: 'Tableette Cafe', vicinity: 'The Waterway, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0317, lng: 31.4787 } } },
    { place_id: 'fue-lyra', name: 'Lyra Cafe', vicinity: 'The Waterway, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0319, lng: 31.4785 } } },
    { place_id: 'fue-smokery', name: 'The Smokery', vicinity: 'The Waterway, New Cairo', category: 'Restaurant', geometry: { location: { lat: 30.0321, lng: 31.4794 } } },
    { place_id: 'fue-zooba', name: 'Zooba - Waterway', vicinity: 'The Waterway, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0322, lng: 31.4795 } } },
    { place_id: 'fue-kazoku', name: 'Kazoku Japanese Grill', vicinity: 'Swanlake, New Cairo', category: 'Restaurant', geometry: { location: { lat: 30.0340, lng: 31.4750 } } },
    { place_id: 'fue-gigi', name: 'Gigi Burger Bar', vicinity: 'The Spot Mall, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0224, lng: 31.4974 } } },
    { place_id: 'fue-zakuski', name: 'Zakuski Cafe', vicinity: 'Concord Plaza, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0247, lng: 31.4889 } } },
    { place_id: 'fue-beanos-waterway', name: "Beano's - Waterway", vicinity: 'The Waterway, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0315, lng: 31.4781 } } },
    { place_id: 'fue-costa-p90', name: 'Costa Coffee - Point 90', vicinity: 'Point 90 Mall, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0176, lng: 31.4997 } } },
    { place_id: 'fue-cinnabon-spot', name: 'Cinnabon - The Spot Mall', vicinity: 'The Spot Mall, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0221, lng: 31.4972 } } },
    { place_id: 'fue-dunkin-spot', name: "Dunkin' - The Spot Mall", vicinity: 'The Spot Mall, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0223, lng: 31.4973 } } },
    { place_id: 'fue-starbucks-spot', name: 'Starbucks - The Spot Mall', vicinity: 'The Spot Mall, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0226, lng: 31.4976 } } },
    { place_id: 'fue-cinnabon-waterway', name: 'Cinnabon - The Waterway', vicinity: 'The Waterway, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0312, lng: 31.4783 } } },
    { place_id: 'fue-krispy-concord', name: 'Krispy Kreme - Concord Plaza', vicinity: 'Concord Plaza, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0241, lng: 31.4883 } } },
    { place_id: 'fue-cilantro-concord', name: 'Cilantro - Concord Plaza', vicinity: 'Concord Plaza, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0245, lng: 31.4885 } } },
    { place_id: 'fue-prezzo', name: 'Prezzo Pizza & Pasta', vicinity: 'Point 90 Mall, New Cairo', category: 'Restaurant', geometry: { location: { lat: 30.0181, lng: 31.4999 } } },
    { place_id: 'fue-lord-wings', name: 'Lord of the Wings', vicinity: 'Point 90 Mall, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0183, lng: 31.5001 } } },
    { place_id: 'fue-max-burger', name: 'Max Burger', vicinity: '90th Street East, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0278, lng: 31.4922 } } },
    { place_id: 'fue-smash-burger', name: 'Smash Burger', vicinity: 'Concord Plaza, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0246, lng: 31.4886 } } },
    { place_id: 'fue-bunster', name: 'Bunster Burger', vicinity: 'The Spot Mall, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0227, lng: 31.4978 } } },
    { place_id: 'fue-arbys', name: "Arby's", vicinity: 'Point 90 Mall, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0173, lng: 31.5001 } } },
    { place_id: 'fue-pizza-king', name: 'Pizza King', vicinity: 'Dreams Mall, Next to FUE', category: 'Fast Food', geometry: { location: { lat: 30.0259, lng: 31.4906 } } },
    { place_id: 'fue-dominos', name: "Domino's Pizza", vicinity: '90th Street, New Cairo', category: 'Fast Food', geometry: { location: { lat: 30.0270, lng: 31.4910 } } },
    { place_id: 'fue-pascucci', name: 'Caffe Pascucci', vicinity: 'Concord Plaza, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0248, lng: 31.4884 } } },
    { place_id: 'fue-beanos-p90', name: "Beano's - Point 90", vicinity: 'Point 90 Mall, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0178, lng: 31.4994 } } },
    { place_id: 'fue-brioche', name: 'Brioche Doree', vicinity: 'Point 90 Mall, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0179, lng: 31.4995 } } },
    { place_id: 'fue-costa-waterway', name: 'Costa Coffee - Waterway', vicinity: 'The Waterway, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0314, lng: 31.4787 } } },
    { place_id: 'fue-dunkin-waterway', name: "Dunkin' - Waterway", vicinity: 'The Waterway, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0315, lng: 31.4788 } } },
    { place_id: 'fue-tbs-silverstar', name: 'TBS - Silver Star Mall', vicinity: 'Silver Star Mall, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0210, lng: 31.4850 } } },
    { place_id: 'fue-cilantro-silverstar', name: 'Cilantro - Silver Star Mall', vicinity: 'Silver Star Mall, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0212, lng: 31.4852 } } },
    { place_id: 'fue-starbucks-silverstar', name: 'Starbucks - Silver Star Mall', vicinity: 'Silver Star Mall, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0214, lng: 31.4854 } } },
    { place_id: 'fue-costa-silverstar', name: 'Costa Coffee - Silver Star', vicinity: 'Silver Star Mall, New Cairo', category: 'Cafe', geometry: { location: { lat: 30.0215, lng: 31.4855 } } },
    { place_id: 'fue-gad-concord', name: 'GAD - Concord Plaza', vicinity: 'Concord Plaza, New Cairo', category: 'Restaurant', geometry: { location: { lat: 30.0249, lng: 31.4889 } } },
    { place_id: 'fue-cookdoor', name: 'Cook Door', vicinity: 'Dreams Mall, Next to FUE', category: 'Fast Food', geometry: { location: { lat: 30.0254, lng: 31.4907 } } },
    { place_id: 'fue-momen', name: "Mo'men Fast Food", vicinity: 'Dreams Mall, Next to FUE', category: 'Fast Food', geometry: { location: { lat: 30.0253, lng: 31.4908 } } },
    { place_id: 'fue-koshary-tahrir', name: 'Koshary El Tahrir', vicinity: 'Dreams Mall, Next to FUE', category: 'Restaurant', geometry: { location: { lat: 30.0252, lng: 31.4909 } } }
  ];

  const containsLatinLetters = (str: string) => /[a-zA-Z]/.test(str);

  const { data: reviews } = await supabase
    .from('reviews')
    .select('restaurant_id, rating');

  const getStats = (placeId: string) => {
    if (!reviews || reviews.length === 0) return { averageRating: 0, reviewCount: 0 };
    const spotReviews = reviews.filter((r) => r.restaurant_id === placeId);
    if (spotReviews.length === 0) return { averageRating: 0, reviewCount: 0 };
    
    const sum = spotReviews.reduce((acc, curr) => acc + curr.rating, 0);
    return {
      averageRating: Number((sum / spotReviews.length).toFixed(1)),
      reviewCount: spotReviews.length,
    };
  };

  const query = `
    [out:json][timeout:25];
    (
      node["amenity"~"restaurant|cafe|fast_food|food_court|ice_cream"](around:${radiusMeters},${lat},${lng});
      way["amenity"~"restaurant|cafe|fast_food|food_court|ice_cream"](around:${radiusMeters},${lat},${lng});
    );
    out center 200;
  `;

  let list = [...fallbackRestaurants];

  try {
    const response = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
      {
        headers: { 'User-Agent': 'CSFamilyStarApp/1.0 (FUE Student Project)' },
        cache: 'no-store',
      }
    );

    if (response.ok) {
      const data = await response.json();
      const fetched = (data.elements || [])
        .map((item: any) => {
          if (!item.tags) return null;

          const nameEn = item.tags['name:en'];
          const rawName = item.tags.name || '';
          
          let englishName = '';
          if (nameEn && containsLatinLetters(nameEn)) {
            englishName = nameEn;
          } else if (containsLatinLetters(rawName)) {
            englishName = rawName;
          }

          if (!englishName) return null;

          const amenity = item.tags.amenity;
          let category = 'Restaurant';
          if (amenity === 'cafe') category = 'Cafe';
          if (amenity === 'fast_food' || amenity === 'ice_cream') category = 'Fast Food';

          const itemLat = item.lat || (item.center && item.center.lat) || lat;
          const itemLng = item.lon || (item.center && item.center.lon) || lng;

          return {
            place_id: `fue-${item.id}`,
            name: englishName,
            vicinity:
              item.tags['addr:street'] ||
              item.tags['addr:suburb'] ||
              'New Cairo (Near FUE)',
            category,
            geometry: {
              location: {
                lat: itemLat,
                lng: itemLng,
              },
            },
          };
        })
        .filter(Boolean);

      const existingNames = new Set(fallbackRestaurants.map((r) => r.name.toLowerCase().trim()));

      const uniqueFetched = fetched.filter((f: any) => {
        const cleanName = f.name.toLowerCase().trim();
        if (existingNames.has(cleanName)) return false;
        existingNames.add(cleanName);
        return true;
      });

      list = [...fallbackRestaurants, ...uniqueFetched];
    }
  } catch (error) {
    console.error('Overpass API error, serving fallback list:', error);
  }

  // Cap at 100 places total
  const top100List = list.slice(0, 100);

  const spotsWithRatings = top100List.map((spot) => ({
    ...spot,
    ...getStats(spot.place_id),
  }));

  return NextResponse.json(spotsWithRatings);
}