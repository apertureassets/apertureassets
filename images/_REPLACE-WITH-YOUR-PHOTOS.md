# Swapping in your own photos

Every image on the site is a real `.jpg` file in this folder. To use your own
photography, **just drop your file over the matching filename** (keep the same
name and `.jpg` extension). No code editing required — refresh and it appears.

> Export to roughly the pixel sizes below (or larger) for a crisp result on
> high-resolution screens, and keep each file under ~400 KB where you can
> (squoosh.app, or "Save for Web" ~80% quality). Match the **shape** (portrait vs
> landscape) noted below so the layout stays tidy.

## Where each photo appears

| Filename | Used on | Suggested size | Shape |
|---|---|---|---|
| `hero.jpg` | Home — large hero image | 2400 × 1500 | landscape |
| `port-01.jpg … port-12.jpg` | Portfolio grid + Home "Selected Work" + Destination galleries | 1200 × 1500 (odd numbers = portrait) / 1600 × 1067 (even = landscape) | mixed |
| `dest-01.jpg … dest-06.jpg` | Destinations grid + Home teaser + Destination hero | 1200 × 1500 | portrait |
| `about-portrait.jpg` | About — portrait of you | 1200 × 1500 | portrait |
| `about-wide.jpg` | About — wide banner | 2200 × 1160 | landscape |
| `camerabag.jpg` | (optional) gear image — not currently placed, spare for your use | 2000 × 1300 | landscape |

**Note on the desaturation effect:** portfolio & destination images are shown
*slightly desaturated* and animate to full colour on hover (on touch devices they
show full colour by default). This is a CSS effect — your original files are never
modified. To change or remove it, edit the `.media img` rule in `css/style.css`.

## Adding a new destination page

`destination.html` is a reusable template (Iceland is the worked example). To add
another place: copy `destination.html` to e.g. `japan.html`, change the title/name,
swap the hero + gallery images, update the alt text and prev/next links, then link
to it from `destinations.html`.

## Changing the words & brand

- **Blog/business name** — search `Aperture Assets` across the `.html` files.
- **Tagline** — search `Captured Honestly`.
- **Your name** — search `Elena Marsh`.
- **Email** — search `hello@apertureassets.com`.
- **Colours & fonts** — the `:root` block at the top of `css/style.css`.

## Alt text (please update!)

Each `<img>` has an `alt="…"` description for screen-reader users and SEO. When you
swap a photo, update its `alt` to describe *your* image.
