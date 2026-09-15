'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Clock, Dices, Footprints, GraduationCap, Heart, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { CATEGORIES, type Category, type PriceTier } from '@/lib/types';
import { useTranslate } from '../hooks/useLocale';
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
  /** Picks a random spot from the filtered list. Omitted means no dice is shown. */
  onSurprise?: () => void;
  surpriseDisabled?: boolean;
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
    <span className="animate-fade-in inline-flex items-center gap-1 rounded-full bg-brand-50 py-1 ps-2.5 pe-1 text-xs font-bold text-brand-800 ring-1 ring-brand-200">
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
  onSurprise,
  surpriseDisabled = false,
}: FilterBarProps) {
  const { t } = useTranslate();
  const [panelOpen, setPanelOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchId = useId();
  const sortId = useId();
  const panelId = useId();

  const activeCount = activeFilterCount(filters);

  // Press "/" to jump to search.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== '/' || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      e.preventDefault();
      searchInputRef.current?.focus();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    onFiltersChange({ ...filters, [key]: value });
  }

  function togglePriceTier(tier: PriceTier) {
    const exists = filters.priceTiers.includes(tier);
    const next = exists ? filters.priceTiers.filter((t) => t !== tier) : [...filters.priceTiers, tier];
    set('priceTiers', next);
  }

  return (
    <div className="space-y-3">
      {/* Search input, with "surprise me" as part of the same control. */}
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
        <label htmlFor={searchId} className="sr-only">
          {t('filter.searchLabel')}
        </label>
        <Search
          className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
          aria-hidden="true"
        />
        <input
          ref={searchInputRef}
          id={searchId}
          type="search"
          value={filters.query}
          onChange={(e) => set('query', e.target.value)}
          placeholder={t('filter.searchPlaceholder')}
          className="w-full rounded-2xl border border-hairline bg-card py-2.5 ps-10 pe-10 text-sm font-medium text-ink placeholder:text-ink-faint shadow-2xs transition duration-200 hover:border-brand-200 focus:border-brand-500 focus:bg-card focus:shadow-md focus:shadow-brand-900/5 focus:outline-none"
        />
        {filters.query ? (
          <button
            type="button"
            onClick={() => {
              set('query', '');
              searchInputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-faint transition hover:bg-surface hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <kbd
            aria-hidden="true"
            className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-hairline bg-surface px-1.5 py-0.5 text-xs font-bold text-ink-faint sm:block"
          >
            /
          </kbd>
        )}
        </div>

        {/*
          Picking at random is a way of searching — "I do not know what I want" — so
          it belongs with the search box rather than floating as its own button.
        */}
        {onSurprise && (
          <button
            type="button"
            onClick={onSurprise}
            disabled={surpriseDisabled}
            aria-label={t('search.surprise')}
            title={t('search.surprise')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-hairline bg-card text-ink-soft shadow-2xs transition hover:border-brand-200 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Dices className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Category rail & Quick Location Mode */}
      <div className="scrollbar-none -mx-1 flex items-center gap-2 overflow-x-auto px-1 py-0.5">
        <button
          type="button"
          onClick={() => set('onCampusOnly', !filters.onCampusOnly)}
          aria-pressed={filters.onCampusOnly}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition duration-200 active:scale-95 ${
            filters.onCampusOnly
              ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-900/20'
              : 'border border-emerald-300/80 bg-emerald-50/60 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-400'
          }`}
        >
          <GraduationCap className="h-3.5 w-3.5" />
          🎓 On-Campus Only
        </button>

        <div className="h-4 w-px bg-hairline shrink-0 my-auto" />

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

      {/* Sort, Filters, and Count */}
      <div className="flex items-center gap-2">
        <label htmlFor={sortId} className="sr-only">
          {t('sort.label')}
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
          {t('filter.title')}
          {activeCount > 0 && (
            <span className="rounded-full bg-white/25 px-1.5 text-xs leading-4">
              {activeCount}
            </span>
          )}
        </button>

        <p className="ms-auto shrink-0 text-xs text-ink-faint" aria-live="polite">
          <span className="font-bold text-ink">{resultCount}</span>
          {resultCount !== totalCount && ` / ${totalCount}`}
        </p>
      </div>

      {/* Active filters, removable one by one. */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.onCampusOnly && (
            <FilterPill label="🎓 On-Campus Only" onRemove={() => set('onCampusOnly', false)} />
          )}
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
            <FilterPill label={t('filter.favoritesOnly')} onRemove={() => set('favoritesOnly', false)} />
          )}
          {filters.openNowOnly && (
            <FilterPill label={t('filter.openNowOnly')} onRemove={() => set('openNowOnly', false)} />
          )}
          <button
            type="button"
            onClick={onReset}
            className="ms-1 inline-flex items-center gap-1 text-xs font-bold text-ink-faint transition hover:text-brand-700"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            {t('filter.clear')}
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
            <legend className="mb-2 text-xs font-bold text-ink">Location & Campus</legend>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => set('onCampusOnly', !filters.onCampusOnly)}
                aria-pressed={filters.onCampusOnly}
                className={`${chip(filters.onCampusOnly)} inline-flex items-center gap-1.5`}
              >
                <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                {t('filter.onCampusOnly')}
              </button>
              <button
                type="button"
                onClick={() => set('walkableOnly', !filters.walkableOnly)}
                aria-pressed={filters.walkableOnly}
                className={`${chip(filters.walkableOnly)} inline-flex items-center gap-1.5`}
              >
                <Footprints className="h-3.5 w-3.5" aria-hidden="true" />
                Walkable ({WALKABLE_METERS} m)
              </button>
            </div>
          </fieldset>

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
                  <span className="ms-1.5 font-medium opacity-80">{label}</span>
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
              onClick={() => set('favoritesOnly', !filters.favoritesOnly)}
              aria-pressed={filters.favoritesOnly}
              className={`${chip(filters.favoritesOnly)} inline-flex items-center gap-1.5`}
            >
              <Heart
                className={`h-3.5 w-3.5 ${filters.favoritesOnly ? 'fill-current' : ''}`}
                aria-hidden="true"
              />
              {t('filter.favoritesOnly')}
            </button>

            <button
              type="button"
              onClick={() => set('openNowOnly', !filters.openNowOnly)}
              aria-pressed={filters.openNowOnly}
              className={`${chip(filters.openNowOnly)} inline-flex items-center gap-1.5`}
            >
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {t('filter.openNowOnly')}
            </button>
          </div>

          {filters.openNowOnly && (
            <p className="mt-2 text-xs text-ink-faint">
              Only spots with verified opening hours can appear here. Anything whose
              hours we do not know is hidden rather than guessed at.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
