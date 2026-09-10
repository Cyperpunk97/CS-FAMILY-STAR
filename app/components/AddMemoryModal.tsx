'use client';

import { useState, useId, useRef } from 'react';
import { Camera, Calendar, MapPin, Sparkles, User, X, Upload } from 'lucide-react';
import Modal from './Modal';
import { MEMORY_MOODS, Memory, MemoryMood } from '@/lib/memories';
import { VENUES } from '@/lib/venues';
import { FUE_FACULTIES } from '@/lib/geo';

interface AddMemoryModalProps {
  open: boolean;
  onClose: () => void;
  onMemoryAdded: (memory: Memory) => void;
  preselectedVenueId?: string;
  preselectedVenueName?: string;
}

export default function AddMemoryModal({
  open,
  onClose,
  onMemoryAdded,
  preselectedVenueId,
  preselectedVenueName,
}: AddMemoryModalProps) {
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [selectedVenueId, setSelectedVenueId] = useState(preselectedVenueId || '');
  const [customVenue, setCustomVenue] = useState(preselectedVenueName || '');
  const [authorName, setAuthorName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fue_user_name') || '';
    }
    return '';
  });
  const [faculty, setFaculty] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('fue_selected_faculty') || 'fcit-cs';
    }
    return 'fcit-cs';
  });
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState<MemoryMood>('laughing_fit');
  const [story, setStory] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Outing']);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Quick venue selection helpers
  const handleVenueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vId = e.target.value;
    setSelectedVenueId(vId);
    if (vId) {
      const found = VENUES.find((v) => v.id === vId);
      if (found) {
        setCustomVenue(found.name);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please choose a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
        setErrorMessage('');
      }
    };
    reader.readAsDataURL(file);
  };

  const addTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean) && tags.length < 5) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const finalVenueName = customVenue.trim() || (selectedVenueId ? VENUES.find((v) => v.id === selectedVenueId)?.name : '');

    if (!title.trim() || title.trim().length < 3) {
      setErrorMessage('Please give your outing memory a title');
      return;
    }
    if (!finalVenueName) {
      setErrorMessage('Where did you go? Please select or enter a spot name.');
      return;
    }
    if (!authorName.trim()) {
      setErrorMessage('Please enter who was there (your name or group name)');
      return;
    }
    if (!story.trim() || story.trim().length < 5) {
      setErrorMessage('Please write a brief sentence or story about this outing');
      return;
    }

    // Persist author name locally for convenience
    if (typeof window !== 'undefined') {
      localStorage.setItem('fue_user_name', authorName.trim());
    }

    const facultyObj = FUE_FACULTIES.find((f) => f.id === faculty);
    const facultyName = facultyObj?.name || faculty;

    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        venueName: finalVenueName,
        venueId: selectedVenueId || undefined,
        authorName: authorName.trim(),
        faculty: facultyName,
        date: date || new Date().toISOString().split('T')[0],
        story: story.trim(),
        mood,
        photoUrl: photoUrl || undefined,
        photoCaption: photoCaption.trim() || undefined,
        tags,
      };

      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save memory');
      }

      const created: Memory = await res.json();
      onMemoryAdded(created);
      onClose();

      // Reset form
      setTitle('');
      setStory('');
      setPhotoUrl('');
      setPhotoCaption('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save memory');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Share an Outing Memory ✨"
      subtitle="Capture your laughs, celebrations, and late-night campus food runs with fellow students."
      variant="dialog"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-800 animate-fade-in"
          >
            {errorMessage}
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor={`${formId}-title`} className="block text-xs font-bold text-ink">
            Memory Title or Headline <span className="text-amber-600">*</span>
          </label>
          <input
            id={`${formId}-title`}
            type="text"
            required
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Post-Finals feast at Chili's with the team! 🎉"
            className="mt-1 w-full rounded-xl border border-hairline bg-surface px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-amber-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Venue / Spot selection */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${formId}-venue-select`} className="block text-xs font-bold text-ink">
              Choose Campus Spot <span className="text-ink-faint font-normal">(optional)</span>
            </label>
            <div className="relative mt-1">
              <select
                id={`${formId}-venue-select`}
                value={selectedVenueId}
                onChange={handleVenueChange}
                className="w-full appearance-none rounded-xl border border-hairline bg-surface px-3 py-2 text-xs text-ink focus:border-amber-500 focus:bg-white focus:outline-none"
              >
                <option value="">-- Pick from 100+ FUE spots --</option>
                {VENUES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.vicinity})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor={`${formId}-custom-venue`} className="block text-xs font-bold text-ink">
              Where did you go? <span className="text-amber-600">*</span>
            </label>
            <div className="relative mt-1">
              <MapPin className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-amber-600" />
              <input
                id={`${formId}-custom-venue`}
                type="text"
                required
                maxLength={80}
                value={customVenue}
                onChange={(e) => setCustomVenue(e.target.value)}
                placeholder="e.g. Point 90 Mall, Concord Plaza, Cilantro..."
                className="w-full rounded-xl border border-hairline bg-surface pl-8 pr-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Who was there, Faculty & Date */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label htmlFor={`${formId}-author`} className="block text-xs font-bold text-ink">
              Who was there? <span className="text-amber-600">*</span>
            </label>
            <div className="relative mt-1">
              <User className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-ink-faint" />
              <input
                id={`${formId}-author`}
                type="text"
                required
                maxLength={50}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Youssef & CS Crew"
                className="w-full rounded-xl border border-hairline bg-surface pl-8 pr-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="sm:col-span-1">
            <label htmlFor={`${formId}-faculty`} className="block text-xs font-bold text-ink">
              Faculty / Department
            </label>
            <div className="relative mt-1">
              <select
                id={`${formId}-faculty`}
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                className="w-full appearance-none rounded-xl border border-hairline bg-surface px-3 py-2 text-xs text-ink focus:border-amber-500 focus:bg-white focus:outline-none"
              >
                {FUE_FACULTIES.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="sm:col-span-1">
            <label htmlFor={`${formId}-date`} className="block text-xs font-bold text-ink">
              Date of Outing
            </label>
            <div className="relative mt-1">
              <Calendar className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-ink-faint" />
              <input
                id={`${formId}-date`}
                type="date"
                value={date}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-hairline bg-surface pl-8 pr-3 py-2 text-xs text-ink focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Mood / Vibe Picker */}
        <div>
          <span className="block text-xs font-bold text-ink">
            Outing Vibe / Mood <span className="text-amber-600">*</span>
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(Object.keys(MEMORY_MOODS) as MemoryMood[]).map((mKey) => {
              const m = MEMORY_MOODS[mKey];
              const isSelected = mood === mKey;
              return (
                <button
                  key={mKey}
                  type="button"
                  onClick={() => setMood(mKey)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    isSelected
                      ? `${m.bgClass} ${m.textClass} ring-2 ring-amber-400 font-bold shadow-xs scale-102`
                      : 'border border-hairline bg-surface text-ink-soft hover:bg-card hover:text-ink'
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* The Story */}
        <div>
          <label htmlFor={`${formId}-story`} className="block text-xs font-bold text-ink">
            The Story / Memorable Moment <span className="text-amber-600">*</span>
          </label>
          <textarea
            id={`${formId}-story`}
            required
            rows={3}
            maxLength={1000}
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="What made this outing special? The inside joke, the delicious dish you ordered, or laughing till closing time..."
            className="mt-1 w-full rounded-xl border border-hairline bg-surface px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-amber-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Photo Upload */}
        <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5 text-amber-600" />
              <span>Add a Photo (Polaroid Snapshot)</span>
            </span>
          </div>

          {photoUrl ? (
            <div className="mt-2.5 flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 border-white shadow-md bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt="Memory preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="absolute right-0.5 top-0.5 rounded-full bg-ink/70 p-0.5 text-white hover:bg-ink"
                  title="Remove photo"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  maxLength={60}
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  placeholder="Optional photo caption (e.g. table laughs ✨)"
                  className="w-full rounded-lg border border-hairline bg-white px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-amber-300 bg-white/70 py-3 transition hover:bg-white"
              >
                <Upload className="h-5 w-5 text-amber-600 mb-1" />
                <span className="text-xs font-bold text-amber-950">Click to upload your outing photo</span>
                <span className="text-[10px] text-ink-faint">PNG, JPG or WebP up to 5MB</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Or paste an image URL directly (optional)"
                className="w-full rounded-lg border border-hairline bg-white px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:border-amber-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label htmlFor={`${formId}-tags`} className="block text-xs font-bold text-ink">
            Tags <span className="text-ink-faint font-normal">(press Enter to add)</span>
          </label>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md bg-amber-100/70 px-2 py-0.5 text-[11px] font-semibold text-amber-900"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-amber-700 hover:text-amber-950"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            {tags.length < 5 && (
              <div className="flex items-center gap-1">
                <input
                  id={`${formId}-tags`}
                  type="text"
                  maxLength={20}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add tag..."
                  className="w-24 rounded-md border border-hairline bg-surface px-2 py-0.5 text-[11px] text-ink focus:border-amber-500 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                  className="rounded-md bg-amber-200/80 px-2 py-0.5 text-[11px] font-bold text-amber-900 disabled:opacity-40"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-bold text-ink-soft hover:bg-surface-sunken"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/25 transition hover:brightness-105 active:scale-98 disabled:opacity-60"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isSubmitting ? 'Sharing Memory...' : 'Post Outing Memory 📸'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
