'use client';

import { useCallback, useRef, useState } from 'react';
import { Dices } from 'lucide-react';
import { pickSurprise } from '@/lib/surprise';
import type { VenueWithStats } from '@/lib/types';

interface SurpriseButtonProps {
  /** The currently filtered, sorted list — whatever is on screen. */
  venues: VenueWithStats[];
  /** Opens the venue sheet. */
  onPick: (venueId: string) => void;
  className?: string;
}

/**
 * Picks one of the visible spots at random.
 *
 * The last pick is remembered in a ref rather than state: it only ever feeds the
 * next click, so storing it in state would re-render the whole list for nothing.
 */
export default function SurpriseButton({ venues, onPick, className = '' }: SurpriseButtonProps) {
  const lastPickedId = useRef<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const handleClick = useCallback(() => {
    const picked = pickSurprise(venues, lastPickedId.current);
    if (!picked) return;

    lastPickedId.current = picked.id;

    // Opening the sheet moves focus into a dialog, so a screen reader would
    // otherwise never hear which spot was chosen.
    setAnnouncement(`Picked ${picked.name}.`);
    onPick(picked.id);
  }, [venues, onPick]);

  // With nothing on screen there is nothing to pick from, and a button that does
  // nothing when pressed is worse than one that is visibly unavailable.
  const disabled = venues.length === 0;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-ink-faint/40 ${className}`}
      >
        <Dices className="h-3.5 w-3.5" aria-hidden="true" />
        Surprise me
      </button>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </>
  );
}
