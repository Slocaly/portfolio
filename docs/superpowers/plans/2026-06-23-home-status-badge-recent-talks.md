# Home Status Badge & Recent Talks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hardcoded "En ce moment" badge to the Hero section and a "TALKS RÉCENTS" section below the hero on the home page.

**Architecture:** Badge is hardcoded HTML/CSS inside `Hero.astro`. A new `RecentTalks.astro` component fetches conferences at build time, computes the display event per talk (next upcoming or most recent past), and renders a 3-row section. `index.astro` imports and places `RecentTalks` below `Hero`.

**Tech Stack:** Astro, TypeScript, `astro:content` getCollection API, scoped CSS with existing design tokens.

## Global Constraints

- No test suite — verify each task by running `pnpm dev` and inspecting the browser at `http://localhost:4321`
- Package manager: pnpm
- Design tokens only — no hardcoded colors; use `var(--color-accent)`, `var(--color-text)`, `var(--color-text-muted)`, `var(--color-border)`, `var(--color-bg)`, `var(--font-display)`
- Max-width container matches the rest of the page: `max-width: var(--wide-width); margin: 0 auto; padding: 0 2rem`
- Do NOT modify the bio text or social icons in `Hero.astro`
- Do NOT commit

---

### Task 1: Add "En ce moment" badge to Hero.astro

**Files:**
- Modify: `src/components/Hero.astro`

**Interfaces:**
- Produces: a `.status-badge` pill element rendered between `.name` heading and `.bio-block`

- [ ] **Step 1: Insert the badge HTML**

In `src/components/Hero.astro`, find this line:

```html
    <div class="bio-block">
```

Insert the following immediately before it (inside `.content`, after `</h1>` closing tag of `.name`):

```html
    <div class="status-badge">
      <span class="status-dot" aria-hidden="true"></span>
      <p><strong>En ce moment</strong> — Dev Frontend chez Kolecto, Paris</p>
    </div>
```

- [ ] **Step 2: Add the badge styles**

Inside the `<style>` block of `src/components/Hero.astro`, add:

```css
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.5rem 1.125rem;
    margin-top: 2rem;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 9999px;
  }

  .status-badge p {
    margin: 0;
    font-size: 0.9rem;
    color: var(--color-text);
  }

  .status-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: var(--color-accent);
    flex-shrink: 0;
  }
```

- [ ] **Step 3: Verify in browser**

Run `pnpm dev` and open `http://localhost:4321`. Confirm:
- A pill with a colored dot and "En ce moment — Dev Frontend chez Kolecto, Paris" appears between the name and the bio text
- The dot matches the accent color (terracotta/reddish)
- The bio text and social icon buttons below are unchanged

---

### Task 2: Create RecentTalks.astro component

**Files:**
- Create: `src/components/RecentTalks.astro`

**Interfaces:**
- Consumes: `getCollection('conferences')` — each entry has `data.title: string`, `data.tags: string[]`, `data.events: { name: string, date: Date }[]`
- Produces: `<section class="recent-talks">` with up to 3 talk rows

- [ ] **Step 1: Create the component with data logic and markup**

Create `src/components/RecentTalks.astro` with the following content:

```astro
---
import { getCollection } from 'astro:content';

const FRENCH_MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

function formatDate(date: Date): string {
  return `${date.getDate()} ${FRENCH_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function stripEmoji(str: string): string {
  return str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
}

const today = new Date();
const allConferences = await getCollection('conferences');

type TalkEntry = {
  id: string;
  title: string;
  tags: string[];
  eventName: string;
  eventDate: Date;
  status: 'PROCHAIN' | 'PASSÉ';
};

const talks: TalkEntry[] = allConferences
  .map(conf => {
    const events = conf.data.events;
    const futureEvents = events
      .filter(e => e.date > today)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    const pastEvents = events
      .filter(e => e.date <= today)
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    if (futureEvents.length > 0) {
      return {
        id: conf.id,
        title: stripEmoji(conf.data.title),
        tags: conf.data.tags.slice(0, 3),
        eventName: futureEvents[0].name,
        eventDate: futureEvents[0].date,
        status: 'PROCHAIN' as const,
      };
    } else if (pastEvents.length > 0) {
      return {
        id: conf.id,
        title: stripEmoji(conf.data.title),
        tags: conf.data.tags.slice(0, 3),
        eventName: pastEvents[0].name,
        eventDate: pastEvents[0].date,
        status: 'PASSÉ' as const,
      };
    }
    return null;
  })
  .filter((t): t is TalkEntry => t !== null);

const sorted = [
  ...talks
    .filter(t => t.status === 'PROCHAIN')
    .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime()),
  ...talks
    .filter(t => t.status === 'PASSÉ')
    .sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime()),
].slice(0, 3);
---

<section class="recent-talks">
  <div class="recent-talks-header">
    <span class="section-label">TALKS RÉCENTS</span>
    <a href="/conferences" class="see-all">TOUT VOIR →</a>
  </div>
  <div class="talks-list">
    {sorted.map(talk => (
      <a href={`/conferences/${talk.id}`} class="talk-row">
        <span class="talk-date">{formatDate(talk.eventDate)}</span>
        <span class="talk-title">{talk.title}</span>
        <div class="talk-tags">
          {talk.tags.map(tag => <span class="tag">{tag}</span>)}
        </div>
        <span class={`talk-status ${talk.status === 'PROCHAIN' ? 'status-upcoming' : 'status-past'}`}>
          {talk.status}
        </span>
        <span class="talk-event">{talk.eventName}</span>
      </a>
    ))}
  </div>
</section>

<style>
  .recent-talks {
    max-width: var(--wide-width);
    margin: 0 auto;
    padding: 2rem 2rem 4rem;
  }

  .recent-talks-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .section-label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .see-all {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-accent);
    text-decoration: none;
  }

  .see-all:hover {
    text-decoration: underline;
  }

  .talks-list {
    display: flex;
    flex-direction: column;
  }

  .talk-row {
    display: grid;
    grid-template-columns: 9rem 1fr auto auto auto;
    align-items: center;
    gap: 1.25rem;
    padding: 1.125rem 0;
    border-top: 1px solid var(--color-border);
    text-decoration: none;
    color: inherit;
  }

  .talk-row:last-child {
    border-bottom: 1px solid var(--color-border);
  }

  .talk-row:hover .talk-title {
    color: var(--color-accent);
  }

  .talk-date {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-text);
    white-space: nowrap;
  }

  .talk-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.15s;
  }

  .talk-tags {
    display: flex;
    gap: 0.375rem;
  }

  .tag {
    font-size: 0.68rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    padding: 0.2rem 0.5rem;
    border-radius: 9999px;
    border: 1px solid var(--color-border);
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  .talk-status {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .status-upcoming {
    color: var(--color-accent);
  }

  .status-past {
    color: var(--color-text-muted);
  }

  .talk-event {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    white-space: nowrap;
  }

  @media (max-width: 768px) {
    .talk-row {
      grid-template-columns: 1fr auto;
      grid-template-rows: auto auto auto;
      gap: 0.25rem 0.75rem;
    }

    .talk-date {
      grid-column: 1;
      grid-row: 1;
    }

    .talk-status {
      grid-column: 2;
      grid-row: 1;
    }

    .talk-title {
      grid-column: 1 / -1;
      grid-row: 2;
    }

    .talk-tags {
      grid-column: 1;
      grid-row: 3;
      flex-wrap: wrap;
    }

    .talk-event {
      grid-column: 2;
      grid-row: 3;
      text-align: right;
    }
  }
</style>
```

- [ ] **Step 2: Verify in browser**

Run `pnpm dev` and open `http://localhost:4321`. The component won't render yet (not imported in index.astro) — instead run `pnpm astro check` to confirm no TypeScript errors in the new file.

Expected output: no errors.

---

### Task 3: Wire RecentTalks into index.astro

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `RecentTalks` component from `../components/RecentTalks.astro`

- [ ] **Step 1: Import and render RecentTalks**

Replace the entire contents of `src/pages/index.astro` with:

```astro
---
import Hero from "../components/Hero.astro";
import Navigation from "../components/Navigation.astro";
import RecentTalks from "../components/RecentTalks.astro";
import Layout from "../layouts/Layout.astro";
---

<Layout>
  <Navigation />
  <Hero />
  <RecentTalks />
</Layout>
```

- [ ] **Step 2: Verify end-to-end in browser**

Open `http://localhost:4321`. Confirm:
- "En ce moment" badge appears in the hero section
- "TALKS RÉCENTS" section appears below the hero
- Up to 3 talks are listed
- PROCHAIN talks (future events) appear before PASSÉ talks
- Each row shows: bold date · title · tags · status badge · event name
- "TOUT VOIR →" navigates to `/conferences`
- Clicking any talk row navigates to `/conferences/<id>`
- No visual regressions on the rest of the page
