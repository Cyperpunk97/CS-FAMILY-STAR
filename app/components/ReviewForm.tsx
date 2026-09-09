'use client';

import { useRef, useState } from 'react';
import { AlertCircle, ImagePlus, Loader2, X } from 'lucide-react';
import { StarsInput } from './Stars';
import { supabase } from '@/lib/supabaseClient';
import { formatBytes, prepareImage } from '@/lib/image';
import { LIMITS, type Review, type VenueWithStats } from '@/lib/types';

interface ReviewFormProps {
  venue: VenueWithStats;
  studentName: string;
  onNeedName: () => void;
  onSubmitted: (review: Review) => void;
}

/**
 * Inline review composer.
 *
 * Three behaviours that differ from the previous version:
 *  - Errors render in the form instead of `alert()`, so the text is readable,
 *    copyable, and does not block the page.
 *  - Its state is local to the component, and the sheet remounts it per venue with
 *    a `key`, so a half-typed comment can no longer leak into the next venue.
 *  - Photos are downscaled in the browser before upload.
 */
export default function ReviewForm({
  venue,
  studentName,
  onNeedName,
  onSubmitted,
}: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [price, setPrice] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [compressedNote, setCompressedNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearFile = () => {
    setFile(null);
    setCompressedNote('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!studentName) {
      onNeedName();
      return;
    }

    setSubmitting(true);
    let imageUrl: string | null = null;

    try {
      if (file) {
        const prepared = await prepareImage(file);

        // Random name: two students uploading "IMG_0001.jpg" must not collide.
        const unique = `${Date.now()}-${crypto.randomUUID()}`;
        const path = `reviews/${unique}.${prepared.extension}`;

        const { error: uploadError } = await supabase.storage
          .from('review-images')
          .upload(path, prepared.blob, {
            contentType: prepared.blob.type || 'image/webp',
            cacheControl: '31536000',
          });

        if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`);

        imageUrl = supabase.storage.from('review-images').getPublicUrl(path).data.publicUrl;
      }

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: venue.id,
          rating,
          comment,
          user_name: studentName,
          image_url: imageUrl,
          price_per_person: price === '' ? null : Number(price),
        }),
      });

      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          payload && typeof payload === 'object' && 'error' in payload
            ? String((payload as { error: unknown }).error)
            : `Could not save your review (${response.status}).`;
        throw new Error(message);
      }

      onSubmitted(payload as Review);

      setComment('');
      setPrice('');
      setRating(5);
      clearFile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      // Always clears, so a failed submit cannot leave the button stuck disabled.
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-surface p-4">
      <div>
        <p className="mb-2 text-xs font-bold text-ink">Your rating</p>
        <StarsInput value={rating} onChange={setRating} name={`rating-${venue.id}`} />
      </div>

      <div>
        <label htmlFor={`comment-${venue.id}`} className="mb-1.5 block text-xs font-bold text-ink">
          What did you order? <span className="font-medium text-ink-faint">(optional)</span>
        </label>
        <textarea
          id={`comment-${venue.id}`}
          rows={3}
          value={comment}
          maxLength={LIMITS.commentMax}
          onChange={(e) => setComment(e.target.value)}
          placeholder="The chicken sandwich was great, service was slow…"
          className="w-full resize-y rounded-xl border border-hairline bg-card p-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand-400"
        />
        <p className="mt-1 text-right text-xs text-ink-faint">
          {comment.length}/{LIMITS.commentMax}
        </p>
      </div>

      <div>
        <label htmlFor={`price-${venue.id}`} className="mb-1.5 block text-xs font-bold text-ink">
          How much did you spend per person?{' '}
          <span className="font-medium text-ink-faint">(optional, EGP)</span>
        </label>
        <input
          id={`price-${venue.id}`}
          type="number"
          inputMode="numeric"
          min={LIMITS.priceMin}
          max={LIMITS.priceMax}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="e.g. 85"
          className="w-full rounded-xl border border-hairline bg-card p-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand-400"
        />
        <p className="mt-1 text-xs text-ink-faint">
          This is what builds the average price other students see.
        </p>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-bold text-ink">
          Food photo <span className="font-medium text-ink-faint">(optional)</span>
        </p>
        <div className="flex items-center gap-2">
          <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-hairline bg-card px-3 py-2.5 transition hover:border-brand-200 hover:bg-brand-50 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600">
            <ImagePlus className="h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
            <span className="truncate text-xs font-medium text-ink-soft">
              {file ? file.name : 'Choose a photo…'}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                const picked = e.target.files?.[0] ?? null;
                setFile(picked);
                setError('');
                setCompressedNote(picked ? `${formatBytes(picked.size)} — will be compressed` : '');
              }}
              className="sr-only"
            />
          </label>
          {file && (
            <button
              type="button"
              onClick={clearFile}
              aria-label="Remove selected photo"
              className="rounded-xl p-2 text-ink-faint transition hover:bg-ink/5 hover:text-ink"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        {compressedNote && <p className="mt-1 text-xs text-ink-faint">{compressedNote}</p>}
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-900 ring-1 ring-red-200"
        >
          <AlertCircle className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Posting…
          </>
        ) : studentName ? (
          'Post review'
        ) : (
          'Add your name to post'
        )}
      </button>
    </form>
  );
}
