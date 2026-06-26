# Conference Hero: No-Thumbnail Fallback — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a conference entry has no `thumbnail`, render a compact page-native header instead of the dark full-bleed hero.

**Architecture:** Add a `hero--no-thumbnail` BEM modifier class to the `.hero` element when `thumbnail` is absent. The modifier overrides height, background, and all text/border colors so the hero blends into the page. The with-thumbnail path is untouched.

**Tech Stack:** Astro, CSS custom properties (defined in `src/styles/global.css`)

## Global Constraints

- Touch only `src/components/ConferenceHero.astro` — no other file changes
- Use existing CSS variables: `--color-bg`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-accent`
- Do not alter any with-thumbnail rendering logic or script blocks
- No new dependencies

---

### Task 1: Add `.hero--no-thumbnail` modifier

**Files:**
- Modify: `src/components/ConferenceHero.astro`

**Interfaces:**
- Consumes: `thumbnail?: ImageMetadata` prop (already defined in the component's Props interface)
- Produces: nothing new — modifies in-place

- [ ] **Step 1: Add the modifier class to the hero element**

  In `src/components/ConferenceHero.astro`, locate line 27:
  ```astro
  <div class="hero">
  ```
  Replace with:
  ```astro
  <div class:list={["hero", { "hero--no-thumbnail": !thumbnail }]}>
  ```

- [ ] **Step 2: Add the no-thumbnail CSS overrides**

  At the end of the `<style>` block (after the `@media (max-width: 480px)` block, before `</style>`), add:

  ```css
  /* --- no-thumbnail variant --- */
  .hero--no-thumbnail {
    height: auto;
    background-color: var(--color-bg);
  }

  .hero--no-thumbnail .hero-gradient {
    display: none;
  }

  .hero--no-thumbnail .back-link {
    color: var(--color-text-muted);
  }

  .hero--no-thumbnail .back-link:hover {
    color: var(--color-text);
  }

  .hero--no-thumbnail .tag {
    color: var(--color-text-muted);
    border-color: var(--color-border);
  }

  .hero--no-thumbnail .tag--primary {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }

  .hero--no-thumbnail .hero-title {
    color: var(--color-text);
  }

  .hero--no-thumbnail .meta-author {
    color: var(--color-text);
  }

  .hero--no-thumbnail .meta-count {
    color: var(--color-text-muted);
  }

  .hero--no-thumbnail .meta-divider {
    background: var(--color-border);
  }

  .hero--no-thumbnail .quick-link {
    color: var(--color-text-muted);
    border-color: var(--color-border);
  }

  .hero--no-thumbnail .quick-link:hover {
    color: var(--color-text);
    border-color: var(--color-text-muted);
  }

  .hero--no-thumbnail .quick-link-tooltip {
    background: var(--color-text);
    color: var(--color-bg);
  }
  ```

- [ ] **Step 3: Start the dev server and verify the no-thumbnail case**

  ```bash
  pnpm dev
  ```

  Open `http://localhost:4321/conferences/demo` in a browser.

  Expected:
  - Hero is compact — no large empty dark area above the title
  - Background matches the rest of the page (`#efece4` in light mode)
  - Tags, title, author, and event count are readable in page text colors
  - No dark gradient overlay visible

- [ ] **Step 4: Verify no regression on a conference with a thumbnail**

  Open any conference that has a thumbnail, e.g. `http://localhost:4321/conferences/appwrite`.

  Expected:
  - Hero looks exactly as before: full dark background, blurred LQIP → full image transition, gradient overlay, white text

- [ ] **Step 5: Verify dark mode**

  Toggle dark mode (system preference or browser dev tools). Check both `/conferences/demo` (no thumbnail) and a thumbnail conference.

  Expected:
  - No-thumbnail hero: background `#1a1916`, text `#e6e1d8` — blends into the dark page
  - Thumbnail hero: unchanged

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/ConferenceHero.astro
  git commit -m "feat: add no-thumbnail fallback to ConferenceHero"
  ```
