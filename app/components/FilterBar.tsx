'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Footprints, Heart, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { CATEGORIES, type Category, type PriceTier } from '@/lib/types';
import {
  SORT_OPTIONS,
  WALKABLE_METERS,
  activeFilterCount,
  type Filters,
  type SortKey,
} from '@/lib/filters';

interface FilterBarProps {
  filters: Filters;
  sort: SortKey;
  resultCount: number;
  totalCount: number;
  onFiltersChange: (next: Filters) => void;
  onSortChange: (next: SortKey) => void;
  onReset: () => void;
}

const CATEGORY_TABS: (Category | 'All')[] = ['All', ...CATEGORIES];

const PRICE_TIERS: { tier: PriceTier; symbol: string; label: string }[] = [
  { tier: 1, symbol: '$', label: 'Budget' },
  { tier: 2, symbol: '$$', label: 'Mid-range' },
  { tier: 3, symbol: '$$$', label: 'Premium' },
];

const RATING_STEPS: { value: Filters['minRating']; label: string }[] = [
  { value: 0, label: 'Any' },
  { value: 3, label: '3.0+' },
  { value: 4, label: '4.0+' },
  { value: 4.5, label: '4.5+' },
];

function chip(active: boolean) {
  return `rounded-full px-3.5 py-1.5 text-xs font-bold transition duration-200 active:scale-95 ${
    active
      ? 'bg-brand-700 text-white shadow-sm shadow-brand-900/20'
      : 'border border-hairline bg-card text-ink-soft hover:border-brand-200 hover:text-brand-700'
  }`;
}

/** A removable summary of one active filter, so state is visible without opening the panel. */
function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="animate-fade-in inline-flex items-center gap-1 rounded-full bg-brand-50 py-1 pl-2.5 pr-1 text-xs font-bold text-brand-800 ring-1 ring-brand-200">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="rounded-full p-0.5 transition hover:bg-brand-200/60"
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </span>
  );
}

export default function FilterBar({
  filters,
  sort,
  resultCount,
  totalCount,
  onFiltersChange,
  onSortChange,
  onReset,
}: FilterBarProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const panelId = useId();
  const sortId = useId();
  const activeCount = activeFilterCount(filters);

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onFiltersChange({ ...filters, [key]: value });

  const togglePriceTier = (tier: PriceTier) =>
    set(
      'priceTiers',
      filters.priceTiers.includes(tier)
        ? filters.priceTiers.filter((t) => t !== tier)
        : [...filters.priceTiers, tier]
    );

  // "/" jumps to search, Escape leaves it — the shortcut every search UI has.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      if (event.key === '/' && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      } else if (event.key === 'Escape' && target === searchRef.current) {
        searchRef.current?.blur();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="space-y-2.5">
      {/* Search */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
          aria-hidden="true"
        />
        <input
          ref={searchRef}
          type="search"
          value={filters.query}
          onChange={(e) => set('query', e.target.value)}
          placeholder="Search a spot, brand or mall"
          aria-label="Search food spots"
          className="w-full rounded-2xl border border-hairline bg-card py-3 pl-10 pr-12 text-sm text-ink shadow-sm transition placeholder:text-ink-faint focus:border-brand-400 focus:shadow-md"
        />
        {filters.query ? (
          <button
            type="button"
            onClick={() => set('query', '')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-faint transition hover:bg-ink/5 hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <kbd
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-hairline bg-surface px-1.5 py-0.5 text-[11px] font-bold text-ink-faint sm:block"
          >
            /
          </kbd>
        )}
      </div>

      {/* Category rail — scrolls horizontally on narrow screens. */}
      <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 py-0.5">
        {CATEGORY_TABS.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => set('category', cat)}
            aria-pressed={filters.category === cat}
            className={`${chip(filters.category === cat)} shrink-0`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/*
        Sort, Filters and the count. Filters lives here rather than at the end of the
        scrolling category rail, where it slid off the right edge on a phone and
        became unreachable without scrolling sideways.
      */}
      <div className="flex items-center gap-2">
        <label htmlFor={sortId} className="sr-only">
          Sort spots by
        </label>
        <select
          id={sortId}
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className="min-w-0 rounded-full border border-hairline bg-card px-3 py-1.5 text-xs font-bold text-ink-soft shadow-sm transition hover:border-brand-200 focus:border-brand-400"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setPanelOpen((open) => !open)}
          aria-expanded={panelOpen}
          aria-controls={panelId}
          className={`${chip(activeCount > 0 || panelOpen)} inline-flex shrink-0 items-center gap-1.5`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-white/25 px-1.5 text-[11px] leading-4">
              {activeCount}
            </span>
          )}
        </button>

        <p className="ml-auto shrink-0 text-xs text-ink-faint" aria-live="polite">
          <span className="font-bold text-ink">{resultCount}</span>
          {resultCount !== totalCount && ` / ${totalCount}`}
        </p>
      </div>

      {/* Active filters, removable one by one. */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.category !== 'All' && (
            <FilterPill label={filters.category} onRemove={() => set('category', 'All')} />
          )}
          {filters.priceTiers.length > 0 && (
            <FilterPill
              label={filters.priceTiers
                .slice()
                .sort()
                .map((t) => '$'.repeat(t))
                .join(' / ')}
              onRemove={() => set('priceTiers', [])}
            />
          )}
          {filters.minRating > 0 && (
            <FilterPill label={`${filters.minRating}+ stars`} onRemove={() => set('minRating', 0)} />
          )}
          {filters.walkableOnly && (
            <FilterPill label="Walkable" onRemove={() => set('walkableOnly', false)} />
          )}
          {filters.favoritesOnly && (
            <FilterPill label="Saved" onRemove={() => set('favoritesOnly', false)} />
          )}
          <button
            type="button"
            onClick={onReset}
            className="ml-1 inline-flex items-center gap-1 text-xs font-bold text-ink-faint transition hover:text-brand-700"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Clear
          </button>
        </div>
      )}

      {/* Advanced filters */}
      {panelOpen && (
        <div
          id={panelId}
          className="animate-expand space-y-4 rounded-2xl border border-hairline bg-card p-4 shadow-sm"
        >
          <fieldset>
            <legend className="mb-2 text-xs font-bold text-ink">Price per person</legend>
            <div className="flex flex-wrap gap-2">
              {PRICE_TIERS.map(({ tier, symbol, label }) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => togglePriceTier(tier)}
                  aria-pressed={filters.priceTiers.includes(tier)}
                  className={chip(filters.priceTiers.includes(tier))}
                >
                  <span aria-hidden="true">{symbol}</span>
                  <span className="ml-1.5 font-medium opacity-80">{label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs font-bold text-ink">Minimum rating</legend>
            <div className="flex flex-wrap gap-2">
              {RATING_STEPS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('minRating', value)}
                  aria-pressed={filters.minRating === value}
                  className={chip(filters.minRating === value)}
                >
                  {label}
                </button>
              ))}
            </div>
            {filters.minRating > 0 && (
              <p className="mt-2 text-xs text-ink-faint">
                Spots with no reviews yet are hidden while a minimum rating is set.
              </p>
            )}
          </fieldset>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => set('walkableOnly', !filters.walkableOnly)}
              aria-pressed={filters.walkableOnly}
              className={`${chip(filters.walkableOnly)} inline-flex items-center gap-1.5`}
            >
              <Footprints className="h-3.5 w-3.5" aria-hidden="true" />
              Walkable ({WALKABLE_METERS} m)
            </button>

            <button
              type="button"
              onClick={() => set('favoritesOnly', !filters.favoritesOnly)}
              aria-pressed={filters.favoritesOnly}
              className={`${chip(filters.favoritesOnly)} inline-flex items-center gap-1.5`}
            >
              <Heart
                className={`h-3.5 w-3.5 ${filters.favoritesOnly ? 'fill-current' : ''}`}
                aria-hidden="true"
              />
              Saved only
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
