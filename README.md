# Aperture Assets — photography portfolio

Live at [apertureassets.co](https://apertureassets.co). A light, airy, monochrome
static portfolio site. No build step, no dependencies. Tagline: *Captured Honestly*.

## Pages
| File | Page |
|---|---|
| `index.html` | Home — hero, selected work, gallery teaser, ethos |
| `destinations.html` | Grid of destination essays |
| `japan.html`, `new-zealand.html`, `south-korea.html`, `amsterdam.html`, `monaco.html`, `chicago.html` | Destination essays — photo grid + travel guide |
| `gallery.html` | Grid of place/genre tiles, each linking to a collection page |
| `*-gallery.html` | Per-destination/genre photo collection pages |
| `camera-bag.html` | The gear — bodies, lenses, bags, accessories |
| `about.html` | Bio, ethos, stats, contact |

## Run it locally
```bash
python -m http.server 4173
# then visit http://localhost:4173
```

## Deploy
Static site served via GitHub Pages behind Cloudflare, with `apertureassets.co`
as the custom domain (see the `CNAME` file).

## Make it yours
- **Photos** → drop files over the matching filenames in `images/`.
- **Colours & fonts** → the `:root` block at the top of `css/style.css`.
- **Name / tagline / copy** → edit the `.html` files (search `Aperture Assets`,
  `Captured Honestly`, `hello@apertureassets.com`).

## Built with care
- Vanilla HTML / CSS / JS — zero dependencies, loads fast on any device.
- One typeface: **Manrope** (weight-led hierarchy), via Google Fonts.
- Monochrome shell (white / greys / near-black); the photography is the only colour.
- Signature motion: images sit slightly desaturated and bloom to full colour on
  hover; touch devices show full colour by default.
- Scroll-reveal animations use transform/opacity/clip-path only and honour
  `prefers-reduced-motion`.
- Accessible: labelled controls, keyboard-friendly lightbox & menu, AA contrast,
  focus-visible rings, semantic headings, alt text on every image.
