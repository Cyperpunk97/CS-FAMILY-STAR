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

/**
 * There is no fabricated fallback here, deliberately.
 *
 * This used to return eight invented students with invented review counts whenever
 * the database was unreachable, and the UI rendered them as a real ranking. In an app
 * that refuses to invent a phone number, inventing people is worse. When there is no
 * data the honest answer is an empty list, and the modal already says "No reviews
 * submitted yet."
 */
const NO_ENTRIES: LeaderboardEntry[] = [];

/** Cap on rows pulled for the ranking — an unbounded select grows with the table. */
const MAX_REVIEW_ROWS = 5000;

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured()) {
    return NO_ENTRIES;
  }

  const db = createServerSupabase();
  if (!db) {
    return NO_ENTRIES;
  }

  try {
    const { data, error } = await db
      .from('reviews')
      .select('user_name, rating, created_at')
      .not('user_name', 'is', null)
      .order('created_at', { ascending: false })
      .limit(MAX_REVIEW_ROWS);

    if (error || !data || data.length === 0) {
      if (error) console.warn('Leaderboard query failed:', error.message);
      return NO_ENTRIES;
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

    return entries;
  } catch (err) {
    console.warn('Leaderboard calculation failed:', err);
    return NO_ENTRIES;
  }
}
