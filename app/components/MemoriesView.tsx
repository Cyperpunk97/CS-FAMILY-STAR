'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Heart,
  Calendar,
  MapPin,
  Camera,
  Share2,
  Search,
  Plus,
  ArrowRight,
  Smile,
  Check,
  RotateCw,
} from 'lucide-react';
import AppNavigation from './AppNavigation';
import AddMemoryModal from './AddMemoryModal';
import { Memory, MEMORY_MOODS, MemoryMood } from '@/lib/memories';
import { VENUES_BY_ID } from '@/lib/venues';

interface MemoriesViewProps {
  initialMemories: Memory[];
}

export default function MemoriesView({ initialMemories }: MemoriesViewProps) {
  const searchParams = useSearchParams();
  const spotFilter = searchParams.get('spot');
  const initialOpenNew = searchParams.get('new') === 'true';

  const [memories, setMemories] = useState<Memory[]>(initialMemories);
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenNew);
  const [cheeredIds, setCheeredIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('fue_cheered_memories');
        if (stored) {
          return new Set(JSON.parse(stored));
        }
      } catch {
        // Ignore storage errors
      }
    }
    return new Set();
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshMemories = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/memories');
      if (res.ok) {
        const data: Memory[] = await res.json();
        setMemories(data);
      }
    } catch (err) {
      console.error('Failed to refresh memories:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCheer = async (memoryId: string) => {
    // Optimistic UI update
    const isCheered = cheeredIds.has(memoryId);
    const newCheered = new Set(cheeredIds);

    if (isCheered) {
      newCheered.delete(memoryId);
      setMemories((prev) =>
        prev.map((m) => (m.id === memoryId ? { ...m, cheersCount: Math.max(0, m.cheersCount - 1) } : m))
      );
    } else {
      newCheered.add(memoryId);
      setMemories((prev) =>
        prev.map((m) => (m.id === memoryId ? { ...m, cheersCount: m.cheersCount + 1 } : m))
      );
    }

    setCheeredIds(newCheered);
    try {
      localStorage.setItem('fue_cheered_memories', JSON.stringify(Array.from(newCheered)));
    } catch {
      // Ignore storage error
    }

    // Call server cheer endpoint only when liking
    if (!isCheered) {
      try {
        await fetch(`/api/memories/${encodeURIComponent(memoryId)}/cheer`, { method: 'POST' });
      } catch (err) {
        console.warn('Cheer request error:', err);
      }
    }
  };

  const handleCopyLink = async (memoryId: string) => {
    try {
      const url = new URL(window.location.origin + '/memories');
      url.searchParams.set('mem', memoryId);
      const shareUrl = url.toString();

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const el = document.createElement('textarea');
        el.value = shareUrl;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }

      setCopiedId(memoryId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy memory link:', err);
    }
  };

  const filteredMemories = useMemo(() => {
    return memories.filter((m) => {
      // Mood filter
      if (selectedMood !== 'all' && m.mood !== selectedMood) {
        return false;
      }
      // Spot query param
      if (spotFilter && m.venueId !== spotFilter) {
        return false;
      }
      // Search text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchVenue = m.venueName.toLowerCase().includes(q);
        const matchAuthor = m.authorName.toLowerCase().includes(q);
        const matchStory = m.story.toLowerCase().includes(q);
        const matchTag = m.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchVenue && !matchAuthor && !matchStory && !matchTag) {
          return false;
        }
      }
      return true;
    });
  }, [memories, selectedMood, spotFilter, searchQuery]);

  const totalCheers = useMemo(() => {
    return memories.reduce((sum, m) => sum + (m.cheersCount || 0), 0);
  }, [memories]);

  return (
    <div className="flex flex-1 flex-col">
      {/* Top Application Navigation Menu */}
      <div className="mb-6 flex items-center justify-between gap-3 border-b border-amber-200/50 pb-4">
        <AppNavigation memoriesCount={memories.length} />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshMemories}
            disabled={isRefreshing}
            className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50/60 p-2 text-xs font-semibold text-amber-900 shadow-2xs transition hover:bg-amber-100 disabled:opacity-50"
            title="Refresh memories"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-amber-700' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-amber-500/20 transition hover:brightness-105 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            <span>Add Memory</span>
          </button>
        </div>
      </div>

      {/* Warm & Happy Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-100/70 via-orange-50/60 to-yellow-100/50 p-6 shadow-sm">
        {/* Playful decorative sunshine glows */}
        <div className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full bg-amber-300/30 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-36 w-36 rounded-full bg-orange-300/20 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/80 px-3 py-1 text-[11px] font-extrabold text-amber-950">
              <Sparkles className="h-3 w-3 text-amber-700 animate-pulse" />
              <span>FUE Student Scrapbook</span>
            </div>

            <h1 className="mt-2 text-2xl font-black tracking-tight text-amber-950 sm:text-3xl">
              Outing Memories 📸✨
            </h1>

            <p className="mt-1.5 text-xs leading-relaxed text-amber-900/80 sm:text-sm">
              Where did we go out? The post-exam celebrations, 2 AM shawarma runs, and golden-hour laughs
              between lectures. Share the moments that made campus life unforgettable.
            </p>

            <div className="mt-3 flex items-center gap-4 text-xs font-bold text-amber-900">
              <span className="flex items-center gap-1">
                <Smile className="h-4 w-4 text-amber-600" />
                <span>
                  {memories.length} {memories.length === 1 ? 'Memory' : 'Memories'} Logged
                </span>
              </span>
              <span className="h-3 w-px bg-amber-300" />
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4 fill-amber-500 text-amber-500" />
                <span>{totalCheers} Cheers & Smiles</span>
              </span>
            </div>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-amber-500/30 transition hover:brightness-105 active:scale-95 sm:w-auto"
            >
              <Camera className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span>Share Our Memory</span>
              <Sparkles className="h-3.5 w-3.5 text-amber-200" />
            </button>
          </div>
        </div>
      </section>

      {/* Search & Vibe Filters */}
      <div className="mt-6 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-amber-700/60" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories by spot, friend, story, or tag..."
            className="w-full rounded-2xl border border-amber-200/80 bg-card py-2.5 pl-10 pr-4 text-xs text-ink placeholder:text-ink-faint shadow-2xs focus:border-amber-500 focus:bg-white focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 rounded-full p-1 text-xs text-ink-faint hover:text-ink"
            >
              ✕
            </button>
          )}
        </div>

        {/* Vibe filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedMood('all')}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              selectedMood === 'all'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'border border-amber-200/80 bg-amber-50/50 text-amber-950 hover:bg-amber-100/70'
            }`}
          >
            All Vibes ☀️
          </button>

          {(Object.keys(MEMORY_MOODS) as MemoryMood[]).map((mKey) => {
            const m = MEMORY_MOODS[mKey];
            const isSelected = selectedMood === mKey;
            return (
              <button
                key={mKey}
                type="button"
                onClick={() => setSelectedMood(mKey)}
                className={`flex shrink-0 items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  isSelected
                    ? `${m.bgClass} ${m.textClass} ring-2 ring-amber-400 font-extrabold shadow-xs`
                    : 'border border-amber-200/70 bg-card text-ink-soft hover:bg-amber-50/50 hover:text-ink'
                }`}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Spot filter banner if linked from a venue */}
      {spotFilter && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-300 bg-amber-100/60 px-3.5 py-2 text-xs text-amber-950">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-amber-700 shrink-0" />
            <span>
              Showing memories for spot: <strong>{VENUES_BY_ID.get(spotFilter)?.name || spotFilter}</strong>
            </span>
          </div>
          <Link href="/memories" className="font-bold underline hover:text-amber-800">
            Show all spots
          </Link>
        </div>
      )}

      {/* Memories Polaroid Grid */}
      <div className="mt-6">
        {filteredMemories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-amber-300/80 bg-amber-50/40 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
              ☀️
            </div>
            <h3 className="mt-3 text-base font-bold text-amber-950">No memories found for this filter</h3>
            <p className="mt-1 text-xs text-amber-900/70">
              Be the first to share an outing memory here! Every late-night dessert or post-exam coffee counts.
            </p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Share an Outing Memory</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {filteredMemories.map((memory, index) => {
              const moodInfo = MEMORY_MOODS[memory.mood] || MEMORY_MOODS.celebration;
              const isCheered = cheeredIds.has(memory.id);
              const isCopied = copiedId === memory.id;

              // Subtle playful tilt for that scrapbook warmth
              const tiltClass =
                index % 3 === 0
                  ? 'hover:-rotate-0.5'
                  : index % 3 === 1
                  ? 'hover:rotate-0.5'
                  : 'hover:rotate-0';

              return (
                <article
                  key={memory.id}
                  id={`memory-${memory.id}`}
                  className={`group relative flex flex-col rounded-2xl border border-amber-200/80 bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md ${tiltClass}`}
                >
                  {/* Charming Washi Tape decorative element */}
                  <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 h-3.5 w-16 -rotate-1 rounded-xs bg-amber-200/60 shadow-2xs backdrop-blur-xs border border-amber-300/40" />

                  {/* Top Bar: Mood badge & Date */}
                  <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${moodInfo.bgClass} ${moodInfo.textClass}`}
                    >
                      <span>{moodInfo.emoji}</span>
                      <span>{moodInfo.label}</span>
                    </span>

                    <span className="flex items-center gap-1 text-[11px] font-medium text-ink-faint">
                      <Calendar className="h-3 w-3" />
                      <span>{memory.date}</span>
                    </span>
                  </div>

                  {/* Photo / Polaroid Container */}
                  {memory.photoUrl ? (
                    <div className="mt-3 overflow-hidden rounded-xl border-4 border-white bg-amber-50 shadow-inner">
                      <div className="relative aspect-[16/10] w-full overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={memory.photoUrl}
                          alt={memory.photoCaption || memory.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
                        />
                      </div>
                      {memory.photoCaption && (
                        <p className="bg-amber-50/90 px-2 py-1 text-center font-mono text-[10px] text-amber-900/80 italic">
                          {memory.photoCaption}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 flex aspect-[16/6] w-full items-center justify-center rounded-xl border border-dashed border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/50 p-3 text-center">
                      <span className="text-xl">✨</span>
                      <p className="ml-2 font-serif text-xs italic text-amber-900/70">
                        &ldquo;{memory.title}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Title & Outing Location */}
                  <div className="mt-3">
                    <h2 className="text-base font-bold text-ink group-hover:text-amber-950">
                      {memory.title}
                    </h2>

                    {/* Venue tag with direct link to Food Guide if attached */}
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-800 font-semibold">
                      <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span>{memory.venueName}</span>

                      {memory.venueId && (
                        <Link
                          href={`/?spot=${encodeURIComponent(memory.venueId)}`}
                          className="ml-auto inline-flex items-center gap-0.5 rounded-md bg-amber-100/60 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 hover:bg-amber-200 transition"
                          title="View this restaurant in Food Guide"
                        >
                          <span>Guide</span>
                          <ArrowRight className="h-2.5 w-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Story */}
                  <p className="mt-2.5 text-xs leading-relaxed text-ink-soft">
                    {memory.story}
                  </p>

                  {/* Tags */}
                  {memory.tags && memory.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {memory.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium text-ink-faint"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer: Author info & Interactive Cheers */}
                  <div className="mt-4 flex items-center justify-between border-t border-hairline/60 pt-3 text-xs">
                    <div className="flex flex-col">
                      <span className="font-bold text-ink text-[11px]">{memory.authorName}</span>
                      {memory.faculty && (
                        <span className="text-[10px] text-ink-faint">{memory.faculty}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Share link button */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(memory.id)}
                        className="relative rounded-lg p-1.5 text-ink-faint hover:bg-amber-50 hover:text-amber-800 transition"
                        title="Copy link to memory"
                      >
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600 animate-pop" />
                        ) : (
                          <Share2 className="h-3.5 w-3.5" />
                        )}
                        {isCopied && (
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-ink px-1 py-0.5 text-[9px] font-bold text-white shadow-xs">
                            Copied!
                          </span>
                        )}
                      </button>

                      {/* Cheer button */}
                      <button
                        type="button"
                        onClick={() => handleCheer(memory.id)}
                        aria-label="Cheer this memory"
                        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition ${
                          isCheered
                            ? 'bg-rose-100 text-rose-700 shadow-2xs'
                            : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                        }`}
                      >
                        <Heart
                          className={`h-3.5 w-3.5 transition-transform ${
                            isCheered ? 'fill-rose-500 text-rose-500 scale-110 animate-pop' : 'text-amber-600'
                          }`}
                        />
                        <span>{memory.cheersCount}</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Memory Modal */}
      {isAddModalOpen && (
        <AddMemoryModal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onMemoryAdded={(newMem) => {
            setMemories((prev) => [newMem, ...prev]);
          }}
          preselectedVenueId={spotFilter || undefined}
          preselectedVenueName={spotFilter ? VENUES_BY_ID.get(spotFilter)?.name : undefined}
        />
      )}
    </div>
  );
}
