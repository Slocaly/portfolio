# Theme Toggle Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Animate the light ↔ dark theme switch with a ~200ms color fade that only activates during the toggle.

**Architecture:** A temporary `data-theme-animating` attribute is added to `<html>` before the theme swap, triggering a scoped CSS transition rule that applies to all elements. The attribute is removed after 220ms, leaving view transitions and all other animations untouched.

**Tech Stack:** Astro, vanilla CSS (custom properties), vanilla JS

## Global Constraints

- No new dependencies
- Must respect `prefers-reduced-motion: reduce` (skip animation entirely)
- Must not interfere with existing view transitions in `global.css`
- Package manager: `pnpm`

---

### Task 1: Add scoped transition CSS rule

**Files:**
- Modify: `src/styles/global.css`

**Interfaces:**
- Produces: `html[data-theme-animating]` CSS selector that downstream JS will trigger

- [ ] **Step 1: Add the rule to `global.css`**

Open `src/styles/global.css`. After the `[data-theme="dark"] { … }` block (line 28–42) and before the `* { box-sizing: border-box; }` rule, add:

```css
html[data-theme-animating] *,
html[data-theme-animating] *::before,
html[data-theme-animating] *::after {
  transition: background-color 200ms ease, color 200ms ease,
              border-color 200ms ease, fill 200ms ease, stroke 200ms ease !important;
}
```

The `!important` ensures this overrides `transition: none` on view-transition pseudos. `fill`/`stroke` cover SVG icons (sun/moon in the toggle button).

- [ ] **Step 2: Verify the rule doesn't break the build**

```bash
pnpm build
```

Expected: build completes with no errors.

- [ ] **Step 3: Verify no interference with view transitions at runtime**

```bash
pnpm dev
```

Open `http://localhost:4321` in a browser. Navigate between pages (Home → À propos → Conférences). The slide animation should look exactly as before — no color bleed or double-transition.

---

### Task 2: Update the theme toggle click handler

**Files:**
- Modify: `src/components/Navigation.astro` (the `setupThemeToggle` function inside the `<script>` block)

**Interfaces:**
- Consumes: `html[data-theme-animating]` CSS selector from Task 1
- Consumes: existing `document.documentElement.dataset.theme` + cookie logic

- [ ] **Step 1: Replace the click handler body**

In `src/components/Navigation.astro`, find the `setupThemeToggle` function (inside `<script>` at the bottom of the file). Replace the handler body so the full function reads:

```js
function setupThemeToggle() {
  const button = document.getElementById("theme-toggle");
  button?.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme;
    const next = current === "dark" ? "light" : "dark";

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!prefersReduced) {
      document.documentElement.setAttribute("data-theme-animating", "");
      setTimeout(
        () => document.documentElement.removeAttribute("data-theme-animating"),
        220
      );
    }

    document.documentElement.dataset.theme = next;
    document.cookie = `theme=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
  });
}

document.addEventListener("astro:page-load", setupThemeToggle);
```

`data-theme-animating` is set **before** `dataset.theme` changes so the browser records the old CSS-variable values as the transition start point.

- [ ] **Step 2: Verify the animation at runtime**

```bash
pnpm dev
```

Open `http://localhost:4321`. Click the theme toggle. Expected: all colors (background, text, borders, icons) fade smoothly over ~200ms rather than snapping instantly.

- [ ] **Step 3: Verify reduced-motion is respected**

In Chrome DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`. Click the toggle. Expected: theme switches instantly with no transition.

- [ ] **Step 4: Verify toggle still works after navigation**

While dev server is running, navigate to another page (e.g., `/about`), then click the toggle. Expected: animation works identically — confirming `astro:page-load` re-registers the handler after view transition swap.
