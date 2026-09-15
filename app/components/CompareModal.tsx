'use client';

import { useMemo, useState } from 'react';
import { Check, Minus } from 'lucide-react';
import Modal from './Modal';
import { compareVenues, overallVerdict, type Winner } from '@/lib/compare';
import type { VenueWithStats } from '@/lib/types';
import { useTranslate } from '../hooks/useLocale';

interface CompareModalProps {
  open: boolean;
  onClose: () => void;
  venues: VenueWithStats[];
  /** Pre-selects the spot the user was already looking at, when there is one. */
  initialVenueId?: string | null;
}

/**
 * Side-by-side comparison of two spots.
 *
 * Native `<select>` elements rather than a custom dropdown: on a phone they open the
 * OS picker, which is scrollable, searchable by keyboard, and already accessible.
 * A hand-rolled listbox of 53 options would be worse in every one of those ways.
 */
export default function CompareModal({
  open,
  onClose,
  venues,
  initialVenueId,
}: CompareModalProps) {
  const { t } = useTranslate();
  const sorted = useMemo(
    () => [...venues].sort((a, b) => a.name.localeCompare(b.name)),
    [venues]
  );

  const [leftId, setLeftId] = useState(() => initialVenueId ?? sorted[0]?.id ?? '');
  const [rightId, setRightId] = useState(() => sorted.find((v) => v.id !== initialVenueId)?.id ?? '');

  const left = sorted.find((v) => v.id === leftId);
  const right = sorted.find((v) => v.id === rightId);

  const rows = useMemo(() => (left && right ? compareVenues(left, right) : []), [left, right]);
  const verdict = left && right ? overallVerdict(rows, left, right) : null;

  const sameSpot = leftId !== '' && leftId === rightId;

  return (
    <Modal open={open} onClose={onClose} title={t('compare.title')} size="lg" variant="sheet">
      <div className="px-5 pb-5">
        <div className="grid grid-cols-2 gap-2">
          <VenuePicker label={t('compare.first')} value={leftId} onChange={setLeftId} venues={sorted} />
          <VenuePicker label={t('compare.second')} value={rightId} onChange={setRightId} venues={sorted} />
        </div>

        {sameSpot ? (
          <p className="mt-4 rounded-xl bg-surface p-3 text-xs text-ink-soft">
            {t('compare.pickTwo')}
          </p>
        ) : (
          left &&
          right && (
            <>
              <table className="mt-4 w-full table-fixed border-collapse text-xs">
                <caption className="sr-only">
                  Comparison of {left.name} and {right.name}
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="w-[22%] pb-2 text-start text-[11px] font-bold text-ink-faint">
                      <span className="sr-only">Attribute</span>
                    </th>
                    <th scope="col" className="pb-2 text-start text-[11px] font-bold text-ink">
                      <span className="line-clamp-2">{left.name}</span>
                    </th>
                    <th scope="col" className="pb-2 text-start text-[11px] font-bold text-ink">
                      <span className="line-clamp-2">{right.name}</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {rows.map((row) => (
                    <tr key={row.label} className="align-top">
                      <th scope="row" className="py-2 pe-2 text-start text-[11px] font-medium text-ink-faint">
                        {row.label}
                      </th>
                      <ComparisonCell value={row.a} winner={row.winner} side="a" />
                      <ComparisonCell value={row.b} winner={row.winner} side="b" />
                    </tr>
                  ))}
                </tbody>
              </table>

              {/*
                Notes explain every row that could not be judged. Without them a tie
                reads as "these are equal" rather than "we cannot honestly say".
              */}
              {rows.some((row) => row.note) && (
                <ul className="mt-3 space-y-1">
                  {rows
                    .filter((row) => row.note)
                    .map((row) => (
                      <li key={row.label} className="flex gap-1.5 text-[11px] text-ink-faint">
                        <Minus className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                        <span>
                          <span className="font-medium">{row.label}:</span> {row.note}
                        </span>
                      </li>
                    ))}
                </ul>
              )}

              {verdict && (
                <p className="mt-3 rounded-xl bg-surface p-3 text-xs font-medium text-ink">
                  {verdict}
                </p>
              )}
            </>
          )
        )}
      </div>
    </Modal>
  );
}

function VenuePicker({
  label,
  value,
  onChange,
  venues,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  venues: VenueWithStats[];
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11px] font-bold text-ink-faint">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        // min-h-11 keeps it a comfortable tap target; text-base stops iOS zooming in.
        className="min-h-11 w-full truncate rounded-xl border border-hairline bg-surface px-2 text-sm font-medium text-ink focus:border-brand-700 focus:outline-none"
      >
        {venues.map((venue) => (
          <option key={venue.id} value={venue.id}>
            {venue.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function ComparisonCell({
  value,
  winner,
  side,
}: {
  value: string;
  winner: Winner;
  side: 'a' | 'b';
}) {
  const wins = winner === side;

  return (
    <td className={`py-2 pe-2 text-xs ${wins ? 'font-bold text-ink' : 'text-ink-soft'}`}>
      <span className="flex items-start gap-1">
        {wins && <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" aria-hidden="true" />}
        <span className="min-w-0 break-words">{value}</span>
      </span>
      {wins && <span className="sr-only">(better)</span>}
    </td>
  );
}
