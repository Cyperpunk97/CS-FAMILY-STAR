'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * Appears once the list is long enough to have lost its header.
 *
 * The scroll handler is passive and only ever flips a boolean, so it does not
 * re-render on every scroll frame — only when crossing the threshold.
 */
export default function ScrollTopButton({ threshold = 700 }: { threshold?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;

    const onScroll = () => {
      if (frame) return; // Coalesce bursts of scroll events into one rAF.
      frame = requestAnimationFrame(() => {
        frame = 0;
        setVisible((was) => {
          const now = window.scrollY > threshold;
          return now === was ? was : now;
        });
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [threshold]);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="animate-rise fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-brand-700 text-white shadow-lg shadow-brand-900/25 transition hover:bg-brand-800 active:scale-90"
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only">Back to top</span>
    </button>
  );
}
