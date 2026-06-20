# Conférences — Pages Astro séparées

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la page `/conferences` (rendu JS côté client, 4 onglets) par 3 pages Astro distinctes rendues côté serveur, en supprimant l'onglet Map.

**Architecture:** Un helper `src/lib/conferences.ts` centralise la logique de données (fetch, transformation, stats). Un composant `ConferencesHeader.astro` rend le hero et la barre de navigation entre les 3 pages. Chaque page (`/conferences`, `/conferences/talk`, `/conferences/conference`) est autonome et rend son contenu en syntaxe Astro pure, sans JavaScript côté client.

**Tech Stack:** Astro, TypeScript, `astro:content` (getCollection / getEntry), pnpm

## Contraintes globales

- Pas de JavaScript côté client pour les vues (zéro `<script>` dans les nouvelles pages)
- Routes statiques Astro : `talk.astro` et `conference.astro` ont priorité sur `[...slug].astro`
- Pas de test suite — vérification via `pnpm astro check` (types) et `pnpm build`
- Pas de dépendance Leaflet à ajouter
- Conserver l'identité visuelle exacte (CSS classes, couleurs, layout) des vues actuelles

---

## Fichiers concernés

| Action | Fichier |
|--------|---------|
| Créer | `src/lib/conferences.ts` |
| Créer | `src/components/ConferencesHeader.astro` |
| Réécrire | `src/pages/conferences.astro` |
| Créer | `src/pages/conferences/talk.astro` |
| Créer | `src/pages/conferences/conference.astro` |
| Inchangé | `src/pages/conferences/[...slug].astro` |

---

## Task 1 : Helper de données `src/lib/conferences.ts`

**Files:**
- Create: `src/lib/conferences.ts`

**Interfaces:**
- Consumes: `astro:content` — `getCollection("conferences")`, `getEntry(ref)`
- Produces:
  - `type TalkEvent = { conf: string; dateMs: number; loc: string; fb: string | null; vid: string | null; }`
  - `type Talk = { id: string; title: string; description: string; tags: string[]; authorLabel: string; link: string; events: TalkEvent[]; }`
  - `type ConferenceStats = { totalTalks: number; totalEvents: number; totalCities: number; minYear: number; }`
  - `async function getTalks(): Promise<Talk[]>`
  - `function getConferenceStats(talks: Talk[]): ConferenceStats`
  - `function fmtDate(ms: number): string` — ex: "12 juin"
  - `function fmtDateFull(ms: number): string` — ex: "12 juin 2025"

- [ ] **Créer `src/lib/conferences.ts` avec ce contenu exact :**

```typescript
import { getCollection, getEntry } from "astro:content";

const MONTHS = [
  "jan.", "fév.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

export function fmtDate(ms: number): string {
  const d = new Date(ms);
  return d.getDate() + " " + MONTHS[d.getMonth()];
}

export function fmtDateFull(ms: number): string {
  const d = new Date(ms);
  return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
}

export type TalkEvent = {
  conf: string;
  dateMs: number;
  loc: string;
  fb: string | null;
  vid: string | null;
};

export type Talk = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  authorLabel: string;
  link: string;
  events: TalkEvent[];
};

export type ConferenceStats = {
  totalTalks: number;
  totalEvents: number;
  totalCities: number;
  minYear: number;
};

export async function getTalks(): Promise<Talk[]> {
  const conferences = await getCollection("conferences");

  const talks = await Promise.all(
    conferences.map(async (conf) => {
      const coSpeaker = conf.data.authors
        ? await getEntry(conf.data.authors)
        : null;

      const shortDesc = (conf.data.abstract ?? "")
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
        .trim()
        .slice(0, 130)
        .concat("...");

      return {
        id: conf.id,
        title: conf.data.title,
        description: shortDesc,
        tags: conf.data.tags,
        authorLabel: coSpeaker
          ? `Lucas Audart & ${coSpeaker.data.name}`
          : "Lucas Audart",
        link: `/conferences/${conf.id}`,
        events: conf.data.events.map((e) => ({
          conf: e.name,
          dateMs: e.date.getTime(),
          loc: e.location.name,
          fb: e.feedbackLink ?? null,
          vid: e.videoLink ?? null,
        })),
      };
    }),
  );

  talks.sort((a, b) => {
    const maxA = Math.max(...a.events.map((e) => e.dateMs));
    const maxB = Math.max(...b.events.map((e) => e.dateMs));
    return maxB - maxA;
  });

  return talks;
}

export function getConferenceStats(talks: Talk[]): ConferenceStats {
  const totalTalks = talks.length;
  const totalEvents = talks.reduce((sum, t) => sum + t.events.length, 0);
  const uniqueCities = new Set(talks.flatMap((t) => t.events.map((e) => e.loc)));
  const totalCities = uniqueCities.size;
  const allYears = talks.flatMap((t) =>
    t.events.map((e) => new Date(e.dateMs).getFullYear()),
  );
  const minYear = Math.min(...allYears);
  return { totalTalks, totalEvents, totalCities, minYear };
}
```

- [ ] **Vérifier les types :**

```bash
pnpm astro check
```

Attendu : aucune erreur dans `src/lib/conferences.ts`.

---

## Task 2 : Composant `ConferencesHeader.astro`

**Files:**
- Create: `src/components/ConferencesHeader.astro`

**Interfaces:**
- Consumes: `ConferenceStats` de `src/lib/conferences.ts`
- Produces: composant Astro avec props `{ stats: ConferenceStats, activeTab: 'date' | 'talk' | 'conference' }`

- [ ] **Créer `src/components/ConferencesHeader.astro` avec ce contenu exact :**

```astro
---
import type { ConferenceStats } from "../lib/conferences";

interface Props {
  stats: ConferenceStats;
  activeTab: "date" | "talk" | "conference";
}

const { stats, activeTab } = Astro.props;
---

<section class="hero">
  <div class="container">
    <div class="hero-eyebrow">
      <span class="hero-line"></span>
      <span class="hero-author">Lucas Audart</span>
    </div>
    <h1 class="hero-title">Conférences</h1>
    <div class="stats">
      <div class="stat">
        <span class="stat-num">{stats.totalTalks}</span>
        <span class="stat-label">Talks</span>
      </div>
      <div class="stat-divider" aria-hidden="true"></div>
      <div class="stat">
        <span class="stat-num">{stats.totalEvents}</span>
        <span class="stat-label">Événements</span>
      </div>
      <div class="stat-divider" aria-hidden="true"></div>
      <div class="stat">
        <span class="stat-num">{stats.totalCities}</span>
        <span class="stat-label">Villes</span>
      </div>
      <div class="stat-divider" aria-hidden="true"></div>
      <div class="stat">
        <span class="stat-num">{stats.minYear}–</span>
        <span class="stat-label">Aujourd'hui</span>
      </div>
    </div>
  </div>
</section>

<div class="tab-bar">
  <div class="container tab-row">
    <a
      href="/conferences"
      class:list={["tab", { "tab--active": activeTab === "date" }]}
    >Par date</a>
    <a
      href="/conferences/talk"
      class:list={["tab", { "tab--active": activeTab === "talk" }]}
    >Par talk</a>
    <a
      href="/conferences/conference"
      class:list={["tab", { "tab--active": activeTab === "conference" }]}
    >Par conférence</a>
  </div>
</div>

<style>
  .container {
    max-width: 72rem;
    margin: 0 auto;
    padding: 0 2rem;
  }

  /* Hero */
  .hero {
    padding: 4.5rem 0 3.5rem;
  }

  .hero-eyebrow {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    margin-bottom: 1.5rem;
  }

  .hero-line {
    display: block;
    width: 1.75rem;
    height: 1px;
    background: var(--color-accent);
    flex-shrink: 0;
  }

  .hero-author {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-accent);
  }

  .hero-title {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: clamp(2.75rem, 6vw, 5rem);
    letter-spacing: -0.025em;
    color: var(--color-text);
    line-height: 1;
    margin: 0 0 3rem;
  }

  .stats {
    display: flex;
    align-items: center;
    gap: 2.5rem;
    flex-wrap: wrap;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .stat-num {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 2.25rem;
    color: var(--color-text);
    letter-spacing: -0.03em;
    line-height: 1;
  }

  .stat-label {
    font-size: 0.67rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-muted);
  }

  .stat-divider {
    width: 1px;
    height: 2.75rem;
    background: var(--color-border);
    flex-shrink: 0;
  }

  /* Tab bar */
  .tab-bar {
    position: sticky;
    top: 3.25rem;
    z-index: 19;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
  }

  .tab-row {
    display: flex;
    align-items: flex-end;
    overflow-x: auto;
  }

  .tab {
    padding: 0.875rem 1.25rem;
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    margin-bottom: -1px;
    line-height: 1;
    color: var(--color-muted);
    white-space: nowrap;
    transition: color 0.1s;
    text-decoration: none;
    display: inline-block;
  }

  .tab:hover {
    color: var(--color-text);
  }

  .tab--active {
    font-weight: 600;
    border-bottom-color: var(--color-accent);
    color: var(--color-text);
  }
</style>
```

- [ ] **Vérifier les types :**

```bash
pnpm astro check
```

Attendu : aucune erreur dans `src/components/ConferencesHeader.astro`.

---

## Task 3 : Réécriture de `src/pages/conferences.astro` (vue "Par date")

**Files:**
- Modify: `src/pages/conferences.astro` (réécriture complète)

**Interfaces:**
- Consumes: `getTalks`, `getConferenceStats`, `fmtDate` de `src/lib/conferences.ts`
- Consumes: `ConferencesHeader` de `src/components/ConferencesHeader.astro`

- [ ] **Remplacer intégralement `src/pages/conferences.astro` par ce contenu :**

```astro
---
import { getTalks, getConferenceStats, fmtDate } from "../lib/conferences";
import Layout from "../layouts/Layout.astro";
import Navigation from "../components/Navigation.astro";
import ConferencesHeader from "../components/ConferencesHeader.astro";

const talks = await getTalks();
const stats = getConferenceStats(talks);

type EventRow = {
  conf: string;
  dateMs: number;
  loc: string;
  fb: string | null;
  vid: string | null;
  talkTitle: string;
  link: string;
};

const evs: EventRow[] = [];
for (const talk of talks) {
  for (const ev of talk.events) {
    evs.push({ ...ev, talkTitle: talk.title, link: talk.link });
  }
}
evs.sort((a, b) => b.dateMs - a.dateMs);

type YearGroup = { year: number; evs: EventRow[] };
const groups: YearGroup[] = [];
for (const ev of evs) {
  const yr = new Date(ev.dateMs).getFullYear();
  const last = groups[groups.length - 1];
  if (!last || last.year !== yr) groups.push({ year: yr, evs: [ev] });
  else last.evs.push(ev);
}
---

<Layout title="Conférences — Lucas Audart">
  <header class="site-header">
    <Navigation />
  </header>

  <ConferencesHeader stats={stats} activeTab="date" />

  <div class="view-inner">
    <p class="view-sub">
      {evs.length} événements · de {groups[groups.length - 1]?.year} à aujourd'hui
    </p>
    {groups.map((g) => (
      <div class="date-group">
        <div class="date-year-col">
          <span class="date-year-label">{g.year}</span>
        </div>
        <div class="date-events-col">
          {g.evs.map((ev) => (
            <div class="date-event-row">
              <span class="date-ev-date">{fmtDate(ev.dateMs)}</span>
              <a href={ev.link} class="date-ev-conf" title={ev.conf}>{ev.conf}</a>
              <span class="date-ev-talk" title={ev.talkTitle}>{ev.talkTitle}</span>
              <span class="date-ev-loc">
                <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="flex-shrink:0;opacity:0.45">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                {ev.loc}
              </span>
              <div class="date-ev-links">
                {ev.vid && (
                  <a href={ev.vid} class="ev-link ev-link--vid" target="_blank" rel="noopener noreferrer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    Vidéo
                  </a>
                )}
                {ev.fb && (
                  <a href={ev.fb} class="ev-link ev-link--fb" target="_blank" rel="noopener noreferrer">Avis</a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
</Layout>

<style>
  :root {
    --color-border-sub: #ece8df;
  }
  [data-theme="dark"] {
    --color-border-sub: #222019;
  }

  .site-header {
    position: sticky;
    top: 0;
    z-index: 20;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
  }

  .view-inner {
    max-width: 72rem;
    margin: 0 auto;
    padding: 3rem 2rem 6rem;
  }

  .view-sub {
    margin: 0 0 2.5rem;
    font-size: 0.72rem;
    color: var(--color-muted);
    letter-spacing: 0.04em;
  }

  .ev-link {
    font-size: 0.63rem;
    font-weight: 600;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    white-space: nowrap;
  }
  .ev-link--vid {
    color: var(--color-accent-2);
  }
  .ev-link--fb {
    color: var(--color-accent);
  }

  .date-group {
    display: grid;
    grid-template-columns: 4.5rem 1fr;
    gap: 0 3rem;
    margin-bottom: 3rem;
  }

  .date-year-col {
    border-top: 2px solid var(--color-accent);
    padding-top: 0.875rem;
  }

  .date-year-label {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1rem;
    color: var(--color-text);
  }

  .date-events-col .date-event-row {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 0.875rem 0;
    border-top: 1px solid var(--color-border-sub);
  }

  .date-ev-date {
    flex: 0 0 3.25rem;
    font-size: 0.73rem;
    color: var(--color-muted);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .date-ev-conf {
    flex: 0 1 10.5rem;
    min-width: 4rem;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.78rem;
    color: var(--color-text);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-decoration: none;
  }
  .date-ev-conf:hover {
    color: var(--color-accent);
  }

  .date-ev-talk {
    flex: 1;
    min-width: 0;
    font-size: 0.8rem;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .date-ev-loc {
    flex: 0 1 8.5rem;
    min-width: 3rem;
    font-size: 0.71rem;
    color: var(--color-muted);
    display: flex;
    align-items: center;
    gap: 0.2rem;
    overflow: hidden;
    white-space: nowrap;
  }

  .date-ev-links {
    flex-shrink: 0;
    display: flex;
    gap: 0.75rem;
    align-items: center;
    min-width: 6.5rem;
  }

  @media (max-width: 640px) {
    .date-group {
      grid-template-columns: 1fr;
    }
    .date-ev-conf,
    .date-ev-loc,
    .date-ev-links {
      display: none;
    }
  }
</style>
```

- [ ] **Vérifier le build :**

```bash
pnpm astro check && pnpm build
```

Attendu : build sans erreur, `/conferences` accessible, vue par date affichée.

---

## Task 4 : Créer `src/pages/conferences/talk.astro` (vue "Par talk")

**Files:**
- Create: `src/pages/conferences/talk.astro`

**Interfaces:**
- Consumes: `getTalks`, `getConferenceStats` de `src/lib/conferences.ts`
- Consumes: `ConferencesHeader` de `src/components/ConferencesHeader.astro`

- [ ] **Créer `src/pages/conferences/talk.astro` avec ce contenu exact :**

```astro
---
import { getTalks, getConferenceStats } from "../../lib/conferences";
import Layout from "../../layouts/Layout.astro";
import Navigation from "../../components/Navigation.astro";
import ConferencesHeader from "../../components/ConferencesHeader.astro";

const talks = await getTalks();
const stats = getConferenceStats(talks);
---

<Layout title="Conférences — Par talk — Lucas Audart">
  <header class="site-header">
    <Navigation />
  </header>

  <ConferencesHeader stats={stats} activeTab="talk" />

  <div class="view-inner">
    <p class="view-sub">
      {talks.length} talks · du plus récent au plus ancien
    </p>
    <div class="talk-grid">
      {talks.map((talk, i) => {
        const num = String(i + 1).padStart(2, "0");
        const yrs = talk.events
          .map((e) => new Date(e.dateMs).getFullYear())
          .sort((a, b) => a - b);
        const fy = yrs[0];
        const ly = yrs[yrs.length - 1];
        const range = fy === ly ? String(fy) : `${fy}–${ly}`;
        const evLabel =
          talk.events.length === 1
            ? "1 événement"
            : `${talk.events.length} événements`;
        const co = talk.authorLabel.includes("&");
        return (
          <a href={talk.link} class="talk-card">
            <div class="talk-card-top">
              <span class="talk-num">{num}</span>
              <span class="talk-date-range">{range}</span>
            </div>
            <div class="talk-card-body">
              <h3 class="talk-title" title={talk.title}>{talk.title}</h3>
              {talk.description && <p class="talk-desc">{talk.description}</p>}
            </div>
            {co && <p class="talk-authors">{talk.authorLabel}</p>}
            <div class="talk-card-footer">
              <div class="talk-tags">
                {talk.tags.slice(0, 3).map((t) => (
                  <span class="talk-tag">{t}</span>
                ))}
              </div>
              <span class="talk-event-count">{evLabel}</span>
            </div>
          </a>
        );
      })}
    </div>
  </div>
</Layout>

<style>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 20;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
  }

  .view-inner {
    max-width: 72rem;
    margin: 0 auto;
    padding: 3rem 2rem 6rem;
  }

  .view-sub {
    margin: 0 0 2.5rem;
    font-size: 0.72rem;
    color: var(--color-muted);
    letter-spacing: 0.04em;
  }

  .talk-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
  }

  .talk-card {
    display: flex;
    flex-direction: column;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border);
    padding: 1.75rem;
    gap: 1.25rem;
    text-decoration: none;
    transition: background 0.12s;
  }
  .talk-card:hover {
    background: var(--color-border-sub);
  }

  .talk-card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .talk-num {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 0.65rem;
    letter-spacing: 0.12em;
    color: var(--color-accent);
  }

  .talk-date-range {
    font-size: 0.7rem;
    color: var(--color-muted);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }

  .talk-card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .talk-title {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.9rem;
    line-height: 1.35;
    color: var(--color-text);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .talk-desc {
    margin: 0;
    font-size: 0.78rem;
    line-height: 1.65;
    color: var(--color-text-muted);
  }

  .talk-authors {
    margin: 0;
    font-size: 0.71rem;
    color: var(--color-muted);
    font-style: italic;
  }

  .talk-card-footer {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
    gap: 0.5rem;
    margin-top: auto;
  }

  .talk-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .talk-tag {
    font-size: 0.63rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-accent);
    border: 1px solid rgba(164, 83, 60, 0.3);
    padding: 0.2rem 0.45rem;
    border-radius: 2px;
  }
  :global([data-theme="dark"]) .talk-tag {
    border-color: rgba(192, 99, 80, 0.3);
  }

  .talk-event-count {
    font-size: 0.72rem;
    color: var(--color-muted);
    white-space: nowrap;
    flex-shrink: 0;
  }

  :root {
    --color-border-sub: #ece8df;
  }
  [data-theme="dark"] {
    --color-border-sub: #222019;
  }

  @media (max-width: 900px) {
    .talk-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 640px) {
    .talk-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
```

- [ ] **Vérifier le build :**

```bash
pnpm astro check && pnpm build
```

Attendu : build sans erreur, `/conferences/talk` accessible, grille de cards affichée.

---

## Task 5 : Créer `src/pages/conferences/conference.astro` (vue "Par conférence")

**Files:**
- Create: `src/pages/conferences/conference.astro`

**Interfaces:**
- Consumes: `getTalks`, `getConferenceStats`, `fmtDateFull` de `src/lib/conferences.ts`
- Consumes: `ConferencesHeader` de `src/components/ConferencesHeader.astro`

- [ ] **Créer `src/pages/conferences/conference.astro` avec ce contenu exact :**

```astro
---
import { getTalks, getConferenceStats, fmtDateFull } from "../../lib/conferences";
import Layout from "../../layouts/Layout.astro";
import Navigation from "../../components/Navigation.astro";
import ConferencesHeader from "../../components/ConferencesHeader.astro";

const talks = await getTalks();
const stats = getConferenceStats(talks);

type ConfEvent = {
  talkTitle: string;
  link: string;
  dateMs: number;
  loc: string;
  fb: string | null;
  vid: string | null;
};

type ConfGroup = { name: string; evs: ConfEvent[] };

const confMap = new Map<string, ConfGroup>();
for (const talk of talks) {
  for (const ev of talk.events) {
    if (!confMap.has(ev.conf)) confMap.set(ev.conf, { name: ev.conf, evs: [] });
    confMap.get(ev.conf)!.evs.push({
      talkTitle: talk.title,
      link: talk.link,
      dateMs: ev.dateMs,
      loc: ev.loc,
      fb: ev.fb,
      vid: ev.vid,
    });
  }
}

const confs = [...confMap.values()].sort(
  (a, b) => b.evs.length - a.evs.length || a.name.localeCompare(b.name),
);
const totalEvents = talks.reduce((s, t) => s + t.events.length, 0);
---

<Layout title="Conférences — Par conférence — Lucas Audart">
  <header class="site-header">
    <Navigation />
  </header>

  <ConferencesHeader stats={stats} activeTab="conference" />

  <div class="view-inner">
    <p class="view-sub">
      {confs.length} conférences · {totalEvents} événements
    </p>
    {confs.map((conf) => {
      const label = conf.evs.length === 1 ? "1 talk" : `${conf.evs.length} talks`;
      const sorted = [...conf.evs].sort((a, b) => b.dateMs - a.dateMs);
      return (
        <div class="conf-group">
          <div class="conf-group-header">
            <h3 class="conf-name">{conf.name}</h3>
            <span class="conf-count">{label}</span>
          </div>
          {sorted.map((ev) => (
            <div class="conf-event-row">
              <a href={ev.link} class="conf-ev-talk" title={ev.talkTitle}>{ev.talkTitle}</a>
              <span class="conf-ev-date">{fmtDateFull(ev.dateMs)}</span>
              <span class="conf-ev-loc">
                <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="flex-shrink:0;opacity:0.45">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                {ev.loc}
              </span>
              <div class="conf-ev-links">
                {ev.vid && (
                  <a href={ev.vid} class="ev-link ev-link--vid" target="_blank" rel="noopener noreferrer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    Vidéo
                  </a>
                )}
                {ev.fb && (
                  <a href={ev.fb} class="ev-link ev-link--fb" target="_blank" rel="noopener noreferrer">Avis</a>
                )}
              </div>
            </div>
          ))}
          <div class="conf-group-spacer"></div>
        </div>
      );
    })}
    <div class="conf-list-footer"></div>
  </div>
</Layout>

<style>
  :root {
    --color-border-sub: #ece8df;
  }
  [data-theme="dark"] {
    --color-border-sub: #222019;
  }

  .site-header {
    position: sticky;
    top: 0;
    z-index: 20;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
  }

  .view-inner {
    max-width: 72rem;
    margin: 0 auto;
    padding: 3rem 2rem 6rem;
  }

  .view-sub {
    margin: 0 0 2.5rem;
    font-size: 0.72rem;
    color: var(--color-muted);
    letter-spacing: 0.04em;
  }

  .ev-link {
    font-size: 0.63rem;
    font-weight: 600;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    white-space: nowrap;
  }
  .ev-link--vid {
    color: var(--color-accent-2);
  }
  .ev-link--fb {
    color: var(--color-accent);
  }

  .conf-group {
    border-top: 1px solid var(--color-border);
  }

  .conf-group-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding: 1.25rem 0 0.75rem;
  }

  .conf-name {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--color-text);
    letter-spacing: -0.01em;
  }

  .conf-count {
    font-size: 0.67rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-accent);
    flex-shrink: 0;
    margin-left: 1rem;
  }

  .conf-event-row {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 0.625rem 0 0.625rem 1.25rem;
    border-top: 1px solid var(--color-border-sub);
  }

  .conf-ev-talk {
    flex: 1;
    min-width: 0;
    font-size: 0.82rem;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-decoration: none;
  }
  .conf-ev-talk:hover {
    color: var(--color-accent);
  }

  .conf-ev-date {
    flex-shrink: 0;
    font-size: 0.72rem;
    color: var(--color-muted);
    white-space: nowrap;
  }

  .conf-ev-loc {
    flex: 0 0 8.5rem;
    font-size: 0.71rem;
    color: var(--color-muted);
    display: flex;
    align-items: center;
    gap: 0.2rem;
    overflow: hidden;
    white-space: nowrap;
  }

  .conf-ev-links {
    flex-shrink: 0;
    display: flex;
    gap: 0.75rem;
    align-items: center;
    min-width: 6.5rem;
  }

  .conf-group-spacer {
    height: 0.5rem;
  }

  .conf-list-footer {
    border-top: 1px solid var(--color-border);
  }

  @media (max-width: 640px) {
    .conf-ev-loc,
    .conf-ev-links {
      display: none;
    }
  }
</style>
```

- [ ] **Vérifier le build final et toutes les routes :**

```bash
pnpm astro check && pnpm build
```

Attendu : build sans erreur. Vérifier manuellement via `pnpm dev` :
- `/conferences` — vue par date, onglet "Par date" actif
- `/conferences/talk` — vue par talk, onglet "Par talk" actif
- `/conferences/conference` — vue par conférence, onglet "Par conférence" actif
- `/conferences/appwrite` (ou autre slug) — page de détail inchangée
