/**
 * Bilingual support (English / Egyptian Arabic).
 *
 * Two rules shape this file.
 *
 * First, a missing translation falls back to English rather than rendering a raw
 * key. A student who switches to Arabic and hits an untranslated screen should see
 * usable English, not `venue.sheet.callButton`.
 *
 * Second, nothing here guesses at Arabic content. UI chrome is translated because we
 * wrote it; venue names, dish names and student reviews are user or vendor data and
 * are shown as authored. `MenuItem.nameAr` is displayed when it exists and simply
 * omitted when it does not — the same principle that keeps `phone: null` rather than
 * inventing a number.
 */

export const LOCALES = ['en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Writing direction. Drives the `dir` attribute and Tailwind's logical properties. */
export function directionOf(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
};

/**
 * The English catalog is the source of truth: its keys define what may be
 * translated, so a typo in a key is a compile error rather than a silent fallback.
 */
const en = {
  'app.name': 'CS Family Star',
  'app.tagline': 'FUE campus food guide',
  'app.skipToContent': 'Skip to content',

  'nav.venues': 'Food spots',
  'nav.memories': 'Memories',
  'nav.leaderboard': 'Top reviewers',
  'nav.language': 'Language',

  'filter.searchPlaceholder': 'Search cafes, restaurants, dishes…',
  'filter.all': 'All',
  'filter.cafe': 'Cafe',
  'filter.restaurant': 'Restaurant',
  'filter.fastFood': 'Fast Food',
  'filter.walkableOnly': 'Walking distance only',
  'filter.onCampusOnly': 'On campus only',
  'filter.favoritesOnly': 'Favourites only',
  'filter.openNowOnly': 'Open now',
  'filter.minRating': 'Minimum rating',
  'filter.anyPrice': 'Any price',
  'filter.clear': 'Clear filters',
  'filter.resultCount': '{count} spots',

  'sort.label': 'Sort by',
  'sort.nearest': 'Nearest to campus',
  'sort.rating': 'Top rated',
  'sort.reviews': 'Most reviewed',
  'sort.cheapest': 'Cheapest first',
  'sort.priciest': 'Most expensive',
  'sort.name': 'Name (A–Z)',

  'venue.call': 'Call',
  'venue.menu': 'Menu',
  'venue.directions': 'Directions',
  'venue.onCampus': 'On campus',
  'venue.approximateLocation': 'Approximate location',
  'venue.noReviews': 'No reviews yet',
  'venue.reviewCount': '{count} reviews',
  'venue.reviewCountOne': '1 review',
  'venue.signatureDish': 'Signature dish',
  'venue.onCampusShort': 'On-Campus',
  'venue.new': 'New',
  'venue.mustTry': 'Must-try',
  'venue.copied': 'Copied!',
  'venue.change': 'Change',
  'venue.perPerson': 'Per person',
  'venue.viewMenu': 'View Menu',
  'venue.mustTryDishes': 'Must-Try Dishes & Student Picks',
  'venue.openInMaps': 'Open in Google Maps',
  'venue.showMap': 'Show map preview',
  'venue.ratingBreakdown': 'Rating breakdown',
  'venue.rateThis': 'Rate this spot',
  'venue.studentReviews': 'Student reviews',
  'venue.phone': 'Phone',
  'compare.title': 'Compare two spots',
  'compare.pickTwo': 'Pick two different spots to compare them.',
  'compare.first': 'First spot',
  'compare.second': 'Second spot',

  'price.approx': 'approx.',
  'price.fromStudents': 'from {count} students',
  'price.fromOneStudent': 'from 1 student',
  'price.askInStore': 'Ask in store',

  'review.write': 'Write a review',
  'review.rating': 'Your rating',
  'review.comment': 'Your review',
  'review.pricePerPerson': 'How much did you spend per person?',
  'review.recommendedDish': 'What should people order?',
  'review.addPhoto': 'Add a photo',
  'review.submit': 'Post review',
  'review.submitting': 'Posting…',
  'review.photoFailed': 'Your photo could not be uploaded, so the review was posted without it.',

  'search.dishTitle': 'Find a dish',
  'search.dishPlaceholder': 'Koshary, latte, burger…',
  'search.budgetLabel': 'Max price per dish',
  'search.noResults': 'No dishes matched.',
  'search.surprise': 'Surprise me — pick a spot at random',
  'search.resultsAt': 'at {venue}',

  'common.close': 'Close',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.retry': 'Try again',
  'common.loading': 'Loading…',
  'menu.dishAdded': "Dish successfully added to the menu!",
  'menu.liveData': "Live Data",
  'menu.applyToVenue': "Apply to Venue Menu",
  'menu.arabicName': "Arabic Name (Optional)",
  'menu.description': "Description & Ingredients",
  'menu.studentDeal': "Student Deal",
  'menu.bestseller': "Bestseller",
  'menu.vegetarian': "Vegetarian",
  'menu.spicy': "Spicy",
  'menu.saveDish': "Save Dish to Menu",
  'menu.popular': "Popular",
  'menu.likelyVeg': "Likely veg",
  'menu.removeItem': "Remove item",
  'fue.est': "Est. 2006",
  'fue.qs': "QS 5 Stars Rated",
  'fue.accredited': "Accredited",
  'fue.name': "Future University in Egypt",
  'fue.about': "About FUE",
  'fue.intro': "Introducing Future University in Egypt",
  'fue.sixFaculties': "Future University’s Six Faculties",
  'fue.staff': "Future University in Egypt Staff",
  'fue.staff1': "Staff trained in top international universities",
  'fue.staff2': "Dedicated faculty research centers & labs",
  'fue.staff3': "Nurturing talent from orientation to graduation",
  'fue.campusLife': "Campus Life & CS Family Star Food Guide",
  'fue.address': "End of 90th Street North, New Cairo, Egypt",
  'study.title': "Can you work here?",
  'study.subtitle': "Answered by students. Tap to add yours.",
  'review.priceHelp': "This is what builds the average price other students see.",
  'leaderboard.title': "FUE Food Critics Hall",
  'leaderboard.subtitle': "Top active student reviewers ranking & badge tiers",
  'memories.showAll': "Show all spots",
  'faculty.title': "Your Faculty Building",
  'faculty.subtitle': "Get tailored walking times from your lectures",
  'memories.faculty': "Faculty / Department",
  'memories.date': "Date of Outing",
  'name.add': "Add name",
  'list.topRated': "Top rated by students",
  'filter.clearAll': "Clear all filters",
  'name.placeholder': "Name or student ID",
  'filter.searchLabel': "Search spots by name, food, or location",
  'filter.title': "Filters",
  'common.metres': '{count} m',
  'common.kilometres': '{count} km',
} as const;

export type MessageKey = keyof typeof en;

/**
 * Arabic catalog. Deliberately `Partial` — anything missing falls back to English,
 * so this can be filled in over time without ever showing a broken screen.
 */
const ar: Partial<Record<MessageKey, string>> = {
  'app.name': 'نجمة عائلة الحاسبات',
  'app.tagline': 'دليل أكل حرم جامعة المستقبل',
  'app.skipToContent': 'تخطَّ إلى المحتوى',

  'nav.venues': 'أماكن الأكل',
  'nav.memories': 'ذكريات',
  'nav.leaderboard': 'أفضل المقيّمين',
  'nav.language': 'اللغة',

  'filter.searchPlaceholder': 'ابحث عن كافيه أو مطعم أو طبق…',
  'filter.all': 'الكل',
  'filter.cafe': 'كافيه',
  'filter.restaurant': 'مطعم',
  'filter.fastFood': 'وجبات سريعة',
  'filter.walkableOnly': 'على مسافة مشي فقط',
  'filter.onCampusOnly': 'داخل الحرم فقط',
  'filter.favoritesOnly': 'المفضلة فقط',
  'filter.openNowOnly': 'مفتوح الآن',
  'filter.minRating': 'أقل تقييم',
  'filter.anyPrice': 'أي سعر',
  'filter.clear': 'مسح الفلاتر',
  'filter.resultCount': '{count} مكان',

  'sort.label': 'ترتيب حسب',
  'sort.nearest': 'الأقرب للحرم',
  'sort.rating': 'الأعلى تقييمًا',
  'sort.reviews': 'الأكثر تقييمًا',
  'sort.cheapest': 'الأرخص أولًا',
  'sort.priciest': 'الأغلى أولًا',
  'sort.name': 'الاسم (أ–ي)',

  'venue.call': 'اتصال',
  'venue.menu': 'المنيو',
  'venue.directions': 'الاتجاهات',
  'venue.onCampus': 'داخل الحرم',
  'venue.approximateLocation': 'موقع تقريبي',
  'venue.noReviews': 'لا توجد تقييمات بعد',
  'venue.reviewCount': '{count} تقييم',
  'venue.reviewCountOne': 'تقييم واحد',
  'venue.signatureDish': 'الطبق المميز',
  'venue.onCampusShort': 'داخل الحرم',
  'venue.new': 'جديد',
  'venue.mustTry': 'لازم تجربه',
  'venue.copied': 'تم النسخ!',
  'venue.change': 'تغيير',
  'venue.perPerson': 'للفرد',
  'venue.viewMenu': 'عرض المنيو',
  'venue.mustTryDishes': 'أطباق لازم تجربها واختيارات الطلاب',
  'venue.openInMaps': 'افتح في خرائط جوجل',
  'venue.showMap': 'عرض الخريطة',
  'venue.ratingBreakdown': 'تفصيل التقييمات',
  'venue.rateThis': 'قيّم هذا المكان',
  'venue.studentReviews': 'تقييمات الطلاب',
  'venue.phone': 'هاتف',
  'compare.title': 'قارن بين مكانين',
  'compare.pickTwo': 'اختر مكانين مختلفين للمقارنة.',
  'compare.first': 'المكان الأول',
  'compare.second': 'المكان الثاني',

  'price.approx': 'تقريبًا',
  'price.fromStudents': 'من {count} طالب',
  'price.fromOneStudent': 'من طالب واحد',
  'price.askInStore': 'اسأل في المحل',

  'review.write': 'اكتب تقييمًا',
  'review.rating': 'تقييمك',
  'review.comment': 'رأيك',
  'review.pricePerPerson': 'كم دفعت للفرد؟',
  'review.recommendedDish': 'بماذا تنصح؟',
  'review.addPhoto': 'أضف صورة',
  'review.submit': 'انشر التقييم',
  'review.submitting': 'جارٍ النشر…',
  'review.photoFailed': 'تعذّر رفع الصورة، وتم نشر التقييم بدونها.',

  'search.dishTitle': 'ابحث عن طبق',
  'search.dishPlaceholder': 'كشري، لاتيه، برجر…',
  'search.budgetLabel': 'أقصى سعر للطبق',
  'search.noResults': 'لا توجد أطباق مطابقة.',
  'search.surprise': 'فاجئني — اختر مكانًا عشوائيًا',
  'search.resultsAt': 'في {venue}',

  'common.close': 'إغلاق',
  'common.cancel': 'إلغاء',
  'common.save': 'حفظ',
  'common.retry': 'حاول مرة أخرى',
  'common.loading': 'جارٍ التحميل…',
  'menu.dishAdded': "تمت إضافة الطبق إلى المنيو!",
  'menu.liveData': "بيانات مباشرة",
  'menu.applyToVenue': "تطبيق على منيو المكان",
  'menu.arabicName': "الاسم بالعربية (اختياري)",
  'menu.description': "الوصف والمكونات",
  'menu.studentDeal': "عرض للطلاب",
  'menu.bestseller': "الأكثر مبيعًا",
  'menu.vegetarian': "نباتي",
  'menu.spicy': "حار",
  'menu.saveDish': "احفظ الطبق في المنيو",
  'menu.popular': "شائع",
  'menu.likelyVeg': "نباتي على الأرجح",
  'menu.removeItem': "حذف العنصر",
  'fue.est': "تأسست ٢٠٠٦",
  'fue.qs': "تصنيف QS خمس نجوم",
  'fue.accredited': "معتمدة",
  'fue.name': "جامعة المستقبل في مصر",
  'fue.about': "عن الجامعة",
  'fue.intro': "تعريف بجامعة المستقبل في مصر",
  'fue.sixFaculties': "كليات جامعة المستقبل الست",
  'fue.staff': "هيئة التدريس بجامعة المستقبل",
  'fue.staff1': "أعضاء هيئة تدريس تدربوا في أفضل الجامعات العالمية",
  'fue.staff2': "مراكز بحثية ومعامل متخصصة لكل كلية",
  'fue.staff3': "رعاية المواهب من الالتحاق حتى التخرج",
  'fue.campusLife': "الحياة الجامعية ودليل الأكل",
  'fue.address': "نهاية شارع التسعين الشمالي، القاهرة الجديدة، مصر",
  'study.title': "تقدر تذاكر هنا؟",
  'study.subtitle': "إجابات الطلاب. اضغط لتضيف رأيك.",
  'review.priceHelp': "هذا ما يبني متوسط السعر الذي يراه بقية الطلاب.",
  'leaderboard.title': "قاعة نقّاد الأكل",
  'leaderboard.subtitle': "ترتيب أنشط المقيّمين ومستويات الشارات",
  'memories.showAll': "عرض كل الأماكن",
  'faculty.title': "مبنى كليتك",
  'faculty.subtitle': "احسب وقت المشي من محاضراتك",
  'memories.faculty': "الكلية / القسم",
  'memories.date': "تاريخ الخروجة",
  'name.add': "أضف اسمك",
  'list.topRated': "الأعلى تقييمًا من الطلاب",
  'filter.clearAll': "مسح كل الفلاتر",
  'name.placeholder': "الاسم أو الرقم الجامعي",
  'filter.searchLabel': "ابحث بالاسم أو الأكل أو المكان",
  'filter.title': "الفلاتر",
  'common.metres': '{count} م',
  'common.kilometres': '{count} كم',
};

const CATALOGS: Record<Locale, Partial<Record<MessageKey, string>>> = { en, ar };

/** Values interpolated into `{placeholders}`. */
export type MessageValues = Record<string, string | number>;

/**
 * Looks up a message, falling back to English and then to the key itself.
 *
 * Prefer the `t` from `useTranslate()` in components; this is the pure function
 * underneath, exported so non-React code and tests can use it.
 */
export function translate(locale: Locale, key: MessageKey, values?: MessageValues): string {
  const template = CATALOGS[locale]?.[key] ?? en[key] ?? key;

  if (!values) return template;

  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match
  );
}

/**
 * Arabic-Indic digits, used only when the whole UI is Arabic.
 *
 * Prices and distances stay legible either way, but mixing Western digits into an
 * otherwise Arabic sentence reads badly in RTL.
 */
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function localizeDigits(input: string | number, locale: Locale): string {
  const text = String(input);
  if (locale !== 'ar') return text;
  return text.replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]);
}

/** How many keys the Arabic catalog covers. Surfaced in tests to catch drift. */
export function translationCoverage(locale: Locale): { translated: number; total: number } {
  const total = Object.keys(en).length;
  const catalog = CATALOGS[locale] ?? {};
  const translated = Object.keys(en).filter((k) => catalog[k as MessageKey] !== undefined).length;
  return { translated, total };
}
