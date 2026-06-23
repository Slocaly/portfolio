# Conference Event Logos — Design Spec

**Date:** 2026-06-23

## Goal

Display the logo of each conference event in the `ConferenceEventsList` sidebar on the conference details page, using the same watermark style as company logos on the about page.

## Data model

`logo: image()` is already defined per event in `content.config.ts` and populated in all MDX files. No schema changes needed.

## Change

**File:** `src/components/ConferenceEventsList.astro`

1. Add `logo: ImageMetadata` to the `Event` interface
2. Import `{ Image }` from `astro:assets`
3. Add a `.event-logo` div inside each `.event-item` containing `<Image src={event.logo} ... />`
4. Style `.event-logo`: `position: absolute; right: -0.5rem; top: 50%; transform: translateY(-50%) rotate(-12deg); opacity: 0.35; width: 5rem; height: 5rem; border-radius: 0.75rem`
5. Add `position: relative; overflow: hidden; padding-right: 5rem` to `.event-item` to contain the absolute logo and prevent text overlap

No changes needed in `[...slug].astro` — events are already passed with full data.
