'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Compass, RotateCw, SearchX, Star, UserCheck, UserPlus } from 'lucide-react';
import AppNavigation from './AppNavigation';
import FacultyModal from './FacultyModal';
import FilterBar from './FilterBar';
import FueInfoModal from './FueInfoModal';
import LeaderboardModal from './LeaderboardModal';
import Modal from './Modal';
import ScrollTopButton from './ScrollTopButton';
import VenueCard from './VenueCard';
import { VenueListSkeleton } from './VenueListSkeleton';
import VenueAvatar from './VenueLogo';
import VenueSheet from './VenueSheet';
import { useFaculty } from '../hooks/useFaculty';
import { useFavorites } from '../hooks/useFavorites';
import { useStudentName } from '../hooks/useStudentName';
import { useUrlParam } from '../hooks/useUrlParam';
import { pickSurprise } from '@/lib/surprise';
import DishResults from './DishResults';
import CompareModal from './CompareModal';
import { formatRating, priceInfo } from '@/lib/format';
import { campusDistanceLabel, haversineMeters, mapsDirectionsUrl } from '@/lib/geo';
import { DEFAULT_FILTERS, filterVenues, sortVenues, type Filters, type SortKey } from '@/lib/filters';
import { LIMITS, type VenueWithStats } from '@/lib/types';
import { useTranslate } from '../hooks/useLocale';

interface VenueListProps {
  initialVenues: VenueWithStats[];
}

/** Minimum reviews before a venue can be featured, so one 5-star rating cannot top the list. */
const SPOTLIGHT_MIN_REVIEWS = 2;

export default function VenueList({ initialVenues }: VenueListProps) {
  const { t } = useTranslate();
  const [venues, setVenues] = useState(initialVenues);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>('nearest');

  // The open sheet lives in the URL, so links are shareable and Back closes it.
  const [activeId, setActiveId] = useUrlParam('spot');
  const [compareOpen, setCompareOpen] = useState(false);
  const [surpriseAnnouncement, setSurpriseAnnouncement] = useState('');
  // Only ever feeds the next click, so a ref avoids re-rendering the whole list.
  const lastSurpriseId = useRef<string | null>(null);

  const { faculty, setFacultyId } = useFaculty();
  const [facultyModalOpen, setFacultyModalOpen] = useState(false);

  const { name: studentName, setName } = useStudentName();
  const { favorites, toggle: toggleFavorite } = useFavorites();

  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [fueInfoOpen, setFueInfoOpen] = useState(false);

  /**
   * Re-pull stats after a review is posted or when manually revalidated.
   */
  const refreshVenues = useCallback(async () => {
    setIsRevalidating(true);
    try {
      const response = await fetch('/api/restaurants');
      if (!response.ok) throw new Error(`Request failed (${response.status})`);

      const data: unknown = await response.json();
      if (Array.isArray(data) && data.length > 0) setVenues(data as VenueWithStats[]);
    } catch (err) {
      console.error('Could not refresh ratings, keeping the current list:', err);
    } finally {
      setIsRevalidating(false);
    }
  }, []);

  /**
   * Recalculate distances and routing links based on the student's selected faculty building.
   */
  const enrichedVenues = useMemo(() => {
    return venues.map((venue) => {
      const dist = haversineMeters(faculty, venue);
      return {
        ...venue,
        distanceMeters: dist,
        directionsUrl: mapsDirectionsUrl(venue, faculty),
      };
    });
  }, [venues, faculty]);

  const visible = useMemo(
    () => sortVenues(filterVenues(enrichedVenues, filters, favorites), sort),
    [enrichedVenues, filters, favorites, sort]
  );

  /** Top-rated spots, shown only while browsing unfiltered. */
  const spotlight = useMemo(
    () =>
      enrichedVenues
        .filter((v) => v.reviewCount >= SPOTLIGHT_MIN_REVIEWS && v.averageRating >= 4)
        .sort((a, b) => b.averageRating - a.averageRating || b.reviewCount - a.reviewCount)
        .slice(0, 8),
    [enrichedVenues]
  );

  const browsingAll =
    filters.query === '' &&
    filters.category === 'All' &&
    filters.priceTiers.length === 0 &&
    filters.minRating === 0 &&
    !filters.walkableOnly &&
    !filters.favoritesOnly;

  // Derived from the id so an open sheet picks up refreshed stats automatically.
  const activeVenue = useMemo(
    () => enrichedVenues.find((v) => v.id === activeId) ?? null,
    [enrichedVenues, activeId]
  );

  const openNameModal = useCallback(() => {
    setNameDraft(studentName);
    setNameModalOpen(true);
  }, [studentName]);

  /**
   * Picks a random spot from what is currently on screen.
   */
  const handleSurprise = useCallback(() => {
    const picked = pickSurprise(visible, lastSurpriseId.current);
    if (!picked) return;

    lastSurpriseId.current = picked.id;
    setSurpriseAnnouncement(`Picked ${picked.name}.`);
    setActiveId(picked.id);
  }, [visible, setActiveId]);

  const saveName = (event: React.FormEvent) => {
    event.preventDefault();
    if (!nameDraft.trim()) return;
    setName(nameDraft);
    setNameModalOpen(false);
  };

  return (
    <>
      {/* Top Application Navigation Bar */}
      <div className="mb-4">
        <AppNavigation onOpenLeaderboard={() => setLeaderboardOpen(true)} />
      </div>

      <header className="mb-4 space-y-2.5">
        {/* Row 1: Brand & User Profile / Refresh */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-900 ring-1 ring-brand-200/60 shadow-2xs">
              <Star className="h-4 w-4 fill-red-800 text-red-800" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-brand-900 leading-tight truncate">
                CS Family Star
              </h1>
              <p className="text-[11px] sm:text-xs text-ink-soft truncate">
                <span className="font-semibold text-brand-900">FUE Campus</span> · Food Guide &amp; Ratings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={openNameModal}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-hairline bg-card px-2.5 text-xs font-bold text-ink-soft shadow-2xs transition hover:border-brand-200 hover:text-brand-700 active:scale-95"
            >
              {studentName ? (
                <>
                  <UserCheck className="h-3.5 w-3.5 text-brand-600 shrink-0" aria-hidden="true" />
                  <span className="max-w-[5.5rem] truncate sm:max-w-[7.5rem]">{studentName}</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{t('name.add')}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={refreshVenues}
              disabled={isRevalidating}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-hairline bg-card text-ink-soft shadow-2xs transition hover:border-brand-200 hover:text-brand-700 active:scale-95 disabled:opacity-60"
              title="Refresh ratings & reviews"
              aria-label="Refresh ratings and reviews"
            >
              <RotateCw
                className={`h-3.5 w-3.5 ${isRevalidating ? 'animate-spin text-brand-600' : ''}`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* Row 2: Origin Faculty selector + About FUE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Walking Origin Selector */}
          <button
            type="button"
            onClick={() => setFacultyModalOpen(true)}
            className="inline-flex h-9 items-center justify-between rounded-xl border border-brand-200/90 bg-brand-50/80 px-3 text-xs font-bold text-brand-900 shadow-2xs transition hover:bg-brand-100 hover:border-brand-300 active:scale-[0.98]"
            title="Choose your faculty building to get walking times tailored to you"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Compass className="h-3.5 w-3.5 text-brand-700 shrink-0" aria-hidden="true" />
              <span className="text-ink-soft font-normal">From:</span>
              <span className="truncate font-bold">{faculty.shortName}</span>
            </div>
            <span className="text-brand-600 text-[11px] font-bold ms-1 shrink-0">Change ›</span>
          </button>

          {/* About FUE */}
          <button
            type="button"
            onClick={() => setFueInfoOpen(true)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#0b2545]/20 bg-white px-2.5 text-xs font-bold text-[#0b2545] shadow-2xs transition hover:bg-[#0b2545]/5 active:scale-[0.98]"
            title="About Future University in Egypt (FUE)"
          >
            <Image
              src="/logos/fue-logo.png"
              alt="FUE Crest"
              width={14}
              height={17}
              className="h-3.5 w-auto object-contain"
            />
            <span className="font-extrabold text-[#0b2545] truncate">About FUE</span>
          </button>
        </div>
      </header>

      {/*
        Sticky search and filters. The negative inset plus padding lets the blurred
        backdrop bleed to the page edges while the controls stay on the content grid.
      */}
      <div className="sticky top-0 z-30 -mx-4 border-b border-hairline/60 bg-surface/90 px-4 pb-2.5 pt-2 backdrop-blur-md sm:-mx-6 sm:px-6">
        <FilterBar
          filters={filters}
          sort={sort}
          resultCount={visible.length}
          totalCount={venues.length}
          onFiltersChange={setFilters}
          onSortChange={setSort}
          onReset={() => setFilters({ ...DEFAULT_FILTERS, query: filters.query })}
          onSurprise={handleSurprise}
          surpriseDisabled={visible.length === 0}
          onCompare={() => setCompareOpen(true)}
          compareDisabled={visible.length < 2}
        />

        {/*
          Opening the sheet moves focus into a dialog, so without this a screen
          reader would never hear which spot the dice chose.
        */}
        <p role="status" aria-live="polite" className="sr-only">
          {surpriseAnnouncement}
        </p>
      </div>

      {/*
        Dishes matching the same search box that filters the venue list.
      */}
      <DishResults query={filters.query} venues={enrichedVenues} onOpenVenue={setActiveId} />

      <CompareModal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        venues={enrichedVenues}
        initialVenueId={activeId}
      />

      {/* Spotlight — a calm way to surface what is actually good. */}
      {browsingAll && spotlight.length > 0 && (
        <section className="mt-4" aria-labelledby="spotlight-heading">
          <h2
            id="spotlight-heading"
            className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-faint"
          >
            <Star className="h-3.5 w-3.5 fill-star text-star" aria-hidden="true" />
            {t('list.topRated')}
          </h2>
          <ul className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
            {spotlight.map((venue) => (
              <li key={venue.id} className="w-44 shrink-0 snap-start">
                <button
                  type="button"
                  onClick={() => setActiveId(venue.id)}
                  className="flex h-full w-full flex-col items-start gap-2 rounded-2xl border border-hairline bg-card p-3 text-start transition duration-200 hover:border-brand-200 hover:shadow-md active:scale-[0.98]"
                >
                  <VenueAvatar venue={venue} size="sm" />
                  <span className="line-clamp-2 text-xs font-bold leading-snug text-ink">
                    {venue.name}
                  </span>
                  <span className="mt-auto flex items-center gap-1 text-xs font-bold text-ink">
                    <Star className="h-3 w-3 fill-star text-star" aria-hidden="true" />
                    {formatRating(venue.averageRating)}
                    <span className="font-medium text-ink-faint">
                      · {campusDistanceLabel(venue.distanceMeters, venue.coordSource)}
                    </span>
                  </span>
                  <span className="sr-only">
                    {venue.reviewCount} reviews, {priceInfo(venue).text} per person
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isRevalidating && venues.length > 0 && (
        <div
          className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-brand-200/80 bg-brand-50/70 px-3 py-1.5 text-xs font-semibold text-brand-900 animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
          </span>
          <span>Refreshing latest ratings & reviews...</span>
        </div>
      )}

      <div className="mt-4 space-y-2.5">
        {venues.length === 0 ? (
          <VenueListSkeleton count={7} />
        ) : visible.length === 0 ? (
          <div className="animate-rise rounded-2xl border border-hairline bg-card p-10 text-center">
            <SearchX className="mx-auto h-8 w-8 text-ink-faint" aria-hidden="true" />
            <p className="mt-3 text-sm font-bold text-ink">No spots match these filters</p>
            <p className="mt-1 text-xs text-ink-soft">
              Try a different search, or clear the filters to see all {venues.length} spots.
            </p>
            <button
              type="button"
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="mt-4 rounded-full bg-brand-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-800 active:scale-95"
            >
              {t('filter.clearAll')}
            </button>
          </div>
        ) : (
          visible.map((venue, index) => (
            <VenueCard
              key={venue.id}
              venue={venue}
              index={index}
              isFavorite={favorites.has(venue.id)}
              onOpen={(v) => setActiveId(v.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))
        )}
      </div>

      <ScrollTopButton />

      {/* `key` remounts per venue, so review state never leaks between spots. */}
      {activeVenue && (
        <VenueSheet
          key={activeVenue.id}
          venue={activeVenue}
          studentName={studentName}
          isFavorite={favorites.has(activeVenue.id)}
          faculty={faculty}
          onClose={() => setActiveId(null)}
          onNeedName={openNameModal}
          onToggleFavorite={toggleFavorite}
          onReviewPosted={refreshVenues}
          onChangeFaculty={() => setFacultyModalOpen(true)}
        />
      )}

      <FacultyModal
        isOpen={facultyModalOpen}
        onClose={() => setFacultyModalOpen(false)}
        selectedFacultyId={faculty.id}
        onSelectFaculty={setFacultyId}
      />

      <Modal
        open={nameModalOpen}
        onClose={() => setNameModalOpen(false)}
        title="Your name"
        subtitle="Shown next to the reviews you post."
        size="sm"
      >
        <form onSubmit={saveName} className="space-y-4 p-5">
          <div>
            <label htmlFor="student-name" className="mb-1.5 block text-xs font-bold text-ink">
              {t('name.placeholder')}
            </label>
            <input
              id="student-name"
              type="text"
              required
              maxLength={LIMITS.userNameMax}
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="e.g. Omar CS, Youssef 2023049"
              className="w-full rounded-xl border border-hairline bg-card p-3 text-sm text-ink placeholder:text-ink-faint focus:border-brand-400"
            />
            <p className="mt-1.5 text-xs text-ink-faint">
              Stored only in this browser. It is shown publicly on your reviews, so use
              a name you are happy for other students to see.
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-brand-700 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800 active:scale-[0.98]"
          >
            {t('common.save')}
          </button>
        </form>
      </Modal>

      <LeaderboardModal
        isOpen={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
      />

      <FueInfoModal
        open={fueInfoOpen}
        onClose={() => setFueInfoOpen(false)}
        onSelectFaculty={setFacultyId}
      />
    </>
  );
}
