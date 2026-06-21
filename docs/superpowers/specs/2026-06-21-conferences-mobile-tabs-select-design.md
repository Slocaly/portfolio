---
name: conferences-mobile-tabs-select
description: Replace the conference tab bar with a native <select> on mobile (≤640px)
metadata:
  type: project
---

# Conferences Tab Bar — Mobile Select Design

## Scope

Single file: `src/components/ConferencesHeader.astro`.  
No changes to the three conference pages (`conferences.astro`, `talk.astro`, `conference.astro`).

## Problem

The conference tab bar ("Par date" / "Par talk" / "Par conférence") uses `overflow-x: auto` on mobile, requiring horizontal scrolling to reach tabs. On screens ≤640px, a native `<select>` provides a better experience.

## Design

### Approach

CSS show/hide with inline `onchange` navigation. Both the tab row and the select are rendered in the HTML at all times; CSS controls which is visible per breakpoint. No script block needed.

### HTML addition

Inside `.tab-bar`, alongside the existing `.tab-row`, add:

```html
<select onchange="window.location.href = this.value">
  <option value="/conferences"             selected={activeTab === "date"}>Par date</option>
  <option value="/conferences/talk"        selected={activeTab === "talk"}>Par talk</option>
  <option value="/conferences/conference"  selected={activeTab === "conference"}>Par conférence</option>
</select>
```

The `selected` attribute on the matching option reflects the current active tab (driven by the existing `activeTab` prop — no new props needed).

### CSS

**Default (desktop):**
```css
.tab-bar select {
  display: none;
}
```

**Mobile (≤640px):**
```css
@media (max-width: 640px) {
  .tab-row {
    display: none;
  }

  .tab-bar select {
    display: block;
    width: 100%;
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--color-text);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    padding: 0.75rem 1rem;
    cursor: pointer;
  }
}
```

### Breakpoint

`640px` — matches the breakpoint used across the conference pages.

### No new props

The existing `activeTab: "date" | "talk" | "conference"` prop already carries all the state needed to set the `selected` option. No interface changes.
