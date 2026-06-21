# Conferences "Par date" — Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix font sizes and mobile layout of the "Par date" conference list so date, conference name, and talk title are all readable on small screens.

**Architecture:** Pure CSS changes inside the `<style>` block of `src/pages/conferences.astro`. Font sizes are bumped globally (desktop + mobile). The `@media (max-width: 640px)` block is rewritten to display a two-line row: line 1 = date + conf name inline, line 2 = talk title wrapping freely.

**Tech Stack:** Astro, CSS (scoped `<style>` block), pnpm

## Global Constraints

- No JS changes — CSS only
- No changes to HTML structure or Astro frontmatter
- No changes to other conference views (`talk.astro`, `conference.astro`)
- Dev server: `pnpm dev` → `localhost:4321`

---

### Task 1: Bump font sizes across all event row elements

**Files:**
- Modify: `src/pages/conferences.astro` — `<style>` block, rules for `.date-ev-date`, `.date-ev-conf`, `.date-ev-talk`, `.date-ev-loc`, `.ev-link`

**Interfaces:**
- Produces: larger base font sizes used by both desktop and mobile styles in Task 2

- [ ] **Step 1: Open the file and locate the font-size declarations to change**

In `src/pages/conferences.astro`, find these CSS rules in the `<style>` block and update their `font-size` values:

```css
/* BEFORE → AFTER */

.ev-link {
  font-size: 0.63rem;   /* → 0.72rem */
  ...
}

.date-ev-date {
  font-size: 0.73rem;   /* → 0.85rem */
  ...
}

.date-ev-conf {
  font-size: 0.78rem;   /* → 0.88rem */
  ...
}

.date-ev-talk {
  font-size: 0.8rem;    /* → 0.9rem */
  ...
}

.date-ev-loc {
  font-size: 0.71rem;   /* → 0.8rem */
  ...
}
```

- [ ] **Step 2: Start the dev server and verify font sizes on desktop**

```bash
pnpm dev
```

Open `localhost:4321/conferences` in a browser. At full desktop width, all text in event rows should be noticeably larger than before but the 5-column table layout should remain intact. No overflow or wrapping issues at ≥ 900px.

---

### Task 2: Rewrite the mobile breakpoint for two-line rows

**Files:**
- Modify: `src/pages/conferences.astro` — `@media (max-width: 640px)` block in `<style>`

**Interfaces:**
- Consumes: updated font sizes from Task 1
- Produces: mobile layout where each event row shows date + conf name on line 1, talk title on line 2

- [ ] **Step 1: Replace the existing `@media (max-width: 640px)` block**

Find the current block:

```css
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
```

Replace it with:

```css
@media (max-width: 640px) {
  .date-group {
    grid-template-columns: 1fr;
  }

  /* Switch to wrapping flex so date + conf share line 1,
     talk title takes full-width line 2 */
  .date-events-col .date-event-row {
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.2rem 0.5rem;
    padding: 0.75rem 0;
  }

  /* Line 1: date (order 1) */
  .date-ev-date {
    flex: 0 0 auto;
    order: 1;
  }

  /* Separator dot after the date, before conf name */
  .date-ev-date::after {
    content: "·";
    margin-left: 0.5rem;
    opacity: 0.4;
  }

  /* Line 1: conf name (order 2) — wraps freely, no truncation */
  .date-ev-conf {
    flex: 0 1 auto;
    order: 2;
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
  }

  /* Line 2: talk title takes full width, forces its own row */
  .date-ev-talk {
    flex: 0 0 100%;
    order: 3;
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
  }

  /* Hide location and links */
  .date-ev-loc,
  .date-ev-links {
    display: none;
  }
}
```

- [ ] **Step 2: Verify the two-line layout at mobile width**

In the browser, open DevTools and set viewport to 390px wide (iPhone 14 size). On `localhost:4321/conferences`:

- Each event row should show two stacked lines:
  - Line 1: date (muted) followed by a `·` separator and the conference name (bold)
  - Line 2: talk title in readable text that wraps onto multiple lines if needed
- No horizontal overflow on the page
- Conference name should not be truncated with ellipsis on mobile
- Year labels (`.date-year-label`) should appear above each group's events

- [ ] **Step 3: Check edge cases**

Still at 390px width:

- A talk with a very long title (e.g. "Développer une culture de l'accessibilité dans votre équipe") should wrap naturally across multiple lines, not overflow
- A conference name that is long should wrap rather than truncate
- Check at 768px (tablet): layout should still be the 5-column desktop row (breakpoint is 640px)

- [ ] **Step 4: Check dark mode**

Toggle to dark mode (click the theme switcher in the nav). Verify:
- Muted date text, conf name, and talk title all have correct contrast against dark background
- The `·` separator is visible but subtle
