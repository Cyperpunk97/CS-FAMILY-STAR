'use client';

import { useMemo, useState } from 'react';
import {
  Check,
  Download,
  Flame,
  GraduationCap,
  Leaf,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import Modal from './Modal';
import VenueAvatar from './VenueLogo';
import { useRestaurantMenu } from '../hooks/useRestaurantMenu';
import type { RestaurantMenu, VenueWithStats } from '@/lib/types';
import { formatMenuPrice } from '@/lib/format';

interface MenuModalProps {
  venue: VenueWithStats;
  open: boolean;
  onClose: () => void;
}

const POPULAR_TALABAT_BRANDS = [
  'Costa Coffee',
  'Cilantro',
  'Starbucks',
  "McDonald's",
  'KFC',
  "Papa John's",
  "Hardee's",
  'Pizza Hut',
  'Buffalo Burger',
  'TBS',
  'Koshary El Tahrir',
  'Dunkin',
  'Cinnabon',
  'Bazooka',
  "Willy's Kitchen",
  'Zooba',
  'El Dahan',
  'Paul',
];

export default function MenuModal({ venue, open, onClose }: MenuModalProps) {
  const { menu, saveMenu, addMenuItem, deleteMenuItem, resetToDefault } = useRestaurantMenu(
    venue.id,
    venue.name
  );

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Talabat Extractor state
  const [showTalabatExtractor, setShowTalabatExtractor] = useState(false);
  const [talabatInput, setTalabatInput] = useState(venue.brand || venue.name);
  const [isExtracting, setIsExtracting] = useState(false);
  const [talabatError, setTalabatError] = useState<string | null>(null);
  const [extractedPreview, setExtractedPreview] = useState<RestaurantMenu | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Add Item form state
  const [itemName, setItemName] = useState('');
  const [itemNameAr, setItemNameAr] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [isStudentDeal, setIsStudentDeal] = useState(false);
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isSpicy, setIsSpicy] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const categories = useMemo(() => {
    return ['All', ...menu.categories];
  }, [menu.categories]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return menu.items.filter((item) => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      if (q) {
        const matchName = item.name.toLowerCase().includes(q);
        const matchNameAr = item.nameAr ? item.nameAr.toLowerCase().includes(q) : false;
        const matchDesc = item.description ? item.description.toLowerCase().includes(q) : false;
        const matchCat = item.category.toLowerCase().includes(q);
        return matchName || matchNameAr || matchDesc || matchCat;
      }
      return true;
    });
  }, [menu.items, selectedCategory, searchQuery]);

  const handleExtractTalabat = async (targetQuery?: string) => {
    const queryToUse = (targetQuery || talabatInput).trim();
    if (!queryToUse) return;

    setIsExtracting(true);
    setTalabatError(null);
    setExtractedPreview(null);
    setSyncSuccessMsg(null);

    try {
      const isUrl =
        queryToUse.startsWith('http://') ||
        queryToUse.startsWith('https://') ||
        queryToUse.includes('talabat.com');

      const endpoint = isUrl
        ? `/api/talabat/extract?url=${encodeURIComponent(queryToUse)}&venueId=${encodeURIComponent(
            venue.id
          )}`
        : `/api/talabat/extract?name=${encodeURIComponent(queryToUse)}&venueId=${encodeURIComponent(
            venue.id
          )}`;

      const res = await fetch(endpoint);
      const data = await res.json();

      if (data.success && data.menu) {
        setExtractedPreview(data.menu);
      } else {
        setTalabatError(
          data.error || 'Could not find a menu for this brand on Talabat. Try another name.'
        );
      }
    } catch (err) {
      setTalabatError(err instanceof Error ? err.message : 'Error extracting from Talabat.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApplyExtractedMenu = () => {
    if (!extractedPreview) return;
    saveMenu(extractedPreview);
    setSyncSuccessMsg(`Applied ${extractedPreview.items.length} dishes from Talabat Egypt!`);
    setExtractedPreview(null);
    setShowTalabatExtractor(false);
    setTimeout(() => setSyncSuccessMsg(null), 4000);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(itemPrice);
    if (!itemName.trim() || isNaN(priceNum) || priceNum <= 0) return;

    const finalCategory =
      itemCategory === '__new__'
        ? customCategory.trim() || 'General'
        : itemCategory || menu.categories[0] || 'General';

    addMenuItem({
      name: itemName.trim(),
      nameAr: itemNameAr.trim() || undefined,
      category: finalCategory,
      price: priceNum,
      description: itemDescription.trim() || undefined,
      isPopular,
      isStudentDeal,
      isVegetarian,
      isSpicy,
    });

    // Reset form
    setItemName('');
    setItemNameAr('');
    setItemPrice('');
    setItemDescription('');
    setIsPopular(false);
    setIsStudentDeal(false);
    setIsVegetarian(false);
    setIsSpicy(false);
    setShowAddForm(false);
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 3000);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${venue.name} Menu`}
      subtitle={venue.isOnCampus ? `On-Campus · ${venue.vicinity}` : venue.vicinity}
      size="lg"
      variant="sheet"
      bareHeader
    >
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        {/* Header - Pinned */}
        <div className="shrink-0 border-b border-hairline bg-surface/80 backdrop-blur-sm px-5 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <VenueAvatar venue={venue} size="sm" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm sm:text-base font-extrabold text-ink">{venue.name}</h3>
                  <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                    Menu
                  </span>
                </div>
                <p className="truncate text-xs text-ink-soft">
                  {menu.items.length} items · Prices in {menu.currency}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="-mr-1 shrink-0 rounded-xl p-2 text-ink-faint transition hover:bg-ink/5 hover:text-ink"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Action Bar inside Menu */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[160px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes, drinks..."
                className="w-full rounded-xl border border-hairline bg-card py-1.5 pl-8 pr-3 text-xs text-ink placeholder:text-ink-faint focus:border-brand-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowTalabatExtractor(!showTalabatExtractor);
                setShowAddForm(false);
              }}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-xs ${
                showTalabatExtractor
                  ? 'bg-amber-600 text-white shadow-amber-600/20'
                  : 'bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100/70'
              }`}
              title="Extract real prices and menu from Talabat Egypt"
            >
              <Download className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Sync Talabat</span>
              <span className="text-[10px] bg-amber-200/70 text-amber-900 px-1 py-0.2 rounded">🇪🇬</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAddForm(!showAddForm);
                setShowTalabatExtractor(false);
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-brand-700 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              {showAddForm ? 'Cancel' : 'Add Dish'}
            </button>

            <button
              type="button"
              onClick={resetToDefault}
              title="Reset menu to default"
              className="shrink-0 rounded-xl border border-hairline bg-card p-1.5 text-ink-soft hover:bg-surface hover:text-ink"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Category Tabs */}
          <div className="no-scrollbar -mx-5 mt-2.5 flex items-center gap-1.5 overflow-x-auto px-5">
            {categories.map((cat) => {
              const count =
                cat === 'All'
                  ? menu.items.length
                  : menu.items.filter((i) => i.category === cat).length;
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-ink text-white shadow-xs'
                      : 'bg-card text-ink-soft hover:bg-surface hover:text-ink border border-hairline/60'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-surface text-ink-soft'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body - Scrolling */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 pb-12">
          {syncSuccessMsg && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 border border-emerald-200 shadow-xs">
              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              {syncSuccessMsg}
            </div>
          )}

          {addSuccess && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 border border-emerald-200">
              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              Dish successfully added to the menu!
            </div>
          )}

          {/* Talabat Extractor Panel */}
          {showTalabatExtractor && (
            <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50/50 p-4 shadow-xs">
              <div className="mb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white font-black text-xs shadow-xs">
                    T
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                      <span>Extract Real Menu from Talabat.com Egypt</span>
                      <span className="rounded bg-amber-200/80 px-1 py-0.2 text-[10px] font-bold text-amber-900">
                        Live Data
                      </span>
                    </h4>
                    <p className="text-[11px] text-amber-800/80">
                      Sync real items, categories, and EGP prices directly by brand name or URL.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTalabatExtractor(false)}
                  className="rounded-lg p-1 text-amber-800 hover:bg-amber-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Extraction Input Form */}
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={talabatInput}
                    onChange={(e) => setTalabatInput(e.target.value)}
                    placeholder="Enter brand name (e.g. Costa Coffee) or Talabat URL"
                    className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-amber-500 focus:outline-none shadow-xs"
                    disabled={isExtracting}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleExtractTalabat()}
                  disabled={isExtracting || !talabatInput.trim()}
                  className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-amber-700 disabled:opacity-50"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Extracting...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      <span>Extract Menu</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Brand Selector Chips */}
              <div className="mt-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900/70 mb-1.5">
                  Or select popular Egyptian branch:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_TALABAT_BRANDS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => {
                        setTalabatInput(b);
                        handleExtractTalabat(b);
                      }}
                      className={`rounded-lg px-2 py-0.5 text-[11px] font-medium transition ${
                        talabatInput.toLowerCase() === b.toLowerCase()
                          ? 'bg-amber-700 text-white font-bold'
                          : 'bg-white border border-amber-200/90 text-amber-950 hover:bg-amber-100/60'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Display */}
              {talabatError && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  <p className="font-bold">Extraction Notice</p>
                  <p className="mt-0.5 text-[11px]">{talabatError}</p>
                </div>
              )}

              {/* Extracted Preview & Apply */}
              {extractedPreview && (
                <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50/70 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-extrabold text-emerald-900">
                          Found {extractedPreview.items.length} items across {extractedPreview.categories.length} categories!
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-emerald-800">
                        Categories: {extractedPreview.categories.slice(0, 4).join(', ')}
                        {extractedPreview.categories.length > 4 ? ` + ${extractedPreview.categories.length - 4} more` : ''}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyExtractedMenu}
                      className="shrink-0 flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Apply to Venue Menu
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Verified Talabat Badge Banner */}
          {menu.note?.toLowerCase().includes('talabat') && !showTalabatExtractor && (
            <div className="mb-3 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-1.5 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold">Talabat.com Egypt</span>
                <span className="text-amber-800 text-[11px]">· Live Verified Menu ({menu.items.length} dishes)</span>
              </div>
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                EGP
              </span>
            </div>
          )}

          {/* Provide / Add Dish Form Panel */}
          {showAddForm && (
            <form
              onSubmit={handleAddItem}
              className="mb-5 rounded-2xl border border-brand-200 bg-brand-50/40 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="flex items-center gap-1.5 text-xs font-extrabold text-brand-900">
                  <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                  Provide New Menu Item for {venue.name}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-ink-soft hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-ink-soft">
                    Dish / Item Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Crispy Chicken Wrap"
                    className="mt-1 w-full rounded-xl border border-hairline bg-white px-3 py-1.5 text-xs text-ink focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink-soft">
                    Arabic Name (Optional)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={itemNameAr}
                    onChange={(e) => setItemNameAr(e.target.value)}
                    placeholder="مثال: راب دجاج مقرمش"
                    className="mt-1 w-full rounded-xl border border-hairline bg-white px-3 py-1.5 text-xs text-ink focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink-soft">Price in EGP *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="e.g. 95"
                    className="mt-1 w-full rounded-xl border border-hairline bg-white px-3 py-1.5 text-xs text-ink focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink-soft">Category *</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-hairline bg-white px-3 py-1.5 text-xs text-ink focus:border-brand-500 focus:outline-none"
                  >
                    <option value="">Select category...</option>
                    {menu.categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__new__">+ Create new category...</option>
                  </select>
                </div>

                {itemCategory === '__new__' && (
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-ink-soft">
                      New Category Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g. Combo Meals, Fresh Juices"
                      className="mt-1 w-full rounded-xl border border-hairline bg-white px-3 py-1.5 text-xs text-ink focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-ink-soft">
                    Description & Ingredients
                  </label>
                  <input
                    type="text"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="Brief ingredients, sides included, size options..."
                    className="mt-1 w-full rounded-xl border border-hairline bg-white px-3 py-1.5 text-xs text-ink focus:border-brand-500 focus:outline-none"
                  />
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-3 sm:col-span-2 pt-1">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isStudentDeal}
                      onChange={(e) => setIsStudentDeal(e.target.checked)}
                      className="rounded border-hairline text-brand-600 focus:ring-brand-500"
                    />
                    <GraduationCap className="h-3.5 w-3.5 text-brand-600" />
                    Student Deal
                  </label>

                  <label className="flex items-center gap-1.5 text-xs font-semibold text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPopular}
                      onChange={(e) => setIsPopular(e.target.checked)}
                      className="rounded border-hairline text-amber-600 focus:ring-amber-500"
                    />
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    Bestseller
                  </label>

                  <label className="flex items-center gap-1.5 text-xs font-semibold text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVegetarian}
                      onChange={(e) => setIsVegetarian(e.target.checked)}
                      className="rounded border-hairline text-emerald-600 focus:ring-emerald-500"
                    />
                    <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                    Vegetarian
                  </label>

                  <label className="flex items-center gap-1.5 text-xs font-semibold text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSpicy}
                      onChange={(e) => setIsSpicy(e.target.checked)}
                      className="rounded border-hairline text-red-600 focus:ring-red-500"
                    />
                    <Flame className="h-3.5 w-3.5 text-red-500" />
                    Spicy
                  </label>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-xl border border-hairline bg-white px-3 py-1.5 text-xs font-bold text-ink-soft hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 rounded-xl bg-brand-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Save Dish to Menu
                </button>
              </div>
            </form>
          )}

          {/* Items Grid */}
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center">
              <UtensilsCrossed className="mx-auto h-8 w-8 text-ink-faint" />
              <p className="mt-2 text-sm font-bold text-ink">No menu items found</p>
              <p className="mt-1 text-xs text-ink-soft">
                Try searching for another dish or click &ldquo;Provide / Add Dish&rdquo; above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-hairline bg-card p-3.5 transition hover:border-brand-200 hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-start gap-3">
                      {item.imageUrl && (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-hairline bg-surface/50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h4 className="font-bold text-ink text-sm leading-tight">{item.name}</h4>
                              {item.nameAr && (
                                <span className="text-xs font-semibold text-ink-soft" dir="rtl">
                                  ({item.nameAr})
                                </span>
                              )}
                            </div>

                            {item.description && (
                              <p className="mt-1 text-xs leading-relaxed text-ink-soft line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 text-right">
                            <span
                              className={
                                item.price === null
                                  ? 'text-xs font-bold text-ink-soft'
                                  : 'text-sm font-extrabold text-brand-700'
                              }
                            >
                              {formatMenuPrice(item.price, menu.currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Badges & Tags */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                      <span className="rounded-md bg-surface px-1.5 py-0.5 text-ink-soft">
                        {item.category}
                      </span>

                      {item.isStudentDeal && (
                        <span className="flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-brand-700 border border-brand-200/60">
                          <GraduationCap className="h-3 w-3" />
                          Student Deal
                        </span>
                      )}

                      {item.isPopular && (
                        <span className="flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-amber-700 border border-amber-200/60">
                          <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                          Popular
                        </span>
                      )}

                      {item.isVegetarian && (
                        <span className="flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-emerald-700 border border-emerald-200/60">
                          <Leaf className="h-2.5 w-2.5" />
                          Veg
                        </span>
                      )}

                      {item.isSpicy && (
                        <span className="flex items-center gap-0.5 rounded-md bg-red-50 px-1.5 py-0.5 text-red-700 border border-red-200/60">
                          <Flame className="h-2.5 w-2.5" />
                          Spicy
                        </span>
                      )}
                    </div>
                  </div>

                  {item.id.startsWith('custom-') && (
                    <div className="mt-2 flex items-center justify-end border-t border-hairline/60 pt-2">
                      <button
                        type="button"
                        onClick={() => deleteMenuItem(item.id)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove item
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer Note */}
          <div className="mt-6 rounded-xl border border-hairline bg-surface/60 p-3 text-center text-xs text-ink-soft">
            <p className="font-semibold text-ink">
              {venue.isOnCampus ? '🎓 Future University in Egypt (FUE) On-Campus Menu' : '🍽️ Menu & Pricing Guide'}
            </p>
            <p className="mt-0.5 text-[11px]">
              Want to update or add new items? Click the &ldquo;Add Dish&rdquo; button above to submit your menu edits.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
