# Conference Hero: No-Thumbnail Fallback

**Date:** 2026-06-26

## Problem

When a conference entry has no `thumbnail`, `ConferenceHero` renders a tall dark hero (`#1a1915`, `clamp(420px, 52vh, 800px)`) with no visual content. The empty space reads as broken rather than intentional.

## Design

Replace the dark void with a page-native header: same background as the rest of the page, content-height, text in page palette colors. No image fallback, no decorative treatment — pure typography.

## Scope

Single component: `src/components/ConferenceHero.astro`.

No changes to the slug page, content schema, or any other component.

## Layout (no thumbnail)

```
← Conférences                          (back link, muted)

[TALK]  [DEMO]                         (tags)
La démonstration : un art subtil…      (title, page heading color)

Lucas Audart & Olivier Perez  |  1 événement  [slides] [video]
```

- **Height:** content-height only — `padding: 1.5rem 0 2.5rem`, no min-height
- **Background:** `var(--color-bg)` (page background)
- **No** `hero-bg-placeholder`, `hero-bg-full`, `hero-preload-trigger`, or `hero-gradient` elements

## Color tokens (no thumbnail)

| Element | With thumbnail | Without thumbnail |
|---|---|---|
| Title | `#fff` | `var(--color-text)` |
| Back link | `rgba(255,255,255,0.55)` | `var(--color-text-muted)` |
| Meta author | `rgba(255,255,255,0.9)` | `var(--color-text)` |
| Meta count | `rgba(255,255,255,0.5)` | `var(--color-text-muted)` |
| Tags (primary) | `#e8876a` border + text | unchanged |
| Tags (rest) | white borders/text | adapt to dark borders/text |
| Quick-links | white borders/icons | page border/icon colors |

## Implementation approach

Add a `.hero--no-thumbnail` modifier class when `thumbnail` is absent. The modifier overrides:
- `min-height` / `height` → `auto`
- `background-color` → `var(--color-bg)`
- All text color variables

The with-thumbnail path stays exactly as-is. The script blocks (`initHeroLqip`, `initQuickLinkTooltips`) are unaffected — `initHeroLqip` already guards for the presence of `.hero-preload-trigger`.
