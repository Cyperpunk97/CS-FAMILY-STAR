'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Laptop, X } from 'lucide-react';
import {
  STUDY_ATTRIBUTES,
  describeAttribute,
  summarizeAttributes,
  type AttributeTally,
  type StudyAttributeId,
} from '@/lib/studySpots';
import { createLocalStore, useLocalStore } from '../hooks/useLocalStore';
import { useTranslate } from '../hooks/useLocale';

/**
 * A random per-browser id used only to stop one person voting twice.
 *
 * Explicitly not an identity: it is never shown, never joined to a name, and
 * clearing storage mints a new one. That is an accepted weakness — the alternative
 * is accounts, which this app does not have.
 */
const voterStore = createLocalStore<string>({
  key: 'fue_voter_token',
  fallback: '',
  parse: (raw) => raw ?? '',
  serialize: (value) => value,
});

function ensureVoterToken(): string {
  const existing = voterStore.getSnapshot();
  if (existing.length >= 8) return existing;

  const token =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `v${Date.now()}${Math.random().toString(36).slice(2, 10)}`;

  voterStore.set(token);
  return token;
}

export default function StudySpotPanel({ venueId }: { venueId: string }) {
  const { t } = useTranslate();
  const [tallies, setTallies] = useState<AttributeTally[]>([]);
  const [myVotes, setMyVotes] = useState<Partial<Record<StudyAttributeId, boolean>>>({});
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState(false);

  // Read so the component re-renders once a token has been minted.
  useLocalStore(voterStore);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(
          `/api/attributes?venue_id=${encodeURIComponent(venueId)}`,
          { cache: 'no-store' }
        );

        if (!response.ok) {
          // 503 means the table has not been created yet. Hide the panel rather
          // than showing an error about database setup to a hungry student.
          if (!cancelled) setUnavailable(true);
          return;
        }

        const data = await response.json();
        if (!cancelled && Array.isArray(data)) setTallies(data);
      } catch {
        if (!cancelled) setUnavailable(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [venueId]);

  const vote = useCallback(
    async (attribute: StudyAttributeId, value: boolean) => {
      setError('');

      // Optimistic: one tap should feel instant. Reconciled below on failure.
      const previous = myVotes[attribute];
      setMyVotes((current) => ({ ...current, [attribute]: value }));

      try {
        const response = await fetch('/api/attributes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            venue_id: venueId,
            attribute,
            value,
            voter_token: ensureVoterToken(),
          }),
        });

        if (!response.ok) {
          setMyVotes((current) => ({ ...current, [attribute]: previous }));
          setError('Your vote could not be saved. Please try again.');
          return;
        }

        // Fold the vote into the displayed tally without a second round trip.
        setTallies((current) => {
          const existing = current.find((t) => t.attribute === attribute);
          const changingVote = previous !== undefined;

          if (!existing) {
            return [...current, { venueId, attribute, yesCount: value ? 1 : 0, totalCount: 1 }];
          }

          return current.map((t) =>
            t.attribute === attribute
              ? {
                  ...t,
                  yesCount: t.yesCount + (value ? 1 : 0) - (changingVote && previous ? 1 : 0),
                  totalCount: changingVote ? t.totalCount : t.totalCount + 1,
                }
              : t
          );
        });
      } catch {
        setMyVotes((current) => ({ ...current, [attribute]: previous }));
        setError('Your vote could not be saved. Please try again.');
      }
    },
    [venueId, myVotes]
  );

  if (unavailable) return null;

  const summaries = summarizeAttributes(tallies);

  return (
    <section className="mt-3 rounded-xl border border-hairline bg-card p-3" aria-label="Study spot">
      <h3 className="flex items-center gap-1.5 text-xs font-bold text-ink">
        <Laptop className="h-3.5 w-3.5" aria-hidden="true" />
        {t('study.title')}
      </h3>
      <p className="mt-0.5 text-xs text-ink-faint">
        {t('study.subtitle')}
      </p>

      <ul className="mt-2 space-y-1.5">
        {STUDY_ATTRIBUTES.map((definition) => {
          const summary = summaries.find((s) => s.attribute === definition.id);
          const description = summary ? describeAttribute(summary) : null;
          const mine = myVotes[definition.id];

          return (
            <li key={definition.id} className="flex items-center justify-between gap-2">
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-ink">
                  {definition.label}
                </span>
                <span className="block truncate text-xs text-ink-faint">
                  {description ?? 'No answers yet'}
                </span>
              </span>

              <span className="flex shrink-0 gap-1">
                <VoteButton
                  active={mine === true}
                  label={`Yes: ${definition.question}`}
                  onClick={() => vote(definition.id, true)}
                  tone="yes"
                />
                <VoteButton
                  active={mine === false}
                  label={`No: ${definition.question}`}
                  onClick={() => vote(definition.id, false)}
                  tone="no"
                />
              </span>
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-900">
          {error}
        </p>
      )}
    </section>
  );
}

function VoteButton({
  active,
  label,
  onClick,
  tone,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  tone: 'yes' | 'no';
}) {
  const Icon = tone === 'yes' ? Check : X;

  const activeClasses =
    tone === 'yes'
      ? 'bg-emerald-600 text-white ring-emerald-600'
      : 'bg-ink-soft text-white ring-ink-soft';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`rounded-lg p-1.5 ring-1 transition ${
        active ? activeClasses : 'bg-surface text-ink-soft ring-hairline hover:text-ink'
      }`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  );
}
