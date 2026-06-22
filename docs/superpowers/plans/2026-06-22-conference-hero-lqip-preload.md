# Conference Hero — LQIP Blur-up + Preload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the perceived load time of the conference detail page hero by adding a `<link rel="preload">` for the hero image and an LQIP blur-up placeholder that cross-fades to the full image on load.

**Architecture:** `Layout.astro` gains a named head slot so pages can inject `<link rel="preload">`. `ConferenceHero.astro` generates a 20px thumbnail at build time and renders it blurred as a placeholder layer; a hidden `<img>` fires a `load` event that triggers the CSS cross-fade to the full image. `[...slug].astro` calls `getImage` for the preload URL and passes the `<link>` tag into the head slot.

**Tech Stack:** Astro 5, `astro:assets` (`getImage`), CSS transitions, vanilla JS with `astro:page-load` for view-transition compatibility.

## Global Constraints

- No new npm dependencies.
- Preload URL and hero URL must use identical `getImage` params (`format: "avif"`, `width: 1600`, `height: 900`) so the browser reuses the same cached response.
- No commits — user manages git.

---

### Task 1: Add `<slot name="head">` to Layout.astro

**Files:**
- Modify: `src/layouts/Layout.astro:82`

**Interfaces:**
- Produces: `<slot name="head" />` available to all pages for injecting `<link rel="preload">` and other head-level tags.

- [ ] **Step 1: Add the slot just before `</head>`**

In `src/layouts/Layout.astro`, replace the closing `</head>` line (currently line 82):

```astro
		</script>
	</head>
```

with:

```astro
		</script>
		<slot name="head" />
	</head>
```

- [ ] **Step 2: Verify existing pages are unaffected**

Run: `pnpm dev`

Navigate to `/`, `/about`, `/conferences` in the browser. Open DevTools → Elements → `<head>`. Check that no extra elements appear and the pages render normally.

---

### Task 2: Add LQIP blur-up to ConferenceHero.astro

**Files:**
- Modify: `src/components/ConferenceHero.astro`

**Interfaces:**
- Consumes: `thumbnail?: ImageMetadata` (existing prop, unchanged)
- Produces: `.hero--loaded` CSS class toggled by JS when the full image is cached; `.hero-bg-placeholder` and `.hero-bg-full` absolutely-positioned layers inside `.hero`.

- [ ] **Step 1: Add the placeholder `getImage` call in the frontmatter**

In `src/components/ConferenceHero.astro`, after the existing `backgroundImage` call, add:

```astro
const placeholderImage = thumbnail
  ? await getImage({ src: thumbnail, format: "avif", width: 20 })
  : undefined;
```

Full frontmatter after the change:

```astro
---
import { getImage } from "astro:assets";

interface Props {
  title: string;
  tags: string[];
  eventsCount: number;
  thumbnail?: ImageMetadata;
  coSpeaker?: {
    name: string;
  };
}

const { title, tags, eventsCount, thumbnail, coSpeaker } = Astro.props;

const backgroundImage = thumbnail
  ? await getImage({ src: thumbnail, format: "avif", width: 1600, height: 900 })
  : undefined;

const placeholderImage = thumbnail
  ? await getImage({ src: thumbnail, format: "avif", width: 20 })
  : undefined;
---
```

- [ ] **Step 2: Restructure the `.hero` div to use layered backgrounds**

Replace the opening `<div class="hero" ...>` and its `style` attribute with a plain `<div class="hero">`, then add three new elements as the first children (before `.hero-gradient`):

```astro
<div class="hero">
  {thumbnail && (
    <div
      class="hero-bg-placeholder"
      aria-hidden="true"
      style={`background-image: url('${placeholderImage?.src}')`}
    />
  )}
  {thumbnail && (
    <div
      class="hero-bg-full"
      aria-hidden="true"
      style={`background-image: url('${backgroundImage?.src}')`}
    />
  )}
  {thumbnail && (
    <img
      class="hero-preload-trigger"
      src={backgroundImage?.src}
      aria-hidden="true"
      alt=""
    />
  )}
  <div class="hero-gradient" aria-hidden="true"></div>
  <!-- rest of existing hero-top-bar and hero-content divs unchanged -->
```

- [ ] **Step 3: Update the `.hero` CSS and add styles for the new layers**

In the `<style>` block, replace the `.hero` rule to remove the now-unused `background-size` and `background-position` properties, and add the new layer rules:

Replace:
```css
.hero {
  position: relative;
  height: clamp(420px, 52vh, 800px);
  background-color: #1a1915;
  background-size: cover;
  background-position: center;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
```

With:
```css
.hero {
  position: relative;
  height: clamp(420px, 52vh, 800px);
  background-color: #1a1915;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.hero-bg-placeholder,
.hero-bg-full {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}

.hero-bg-placeholder {
  filter: blur(20px);
  transform: scale(1.1);
  transition: opacity 0.4s ease;
}

.hero-bg-full {
  opacity: 0;
  transition: opacity 0.4s ease;
}

.hero--loaded .hero-bg-full {
  opacity: 1;
}

.hero--loaded .hero-bg-placeholder {
  opacity: 0;
}

.hero-preload-trigger {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
}
```

- [ ] **Step 4: Add the LQIP script to the existing `<script>` block**

The existing `<script>` block handles the back-link. Append the LQIP initializer to the same block, using `astro:page-load` so it re-runs after every view-transition navigation:

```astro
<script>
  const link = document.getElementById("back-link") as HTMLAnchorElement | null;
  if (link) {
    const stored = sessionStorage.getItem("conferences-back");
    if (stored) link.href = stored;
  }

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
  document.addEventListener("astro:page-load", initHeroLqip);
</script>
```

- [ ] **Step 5: Verify the blur-up in the browser**

Run: `pnpm dev`

Navigate to any conference detail page (e.g. `/conferences/<slug>`). Open DevTools → Network → throttle to "Slow 3G". Hard-reload. You should see:
- The blurred placeholder appear immediately as the page paints.
- The sharp hero image cross-fade in once the full AVIF finishes loading.
- No layout shift — the hero area maintains its height throughout.

Check DevTools → Elements → `.hero`: after the image loads, it should have class `hero hero--loaded`.

---

### Task 3: Add preload link in `[...slug].astro`

**Files:**
- Modify: `src/pages/conferences/[...slug].astro`

**Interfaces:**
- Consumes: `<slot name="head" />` added to `Layout.astro` in Task 1; `thumbnail` from conference data.
- Produces: `<link rel="preload" as="image" fetchpriority="high">` in `<head>` for pages with a thumbnail.

- [ ] **Step 1: Import `getImage` and generate the preload URL**

In `src/pages/conferences/[...slug].astro`, add the `getImage` import and generate the preload image after the existing frontmatter:

```astro
---
import { getCollection, getEntry, render } from "astro:content";
import { getImage } from "astro:assets";
import Layout from "../../layouts/Layout.astro";
import Navigation from "../../components/Navigation.astro";
import SectionLabel from "../../components/SectionLabel.astro";
import ConferenceHero from "../../components/ConferenceHero.astro";
import ConferenceEventsList from "../../components/ConferenceEventsList.astro";
import ConferenceGallery from "../../components/ConferenceGallery.astro";
import ConferenceSpeakers from "../../components/ConferenceSpeakers.astro";

export async function getStaticPaths() {
  const conferences = await getCollection("conferences");
  return conferences.map((conference) => ({
    params: { slug: conference.id },
    props: { conference },
  }));
}

const { conference } = Astro.props;
const { Content } = await render(conference);
const { title, events, authors, tags, thumbnail, photos } = conference.data;
const coSpeaker = authors ? await getEntry(authors) : null;

const heroPreloadImage = thumbnail
  ? await getImage({ src: thumbnail, format: "avif", width: 1600, height: 900 })
  : undefined;
---
```

- [ ] **Step 2: Inject the preload link into the head slot**

In the template, add the `<link>` as the first child of `<Layout>`, right above the `<header>`:

```astro
<Layout title={`${title} — Lucas Audart`}>
  {heroPreloadImage && (
    <link
      slot="head"
      rel="preload"
      as="image"
      href={heroPreloadImage.src}
      fetchpriority="high"
    />
  )}
  <header class="site-header">
    <Navigation />
  </header>
  <!-- rest unchanged -->
```

- [ ] **Step 3: Verify the preload tag in the browser**

Run: `pnpm dev`

Navigate to a conference detail page. Open DevTools → Elements → `<head>`. Confirm a `<link rel="preload" as="image" fetchpriority="high" href="...avif...">` is present.

Open DevTools → Network. Hard-reload. The hero AVIF should appear in the waterfall with `Initiator: preload` and start downloading immediately (before the CSS fires).

- [ ] **Step 4: Verify pages without thumbnails are unaffected**

Navigate to a conference page that has no thumbnail (if one exists). Confirm no `<link rel="preload">` appears in `<head>` and the hero still renders the dark fallback background correctly.
