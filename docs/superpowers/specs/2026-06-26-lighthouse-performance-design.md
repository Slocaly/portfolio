# Lighthouse Performance Optimizations — Conference Detail Page

**Date:** 2026-06-26  
**Baseline score:** 85 (Performance)  
**Target:** 95+

## Context

The conference detail page (`/conferences/[slug]`) scores 85 on Lighthouse performance. Three red issues drive the gap:

1. **Improve image delivery** — 2,314 KiB estimated savings. Root cause: the hero background image is set via CSS `background-image` which the browser's LCP detector cannot see. Additionally `[...slug].astro` preloads a 2600×1500 AVIF while `ConferenceHero.astro` displays a 1600×900 AVIF — two different URLs, so the preload downloads an image that is never shown.
2. **Render-blocking requests** — 240 ms estimated savings. Google Fonts CSS stylesheet blocks rendering.
3. **Use efficient cache lifetimes** — 2,086 KiB estimated savings. No `Cache-Control` headers are set for static assets on Cloudflare Pages.

## Design

### 1. Hero image — LCP fix with blur-up preserved

**Problem:** `<img class="hero-preload-trigger">` is styled `width: 0; height: 0; overflow: hidden` — invisible to the browser LCP detector. The full-res image is loaded as a CSS `background-image`, which the preload scanner cannot prioritize. The `<link rel="preload">` in `[...slug].astro` points to a 2600×1500 AVIF that is never displayed.

**Solution:**

- Remove the `heroPreloadImage` `getImage` call and the `<link rel="preload">` from `[...slug].astro`.
- Remove `hero-bg-full` (the full-res CSS background-image div) and `hero-preload-trigger` from `ConferenceHero.astro`.
- Add a real `<Image>` component from `astro:assets` in their place:
  - Positioned `absolute; inset: 0; width: 100%; height: 100%; object-fit: cover`
  - Starts at `opacity: 0`, transitions to `opacity: 1` via `hero--loaded` class (same transition as today)
  - `fetchpriority="high"` and `loading="eager"` so the browser preload scanner prioritizes it
  - `widths={[800, 1200, 1600]}` and `sizes="100vw"` for responsive srcset — mobile gets ~800px instead of 1600px
  - `format="avif"`
- Keep the blurred 20px placeholder as CSS `background-image` — shown immediately, fades out when the real image loads.
- Update `initHeroLqip()` in the `<script>` to watch the new `<img>` instead of `hero-preload-trigger`.
- Remove the `backgroundImage` `getImage` call from `ConferenceHero.astro` (replaced by the `<Image>` component).

**UX:** identical to today. User sees blurred placeholder instantly, then a smooth fade to full resolution.

### 2. Self-hosted fonts

**Problem:** Three `<link>` tags in `Layout.astro` (two `preconnect`, one `stylesheet`) load Google Fonts synchronously, blocking rendering and adding a third-party round-trip.

**Solution:**

- Download 5 woff2 files from Google Fonts and place in `public/fonts/`:
  - `archivo-400.woff2` (Archivo Regular)
  - `archivo-500.woff2` (Archivo Medium)
  - `archivo-600.woff2` (Archivo SemiBold)
  - `archivo-expanded-700.woff2` (Archivo Expanded Bold)
  - `archivo-expanded-800.woff2` (Archivo Expanded ExtraBold)
- Add `@font-face` declarations to `src/styles/global.css` with `font-display: swap` and `font-style: normal`.
- Remove the three Google Fonts `<link>` tags from `Layout.astro` entirely.
- Add `<link rel="preload" as="font" type="font/woff2" crossorigin>` tags in `Layout.astro` for the two display weights (700 and 800 of Archivo Expanded) which are used for headings and are render-critical.

### 3. Cloudflare cache headers

**Problem:** No `Cache-Control` headers configured — Cloudflare uses short default TTLs, so static assets are re-downloaded on repeat visits.

**Solution:** Create `public/_headers` (Cloudflare Pages reads this file at deploy time):

```
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=31536000, immutable
```

Astro content-hashes all files under `/_astro/` at build time, making `immutable` safe. Font files are static and versioned by filename.

## Files changed

| File | Change |
|------|--------|
| `src/pages/conferences/[...slug].astro` | Remove `heroPreloadImage` getImage + preload link |
| `src/components/ConferenceHero.astro` | Replace CSS bg-full + preload-trigger with `<Image>` component; update JS |
| `src/layouts/Layout.astro` | Remove Google Fonts links; add font preloads |
| `src/styles/global.css` | Add `@font-face` declarations |
| `public/fonts/*.woff2` | Add 5 self-hosted font files |
| `public/_headers` | Add Cloudflare cache header rules |

## Out of scope

- bfcache ("Page prevented back/forward cache restoration") — caused by Astro's ClientRouter (View Transitions); not addressable without removing transitions.
- Leaflet unused JS — acceptable trade-off for map functionality.
- Gallery images — already using `loading="lazy"` and `format="avif"` with correct dimensions; no change needed.
