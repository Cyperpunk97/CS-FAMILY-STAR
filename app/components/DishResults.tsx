'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { UtensilsCrossed, Wallet } from 'lucide-react';
import { searchDishes, type DishHit } from '@/lib/dishSearch';
import { formatMenuPrice } from '@/lib/format';
import { campusDistanceLabel } from '@/lib/geo';
import type { VenueWithStats } from '@/lib/types';

/** Budget presets, in EGP. `null` is "no limit". */
const BUDGETS: { label: string; value: number | null }[] = [
  { label: 'Any', value: null },
  { label: '≤ 60', value: 60 },
  { label: '≤ 100', value: 100 },
  { label: '≤ 150', value: 150 },
  { label: '≤ 250', value: 250 },
];

interface DishResultsProps {
  /** The one search box's current query — this panel has no input of its own. */
  query: string;
  /** The full enriched list: dish results are not narrowed by the venue filters. */
  venues: VenueWithStats[];
  onOpenVenue: (venueId: string) => void;
}

/**
 * Dishes matching the single search box.
 *
 * There used to be two separate search inputs — one for venues in the filter bar,
 * one for dishes in its own panel — which meant typing "koshary" in the obvious
 * place searched the wrong thing. There is now one box: the venue list filters as
 * before, and this appears underneath when the same words also match dishes.
 *
 * It renders nothing when there are no matches, so the page is unchanged for
 * queries that are only about venues.
 */
export default function DishResults({ query, venues, onOpenVenue }: DishResultsProps) {
  const [budget, setBudget] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Searching 1,500 dishes on every keystroke is fast but not free; deferring keeps
  // typing responsive on a mid-range phone.
  const deferredQuery = useDeferredValue(query);

  const hits = useMemo(
    () => searchDishes(deferredQuery, venues, { maxPrice: budget, limit: 40 }),
    [deferredQuery, venues, budget]
  );

  const hasQuery = deferredQuery.trim().length > 0;
  if (!hasQuery || hits.length === 0) return null;

  // Long result lists push the venue list far down the page on a phone, so only a
  // few show until asked for more.
  const shown = expanded ? hits : hits.slice(0, 4);

  return (
    <section
      className="mt-3 rounded-2xl border border-hairline bg-card p-3"
      aria-label="Matching dishes"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-xs font-bold text-ink">
          <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden="true" />
          {hits.length} dish{hits.length === 1 ? '' : 'es'} match
        </h2>

        <div className="flex min-w-0 flex-wrap items-center gap-1">
          <Wallet className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden="true" />
          {BUDGETS.map((option) => {
            const active = budget === option.value;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => setBudget(option.value)}
                aria-pressed={active}
                className={`rounded-lg px-2 py-1 text-[11px] font-bold ring-1 transition ${
                  active
                    ? 'bg-brand-700 text-white ring-brand-700'
                    : 'bg-surface text-ink-soft ring-hairline hover:text-ink'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {budget !== null && (
        // Being explicit beats a student concluding a venue has nothing cheap.
        <p className="mt-1.5 text-[11px] text-ink-faint">
          Dishes priced by weight are hidden while a budget is set — their price is not
          known in advance.
        </p>
      )}

      <ul className="mt-1 divide-y divide-hairline">
        {shown.map((hit) => (
          <DishRow key={`${hit.venueId}-${hit.item.id}`} hit={hit} onOpen={onOpenVenue} />
        ))}
      </ul>

      {hits.length > shown.length && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-1 min-h-11 w-full rounded-xl text-xs font-bold text-brand-700 hover:bg-surface"
        >
          Show {hits.length - shown.length} more
        </button>
      )}
    </section>
  );
}

function DishRow({ hit, onOpen }: { hit: DishHit; onOpen: (venueId: string) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(hit.venueId)}
        // min-h-11 keeps every row a comfortable tap target on a phone.
        className="flex min-h-11 w-full items-start justify-between gap-3 py-2 text-start transition hover:bg-surface"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-ink">{hit.item.name}</span>
          {hit.item.nameAr && (
            <span lang="ar" dir="rtl" className="block truncate text-xs text-ink-soft">
              {hit.item.nameAr}
            </span>
          )}
          <span className="mt-0.5 block truncate text-xs text-ink-faint">
            {hit.venueName} · {campusDistanceLabel(hit.distanceMeters, hit.coordSource)}
          </span>
        </span>

        <span
          className={`shrink-0 whitespace-nowrap text-xs font-extrabold ltr-nums ${
            hit.item.price === null ? 'text-ink-faint' : 'text-brand-700'
          }`}
        >
          {formatMenuPrice(hit.item.price, hit.currency)}
        </span>
      </button>
    </li>
  );
}
