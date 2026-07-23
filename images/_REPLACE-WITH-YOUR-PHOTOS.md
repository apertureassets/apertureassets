# Swapping in your own photos

Every image on the site is a real `.jpg` file in this folder. To use your own
photography, **just drop your file over the matching filename** (keep the same
name and `.jpg` extension). No code editing required — refresh and it appears.

> Export to roughly the pixel sizes below (or larger) for a crisp result on
> high-resolution screens, and keep each file under ~400 KB where you can
> (squoosh.app, or "Save for Web" ~80% quality). Match the **shape** (portrait vs
> landscape) noted below so the layout stays tidy.

## How the images are organised

Every destination and gallery page now has its **own** set of photo files —
nothing is shared or repeated between pages any more. Filenames are prefixed
with the page they belong to, so you can tell at a glance which file feeds
which page.

### Destination essays (6 places)

Each place — Japan, New Zealand, South Korea, Amsterdam, Monaco, Chicago —
has its own hero photo plus 8 photos for its story:

| Filename pattern | Used on | Suggested size | Shape |
|---|---|---|---|
| `<place>-hero.jpg` | That place's tile on `destinations.html` and the homepage | 1200 × 1500 | portrait |
| `<place>-hero-banner.jpg` | That place's own essay page — the full-bleed banner at the top | 2400 × 1500 | landscape |
| `<place>-story-01.jpg` … `-03.jpg` | First photo row of the essay | 1200 × 1500 | portrait |
| `<place>-story-04.jpg`, `-05.jpg` | Second photo row of the essay | 1600 × 1067 | landscape |
| `<place>-story-06.jpg` … `-08.jpg` | Third photo row of the essay | 1200 × 1500 | portrait |

> `<place>-hero-banner.jpg` sits in a short, very wide full-bleed band, so a
> portrait photo gets cropped hard there. If you only have a portrait shot,
> don't just drop it in at 1200×1500 — pad it out to 2400×1500 first (e.g.
> center it over a blurred, darkened, edge-stretched copy of itself) so the
> whole subject stays in frame instead of being cut off top and bottom.

`<place>` is one of: `japan`, `new-zealand`, `south-korea`, `amsterdam`,
`monaco`, `chicago`. Example: Japan's story photos are
`japan-story-01.jpg` through `japan-story-08.jpg`.

### Gallery collections (9 pages)

Each collection page — Japan, New Zealand, South Korea, Amsterdam, Monaco,
Chicago, London, United Kingdom, Motorsport — has its own 12-photo grid:

| Filename pattern | Used on | Suggested size | Shape |
|---|---|---|---|
| `<collection>-gallery-01.jpg` … `-03.jpg` | First row of the grid | 1200 × 1500 | portrait |
| `<collection>-gallery-04.jpg`, `-05.jpg` | Second row | 1600 × 1067 | landscape |
| `<collection>-gallery-06.jpg` … `-08.jpg` | Third row | 1200 × 1500 | portrait |
| `<collection>-gallery-09.jpg`, `-10.jpg` | Fourth row | 1600 × 1067 | landscape |
| `<collection>-gallery-11.jpg`, `-12.jpg` | Fifth row | 1600 × 1067 | landscape |

`<collection>` is one of: `japan`, `new-zealand`, `south-korea`, `amsterdam`,
`monaco`, `chicago`, `london`, `united-kingdom`, `motorsport`. Example:
Motorsport's grid is `motorsport-gallery-01.jpg` through
`motorsport-gallery-12.jpg`.

`gallery.html`'s tile grid (the page that links to each collection) and the
homepage's "Collections" teaser both reuse each collection's own
`<collection>-gallery-01.jpg` as the thumbnail — so updating that one file
also updates its tile automatically.

### Everything else

| Filename | Used on | Suggested size | Shape |
|---|---|---|---|
| `hero.jpg` | Home — large hero image | 2400 × 1500 | landscape |
| `about-portrait.jpg` | About — portrait of you | 1200 × 1500 | portrait |
| `about-wide.jpg` | About — wide banner | 2200 × 1160 | landscape |
| `camerabag.jpg` | (optional) gear image — not currently placed, spare for your use | 2000 × 1300 | landscape |

**Note on the desaturation effect:** portfolio & destination images are shown
*slightly desaturated* and animate to full colour on hover (on touch devices they
show full colour by default). This is a CSS effect — your original files are never
modified. To change or remove it, edit the `.media img` rule in `css/style.css`.

## Adding a new destination or gallery collection

To add another place: copy one of the existing essay pages (e.g. `japan.html`)
to a new file named after the new place, change the title/name and text,
rename the image files it points to to match the new place's slug (e.g.
`iceland-hero.jpg`, `iceland-story-01.jpg` …), update the alt text and
prev/next links, then link to it from `destinations.html`. Do the same with
an existing `*-gallery.html` file to add a new photo collection, linking it
from `gallery.html`.

## Changing the words & brand

- **Blog/business name** — search `Aperture Assets` across the `.html` files.
- **Tagline** — search `Captured Honestly`.
- **Your name** — search `Elena Marsh`.
- **Email** — search `hello@apertureassets.com`.
- **Colours & fonts** — the `:root` block at the top of `css/style.css`.

## Alt text (please update!)

Each `<img>` has an `alt="…"` description for screen-reader users and SEO. When you
swap a photo, update its `alt` to describe *your* image.
