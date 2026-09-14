/**
 * Opening hours, in OpenStreetMap's `opening_hours` syntax.
 *
 * The governing rule here is the same one that keeps `phone: null` in the catalog: a
 * wrong answer is worse than no answer. A student who walks 800 m to a closed cafe
 * because the app guessed is worse off than one who was told "hours unknown" and
 * checked. So:
 *
 *   - A venue with no hours data is `unknown`, never assumed open.
 *   - Any expression this parser does not fully understand returns `unknown` rather
 *     than a best-effort guess. The supported subset is documented below; anything
 *     outside it — `sunrise`, `PH`, `week 1-53`, month ranges, `||` fallbacks — is
 *     refused outright.
 *   - "Open now" filtering never silently drops unknown venues; the UI decides how
 *     to present them.
 *
 * Supported subset, which covers the overwhelming majority of Cairo food venues:
 *   `24/7`
 *   `Mo-Fr 09:00-17:00`
 *   `Mo,We,Fr 08:00-12:00`
 *   `Mo-Th 10:00-23:00; Fr-Sa 10:00-02:00`     (past-midnight spans included)
 *   `Sa-Th 09:00-23:00; Fr off`
 */

export type OpenState = 'open' | 'closed' | 'unknown';

/** OSM weekday tokens, in OSM's order: Monday first. */
const DAY_TOKENS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;

/** Minutes from midnight. A span may end past 1440 when it runs into the next day. */
interface Span {
  /** 0-6, Monday = 0, matching DAY_TOKENS. */
  day: number;
  startMinute: number;
  endMinute: number;
}

function dayIndex(token: string): number {
  return DAY_TOKENS.indexOf(token as (typeof DAY_TOKENS)[number]);
}

/** `Mo-Th` -> [0,1,2,3];  `Mo,We` -> [0,2];  `Mo` -> [0]. Null if unparseable. */
function parseDays(text: string): number[] | null {
  const days: number[] = [];

  for (const part of text.split(',')) {
    const chunk = part.trim();
    if (!chunk) return null;

    const range = chunk.match(/^([A-Za-z]{2})\s*-\s*([A-Za-z]{2})$/);
    if (range) {
      const from = dayIndex(range[1]);
      const to = dayIndex(range[2]);
      if (from < 0 || to < 0) return null;

      // OSM ranges wrap: `Sa-Th` means Saturday through Thursday, skipping Friday.
      for (let i = 0; i < 7; i++) {
        const day = (from + i) % 7;
        days.push(day);
        if (day === to) break;
      }
      continue;
    }

    const single = dayIndex(chunk);
    if (single < 0) return null;
    days.push(single);
  }

  return days.length > 0 ? days : null;
}

/** `09:00` -> 540. Null if not a valid 24-hour clock time. */
function parseClock(text: string): number | null {
  const match = text.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  // 24:00 is legal in OSM and means end-of-day.
  if (hours > 24 || minutes > 59) return null;
  if (hours === 24 && minutes !== 0) return null;

  return hours * 60 + minutes;
}

/**
 * Parses an `opening_hours` value into spans.
 *
 * Returns `null` for anything outside the supported subset — the caller turns that
 * into `unknown`, which is the whole point.
 */
export function parseOpeningHours(value: string | null | undefined): Span[] | null {
  if (!value || typeof value !== 'string') return null;

  const normalized = value.trim();
  if (!normalized) return null;

  if (normalized === '24/7') {
    return DAY_TOKENS.map((_, day) => ({ day, startMinute: 0, endMinute: 1440 }));
  }

  // Constructs this parser deliberately refuses rather than approximating.
  if (/sunrise|sunset|dawn|dusk|PH|SH|week\s|easter|\|\||\[/i.test(normalized)) return null;
  // Month or date-based rules (`Jan-Mar`, `Dec 25`) are out of scope.
  if (/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/.test(normalized)) return null;

  const spans: Span[] = [];
  const closedDays = new Set<number>();

  for (const rawRule of normalized.split(';')) {
    const rule = rawRule.trim();
    if (!rule) continue;

    const offMatch = rule.match(/^(.+?)\s+(off|closed)$/i);
    if (offMatch) {
      const days = parseDays(offMatch[1]);
      if (!days) return null;
      for (const day of days) closedDays.add(day);
      continue;
    }

    const parts = rule.match(/^([A-Za-z,\s-]+?)\s+(.+)$/);
    if (!parts) return null;

    const days = parseDays(parts[1]);
    if (!days) return null;

    for (const rawTime of parts[2].split(',')) {
      const time = rawTime.trim().match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
      if (!time) return null;

      const startMinute = parseClock(time[1]);
      let endMinute = parseClock(time[2]);
      if (startMinute === null || endMinute === null) return null;

      // `10:00-02:00` closes after midnight; carry it into the next day.
      if (endMinute <= startMinute) endMinute += 1440;

      for (const day of days) spans.push({ day, startMinute, endMinute });
    }
  }

  if (spans.length === 0) return null;

  return spans.filter((span) => !closedDays.has(span.day));
}

/** Local wall-clock time in a timezone, without pulling in a date library. */
export function zonedNow(now: Date, timeZone: string): { day: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';

  const weekday = get('weekday').slice(0, 2);
  const day = dayIndex(weekday.charAt(0).toUpperCase() + weekday.charAt(1).toLowerCase());

  // `hour12: false` can render midnight as 24; normalise it.
  const hour = Number(get('hour')) % 24;
  const minute = Number(get('minute'));

  return { day, minute: hour * 60 + minute };
}

/** Egypt observes a single timezone; venues are all in New Cairo. */
export const CAMPUS_TIMEZONE = 'Africa/Cairo';

export function isOpenAt(
  openingHours: string | null | undefined,
  now: Date = new Date(),
  timeZone: string = CAMPUS_TIMEZONE
): OpenState {
  const spans = parseOpeningHours(openingHours);
  if (spans === null) return 'unknown';

  const { day, minute } = zonedNow(now, timeZone);
  if (day < 0) return 'unknown';

  for (const span of spans) {
    // Same-day match.
    if (span.day === day && minute >= span.startMinute && minute < span.endMinute) {
      return 'open';
    }

    // A span started yesterday and runs past midnight into today.
    if (span.endMinute > 1440) {
      const yesterday = (day + 6) % 7;
      if (span.day === yesterday && minute + 1440 < span.endMinute) return 'open';
    }
  }

  return 'closed';
}

/** Short label for the badge. `null` when hours are unknown — the UI omits the badge. */
export function openStateLabel(state: OpenState): 'Open now' | 'Closed' | null {
  if (state === 'open') return 'Open now';
  if (state === 'closed') return 'Closed';
  return null;
}
