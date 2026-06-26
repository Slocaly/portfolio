# Lighthouse Performance Optimizations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the conference detail page Lighthouse performance score from 85 to 95+ by fixing image LCP detection, eliminating the Google Fonts render-blocking request, and adding long-term Cloudflare cache headers.

**Architecture:** Three independent changes: (1) replace the hidden CSS background image in the hero with a proper `<Image>` component so the browser's preload scanner and LCP detector can find it; (2) self-host Archivo and Archivo Expanded fonts to eliminate the Google Fonts render-blocking stylesheet; (3) add a `public/_headers` file so Cloudflare Pages sets long-term immutable cache on hashed assets and fonts.

**Tech Stack:** Astro 5.17+, astro:assets Image component, Cloudflare Pages, AVIF images, woff2 fonts.

## Global Constraints

- No test suite — verification is manual: `pnpm dev`, open `http://localhost:4321/conferences/tanstack-db/`, check in browser.
- Never commit automatically; leave committing to the user.
- Package manager: `pnpm`.
- Blur-up UX must be preserved: user must see blurred placeholder immediately, then smooth fade to full image. No black flash.

---

### Task 1: Self-host Archivo fonts

**Files:**
- Create: `public/fonts/archivo-400.woff2`
- Create: `public/fonts/archivo-500.woff2`
- Create: `public/fonts/archivo-600.woff2`
- Create: `public/fonts/archivo-expanded-700.woff2`
- Create: `public/fonts/archivo-expanded-800.woff2`
- Modify: `src/styles/global.css`
- Modify: `src/layouts/Layout.astro`

**Interfaces:**
- Produces: `/fonts/*.woff2` files served by Cloudflare; `@font-face` rules in global.css that replace the Google Fonts stylesheet; font preload `<link>` tags in Layout.astro head.

- [ ] **Step 1: Create the font download script**

Create `scripts/download-fonts.mjs` (temporary — will be deleted after running):

```js
// scripts/download-fonts.mjs
import fs from 'fs/promises';
import path from 'path';

const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Archivo+Expanded:wght@700;800&family=Archivo:wght@400;500;600&display=swap';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const css = await fetch(FONTS_URL, { headers: { 'User-Agent': UA } }).then((r) => r.text());

const blockRe = /@font-face\s*\{([^}]+)\}/g;
const seen = new Set();
const downloads = [];

for (const [, block] of css.matchAll(blockRe)) {
  const family = block.match(/font-family:\s*['"]([^'"]+)['"]/)?.[1];
  const weight = block.match(/font-weight:\s*(\d+)/)?.[1];
  const url = block.match(/src:\s*url\((https:\/\/[^)]+\.woff2)\)/)?.[1];
  // Only the latin subset (U+0000-00FF covers all French characters: é è à ç ü etc.)
  const isLatin = block.includes('U+0000-00FF');

  if (!family || !weight || !url || !isLatin) continue;

  const key = `${family}-${weight}`;
  if (seen.has(key)) continue;
  seen.add(key);

  const slug = family.toLowerCase().replace(/\s+/g, '-');
  const filename = `${slug}-${weight}.woff2`;
  downloads.push({ filename, url, family, weight });
}

await fs.mkdir('public/fonts', { recursive: true });

for (const { filename, url } of downloads) {
  const buf = await fetch(url).then((r) => r.arrayBuffer());
  await fs.writeFile(path.join('public/fonts', filename), Buffer.from(buf));
  console.log(`✓ ${filename}`);
}
```

- [ ] **Step 2: Run the download script**

```bash
node scripts/download-fonts.mjs
```

Expected output (filenames may vary but must include these 5):
```
✓ archivo-400.woff2
✓ archivo-500.woff2
✓ archivo-600.woff2
✓ archivo-expanded-700.woff2
✓ archivo-expanded-800.woff2
```

Verify the files exist:
```bash
ls -lh public/fonts/
```

Expected: 5 `.woff2` files, each between 15–50 KB.

- [ ] **Step 3: Delete the download script**

```bash
rm scripts/download-fonts.mjs
rmdir scripts 2>/dev/null || true
```

- [ ] **Step 4: Add `@font-face` declarations to `src/styles/global.css`**

Open `src/styles/global.css`. Add the following block at the very top of the file, before the `:root {` block:

```css
@font-face {
  font-family: 'Archivo';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/archivo-400.woff2') format('woff2');
}

@font-face {
  font-family: 'Archivo';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('/fonts/archivo-500.woff2') format('woff2');
}

@font-face {
  font-family: 'Archivo';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('/fonts/archivo-600.woff2') format('woff2');
}

@font-face {
  font-family: 'Archivo Expanded';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/archivo-expanded-700.woff2') format('woff2');
}

@font-face {
  font-family: 'Archivo Expanded';
  font-style: normal;
  font-weight: 800;
  font-display: swap;
  src: url('/fonts/archivo-expanded-800.woff2') format('woff2');
}
```

- [ ] **Step 5: Update `src/layouts/Layout.astro` — remove Google Fonts, add preloads**

In `src/layouts/Layout.astro`, remove these three lines:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Archivo+Expanded:wght@700;800&family=Archivo:wght@400;500;600&display=swap"
  rel="stylesheet"
/>
```

Replace them with these three preload links:

```html
<link rel="preload" href="/fonts/archivo-400.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/fonts/archivo-expanded-700.woff2" as="font" type="font/woff2" crossorigin />
<link rel="preload" href="/fonts/archivo-expanded-800.woff2" as="font" type="font/woff2" crossorigin />
```

- [ ] **Step 6: Verify fonts load in the browser**

```bash
pnpm dev
```

Open `http://localhost:4321/conferences/tanstack-db/` in Chrome. Open DevTools → Network tab → filter by "Font". Reload the page.

Expected: 3 font requests to `/fonts/archivo-400.woff2`, `/fonts/archivo-expanded-700.woff2`, `/fonts/archivo-expanded-800.woff2` show as preloaded (initiator: `<link rel=preload>`). The page typography (headings and body text) must look identical to before. No Google Fonts requests should appear.

---

### Task 2: Fix hero LCP — replace CSS background with `<Image>`

**Files:**
- Modify: `src/pages/conferences/[...slug].astro`
- Modify: `src/components/ConferenceHero.astro`

**Interfaces:**
- Consumes: `thumbnail: ImageMetadata | undefined` prop already passed to `ConferenceHero` from `[...slug].astro`.
- Produces: A real `<img>` element with `fetchpriority="high"` that the browser preload scanner can discover and the LCP detector can measure. Blur-up UX preserved.

- [ ] **Step 1: Remove the dead preload from `src/pages/conferences/[...slug].astro`**

Open `src/pages/conferences/[...slug].astro`. Make the following changes:

Remove the import line:
```ts
import { getImage } from "astro:assets";
```

Remove the `heroPreloadImage` variable (lines after the `const { ... } = conference.data;` destructure):
```ts
const heroPreloadImage = thumbnail
  ? await getImage({ src: thumbnail, format: "avif", width: 2600, height: 1500 })
  : undefined;
```

Remove the preload link block from the template:
```astro
{heroPreloadImage && (
  <link
    slot="head"
    rel="preload"
    as="image"
    href={heroPreloadImage.src}
    fetchpriority="high"
  />
)}
```

The frontmatter should now start like this after the change:
```ts
import { getCollection, getEntry, render } from "astro:content";
import Layout from "../../layouts/Layout.astro";
import SectionLabel from "../../components/SectionLabel.astro";
import ConferenceHero from "../../components/ConferenceHero.astro";
import ConferenceEventsList from "../../components/ConferenceEventsList.astro";
import ConferenceGallery from "../../components/ConferenceGallery.astro";
import ConferenceSpeakers from "../../components/ConferenceSpeakers.astro";
import ConferenceMap from "../../components/ConferenceMap.astro";

export async function getStaticPaths() {
  const conferences = await getCollection("conferences");
  return conferences.map((conference) => ({
    params: { slug: conference.id },
    props: { conference },
  }));
}

const { conference } = Astro.props;
const { Content } = await render(conference);
const { title, events, authors, tags, thumbnail, photos, slides, videoLink } = conference.data;
const coSpeaker = authors ? await getEntry(authors) : null;
```

- [ ] **Step 2: Replace the hidden image trigger with a real `<Image>` in `ConferenceHero.astro`**

Open `src/components/ConferenceHero.astro`.

In the frontmatter, change the import from:
```ts
import { getImage } from "astro:assets";
```
to:
```ts
import { getImage, Image } from "astro:assets";
```

Remove the `backgroundImage` variable entirely:
```ts
const backgroundImage = thumbnail
  ? await getImage({ src: thumbnail, format: "avif", width: 1600, height: 900 })
  : undefined;
```

The `placeholderImage` variable stays unchanged.

- [ ] **Step 3: Replace the template elements in `ConferenceHero.astro`**

In the template, find and remove this block (the full-res CSS background div):
```astro
{thumbnail && (
  <div
    class="hero-bg-full"
    aria-hidden="true"
    style={`background-image: url('${backgroundImage?.src}')`}
  />
)}
```

And remove this block (the hidden trigger image):
```astro
{thumbnail && (
  <img
    class="hero-preload-trigger"
    src={backgroundImage?.src}
    aria-hidden="true"
    alt=""
  />
)}
```

In their place, add one `<Image>` block (keep the `hero-bg-placeholder` div above it unchanged):
```astro
{thumbnail && (
  <Image
    src={thumbnail}
    widths={[800, 1200, 1600]}
    sizes="100vw"
    format="avif"
    fetchpriority="high"
    loading="eager"
    class="hero-bg-img"
    alt=""
    aria-hidden="true"
  />
)}
```

- [ ] **Step 4: Update the CSS in `ConferenceHero.astro`**

The `<style>` block has a shared selector that must be split, plus rules to remove and add.

**a) Split the shared selector** — find:
```css
.hero-bg-placeholder,
.hero-bg-full {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}
```
Replace with (`.hero-bg-full` removed from selector):
```css
.hero-bg-placeholder {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}
```

**b) Remove these rule blocks** (`.hero-bg-full`, its loaded state, and `.hero-preload-trigger`):
```css
.hero-bg-full {
  opacity: 0;
  transition: opacity 0.4s ease;
}

.hero--loaded .hero-bg-full {
  opacity: 1;
}

.hero-preload-trigger {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
}
```

**c) Add the new image rules** after the `.hero-bg-placeholder { filter: blur... }` block:
```css
.hero-bg-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.hero--loaded .hero-bg-img {
  opacity: 1;
}
```

The `.hero--loaded .hero-bg-placeholder { opacity: 0; }` rule already present stays unchanged.

- [ ] **Step 5: Update the JS in `ConferenceHero.astro`**

In the `<script>` block, find the `initHeroLqip` function:

```ts
function initHeroLqip() {
  const trigger = document.querySelector(
    ".hero-preload-trigger"
  ) as HTMLImageElement | null;
  const hero = document.querySelector(".hero") as HTMLElement | null;
  if (trigger && hero) {
    if (trigger.complete) {
      hero.classList.add("hero--loaded");
    } else {
      trigger.addEventListener("load", () =>
        hero.classList.add("hero--loaded")
      );
    }
  }
}
```

Replace it with:

```ts
function initHeroLqip() {
  const img = document.querySelector(".hero-bg-img") as HTMLImageElement | null;
  const hero = document.querySelector(".hero") as HTMLElement | null;
  if (img && hero) {
    if (img.complete) {
      hero.classList.add("hero--loaded");
    } else {
      img.addEventListener("load", () => hero.classList.add("hero--loaded"));
    }
  }
}
```

- [ ] **Step 6: Verify blur-up still works**

```bash
pnpm dev
```

Open `http://localhost:4321/conferences/tanstack-db/` in Chrome. Open DevTools → Network tab → set to "Slow 3G" throttling. Reload.

Expected:
- Immediately: blurred low-res placeholder visible (no black flash)
- After a moment: hero image fades in smoothly
- In DevTools → Network: a request for `/_astro/devlille.*.avif` appears with `Priority: Highest`
- There should be a srcset with 800w, 1200w, 1600w variants

Also run type-check:
```bash
pnpm astro check
```
Expected: no errors.

---

### Task 3: Cloudflare cache headers

**Files:**
- Create: `public/_headers`

**Interfaces:**
- Produces: Cloudflare Pages reads `public/_headers` at deploy time and injects `Cache-Control` headers for matching routes. No runtime code needed.

- [ ] **Step 1: Create `public/_headers`**

Create `public/_headers` with the following content:

```
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=31536000, immutable
```

- [ ] **Step 2: Verify the file is in the build output**

```bash
pnpm build
```

Expected: build succeeds with no errors.

```bash
ls dist/_headers
```

Expected: file exists at `dist/_headers`.

```bash
cat dist/_headers
```

Expected output:
```
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=31536000, immutable
```

Cloudflare Pages will apply these headers when the `dist/` directory is deployed. After deploying, verify in Chrome DevTools → Network → click any `/_astro/*.avif` file → Headers tab → `Cache-Control: public, max-age=31536000, immutable`.
