'use client';

import { Star } from 'lucide-react';
import { LIMITS } from '@/lib/types';

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

/**
 * Read-only star display. The stars are decorative; the rating is announced as text
 * so a screen reader says "4 out of 5" instead of reading five identical icons.
 */
export function StarsDisplay({
  rating,
  size = 'sm',
}: {
  rating: number;
  size?: 'sm' | 'md';
}) {
  const px = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="sr-only">{rating} out of {LIMITS.ratingMax} stars</span>
      {STAR_VALUES.map((value) => (
        <Star
          key={value}
          aria-hidden="true"
          className={`${px} ${
            value <= rating ? 'fill-star text-star' : 'fill-transparent text-ink-faint'
          }`}
        />
      ))}
    </span>
  );
}

/**
 * Star rating input, built as a radio group.
 *
 * The previous version was five unlabelled `<button>` elements, which a screen
 * reader announced as five identical blank buttons with no indication of which one
 * was selected. Native radios keep arrow-key navigation and selected state for free.
 */
export function StarsInput({
  value,
  onChange,
  name = 'rating',
}: {
  value: number;
  onChange: (value: number) => void;
  name?: string;
}) {
  const labels = ['Terrible', 'Poor', 'Okay', 'Good', 'Excellent'];

  return (
    <div role="radiogroup" aria-label="Your rating" className="flex items-center gap-1">
      {STAR_VALUES.map((star) => {
        const active = star <= value;
        return (
          <label
            key={star}
            title={`${star} — ${labels[star - 1]}`}
            className="cursor-pointer rounded-lg p-1 transition-transform hover:scale-110 active:scale-95 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600"
          >
            <input
              type="radio"
              name={name}
              value={star}
              checked={value === star}
              onChange={() => onChange(star)}
              className="sr-only"
            />
            <Star
              aria-hidden="true"
              className={`h-9 w-9 transition-colors ${
                active ? 'fill-star text-star' : 'fill-transparent text-ink-faint'
              }`}
            />
            <span className="sr-only">
              {star} star{star === 1 ? '' : 's'} — {labels[star - 1]}
            </span>
          </label>
        );
      })}
      <span className="ml-2 text-sm font-bold text-ink-soft" aria-hidden="true">
        {labels[value - 1]}
      </span>
    </div>
  );
}
