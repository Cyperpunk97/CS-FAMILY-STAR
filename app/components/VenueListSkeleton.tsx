'use client';

import React from 'react';
import { Star } from 'lucide-react';

export function VenueCardSkeleton({ index = 0 }: { index?: number }) {
  const widths = [135, 165, 115, 150, 125, 175, 140];
  const nameWidth = widths[index % widths.length];

  return (
    <div
      style={{ '--i': index } as React.CSSProperties}
      className="stagger relative flex items-center gap-1 rounded-[--radius-card] border border-hairline bg-card py-3 pl-3 pr-2.5"
      aria-hidden="true"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Avatar logo placeholder */}
        <div className="h-10 w-10 shrink-0 rounded-xl skeleton" />

        <div className="min-w-0 flex-1 space-y-2">
          {/* Title and Rating row */}
          <div className="flex items-center gap-2">
            <div
              className="h-4 rounded-md skeleton"
              style={{ width: `${nameWidth}px` }}
            />
            <div className="h-4 w-11 rounded-md skeleton" />
          </div>

          {/* Category, Distance, and Price meta line */}
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-12 rounded skeleton" />
            <span className="select-none text-xs text-ink-faint">·</span>
            <div className="h-3 w-20 rounded skeleton" />
            <span className="select-none text-xs text-ink-faint">·</span>
            <div className="h-3 w-14 rounded skeleton" />
          </div>

          {/* Must-try dish badge placeholder */}
          {index % 2 === 0 && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <div className="h-3.5 w-14 rounded-md skeleton" />
              <div
                className="h-3 rounded skeleton"
                style={{ width: `${Math.floor(80 + ((index * 31) % 45))}px` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Action buttons placeholder (copy link + favorite) */}
      <div className="flex shrink-0 items-center gap-1">
        <div className="h-7 w-7 rounded-lg skeleton" />
        <div className="h-7 w-7 rounded-lg skeleton" />
      </div>

      {/* Chevron placeholder */}
      <div className="h-4 w-4 shrink-0 rounded skeleton" />
    </div>
  );
}

export function SpotlightSkeleton() {
  return (
    <section className="mt-4" aria-hidden="true">
      <div className="mb-2 flex items-center gap-1.5">
        <div className="h-3.5 w-3.5 rounded-full skeleton" />
        <div className="h-3.5 w-32 rounded skeleton" />
      </div>
      <div className="scrollbar-none -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex h-full w-44 shrink-0 flex-col items-start gap-2 rounded-2xl border border-hairline bg-card p-3"
          >
            <div className="h-8 w-8 shrink-0 rounded-xl skeleton" />
            <div className="h-3.5 w-28 rounded skeleton" />
            <div className="mt-2 flex w-full items-center justify-between">
              <div className="h-3 w-12 rounded skeleton" />
              <div className="h-3 w-14 rounded skeleton" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FilterBarSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {/* Search bar input placeholder */}
      <div className="h-11 w-full rounded-2xl border border-hairline bg-card skeleton" />

      {/* Categories chips rail */}
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6">
        {[52, 76, 68, 84, 60, 72, 64].map((w, idx) => (
          <div
            key={idx}
            className="h-8 shrink-0 rounded-full border border-hairline skeleton"
            style={{ width: `${w}px` }}
          />
        ))}
      </div>

      {/* Secondary filter chips & sort bar */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-1.5">
          <div className="h-7 w-12 rounded-lg skeleton" />
          <div className="h-7 w-12 rounded-lg skeleton" />
          <div className="h-7 w-12 rounded-lg skeleton" />
          <div className="h-7 w-16 rounded-lg skeleton" />
        </div>
        <div className="h-7 w-24 rounded-lg skeleton" />
      </div>
    </div>
  );
}

export function VenueListSkeleton({ count = 7 }: { count?: number }) {
  return (
    <div className="space-y-2.5 animate-fade-in" aria-busy="true" aria-live="polite">
      <div className="sr-only">Loading campus food spots...</div>
      {Array.from({ length: count }, (_, i) => (
        <VenueCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}

export function VenuePageSkeleton() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:px-6">
      {/* Header skeleton */}
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-hidden="true">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-[1.35rem] font-black tracking-tight text-brand-900">
            <Star className="h-5 w-5 shrink-0 fill-red-800 text-red-800" aria-hidden="true" />
            <span>CS Family Star</span>
          </h1>
          <p className="mt-0.5 text-xs text-ink-soft">
            Future University in Egypt · campus food guide
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:justify-end">
          <div className="h-7 w-28 rounded-full border border-brand-200/90 bg-brand-50/70 skeleton" />
          <div className="h-7 w-16 rounded-full border border-amber-300/80 bg-amber-50/80 skeleton" />
          <div className="h-7 w-20 rounded-full border border-hairline skeleton" />
        </div>
      </header>

      {/* Sticky search/filters bar */}
      <div className="sticky top-0 z-30 -mx-4 border-b border-hairline/60 bg-surface/85 px-4 pb-2.5 pt-2 backdrop-blur-md sm:-mx-6 sm:px-6">
        <FilterBarSkeleton />
      </div>

      {/* Spotlight rail */}
      <SpotlightSkeleton />

      {/* Venue card list skeleton */}
      <div className="mt-4">
        <VenueListSkeleton count={7} />
      </div>

      {/* Footer */}
      <footer className="mt-10 border-t border-hairline pt-5 text-center" aria-hidden="true">
        <div className="mx-auto h-3 w-64 rounded skeleton" />
        <div className="mx-auto mt-2 h-2.5 w-80 rounded skeleton" />
      </footer>
    </main>
  );
}
