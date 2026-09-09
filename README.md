# CS Family Star

A campus food guide for **Future University in Egypt** (New Cairo). 100 cafes,
restaurants and fast food spots around campus, with student ratings, crowdsourced
prices, walking distance and one-tap directions.

Built by Youssef Ahmed and Ahmed Abdelwahab.

---

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL and anon key
npm run dev
```

Open <http://localhost:3000>.

### Set up the database

Run [`supabase/schema.sql`](supabase/schema.sql) once in the Supabase SQL editor
(Dashboard → SQL Editor → New query). It is safe to run twice.

The app works before you run it — the API routes fall back to the old schema — but
until you do there is **no Row Level Security**, which means anyone holding the
public anon key can write directly to your table and bypass every validation rule in
`/api/reviews`. Run it.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run osm:contacts` | Look up real phone numbers from OpenStreetMap (see below) |
| `npm run logos:fetch` | Download brand logos from Wikimedia Commons (see below) |
| `npm run venues:discover` | Find food places near campus that are missing from the catalog |

---

## Adding phone numbers, menus and logos

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

### Logos

20 brand logos are already in `public/logos/`, fetched from Wikimedia Commons:

```bash
npm run logos:fetch          # download; re-run any time to refresh
npm run logos:fetch -- --dry # see what it would find, download nothing
```

It runs one Wikidata SPARQL query for every brand at once, takes the item whose
description actually reads like a food business, downloads the logo from Commons,
and writes licence + author + source for every file to `public/logos/CREDITS.md`.

**Where each logo appears.** Roughly half of these are wide wordmarks — the
Starbucks file is 330×36, a 9:1 strip that is unreadable in a 44px list avatar. So:

- aspect ≤ 1.6 (Pizza Hut, McDonald's, Burger King, Arby's, Caffè Pascucci) →
  shown in the list avatar **and** the venue sheet
- anything wider → monogram in the list, real wordmark in the venue sheet hero

Brands with no logo just use a monogram of their initials, coloured from a hash of
the brand name. Nothing ever renders as an empty box.

**Before you ship:** read `public/logos/CREDITS.md`. 16 of the 20 are public domain;
four are CC BY-SA (Caffè Pascucci, Krispy Kreme, Paul, Second Cup) and that licence
expects visible attribution, which the app does not currently show. Either add a
credits link in the footer, or delete those four files and their entries from
`CONTACTS_BY_BRAND` — they will fall back to monograms.

And note that a licence is not the whole story: a wordmark can be free of copyright
and still be an active trademark. Identifying a real branch in a listing is normally
fine; altering the mark, or implying the brand endorses this app, is not.

**To find real numbers**, run:

```bash
npm run osm:contacts
```

It queries OpenStreetMap for venues near campus that have a mapped phone or website,
matches them against the catalog by name and distance, and prints ready-to-paste
entries. It only prints — it never edits your files. Review each match: OSM is
volunteer-maintained and can be stale.

---

## Adding more venues

```bash
npm run venues:discover                  # 3 km around campus
npm run venues:discover -- --radius 1500 # tighter
```

Queries OpenStreetMap for cafes, restaurants and fast food near campus, drops
everything already in the catalog, and prints the rest as ready-to-paste entries.
It only prints — it never edits your files. Review each one: OSM can be out of date,
and `priceTier` is a guess the script cannot make for you.

It also reports **coordinate conflicts** — brands the catalog and OSM both know but
place hundreds of metres apart. Those are worth checking, because the app's default
sort is by distance.

## Coordinate accuracy — `coordSource`

The 100 venues this project started with have **approximate, hand-entered
coordinates**. Two whole clusters of them were not merely imprecise but in the wrong
place, and have been corrected against OpenStreetMap:

| cluster | venues | was | now | error |
| --- | --- | --- | --- | --- |
| Point 90 Mall | 29 | 1251 m from campus, **on the AUC campus** | 729 m | 573 m |
| Concord Plaza | 20 | 307 m | 816 m | 556 m |

Both now carry the mall's own surveyed position, so every venue in a mall shares one
coordinate. **That repetition is deliberate** — OSM does not map the individual shops
inside these malls, so the building is the most precise thing that can honestly be
said. Do not nudge them apart to look tidier; that would invent precision.

Still unverified, because OSM has no entry for them: **The Waterway** (17),
**Dreams Mall** (7), **The Spot Mall** (9), **Silver Star Mall** (4). Their positions
are still hand-estimates and may be similarly off.

### Dreams Mall — checked, deliberately left alone

Worth recording so nobody repeats the investigation. OSM has **nothing named
"Dreams"** within 10 km, in English or Arabic. The seven venues are 49–93 m from
campus (centroid 73 m), and the nearest mall OSM does know about, **Meeting Point
Mall**, is only 99 m from that centroid — well inside the margin these coordinates
already carry, and nothing like the 573 m and 556 m errors above.

Two further reasons not to move them: **Galleria Mall** is a comparable candidate at
173 m, and the shops OSM places in Meeting Point Mall (Coffeeshop Company, Abou
Shakra, Aroma Lounge, Studio Misr, Chili's) are a completely different set from the
catalog's Dreams Mall list (GAD, Dunkin', TBS Express, Pizza King, Cook Door,
Mo'men, Koshary El Tahrir) — so they may well be different buildings.

Relocating them would assert an identity the data does not support, and could easily
make the position worse. They stay put, and the "~" already tells the user the
position is approximate.

Other artefacts of the original data:

- `Cilantro - FUE Campus` sits on the exact campus centre point.
- `Mince Burger` and `Dunkin' - Waterway` share one identical coordinate.

Since "Nearest to campus" is the default sort, the app is explicit about all of this
rather than quietly implying metre-level precision.

Every venue carries a `coordSource`:

| | `approx` (hand-entered) | `osm` (surveyed) |
| --- | --- | --- |
| List + sheet | `~100 m` | `130 m` |
| Rounding | 25 m under 500 m, then 50 m, then 0.1 km | 10 m |
| Venue sheet | adds "Approximate location" | nothing extra |
| Google Maps link | searches by **name + area**, so Maps resolves the real shop | uses the exact coordinate |

That last row matters most: handing Google Maps a hand-estimated coordinate routes
someone confidently to the wrong door, so approximate venues are sent as a name
search instead.

**`approx` is the default.** A catalog entry with no `coordSource` is treated as
approximate, so hand-adding a venue can never accidentally claim precision it does
not have. Only mark `'osm'` when the coordinate came from the map —
`npm run venues:discover` emits it for you.

To upgrade a venue by hand: find it on
[openstreetmap.org](https://www.openstreetmap.org), right-click → "Show address",
paste the real coordinates into `lib/venues.ts` and add `coordSource: 'osm'`.

## How prices work

Two sources, and the UI always says which one it is showing:

1. **What students report.** The review form asks "how much did you spend per
   person?". The average of real answers is shown as `≈ 85 EGP · from 12 students`.
2. **An editorial estimate**, used until anyone reports. Shown as `40–100 EGP ·
   approx.` and never presented as measured data.

---

## Architecture

```
app/
  page.tsx              Server Component — renders the list on the server, no spinner
  layout.tsx            Metadata, viewport, fonts, skip link
  api/restaurants/      Venue list + review stats (for client refresh after posting)
  api/reviews/          GET reviews for a venue, POST a new one (validated)
  components/           VenueList, VenueCard, VenueSheet, FilterBar, Modal, …
  hooks/                useLocalStore, useFavorites, useStudentName, useUrlParam
lib/
  venues.ts             The 100-venue catalog + contact overrides
  venueStats.ts         Joins the catalog with review aggregates
  validation.ts         Server-side review validation
  filters.ts            Sort + filter logic (pure functions)
  geo.ts                Distance from campus, Google Maps deep links
  types.ts              Shared contracts between server and client
supabase/schema.sql     Tables, constraints, aggregate view, RLS policies
```

Some notes on decisions that are not obvious from the code:

- **The venue catalog is local data, not an API call.** An earlier version fetched
  the Overpass OSM API on every request and then discarded the result with a
  `.slice(0, 100)` on a list whose first 100 entries were already the fallback. OSM
  lookup is now a one-off script.
- **The page is ISR with `revalidate = 30`.** Without it Next 16 prerenders `/` once
  at build time and ratings freeze at deploy. Posting a review refreshes immediately
  because the client refetches `/api/restaurants`, which is uncached.
- **The open venue lives in the URL** (`?spot=fue-cilantro`). That makes links
  shareable and makes the phone's back gesture close the sheet.
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

- **Identity is a name in `localStorage`**, not an account. Anyone can post as
  anyone. Real auth (Supabase Auth, restricted to `@fue.edu.eg` addresses) is the
  natural next step, and would also allow editing or deleting your own review.
- **Rate limiting is per server instance and in memory.** It stops casual spam, not a
  determined attacker. The durable guards are the constraints and RLS policies in
  `supabase/schema.sql`.
- **Opening hours are not modelled**, so there is no "open now" filter.
- The rating breakdown in the venue sheet covers the most recent 50 reviews, and
  says so when there are more.
