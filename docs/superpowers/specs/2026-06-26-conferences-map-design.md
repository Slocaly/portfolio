# Conferences Map View ("Par lieu") — Design Spec

## Overview

Add a fourth tab "Par lieu" to the conferences section that renders a fully interactive map (pan, zoom) showing where talks have been given. Each unique city becomes a pin; hovering/clicking a pin shows a tooltip listing the talks that took place there.

---

## Data layer

**File:** `src/lib/conferences.ts`

Extend `TalkEvent` with coordinates:

```ts
export type TalkEvent = {
  conf: string;
  dateMs: number;
  loc: string;
  lat: number;   // ← new
  lng: number;   // ← new
  fb: string | null;
  vid: string | null;
};
```

In `getTalks()`, map `e.location.lat` and `e.location.lng` through alongside existing fields. No schema change — the data is already present in every `.mdx` event.

---

## Routing & tab

**File:** `src/components/ConferencesHeader.astro`

- Add `"lieu"` to the `activeTab` union type.
- Add a tab link: `<a href="/conferences/lieu">Par lieu</a>` after "Par conférence".

**New file:** `src/pages/conferences/lieu.astro`

Follows the exact pattern of `talk.astro` / `conference.astro`:
- Imports `getTalks()`, `getConferenceStats()`
- Renders `<Navigation />` + `<ConferencesHeader stats={stats} activeTab="lieu" />`
- Below the header: a full-bleed `<div id="map">` with grouped pin data as `data-pins` JSON attribute

---

## Map implementation

**Library:** `leaflet` + `@types/leaflet` installed as npm packages (no CDN).

**Tile providers:**
- Light: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`
- Dark: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`

**Pin data grouping (build-time, in the Astro frontmatter):**

```ts
type PinData = {
  loc: string;
  lat: number;
  lng: number;
  talks: { conf: string; title: string; link: string }[];
};
```

Events are grouped by `loc` string. Each unique city → one `PinData` entry with all its associated talks.

**Markers:**
- `L.circleMarker` styled with `--color-accent` (filled circle, no default Leaflet icon)
- Radius: `7px` base; cities with 3+ events: `9px`
- Stroke: white/dark depending on theme, width `2px`

**Tooltips:**
- `L.popup` bound to each marker
- Content: city name (bold) + bulleted list of `conf — talk title` (linked to `/conferences/{id}`)
- Fully CSS-overridden to match the site's card/border style

**Dark mode tile swap:**
- On page load: read `document.documentElement.dataset.theme`
- `MutationObserver` on `<html>` watches `data-theme` attribute changes
- On change: remove old tile layer, add new one — Leaflet handles this cleanly

**Map sizing:**
- `height: calc(100vh - 220px)` (below sticky tab bar)
- `min-height: 400px`
- Full container width, no side padding

**Initial view:**
- Center: France (`[46.5, 2.3]`)
- Zoom: `6` (shows all of metropolitan France)

---

## File changes summary

| File | Action |
|---|---|
| `src/lib/conferences.ts` | Add `lat`/`lng` to `TalkEvent`, map through in `getTalks()` |
| `src/components/ConferencesHeader.astro` | Add `"lieu"` tab and type |
| `src/pages/conferences/lieu.astro` | New page |

No new components, no React, no adapter changes.
