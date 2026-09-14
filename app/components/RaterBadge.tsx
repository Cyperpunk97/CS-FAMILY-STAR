'use client';

import { Award, Sparkles, Star } from 'lucide-react';
import { getRaterTier } from '@/lib/leaderboard';

export default function RaterBadge({
  reviewCount,
  showLabel = true,
  className = '',
}: {
  reviewCount: number;
  showLabel?: boolean;
  className?: string;
}) {
  const { badge, tier } = getRaterTier(reviewCount);

  const colors = {
    bronze: 'bg-amber-950/10 text-amber-900 border-amber-300/40 dark:text-amber-800',
    silver: 'bg-slate-100 text-slate-700 border-slate-300/60',
    gold: 'bg-amber-100 text-amber-800 border-amber-400/60',
    diamond: 'bg-brand-50 text-brand-800 border-brand-300/60',
  }[tier];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${colors} ${className}`}
      title={`${reviewCount} verified campus reviews`}
    >
      {tier === 'diamond' && <Sparkles className="w-3 h-3 text-brand-700 shrink-0" />}
      {tier === 'gold' && <Star className="w-3 h-3 text-amber-600 fill-amber-500 shrink-0" />}
      {(tier === 'silver' || tier === 'bronze') && <Award className="w-3 h-3 shrink-0" />}
      {showLabel ? badge : tier.toUpperCase()}
    </span>
  );
}
