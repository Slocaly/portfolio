# Conference Gallery — Astro Image Integration

**Date:** 2026-06-22  
**Status:** Approved

## Goal

Replace the raw `<img>` tags in `ConferenceGallery.astro` with Astro's `<Image>` component to get automatic format conversion (avif), `srcset` generation, and proper `width`/`height` attributes — with no change to the visual layout.

## Scope

Single file change: `src/components/ConferenceGallery.astro`.

No changes to:
- `src/content.config.ts` — `photos: z.array(image())` already produces `ImageMetadata[]`
- Any `.mdx` frontmatter — string paths are already resolved by the `image()` helper at build time
- The detail page `src/pages/conferences/[...slug].astro` — props are unchanged

## Design

### Layout

Keep the existing flex-wrap row of fixed-height images (220px desktop, 150px mobile). The `<Image>` component receives a computed `width` derived from the photo's intrinsic aspect ratio:

```
width = Math.round(220 * (photo.width / photo.height))
```

This ensures the `width` and `height` HTML attributes reflect the true display size, preventing layout shift.

### Component changes

```astro
import { Image } from "astro:assets";
```

Replace:
```astro
<img src={photo.src} alt="" loading="lazy" decoding="async" class="gallery-img" />
```

With:
```astro
<Image
  src={photo}
  height={220}
  width={Math.round(220 * (photo.width / photo.height))}
  alt=""
  loading="lazy"
  format="avif"
  class="gallery-img"
/>
```

The CSS `.gallery-img { height: 220px; width: auto; }` rule stays — it handles the responsive override at ≤768px (150px) and acts as a display constraint independent of the HTML attributes.

### No lightbox

Click interaction is out of scope. Images are display-only for now.

## Why this approach

- `<Image>` accepts `ImageMetadata` directly — no `.src` string extraction needed (that's what caused the earlier `ConferenceHero` bug)
- Deriving `width` from aspect ratio keeps the layout identical to the current flex-height approach
- `format="avif"` is Astro's recommended modern format; fallback is handled by the browser
