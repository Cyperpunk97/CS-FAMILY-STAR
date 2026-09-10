'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { Compass, RotateCw, SearchX, Star, Trophy, UserCheck, UserPlus } from 'lucide-react';
import AppNavigation from './AppNavigation';
import FacultyModal from './FacultyModal';
import FilterBar from './FilterBar';
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
import { formatRating, priceInfo } from '@/lib/format';
import { campusDistanceLabel, haversineMeters, mapsDirectionsUrl } from '@/lib/geo';
import { DEFAULT_FILTERS, filterVenues, sortVenues, type Filters, type SortKey } from '@/lib/filters';
import { LIMITS, type VenueWithStats } from '@/lib/types';

interface VenueListProps {
  initialVenues: VenueWithStats[];
}

/** Minimum reviews before a venue can be featured, so one 5-star rating cannot top the list. */
const SPOTLIGHT_MIN_REVIEWS = 2;

export default function VenueList({ initialVenues }: VenueListProps) {
  const [venues, setVenues] = useState(initialVenues);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortKey>('nearest');

  // The open sheet lives in the URL, so links are shareable and Back closes it.
  const [activeId, setActiveId] = useUrlParam('spot');

  const { faculty, setFacultyId } = useFaculty();
  const [facultyModalOpen, setFacultyModalOpen] = useState(false);

  const { name: studentName, setName } = useStudentName();
  const { favorites, toggle: toggleFavorite } = useFavorites();

  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  /**
   * Re-pull stats after a review is posted or when manually revalidated.
   *
   * Deliberately keeps the current list when the refresh fails. The previous
   * version called `setRestaurants([])` in its catch, so one flaky request wiped
   * the entire page.
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

  const saveName = (event: React.FormEvent) => {
    event.preventDefault();
    if (!nameDraft.trim()) return;
    setName(nameDraft);
    setNameModalOpen(false);
  };

  return (
    <>
      {/* Top Application Navigation Menu */}
      <div className="mb-4 flex items-center justify-between border-b border-hairline/60 pb-3">
        <AppNavigation />
        <Link
          href="/memories?new=true"
          className="inline-flex items-center gap-1 rounded-full bg-amber-100/80 px-3 py-1.5 text-xs font-bold text-amber-900 transition hover:bg-amber-200"
        >
          <span>Share outing</span>
          <span>📸</span>
        </Link>
      </div>

      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-[1.35rem] font-black tracking-tight text-brand-900">
            <Star className="h-5 w-5 shrink-0 fill-red-800 text-red-800" aria-hidden="true" />
            <span>CS Family Star</span>
          </h1>
          <p className="mt-0.5 text-xs text-ink-soft">
            Future University in Egypt · campus food guide
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={() => setFacultyModalOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-200/90 bg-brand-50/70 px-3 py-1.5 text-xs font-bold text-brand-900 shadow-2xs transition hover:bg-brand-100 hover:border-brand-300 active:scale-95"
            title="Choose your faculty building to get walking times tailored to you"
          >
            <Compass className="h-3.5 w-3.5 text-brand-700" aria-hidden="true" />
            <span className="text-ink-soft font-medium">From:</span>
            <span className="max-w-[8.5rem] truncate sm:max-w-none">{faculty.shortName}</span>
          </button>

          <button
            type="button"
            onClick={() => setLeaderboardOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-300/80 bg-amber-50/80 px-3 py-1.5 text-xs font-bold text-amber-900 shadow-sm transition hover:bg-amber-100 hover:border-amber-400 active:scale-95"
            title="View Top Campus Reviewers Leaderboard"
          >
            <Trophy className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
            <span className="inline">Ranks</span>
          </button>

          <button
            type="button"
            onClick={openNameModal}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-hairline bg-card px-3 py-1.5 text-xs font-bold text-ink-soft shadow-sm transition hover:border-brand-200 hover:text-brand-700 active:scale-95"
          >
            {studentName ? (
              <>
                <UserCheck className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                <span className="max-w-[7.5rem] truncate">{studentName}</span>
              </>
            ) : (
              <>
                <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                Add name
              </>
            )}
          </button>

          <button
            type="button"
            onClick={refreshVenues}
            disabled={isRevalidating}
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-hairline bg-card p-1.5 text-xs font-bold text-ink-soft shadow-sm transition hover:border-brand-200 hover:text-brand-700 active:scale-95 disabled:opacity-60"
            title="Refresh ratings & reviews"
            aria-label="Refresh ratings and reviews"
          >
            <RotateCw
              className={`h-3.5 w-3.5 ${isRevalidating ? 'animate-spin text-brand-600' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </header>

      {/*
        Sticky search and filters. The negative inset plus padding lets the blurred
        backdrop bleed to the page edges while the controls stay on the content grid.
      */}
      <div className="sticky top-0 z-30 -mx-4 border-b border-hairline/60 bg-surface/85 px-4 pb-2.5 pt-2 backdrop-blur-md sm:-mx-6 sm:px-6">
        <FilterBar
          filters={filters}
          sort={sort}
          resultCount={visible.length}
          totalCount={venues.length}
          onFiltersChange={setFilters}
          onSortChange={setSort}
          onReset={() => setFilters({ ...DEFAULT_FILTERS, query: filters.query })}
        />
      </div>

      {/* Spotlight — a calm way to surface what is actually good. */}
      {browsingAll && spotlight.length > 0 && (
        <section className="mt-4" aria-labelledby="spotlight-heading">
          <h2
            id="spotlight-heading"
            className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-faint"
          >
            <Star className="h-3.5 w-3.5 fill-star text-star" aria-hidden="true" />
            Top rated by students
          </h2>
          <ul className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
            {spotlight.map((venue) => (
              <li key={venue.id} className="w-44 shrink-0 snap-start">
                <button
                  type="button"
                  onClick={() => setActiveId(venue.id)}
                  className="flex h-full w-full flex-col items-start gap-2 rounded-2xl border border-hairline bg-card p-3 text-left transition duration-200 hover:border-brand-200 hover:shadow-md active:scale-[0.98]"
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
              Clear all filters
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
              Name or student ID
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
            Save
          </button>
        </form>
      </Modal>

      <LeaderboardModal
        isOpen={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
      />
    </>
  );
}
