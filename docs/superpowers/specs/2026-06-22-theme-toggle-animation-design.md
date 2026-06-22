# Theme Toggle Animation Design

**Date:** 2026-06-22
**Status:** Approved

## Goal

Animate the theme switch (light ↔ dark) with a subtle ~200ms color fade so the transition feels smooth rather than an instant snap.

## Approach

Use a temporary `data-theme-animating` attribute on `<html>` to gate CSS transitions. Transitions only apply during the toggle, leaving view transitions and other animations unaffected.

## CSS (`src/styles/global.css`)

Add one rule:

```css
html[data-theme-animating] *,
html[data-theme-animating] *::before,
html[data-theme-animating] *::after {
  transition: background-color 200ms ease, color 200ms ease,
              border-color 200ms ease, fill 200ms ease, stroke 200ms ease !important;
}
```

The `!important` ensures it overrides any `transition: none` on specific elements (e.g., view transition pseudos). `fill` and `stroke` cover SVG icons so sun/moon icons fade smoothly too.

## JS (`src/components/Navigation.astro`)

Update the click handler:

```js
button?.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme;
  const next = current === "dark" ? "light" : "dark";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!prefersReduced) {
    document.documentElement.setAttribute("data-theme-animating", "");
    setTimeout(() => document.documentElement.removeAttribute("data-theme-animating"), 220);
  }

  document.documentElement.dataset.theme = next;
  document.cookie = `theme=${next}; path=/; max-age=${60 * 60 * 24 * 365}`;
});
```

The attribute is added **before** the theme swap so the browser catches the transition from the old values to the new ones. It is removed after 220ms — 20ms past the transition duration — to avoid a flicker on removal.

## Reduced Motion

When `prefers-reduced-motion: reduce` is set, `data-theme-animating` is never added and the theme swaps instantly, preserving existing behavior.

## Scope

- `src/styles/global.css` — one new CSS rule
- `src/components/Navigation.astro` — updated click handler inside `setupThemeToggle()`

No new files, no new components.
