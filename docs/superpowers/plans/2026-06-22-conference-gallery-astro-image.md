# Conference Gallery — Astro Image Integration

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace raw `<img>` tags in `ConferenceGallery.astro` with Astro's `<Image>` component for automatic avif conversion, srcset generation, and proper intrinsic dimensions.

**Architecture:** Single component change — swap `<img src={photo.src}>` for `<Image src={photo} />`, deriving `width` from each photo's intrinsic aspect ratio so the fixed-height flex layout is preserved. No schema or page changes needed; `photos` is already `ImageMetadata[]` from the `image()` schema helper.

**Tech Stack:** Astro 5, `astro:assets` Image component, pnpm

## Global Constraints

- Package manager: `pnpm` (not npm/yarn)
- No test suite — verification is manual via dev server (`pnpm dev`)
- Astro Image requires both `width` and `height` as numbers at build time
- Pass `ImageMetadata` objects directly to `<Image src={...}>` — never `.src` (that extracts a string and breaks)
- Target format: `avif`
- Gallery layout: fixed height 220px desktop / 150px mobile, `width: auto`

---

### Task 1: Swap `<img>` for `<Image>` in ConferenceGallery

**Files:**
- Modify: `src/components/ConferenceGallery.astro`

**Interfaces:**
- Consumes: `photos: ImageMetadata[]` prop (unchanged — already typed this way)
- Produces: optimized `<img>` tags with `width`, `height`, `srcset`, and avif `src`

- [ ] **Step 1: Open the file and read the current implementation**

Current `src/components/ConferenceGallery.astro`:
```astro
---
import SectionLabel from "./SectionLabel.astro";

interface Props {
  photos?: ImageMetadata[];
}

const { photos } = Astro.props;
---

{photos && photos.length > 0 && (
  <div class="gallery-wrapper">
    <SectionLabel label="Photos" />
    <div class="gallery-grid">
      {photos.map((photo) => (
        <div class="gallery-item">
          <img src={photo.src} alt="" loading="lazy" decoding="async" class="gallery-img" />
        </div>
      ))}
    </div>
  </div>
)}

<style>
  .gallery-wrapper { max-width: 72rem; margin: 0 auto; padding: 0 2rem 6rem; }
  .gallery-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .gallery-img {
    height: 220px;
    width: auto;
    display: block;
  }

  @media (max-width: 768px) {
    .gallery-img { height: 150px; }
  }
</style>
```

- [ ] **Step 2: Replace with the updated implementation**

Replace the entire file content with:
```astro
---
import { Image } from "astro:assets";
import SectionLabel from "./SectionLabel.astro";

interface Props {
  photos?: ImageMetadata[];
}

const { photos } = Astro.props;
---

{photos && photos.length > 0 && (
  <div class="gallery-wrapper">
    <SectionLabel label="Photos" />
    <div class="gallery-grid">
      {photos.map((photo) => (
        <div class="gallery-item">
          <Image
            src={photo}
            height={220}
            width={Math.round(220 * (photo.width / photo.height))}
            alt=""
            loading="lazy"
            format="avif"
            class="gallery-img"
          />
        </div>
      ))}
    </div>
  </div>
)}

<style>
  .gallery-wrapper { max-width: 72rem; margin: 0 auto; padding: 0 2rem 6rem; }
  .gallery-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .gallery-img {
    height: 220px;
    width: auto;
    display: block;
  }

  @media (max-width: 768px) {
    .gallery-img { height: 150px; }
  }
</style>
```

- [ ] **Step 3: Start the dev server and verify**

```bash
pnpm dev
```

Navigate to a conference page that has photos, e.g. `/conferences/zod-magicien`.

Check:
- Photos render at the correct height (220px)
- In DevTools Network tab, images are served as `avif`
- `<img>` elements have explicit `width` and `height` attributes (no layout shift)
- No console errors

- [ ] **Step 4: Run a production build to confirm no build errors**

```bash
pnpm build
```

Expected: build completes with no errors. Astro will emit optimized images to `dist/_astro/`.

- [ ] **Step 5: Commit**

```bash
git add src/components/ConferenceGallery.astro
git commit -m "✨ use Astro Image in conference gallery"
```
