'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Search, Wallet, X } from 'lucide-react';
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

interface DishSearchProps {
  /** The full enriched list — searching dishes should not be limited by venue filters. */
  venues: VenueWithStats[];
  /** Opens the venue sheet for the spot that serves the dish. */
  onOpenVenue: (venueId: string) => void;
}

/**
 * Search every dish on every menu.
 *
 * The venue list answers "where should I go". This answers "who has koshary" and
 * "what can I actually afford today", which is the question students were opening
 * menus one at a time to work out.
 */
export default function DishSearch({ venues, onOpenVenue }: DishSearchProps) {
  const [query, setQuery] = useState('');
  const [budget, setBudget] = useState<number | null>(null);

  // Searching 1,500 dishes on every keystroke is fast but not free; deferring keeps
  // typing responsive on a mid-range phone.
  const deferredQuery = useDeferredValue(query);

  const hits = useMemo(
    () => searchDishes(deferredQuery, venues, { maxPrice: budget, limit: 40 }),
    [deferredQuery, venues, budget]
  );

  const searching = deferredQuery.trim().length > 0 || budget !== null;

  return (
    <section className="rounded-2xl border border-hairline bg-card p-3" aria-label="Find a dish">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint start-3"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Koshary, latte, burger…"
          aria-label="Search dishes"
          className="w-full rounded-xl border border-hairline bg-surface py-2 text-sm text-ink placeholder:text-ink-faint focus:border-brand-700 focus:outline-none ps-9 pe-9"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear dish search"
            className="absolute top-1/2 -translate-y-1/2 rounded-lg p-1 text-ink-faint hover:text-ink end-2"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Wallet className="h-3.5 w-3.5 text-ink-faint" aria-hidden="true" />
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

      {searching && (
        <>
          <p role="status" aria-live="polite" className="mt-3 text-xs text-ink-faint">
            {hits.length === 0
              ? 'No dishes matched.'
              : `${hits.length} dish${hits.length === 1 ? '' : 'es'}`}
          </p>

          {budget !== null && (
            // Being explicit beats a student concluding a venue has nothing cheap.
            <p className="mt-1 text-[11px] text-ink-faint">
              Dishes priced by weight are not shown while a budget is set — their price
              is not known in advance.
            </p>
          )}

          <ul className="mt-2 divide-y divide-hairline">
            {hits.map((hit) => (
              <DishRow key={`${hit.venueId}-${hit.item.id}`} hit={hit} onOpen={onOpenVenue} />
            ))}
          </ul>
        </>
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
        className="flex w-full items-start justify-between gap-3 py-2 text-start transition hover:bg-surface"
      >
        <span className="min-w-0">
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
          className={`shrink-0 text-xs font-extrabold ltr-nums ${
            hit.item.price === null ? 'text-ink-faint' : 'text-brand-700'
          }`}
        >
          {formatMenuPrice(hit.item.price, hit.currency)}
        </span>
      </button>
    </li>
  );
}
