# Conference Hero — LQIP Blur-up + Preload

**Date:** 2026-06-22  
**Scope:** `ConferenceHero.astro`, `Layout.astro`, `[...slug].astro`

## Problem

The conference detail page hero background image (1600×900 AVIF) loads slowly. The browser can't discover it until CSS is evaluated, and no placeholder is shown in the meantime — the hero area just renders dark until the image arrives.

## Solution

Two complementary improvements:

- **`<link rel="preload">`** — start fetching the full image during HTML parse, before CSS evaluation
- **LQIP blur-up** — show a tiny blurred placeholder immediately, cross-fade to the sharp image on load

## Architecture

### `Layout.astro`

Add a `<slot name="head">` inside `<head>`. Pages that need to inject a preload tag can pass it through this slot. No-op for pages that don't use it.

### `[...slug].astro`

When a `thumbnail` is present, pass a `<link rel="preload" as="image" href="..." fetchpriority="high">` into the `head` slot. The `href` is the full-size image URL produced by `getImage` in `ConferenceHero`.

To avoid calling `getImage` twice across two files, the preload URL is generated in `ConferenceHero.astro` and surfaced via `Astro.slots` / a prop — or more simply, `[...slug].astro` calls `getImage` itself for the preload tag, keeping `ConferenceHero` self-contained.

### `ConferenceHero.astro`

**Build-time (frontmatter):**

Two `getImage` calls when `thumbnail` is present:
- `placeholderImage`: `{ src: thumbnail, format: "avif", width: 20 }` — tiny placeholder
- `backgroundImage`: existing call, `{ src: thumbnail, format: "avif", width: 1600, height: 900 }`

**DOM structure:**

```html
<div class="hero" ...>
  <!-- Placeholder layer: blurred tiny image, always present -->
  <div class="hero-bg-placeholder" style="background-image: url('...')" aria-hidden="true"></div>

  <!-- Full-image layer: starts opacity 0, fades in on load -->
  <div class="hero-bg-full" aria-hidden="true"></div>

  <!-- Invisible trigger img: fires load event when full image is cached -->
  <img class="hero-preload-trigger" src="..." aria-hidden="true" alt="">

  <!-- Existing content layers (gradient, top bar, hero content) -->
  <div class="hero-gradient" aria-hidden="true"></div>
  ...
</div>
```

The `.hero-bg-full` background-image is set via an inline `style` attribute (same as the placeholder), pointing at the full-size URL.

## CSS

```css
.hero-bg-placeholder,
.hero-bg-full {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}

.hero-bg-placeholder {
  filter: blur(20px);
  transform: scale(1.1); /* hides blurred edges */
  transition: opacity 0.4s ease;
}

.hero-bg-full {
  opacity: 0;
  transition: opacity 0.4s ease;
}

.hero--loaded .hero-bg-full  { opacity: 1; }
.hero--loaded .hero-bg-placeholder { opacity: 0; }
```

The `.hero-preload-trigger` img is visually hidden (`position: absolute; width: 0; height: 0; overflow: hidden`).

## Script

Inline `<script>` at the bottom of `ConferenceHero.astro`:

```js
const trigger = document.querySelector('.hero-preload-trigger');
const hero = document.querySelector('.hero');
if (trigger && hero) {
  if (trigger.complete) {
    hero.classList.add('hero--loaded');
  } else {
    trigger.addEventListener('load', () => hero.classList.add('hero--loaded'));
  }
}
```

The `trigger.complete` check handles the case where the preload tag has already fetched the image before the script runs.

## No-JS Fallback

The hero remains readable without JS — the blurred placeholder stays visible indefinitely. The gradient overlay and text are unaffected. No content is hidden behind the image.

## Scope

- Only `ConferenceHero.astro` and `Layout.astro` and `[...slug].astro` are modified.
- `ConferenceGallery.astro` is out of scope — its images are already lazy-loaded at 220px height and load below the fold.
- No new dependencies.
