'use client';

import Image from 'next/image';
import { useState } from 'react';
import { brandHue, brandInitials } from '@/lib/venues';
import { AVATAR_MAX_ASPECT, type Venue } from '@/lib/types';

/**
 * A venue's mark, in one of two forms.
 *
 * `VenueAvatar` is the square badge used in the list. It only shows a real logo when
 * that logo is roughly square — about half the brand logos on Wikimedia Commons are
 * wide wordmarks (the Starbucks file is 330x36, a 9:1 strip), and fitting one into a
 * 44px square gives a 44x5 smear that reads as an empty box. Those fall back to a
 * monogram, which is legible at any size.
 *
 * `VenueWordmark` is the wide form used in the venue sheet, where there is room for
 * a wordmark to be shown at its natural proportions.
 *
 * The monogram colour is a deterministic hash of the brand name, so every branch of a
 * chain matches and the server and client render identically — a random colour here
 * would cause a hydration mismatch.
 */

const SIZES = {
  sm: { box: 36, text: 'text-xs' },
  md: { box: 44, text: 'text-sm' },
  lg: { box: 64, text: 'text-xl' },
} as const;

type LogoFields = Pick<Venue, 'name' | 'brand' | 'logoUrl' | 'logoWidth' | 'logoHeight'>;

function aspectOf(venue: LogoFields): number | null {
  if (!venue.logoWidth || !venue.logoHeight) return null;
  return venue.logoWidth / venue.logoHeight;
}

export default function VenueAvatar({
  venue,
  size = 'md',
}: {
  venue: LogoFields;
  size?: keyof typeof SIZES;
}) {
  const [failed, setFailed] = useState(false);
  const { box, text } = SIZES[size];
  const hue = brandHue(venue.brand);

  const aspect = aspectOf(venue);
  // No dimensions recorded means a hand-added logo; trust it.
  const fitsSquare = aspect === null || aspect <= AVATAR_MAX_ASPECT;
  const showImage = Boolean(venue.logoUrl) && fitsSquare && !failed;

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-2xl ring-1 ring-ink/10"
      style={{
        width: box,
        height: box,
        backgroundColor: showImage ? '#fff' : `hsl(${hue} 62% 94%)`,
      }}
    >
      {showImage ? (
        <Image
          src={venue.logoUrl as string}
          alt=""
          width={box}
          height={box}
          className="h-full w-full object-contain p-1"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          aria-hidden="true"
          className={`flex h-full w-full items-center justify-center font-black tracking-tight ${text}`}
          style={{ color: `hsl(${hue} 55% 34%)` }}
        >
          {brandInitials(venue.name)}
        </span>
      )}
    </div>
  );
}

/** The brand's real logo at its natural proportions. Renders nothing without one. */
export function VenueWordmark({ venue, height = 34 }: { venue: LogoFields; height?: number }) {
  const [failed, setFailed] = useState(false);
  if (!venue.logoUrl || failed) return null;

  const aspect = aspectOf(venue) ?? 1;
  const width = Math.round(height * aspect);

  return (
    <Image
      src={venue.logoUrl}
      alt={`${venue.brand} logo`}
      width={width}
      height={height}
      className="h-[34px] w-auto max-w-[170px] object-contain object-left"
      onError={() => setFailed(true)}
    />
  );
}
