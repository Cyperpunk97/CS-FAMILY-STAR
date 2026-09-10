import type { Review } from './types';

// In-memory reviews fallback when Supabase is not configured or in development mode
let nextId = 100;

const initialReviews: Review[] = [
  {
    id: 1,
    restaurant_id: 'fue-cilantro',
    rating: 5,
    comment: 'Great iced latte and chill atmosphere right on campus! Perfect for studying between CS lectures.',
    user_name: 'Youssef Ahmed',
    image_url: null,
    price_per_person: 75,
    recommended_dish: 'Iced Spanish Latte',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 2,
    restaurant_id: 'fue-cilantro',
    rating: 4,
    comment: 'Quick service, coffee is consistent. Sometimes crowded during noon break.',
    user_name: 'Mariam K.',
    image_url: null,
    price_per_person: 65,
    recommended_dish: 'Turkey & Cheddar Croissant',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 3,
    restaurant_id: 'fue-pasta2go',
    rating: 4,
    comment: 'Alfredo pasta with crispy chicken was hearty and fast.',
    user_name: 'Ahmed A.',
    image_url: null,
    price_per_person: 85,
    recommended_dish: 'Crispy Chicken Alfredo Pasta',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 4,
    restaurant_id: 'fue-point90-starbucks',
    rating: 5,
    comment: 'Reliable place to get Frappuccinos after exams at Point 90.',
    user_name: 'Sara M.',
    image_url: null,
    price_per_person: 140,
    recommended_dish: 'Caramel Macchiato',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: 5,
    restaurant_id: 'fue-mcdonalds',
    rating: 4,
    comment: 'Classic Big Mac combo, always quick.',
    user_name: 'Omar T.',
    image_url: null,
    price_per_person: 110,
    recommended_dish: 'Big Mac Combo',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: 6,
    restaurant_id: 'fue-cinnabon',
    rating: 5,
    comment: 'Fresh warm Minibon with extra pecan frosting. Best sugar rush.',
    user_name: 'Nour E.',
    image_url: null,
    price_per_person: 95,
    recommended_dish: 'Caramel Pecanbon Roll',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: 7,
    restaurant_id: 'fue-costa',
    rating: 4,
    comment: 'Great flat white and quiet seating at Concord Plaza.',
    user_name: 'Karim H.',
    image_url: null,
    price_per_person: 120,
    recommended_dish: 'Iced Flat White',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: 8,
    restaurant_id: 'fue-crave',
    rating: 5,
    comment: 'Amazing cordon bleu and chocolate fondant, great for celebratory group dinners.',
    user_name: 'Salma G.',
    image_url: null,
    price_per_person: 320,
    recommended_dish: 'Chicken Cordon Bleu',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
  },
];

const memoryReviews: Review[] = [...initialReviews];

export function getInMemoryReviews(
  restaurantId: string,
  limit = 50,
  offset = 0
): Review[] {
  return memoryReviews
    .filter((r) => r.restaurant_id === restaurantId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(offset, offset + limit);
}

export function addInMemoryReview(reviewData: {
  restaurant_id: string;
  rating: number;
  comment?: string | null;
  user_name?: string | null;
  image_url?: string | null;
  price_per_person?: number | null;
  recommended_dish?: string | null;
}): Review {
  const newReview: Review = {
    id: nextId++,
    restaurant_id: reviewData.restaurant_id,
    rating: reviewData.rating,
    comment: reviewData.comment ?? null,
    user_name: reviewData.user_name ?? null,
    image_url: reviewData.image_url ?? null,
    price_per_person: reviewData.price_per_person ?? null,
    recommended_dish: reviewData.recommended_dish ?? null,
    created_at: new Date().toISOString(),
  };

  memoryReviews.unshift(newReview);
  return newReview;
}

export function getInMemoryReviewStats(): Map<
  string,
  { sum: number; count: number; priceSum: number; priceCount: number }
> {
  const stats = new Map<
    string,
    { sum: number; count: number; priceSum: number; priceCount: number }
  >();

  for (const review of memoryReviews) {
    const entry = stats.get(review.restaurant_id) ?? {
      sum: 0,
      count: 0,
      priceSum: 0,
      priceCount: 0,
    };

    if (Number.isFinite(review.rating)) {
      entry.sum += review.rating;
      entry.count += 1;
    }

    if (review.price_per_person != null && Number.isFinite(review.price_per_person) && review.price_per_person > 0) {
      entry.priceSum += review.price_per_person;
      entry.priceCount += 1;
    }

    stats.set(review.restaurant_id, entry);
  }

  return stats;
}

/** Collects student recommended dishes ranked by frequency per venue. */
export function getInMemoryTopDishes(): Map<string, string[]> {
  const dishCounts = new Map<string, Map<string, number>>();

  for (const review of memoryReviews) {
    if (!review.recommended_dish) continue;
    const dish = review.recommended_dish.trim();
    if (!dish) continue;

    let venueMap = dishCounts.get(review.restaurant_id);
    if (!venueMap) {
      venueMap = new Map<string, number>();
      dishCounts.set(review.restaurant_id, venueMap);
    }

    venueMap.set(dish, (venueMap.get(dish) ?? 0) + 1);
  }

  const result = new Map<string, string[]>();
  for (const [venueId, counts] of dishCounts.entries()) {
    const sortedDishes = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([dish]) => dish)
      .slice(0, 3);
    result.set(venueId, sortedDishes);
  }

  return result;
}
