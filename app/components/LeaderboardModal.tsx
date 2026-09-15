'use client';

import { useEffect, useState } from 'react';
import { Trophy, Star, Flame, Sparkles, X } from 'lucide-react';
import type { LeaderboardEntry } from '@/lib/types';
import RaterBadge from './RaterBadge';

export default function LeaderboardModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let alive = true;
    Promise.resolve().then(() => {
      if (alive) setLoading(true);
    });

    fetch('/api/leaderboard', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (alive && Array.isArray(data)) {
          setLeaders(data);
        }
      })
      .catch((err) => console.warn('Failed to load leaderboard:', err))
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="leaderboard-title"
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl bg-card shadow-2xl border border-hairline flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hairline px-6 py-4 bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 id="leaderboard-title" className="text-lg font-bold text-ink flex items-center gap-2">
                FUE Food Critics Hall
              </h2>
              <p className="text-xs text-ink-soft">
                Top active student reviewers ranking & badge tiers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-ink-soft hover:bg-surface-sunken hover:text-ink transition"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tier Info Bar */}
        <div className="px-6 py-3 bg-brand-50/50 border-b border-brand-100 text-xs text-brand-900 flex items-center justify-between flex-wrap gap-2">
          <span className="font-semibold flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-brand-700" />
            Rater Badges:
          </span>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-white/80 border border-brand-200">
              🌟 10+ Star
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white/80 border border-brand-200">
              🥇 6-9 Master
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white/80 border border-brand-200">
              🥈 3-5 Foodie
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white/80 border border-brand-200">
              🥉 1-2 Scout
            </span>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-ink-soft">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-700 border-t-transparent mb-2" />
              <p className="text-sm">Calculating campus critic rankings...</p>
            </div>
          ) : leaders.length === 0 ? (
            <div className="py-12 text-center text-ink-soft">
              <p className="text-sm">No reviews submitted yet. Be the first to rank on campus!</p>
            </div>
          ) : (
            leaders.map((entry, idx) => {
              const isTop3 = idx < 3;
              const rankColor =
                idx === 0
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : idx === 1
                  ? 'bg-slate-100 text-slate-800 border-slate-300'
                  : idx === 2
                  ? 'bg-orange-100 text-orange-900 border-orange-300'
                  : 'bg-surface-sunken text-ink-soft border-hairline';

              return (
                <div
                  key={entry.userName}
                  className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border transition ${
                    isTop3 ? 'bg-surface hover:border-brand-300' : 'bg-card hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-sm border ${rankColor}`}
                    >
                      {idx === 0 ? '👑' : `#${entry.rank}`}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-ink truncate">
                          {entry.userName}
                        </span>
                        <RaterBadge reviewCount={entry.reviewCount} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-ink-soft mt-0.5">
                        <span className="flex items-center gap-1">
                          <Flame className="h-3 w-3 text-brand-600" />
                          {entry.reviewCount} review{entry.reviewCount === 1 ? '' : 's'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-star fill-star" />
                          avg {entry.averageRatingGiven.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-medium text-brand-700">
                      {isTop3 ? 'Top Rater' : 'Contributor'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-hairline px-6 py-3.5 bg-surface text-center">
          <p className="text-xs text-ink-soft">
            Leave detailed reviews with ratings and prices on any food spot to level up your badge!
          </p>
        </div>
      </div>
    </div>
  );
}
