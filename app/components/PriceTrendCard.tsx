'use client';

import { useMemo } from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { computePriceTrend, describePriceTrend, priceSeries } from '@/lib/priceTrend';
import type { Review } from '@/lib/types';

/**
 * What students have been paying, over time.
 *
 * Renders nothing at all when there is not enough data to say something true — an
 * empty space is better than a hedged "not enough data to determine a trend" box on
 * every quiet venue in the catalog.
 */
export default function PriceTrendCard({ reviews }: { reviews: Review[] }) {
  const trend = useMemo(() => computePriceTrend(reviews), [reviews]);
  const series = useMemo(() => priceSeries(reviews), [reviews]);

  const label = describePriceTrend(trend);
  if (!label) return null;

  const Icon =
    trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;

  // Rising prices are not "good" or "bad" in brand terms, but a student reading this
  // wants to spot an increase quickly, so up is amber and down is green.
  const tone =
    trend.direction === 'up'
      ? 'text-amber-700 bg-amber-50 ring-amber-200'
      : trend.direction === 'down'
        ? 'text-emerald-700 bg-emerald-50 ring-emerald-200'
        : 'text-ink-soft bg-surface ring-hairline';

  return (
    <div className="mt-3 rounded-xl border border-hairline bg-card p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-ink">What students pay</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            <span className="ltr-nums">{trend.earlierAverage}</span> →{' '}
            <span className="ltr-nums font-bold text-ink">{trend.recentAverage}</span> EGP per person
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ring-1 ${tone}`}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {label}
        </span>
      </div>

      <Sparkline points={series.map((p) => p.price)} />

      {/*
        The sample size is part of the claim, not a footnote. A 46% rise off six
        reports is a hint, not a measurement, and the reader should be able to tell.
      */}
      <p className="mt-1.5 text-xs text-ink-faint">
        From {trend.earlierCount + trend.recentCount} student price reports. Earlier average is the
        older half, recent the newer half.
      </p>
    </div>
  );
}

/**
 * Bare sparkline. No axes and no tooltip on purpose — it conveys shape, and the
 * actual numbers are stated in text above it, where a screen reader will find them.
 */
function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;

  const width = 240;
  const height = 32;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const path = points
    .map((price, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((price - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-2 h-8 w-full overflow-visible"
      role="presentation"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path d={path} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-brand-700" />
    </svg>
  );
}
