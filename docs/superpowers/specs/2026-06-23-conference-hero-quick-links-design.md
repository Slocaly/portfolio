# Conference Hero Quick Links

**Date:** 2026-06-23

## Goal

Add slides and video quick-link buttons to the conference detail page hero, placed inline after the event count in the meta row.

## Schema changes

Add `videoLink: z.string().url().optional()` at the **conference level** in `content.config.ts`, alongside the existing `slides` field. No changes to the per-event `videoLink`.

## ConferenceHero changes

**New props:** `slides?: string`, `videoLink?: string`. Both optional.

**Layout:** The `.hero-meta` flex row gains `flex-wrap: wrap`. After the event count span, if either link exists, render: a divider then a `.quick-links` group of icon-only `<a>` buttons.

**Button style** (matches `.socials a` from `Hero.astro`, adapted for dark background):
- `40×40px`, `border: 1px solid rgba(255,255,255,0.18)`, `border-radius: 0.375rem`
- Icon color: `rgba(255,255,255,0.55)`, hover: `rgba(255,255,255,1)`
- Background: transparent

**Icons (inline SVG, `1.1rem`):**
- Video link → camera/video icon
- Slides → presentation icon

Buttons only render when the corresponding prop is present.

## Slug page changes

Destructure `slides` and `videoLink` from `conference.data` and pass them to `<ConferenceHero />`.

## Files touched

1. `src/content.config.ts` — add `videoLink` to conference schema
2. `src/components/ConferenceHero.astro` — new props, buttons, styles
3. `src/pages/conferences/[...slug].astro` — pass new props
