import { createServerSupabase, isSupabaseConfigured } from './supabaseClient';
import type { LeaderboardEntry } from './types';

export function getRaterTier(reviewCount: number): {
  badge: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
} {
  if (reviewCount >= 10) return { badge: 'Star Critic 🌟', tier: 'diamond' };
  if (reviewCount >= 6) return { badge: 'Taste Master 🥇', tier: 'gold' };
  if (reviewCount >= 3) return { badge: 'Campus Foodie 🥈', tier: 'silver' };
  return { badge: 'Food Scout 🥉', tier: 'bronze' };
}

const fallbackLeaderboard: LeaderboardEntry[] = [
  {
    userName: 'Youssef Ahmed',
    reviewCount: 14,
    averageRatingGiven: 4.8,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    rank: 1,
    badge: 'Star Critic 🌟',
    tier: 'diamond',
  },
  {
    userName: 'Ahmed Abdelwahab',
    reviewCount: 11,
    averageRatingGiven: 4.6,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    rank: 2,
    badge: 'Star Critic 🌟',
    tier: 'diamond',
  },
  {
    userName: 'Mariam K.',
    reviewCount: 8,
    averageRatingGiven: 4.3,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    rank: 3,
    badge: 'Taste Master 🥇',
    tier: 'gold',
  },
  {
    userName: 'Sara M.',
    reviewCount: 6,
    averageRatingGiven: 4.7,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    rank: 4,
    badge: 'Taste Master 🥇',
    tier: 'gold',
  },
  {
    userName: 'Omar T.',
    reviewCount: 5,
    averageRatingGiven: 4.2,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    rank: 5,
    badge: 'Campus Foodie 🥈',
    tier: 'silver',
  },
  {
    userName: 'Nour E.',
    reviewCount: 4,
    averageRatingGiven: 4.9,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    rank: 6,
    badge: 'Campus Foodie 🥈',
    tier: 'silver',
  },
  {
    userName: 'Karim H.',
    reviewCount: 3,
    averageRatingGiven: 4.0,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    rank: 7,
    badge: 'Campus Foodie 🥈',
    tier: 'silver',
  },
  {
    userName: 'Salma G.',
    reviewCount: 2,
    averageRatingGiven: 5.0,
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    rank: 8,
    badge: 'Food Scout 🥉',
    tier: 'bronze',
  },
];

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured()) {
    return fallbackLeaderboard;
  }

  const db = createServerSupabase();
  if (!db) {
    return fallbackLeaderboard;
  }

  try {
    const { data, error } = await db
      .from('reviews')
      .select('user_name, rating, created_at')
      .not('user_name', 'is', null);

    if (error || !data || data.length === 0) {
      return fallbackLeaderboard;
    }

    const userMap = new Map<
      string,
      { count: number; totalRating: number; lastActive: string }
    >();

    for (const r of data) {
      const name = (r.user_name || '').trim();
      if (!name) continue;

      const existing = userMap.get(name) || {
        count: 0,
        totalRating: 0,
        lastActive: r.created_at,
      };

      existing.count += 1;
      existing.totalRating += r.rating || 0;
      if (new Date(r.created_at) > new Date(existing.lastActive)) {
        existing.lastActive = r.created_at;
      }
      userMap.set(name, existing);
    }

    const entries = Array.from(userMap.entries()).map(([name, stat]) => {
      const { badge, tier } = getRaterTier(stat.count);
      return {
        userName: name,
        reviewCount: stat.count,
        averageRatingGiven: Math.round((stat.totalRating / stat.count) * 10) / 10,
        lastActive: stat.lastActive,
        rank: 0,
        badge,
        tier,
      };
    });

    entries.sort((a, b) => b.reviewCount - a.reviewCount || b.averageRatingGiven - a.averageRatingGiven);

    entries.forEach((e, idx) => {
      e.rank = idx + 1;
    });

    return entries.length > 0 ? entries : fallbackLeaderboard;
  } catch (err) {
    console.warn('Leaderboard calculation failed, using fallback:', err);
    return fallbackLeaderboard;
  }
}
