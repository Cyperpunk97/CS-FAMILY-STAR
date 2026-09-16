'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Utensils } from 'lucide-react';
import LanguageToggle from './LanguageToggle';

interface AppNavigationProps {
  className?: string;
  memoriesCount?: number;
}

/**
 * Unified top application bar combining:
 * 1. Primary section switcher (Food Guide / Outing Memories)
 * 2. Language switcher (English / Arabic)
 */
export default function AppNavigation({
  className = '',
  memoriesCount,
}: AppNavigationProps) {
  const pathname = usePathname();
  const isMemories = pathname === '/memories';
  const isFoodGuide = pathname === '/' || (!isMemories && !pathname.startsWith('/memories'));

  return (
    <div className={`flex w-full items-center justify-between gap-2 border-b border-hairline/60 pb-3 ${className}`}>
      {/* Tab Switcher */}
      <nav aria-label="Main application sections" className="inline-flex">
        <div className="inline-flex items-center rounded-xl bg-surface-sunken/90 p-1 shadow-2xs ring-1 ring-hairline/80">
          <Link
            href="/"
            className={`relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all sm:px-3.5 sm:py-1.5 ${
              isFoodGuide
                ? 'bg-card text-brand-900 shadow-2xs ring-1 ring-brand-200/60'
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
            <span className="whitespace-nowrap">Food Guide</span>
            <span className="hidden text-[11px] font-medium text-ink-faint sm:inline">100+</span>
          </Link>

          <Link
            href="/memories"
            className={`relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all sm:px-3.5 sm:py-1.5 ${
              isMemories
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-2xs shadow-amber-500/20'
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
            <span className="whitespace-nowrap">Memories</span>
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

      {/* Right Side Actions: Language Toggle */}
      <div className="flex items-center gap-1.5 shrink-0">
        <LanguageToggle />
      </div>
    </div>
  );
}
