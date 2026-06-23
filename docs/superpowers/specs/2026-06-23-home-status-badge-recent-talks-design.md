---
name: home-status-badge-recent-talks
description: Add "En ce moment" badge to Hero and a "TALKS RÉCENTS" section to the home page
metadata:
  type: project
---

## Overview

Two additions to the home page:
1. A hardcoded "En ce moment" status badge inside `Hero.astro`
2. A new `RecentTalks.astro` component rendered below the hero in `index.astro`

The existing bio text and social buttons in `Hero.astro` are unchanged.

---

## 1. Badge — Hero.astro

A hardcoded pill inserted between the name heading and the bio block.

**Content:** `● En ce moment — Dev Frontend chez Kolecto, Paris`

**Appearance:**
- Rounded pill, light background + border using existing design tokens
- Colored dot using `var(--color-accent)` (matches eyebrow line color)
- "En ce moment" in bold, rest in normal weight
- Muted text color

---

## 2. RecentTalks.astro component

New component at `src/components/RecentTalks.astro`. Fetches conference data at build time and renders the talks section.

### Data logic

For each conference entry from `getCollection('conferences')`:
- Find all **future** events (date > today): if any exist, pick the nearest one → status `PROCHAIN`
- If none, pick the most recent **past** event → status `PASSÉ`

Sort order:
1. PROCHAIN talks — ascending by event date (soonest first)
2. PASSÉ talks — descending by event date (most recent first)

Take the top 3 results.

### Row layout

Each row (left → right):

| Column | Content | Style |
|--------|---------|-------|
| Date | "12 juin 2026" (day + French month + year) | Bold/larger, prominent |
| Title | `conference.data.title` stripped of leading/trailing emoji | Normal weight |
| Tags | First 3 tags from `conference.data.tags` as small chips | Muted, small |
| Status badge | `PROCHAIN` or `PASSÉ` | Accent color for PROCHAIN, muted for PASSÉ |
| Event name | Name of the selected event | Muted |

### Section header

- Left: `TALKS RÉCENTS` (uppercase label, same style as eyebrow text)
- Right: `TOUT VOIR →` link to `/conferences`
- Horizontal dividers between rows

### Date formatting

French month names: janvier, février, mars, avril, mai, juin, juillet, août, septembre, octobre, novembre, décembre. Format: `${day} ${month} ${year}`.

---

## 3. index.astro changes

Import and render `<RecentTalks />` below `<Hero />`:

```astro
<Layout>
  <Navigation />
  <Hero />
  <RecentTalks />
</Layout>
```
