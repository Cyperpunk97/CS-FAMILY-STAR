# CS Family Star

A campus food guide for **Future University in Egypt** (New Cairo). Cafes,
restaurants and fast food around campus, with student ratings, crowdsourced prices,
walking distance, menus and one-tap directions.

Built by Youssef Ahmed and Ahmed Abdelwahab.

---

## Getting started

```
npm install
cp .env.example .env.local   # then fill in your Supabase URL and anon key
npm run dev
```

Open <http://localhost:3000>.

### Set up the database

Run [`supabase/schema.sql`](supabase/schema.sql) once in the Supabase SQL editor
(Dashboard → SQL Editor → New query). It is idempotent — safe to run twice.

Until you run it there is **no Row Level Security**, which means anyone holding the
public anon key can write directly to your table and bypass every validation rule in
`/api/reviews`. Run it.

Without any Supabase configuration at all the app still runs: it serves a small set
of seeded demo reviews from memory so the UI has something to show. That fallback is
**development only**. Once `NEXT_PUBLIC_SUPABASE_URL` and a key are set, a failed
read or write returns a 503 rather than quietly falling back — serving seeded demo
reviews as if they were real student reviews would be worse than an error.

---

## Scripts

| Command                   | What it does                                                   |
| ------------------------- | -------------------------------------------------------------- |
| `npm run dev`             | Dev server                                                      |
| `npm run build`           | Production build                                                |
| `npm run lint`            | ESLint                                                          |
| `npm run typecheck`       | TypeScript, no emit                                             |
| `npm run osm:contacts`    | Look up real phone numbers from OpenStreetMap (see below)       |
| `npm run logos:fetch`     | Download brand logos from Wikimedia Commons (see below)         |
| `npm run logos:wikipedia` | Same, via the Wikipedia article API                             |
| `npm run venues:discover` | Find food places near campus that are missing from the catalog  |

---

## The catalog

`lib/venues.ts` holds **53 venues**, as local data rather than an API call:

| cluster                  | venues | `coordSource` |
| ------------------------ | ------ | ------------- |
| FUE campus (`fue-*`)     | 23     | `osm`         |
| Point 90 area (`p90-*`)  | 30     | `approx`      |

An earlier version fetched the Overpass OSM API on every request and then discarded
the result with a `.slice(0, 100)` on a list whose first entries were already the
fallback. OSM lookup is now a one-off script.

### Coordinate accuracy — `coordSource`

Distance from campus is the default sort, so the app is explicit about which
coordinates are surveyed and which are estimates.

|                  | `approx` (hand-entered)                                     | `osm` (surveyed)          |
| ---------------- | ----------------------------------------------------------- | ------------------------- |
| List + sheet     | `~100 m`                                                     | `130 m`                   |
| Rounding         | 25 m under 500 m, then 50 m, then 0.1 km                     | 10 m                      |
| Venue sheet      | adds "Approximate location"                                  | nothing extra             |
| Google Maps link | searches by **name + area**, so Maps resolves the real shop  | uses the exact coordinate |

That last row matters most: handing Google Maps a hand-estimated coordinate routes
someone confidently to the wrong door, so approximate venues are sent as a name
search instead.

**`approx` is the default.** A catalog entry with no `coordSource` is treated as
approximate, so hand-adding a venue can never accidentally claim precision it does
not have. Only mark `'osm'` when the coordinate came from the map —
`npm run venues:discover` emits it for you.

**The 30 Point 90 coordinates are estimates and are known to be imprecise.** They sit
on a regular 0.0001° grid, which no real row of shops does; OSM does not map the
individual units inside the mall. They are all marked `approx` and the UI shows them
with a `~`. Do not promote them to `osm` without checking each one against the map.

To upgrade a venue by hand: find it on [openstreetmap.org](https://www.openstreetmap.org),
right-click → "Show address", paste the real coordinates into `lib/venues.ts` and add
`coordSource: 'osm'`.

### Adding more venues

```
npm run venues:discover                  # 3 km around campus
npm run venues:discover -- --radius 1500 # tighter
```

Queries OpenStreetMap for cafes, restaurants and fast food near campus, drops
everything already in the catalog, and prints the rest as ready-to-paste entries.
It only prints — it never edits your files. Review each one: OSM can be out of date,
and `priceTier` is a guess the script cannot make for you.

It also reports **coordinate conflicts** — brands the catalog and OSM both know but
place hundreds of metres apart. Those are worth checking.

---

## Phone numbers, menus and logos

**No phone number in this repo is invented.** A wrong number sends a student to a
stranger, and a wrong menu link is worse than no link — so every venue ships with
`phone: null`, `menuUrl: null`, `logoUrl: null`, and the UI simply hides the Call and
Menu buttons until real data exists.

To add them, open [`lib/venues.ts`](lib/venues.ts) and fill in one of two maps near
the top. One entry per brand covers every branch of that chain:

```ts
const CONTACTS_BY_BRAND = {
  'Starbucks': { phone: '19005', menuUrl: 'https://…', logoUrl: '/logos/starbucks.png' },
};

// Or override a single branch — this wins over the brand entry:
const CONTACTS_BY_ID = {
  'fue-cilantro': { phone: '02 1234 5678' },
};
```

**To find real numbers**, run `npm run osm:contacts`. It queries OpenStreetMap for
venues near campus with a mapped phone or website, matches them against the catalog
by name and distance, and prints ready-to-paste entries. It only prints — it never
edits your files. Review each match: OSM is volunteer-maintained and can be stale.

### Logos

26 brand logos live in `public/logos/`, fetched from Wikimedia Commons:

```
npm run logos:fetch          # download; re-run any time to refresh
npm run logos:fetch -- --dry # see what it would find, download nothing
```

**Where each logo appears.** Roughly half are wide wordmarks — the Starbucks file is
330×36, a 9:1 strip that is unreadable in a 44px list avatar. So:

- aspect ≤ 1.6 → shown in the list avatar **and** the venue sheet
- anything wider → monogram in the list, real wordmark in the venue sheet hero

Brands with no logo use a monogram of their initials, coloured from a hash of the
brand name. Nothing ever renders as an empty box.

**Before you ship:** read `public/logos/CREDITS.md`. 18 entries are public domain;
**four are CC BY-SA** (Caffè Pascucci, Krispy Kreme, Paul, Second Cup) and that
licence expects visible attribution, which the app does not currently show. Either
add a credits link in the footer, or delete those four files and their entries from
`CONTACTS_BY_BRAND` — they will fall back to monograms.

A licence is not the whole story: a wordmark can be free of copyright and still be an
active trademark. Identifying a real branch in a listing is normally fine; altering
the mark, or implying the brand endorses this app, is not.

---

## Menus

Two sources, in order:

1. **`lib/menus.ts`** — 25 hand-authored menus.
2. **`lib/talabatMenusData.json`** — 18 brands cached from Talabat Egypt, with a live
   lookup as a last resort via `/api/talabat/extract`.

That route takes a caller-supplied URL, so it only fetches hosts on an allowlist
(`talabat.com` and its subdomains), refuses redirects, times out at 8 seconds and
stops reading a response past 5 MB. Without those guards it is a server-side request
forgery primitive — point it at an internal address and read the outcome from the
error message. **If you add another host, add it to `ALLOWED_MENU_HOSTS` in
`lib/talabat.ts` rather than loosening the check.**

## How prices work

Two sources, and the UI always says which one it is showing:

1. **What students report.** The review form asks "how much did you spend per
   person?". The average of real answers shows as `≈ 85 EGP · from 12 students`.
2. **An editorial estimate**, used until anyone reports. Shown as
   `40–100 EGP · approx.` and never presented as measured data.

---

## Architecture

```
app/
  page.tsx              Server Component — renders the list on the server, no spinner
  layout.tsx            Metadata, viewport, fonts, skip link
  memories/             The Memories feed
  api/restaurants/      Venue list + review stats (for client refresh after posting)
  api/reviews/          GET reviews for a venue, POST a new one (validated)
  api/memories/         GET the feed, POST a memory, POST a cheer
  api/leaderboard/      Top reviewers, computed from the reviews table
  api/talabat/extract/  Menu lookup — host-allowlisted
  api/logos/fetch/      Wikipedia logo lookup for worldwide brands only
  components/           VenueList, VenueCard, VenueSheet, MenuModal, MemoriesView, …
  hooks/                useLocalStore, useFavorites, useStudentName, useFaculty, …
lib/
  venues.ts             The catalog + contact overrides
  venueStats.ts         Joins the catalog with review aggregates
  validation.ts         Server-side review validation + shared image-URL check
  rateLimit.ts          In-process sliding window
  filters.ts            Sort + filter logic (pure functions)
  geo.ts                Distance from campus or faculty, Google Maps deep links
  menus.ts, talabat.ts  Menu data and extraction
  memories.ts           Memory feed (in-memory, capped)
  leaderboard.ts        Reviewer ranking
  types.ts              Shared contracts between server and client
supabase/schema.sql     Tables, constraints, aggregate view, RLS policies
```

Some notes on decisions that are not obvious from the code:

- **The page is ISR with `revalidate = 30`.** Without it Next prerenders `/` once at
  build time and ratings freeze at deploy. Posting a review refreshes immediately
  because the client refetches `/api/restaurants`, which is uncached.
- **The open venue lives in the URL** (`?spot=fue-cilantro`). That makes links
  shareable and makes the phone's back gesture close the sheet.
- **Logo lookup never blocks a render.** `getCachedWikipediaLogo` is a synchronous
  cache peek; a miss falls back to the monogram. Awaiting a fetch per venue meant a
  cold start made one outbound Wikipedia request per logo-less brand before the first
  byte of HTML.
- **Uploaded images go to Supabase Storage, never into a request body.** Both reviews
  and memories downscale in the browser, upload, and send only the resulting URL. The
  server rejects any image URL outside its own bucket — an arbitrary URL would turn
  every reader's browser into a request to a server of the poster's choosing.
- **The app is light-theme only, on purpose.** It previously had a
  `prefers-color-scheme: dark` block that darkened only the body while every surface
  stayed light. Half a dark mode is worse than none.

---

## Accessibility

- Every dialog traps focus, closes on Escape, restores focus on close and locks
  background scroll.
- The star rating input is a real radio group, so it has arrow-key navigation and
  announces which rating is selected.
- All text meets WCAG AA (4.5:1) on its background, and nothing is smaller than 12px.
- Animations are decoration only and are disabled under `prefers-reduced-motion`.
- `/` focuses search; there is a skip link to the main content.

---

## Known gaps

- **Memories and the leaderboard have no tables.** Memories live in one server
  instance's memory, capped at 500, and are lost on restart — on a serverless host a
  student's post can disappear within minutes. The leaderboard is computed from the
  reviews table and returns an empty list when that is unavailable; it never invents
  entries. Giving memories a real table is the next schema change.
- **Identity is a name in `localStorage`**, not an account. Anyone can post as anyone.
  Real auth (Supabase Auth, restricted to `@fue.edu.eg` addresses) is the natural next
  step, and would also allow editing or deleting your own review.
- **Rate limiting is per server instance and in memory.** It stops casual spam, not a
  determined attacker, and `x-forwarded-for` is spoofable — never treat it as identity.
  The durable guards are the constraints and RLS policies in `supabase/schema.sql`.
- **Opening hours are not modelled**, so there is no "open now" filter.
- The rating breakdown in the venue sheet covers the most recent 50 reviews, and says
  so when there are more.
