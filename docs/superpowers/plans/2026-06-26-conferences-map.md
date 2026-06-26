# Conferences Map View ("Par lieu") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Par lieu" tab to the conferences section that renders a Leaflet map showing all talk locations as interactive pins with city tooltips.

**Architecture:** Three small file changes — extend the data type, add a tab, create a new page. Leaflet runs in the browser via an Astro `<script>` module. The Astro page computes pin data at build time and passes it as JSON to the script via a `data-pins` attribute. The site uses `<ClientRouter>` (View Transitions), so the map is initialized inside an `astro:page-load` listener.

**Tech Stack:** Astro (static), Leaflet 1.x, Carto tile provider (no API key required), TypeScript.

## Global Constraints

- Package manager: `pnpm` — all install commands use `pnpm add`
- No test suite — verification is done by running `pnpm dev` and checking in the browser
- Type-check command: `pnpm astro check`
- Color tokens come from CSS custom properties defined in `src/styles/global.css`; `--color-accent` is `#a4533c` (light) / `#c06350` (dark)
- The site uses Astro `<ClientRouter>` for View Transitions — scripts must use `astro:page-load` to re-run on SPA navigation
- Leaflet `circleMarker` options do not accept CSS variables — read accent color via `getComputedStyle` at runtime

---

### Task 1: Extend TalkEvent with lat/lng

**Files:**
- Modify: `src/lib/conferences.ts`

**Interfaces:**
- Produces: `TalkEvent` type with `lat: number` and `lng: number` fields; consumed by Task 3's page

- [ ] **Step 1: Add `lat` and `lng` to the `TalkEvent` type**

In `src/lib/conferences.ts`, update the type (lines 18–24):

```ts
export type TalkEvent = {
  conf: string;
  dateMs: number;
  loc: string;
  lat: number;
  lng: number;
  fb: string | null;
  vid: string | null;
};
```

- [ ] **Step 2: Map the new fields through in `getTalks()`**

In `src/lib/conferences.ts`, update the `events` mapping inside `getTalks()` (around line 67):

```ts
events: conf.data.events.map((e) => ({
  conf: e.name,
  dateMs: e.date.getTime(),
  loc: e.location.name,
  lat: e.location.lat,
  lng: e.location.lng,
  fb: e.feedbackLink ?? null,
  vid: e.videoLink ?? null,
})),
```

- [ ] **Step 3: Type-check**

```bash
pnpm astro check
```

Expected: 0 errors. (The `loc` field is already used in `conferences.astro` as `ev.loc` — no consumer breaks because we only added new fields.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/conferences.ts
git commit -m "feat: add lat/lng to TalkEvent"
```

---

### Task 2: Add "Par lieu" tab to ConferencesHeader

**Files:**
- Modify: `src/components/ConferencesHeader.astro`

**Interfaces:**
- Consumes: `activeTab` prop (currently `"date" | "talk" | "conference"`)
- Produces: updated `activeTab` type `"date" | "talk" | "conference" | "lieu"` and a new tab link at `/conferences/lieu`

- [ ] **Step 1: Add `"lieu"` to the `activeTab` type**

In `src/components/ConferencesHeader.astro`, update the Props interface (lines 4–8):

```ts
interface Props {
  stats: ConferenceStats;
  activeTab: "date" | "talk" | "conference" | "lieu";
}
```

- [ ] **Step 2: Add the "Par lieu" tab link**

In `src/components/ConferencesHeader.astro`, after the "Par conférence" `<a>` tag (around line 57), add:

```html
<a
  href="/conferences/lieu"
  class:list={["tab", { "tab--active": activeTab === "lieu" }]}
>
  Par lieu
</a>
```

- [ ] **Step 3: Verify in browser**

```bash
pnpm dev
```

Open `http://localhost:4321/conferences`. The tab bar should now show four tabs: Par date · Par talk · Par conférence · Par lieu. Clicking "Par lieu" should 404 (page not created yet) — that's expected.

- [ ] **Step 4: Commit**

```bash
git add src/components/ConferencesHeader.astro
git commit -m "feat: add Par lieu tab to ConferencesHeader"
```

---

### Task 3: Install Leaflet and create the map page

**Files:**
- Create: `src/pages/conferences/lieu.astro`

**Interfaces:**
- Consumes: `getTalks()` → `Talk[]` where `Talk.events[].lat` and `Talk.events[].lng` exist (Task 1)
- Consumes: `getConferenceStats()` → `ConferenceStats` (already used by other pages)
- Consumes: `ConferencesHeader` with `activeTab="lieu"` (Task 2)

- [ ] **Step 1: Install Leaflet**

```bash
pnpm add leaflet @types/leaflet
```

Expected: both packages appear in `package.json` dependencies / devDependencies.

- [ ] **Step 2: Create `src/pages/conferences/lieu.astro`**

Create the file with this exact content:

```astro
---
import { getTalks, getConferenceStats } from "../../lib/conferences";
import Layout from "../../layouts/Layout.astro";
import Navigation from "../../components/Navigation.astro";
import ConferencesHeader from "../../components/ConferencesHeader.astro";

const talks = await getTalks();
const stats = getConferenceStats(talks);

type PinData = {
  loc: string;
  lat: number;
  lng: number;
  talks: { conf: string; title: string; link: string }[];
};

const pinMap = new Map<string, PinData>();
for (const talk of talks) {
  for (const ev of talk.events) {
    const existing = pinMap.get(ev.loc);
    if (existing) {
      existing.talks.push({ conf: ev.conf, title: talk.title, link: talk.link });
    } else {
      pinMap.set(ev.loc, {
        loc: ev.loc,
        lat: ev.lat,
        lng: ev.lng,
        talks: [{ conf: ev.conf, title: talk.title, link: talk.link }],
      });
    }
  }
}
const pins = [...pinMap.values()];
---

<Layout
  title="Conférences — Par lieu — Lucas Audart"
  description="Carte des villes où Lucas Audart a donné des conférences en tant que speaker."
>
  <header class="site-header">
    <Navigation />
  </header>

  <ConferencesHeader stats={stats} activeTab="lieu" />

  <div id="map" data-pins={JSON.stringify(pins)}></div>
</Layout>

<style is:global>
  @import 'leaflet/dist/leaflet.css';

  .leaflet-popup-content-wrapper {
    background: var(--color-bg-elevated);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    padding: 0;
  }

  .leaflet-popup-content {
    margin: 0;
  }

  .leaflet-popup-tip {
    background: var(--color-bg-elevated);
  }

  .leaflet-popup-close-button {
    color: var(--color-muted) !important;
    top: 0.5rem !important;
    right: 0.5rem !important;
  }

  .map-popup {
    padding: 0.875rem 1rem 0.875rem;
    min-width: 180px;
  }

  .map-popup-city {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--color-text);
    margin-bottom: 0.5rem;
  }

  .map-popup-talks {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .map-popup-talks li a {
    font-size: 0.78rem;
    color: var(--color-muted);
    text-decoration: none;
    line-height: 1.4;
    display: block;
  }

  .map-popup-talks li a:hover {
    color: var(--color-accent);
  }
</style>

<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 20;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
  }

  #map {
    height: calc(100vh - 220px);
    min-height: 400px;
    width: 100%;
    z-index: 0;
  }
</style>

<script>
  import L from "leaflet";

  type PinData = {
    loc: string;
    lat: number;
    lng: number;
    talks: { conf: string; title: string; link: string }[];
  };

  const TILES = {
    light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  };
  const ATTR =
    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>';

  const isDark = () => document.documentElement.dataset.theme === "dark";

  document.addEventListener("astro:page-load", () => {
    const el = document.getElementById("map");
    if (!el) return;

    const pins = JSON.parse(el.dataset.pins!) as PinData[];

    const map = L.map("map").setView([46.5, 2.3], 6);

    let tileLayer = L.tileLayer(isDark() ? TILES.dark : TILES.light, {
      attribution: ATTR,
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    new MutationObserver(() => {
      tileLayer.setUrl(isDark() ? TILES.dark : TILES.light);
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const accentColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-accent")
      .trim();

    for (const pin of pins) {
      const radius = pin.talks.length >= 3 ? 9 : 7;
      const marker = L.circleMarker([pin.lat, pin.lng], {
        radius,
        fillColor: accentColor,
        color: isDark() ? "#1a1916" : "#ffffff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      });

      const talksHtml = pin.talks
        .map((t) => `<li><a href="${t.link}">${t.conf} — ${t.title}</a></li>`)
        .join("");

      marker.bindPopup(
        `<div class="map-popup"><div class="map-popup-city">${pin.loc}</div><ul class="map-popup-talks">${talksHtml}</ul></div>`,
        { maxWidth: 280 }
      );
      marker.addTo(map);
    }
  });
</script>
```

- [ ] **Step 3: Type-check**

```bash
pnpm astro check
```

Expected: 0 errors.

- [ ] **Step 4: Verify in browser**

```bash
pnpm dev
```

Open `http://localhost:4321/conferences/lieu`. Verify:
- The "Par lieu" tab is active (underlined with accent color)
- A map fills the area below the tab bar, centered on France
- City pins (filled accent-colored circles) appear for each unique location
- Clicking a pin opens a popup showing the city name and a list of conference talks
- Links in the popup navigate to the correct talk page
- Toggling dark mode (if available) switches the map tiles from light to dark

- [ ] **Step 5: Commit**

```bash
git add src/pages/conferences/lieu.astro package.json pnpm-lock.yaml
git commit -m "feat: add Par lieu map view to conferences"
```
