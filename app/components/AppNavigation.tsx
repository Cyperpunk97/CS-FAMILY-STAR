'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Utensils } from 'lucide-react';

interface AppNavigationProps {
  className?: string;
  memoriesCount?: number;
}

/**
 * Top-level navigation menu switching between:
 * 1. Campus Food Guide (100+ spots, ratings, walking times, prices)
 * 2. Outing Memories (warm & happy scrapbook of student outings)
 */
export default function AppNavigation({ className = '', memoriesCount }: AppNavigationProps) {
  const pathname = usePathname();
  const isMemories = pathname === '/memories';
  const isFoodGuide = pathname === '/' || (!isMemories && !pathname.startsWith('/memories'));

  return (
    <nav
      aria-label="Main application sections"
      className={`relative flex items-center justify-center ${className}`}
    >
      <div className="inline-flex items-center rounded-2xl bg-surface-sunken/80 p-1 shadow-inner ring-1 ring-hairline/80">
        <Link
          href="/"
          className={`relative flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all sm:px-4 sm:py-2 ${
            isFoodGuide
              ? 'bg-card text-brand-900 shadow-sm ring-1 ring-brand-200/50'
              : 'text-ink-soft hover:text-ink hover:bg-card/50'
          }`}
          aria-current={isFoodGuide ? 'page' : undefined}
        >
          <Utensils
            className={`h-3.5 w-3.5 transition-transform ${
              isFoodGuide ? 'text-brand-700 scale-105' : 'text-ink-faint'
            }`}
            aria-hidden="true"
          />
          <span>Food Guide</span>
          <span className="hidden text-[10px] font-medium text-ink-faint sm:inline">100+ spots</span>
        </Link>

        <Link
          href="/memories"
          className={`relative flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all sm:px-4 sm:py-2 ${
            isMemories
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/20'
              : 'text-ink-soft hover:text-amber-900 hover:bg-amber-50/70'
          }`}
          aria-current={isMemories ? 'page' : undefined}
        >
          <Sparkles
            className={`h-3.5 w-3.5 transition-transform ${
              isMemories ? 'text-amber-100 animate-pulse' : 'text-amber-600'
            }`}
            aria-hidden="true"
          />
          <span>Memories</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              isMemories
                ? 'bg-white/25 text-white'
                : 'bg-amber-100 text-amber-900'
            }`}
          >
            {typeof memoriesCount === 'number' ? memoriesCount : '✨'}
          </span>
        </Link>
      </div>
    </nav>
  );
}
