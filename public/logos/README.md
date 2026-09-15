# Venue logos

Drop logo image files here and reference them from `lib/venues.ts`:

```ts
const CONTACTS_BY_BRAND = {
  'Starbucks': { logoUrl: '/logos/starbucks.png' },
};
```

- **Format:** PNG or WebP with a transparent background works best. SVG also works.
- **Size:** square, around 128×128. They render at 44px in the list and 64px in the
  venue sheet, and are drawn with `object-contain` so nothing gets cropped.
- **Naming:** anything you like — the filename is only referenced from `venues.ts`.

Any venue without a logo renders a coloured monogram of its initials instead, so the
layout never breaks and you can add these one at a time.

**Only add logos you have the right to use.** A brand's logo is its trademark;
displaying one to identify a real branch in a listing is normally fine, but altering
it, or implying the brand endorses this app, is not.
