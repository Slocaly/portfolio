# Conference Hero Quick Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add slides and video icon-button quick links to the conference detail page hero, inline after the event count.

**Architecture:** Add `videoLink` to the conference-level schema, pass both `slides` and `videoLink` through to `ConferenceHero`, and render icon-only `<a>` buttons styled like the home page social links, with `flex-wrap` on the meta row for mobile.

**Tech Stack:** Astro, Zod (content schema), inline SVG icons, CSS custom properties from existing design tokens.

## Global Constraints

- Package manager: `pnpm`
- No test suite — verification is via `pnpm build` (type-check + build) and `pnpm dev` visual inspection
- Do not commit (user requirement for this session)
- Button style must match `.socials a` from `src/components/Hero.astro`: `40×40px`, `border: 1px solid`, `border-radius: 0.375rem`, icon at `1.1rem`
- Buttons only render when the corresponding prop is truthy
- Existing `videoLink` on the per-event `ZEvent` schema is untouched

---

### Task 1: Add `videoLink` to conference schema

**Files:**
- Modify: `src/content.config.ts`

**Interfaces:**
- Produces: `conferences` collection schema now includes `videoLink: z.string().url().optional()`

- [ ] **Step 1: Add the field**

In `src/content.config.ts`, inside the `conferences` schema object (around line 54), add `videoLink` next to `slides`:

```ts
slides: z.string().url().optional(),
videoLink: z.string().url().optional(),
```

The block should look like:

```ts
const conferences = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/conferences" }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string().optional(),
    abstract: z.string().optional(),
    events: z.array(ZEvent({ image })),
    authors: reference("authors").optional(),
    tags: z.array(z.string()),
    slides: z.string().url().optional(),
    videoLink: z.string().url().optional(),
    references: z.array(z.string().url()).optional(),
    thumbnail: image(),
    photos: z.array(image()).optional(),
  }),
});
```

- [ ] **Step 2: Verify build passes**

```bash
pnpm astro check
```

Expected: no type errors.

---

### Task 2: Update `ConferenceHero` with quick-link buttons

**Files:**
- Modify: `src/components/ConferenceHero.astro`

**Interfaces:**
- Consumes: `slides?: string`, `videoLink?: string` (both optional strings, URLs)
- Produces: rendered hero with icon buttons after event count when props are present

- [ ] **Step 1: Add props to the interface**

Replace the existing `Props` interface (lines 3–9):

```ts
interface Props {
  title: string;
  tags: string[];
  eventsCount: number;
  thumbnail?: ImageMetadata;
  coSpeaker?: {
    name: string;
  };
  slides?: string;
  videoLink?: string;
}
```

- [ ] **Step 2: Destructure new props**

Replace line 14:

```ts
const { title, tags, eventsCount, thumbnail, coSpeaker, slides, videoLink } = Astro.props;
```

- [ ] **Step 3: Add buttons to the hero-meta row**

The `.hero-meta` div currently ends after the `meta-count` span (around line 89). Add a conditional block after it:

```astro
<div class="hero-meta">
  <span class="meta-author">
    {coSpeaker ? `Lucas Audart & ${coSpeaker.name}` : "Lucas Audart"}
  </span>
  <span class="meta-divider" aria-hidden="true"></span>
  <span class="meta-count"
    >{eventsCount} événement{eventsCount > 1 ? "s" : ""}</span
  >
  {(slides || videoLink) && (
    <>
      <span class="meta-divider" aria-hidden="true"></span>
      <div class="quick-links">
        {slides && (
          <a href={slides} target="_blank" rel="noopener noreferrer" class="quick-link" aria-label="Slides">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="2" y="3" width="20" height="14" rx="2"></rect>
              <path d="M8 21h8M12 17v4"></path>
            </svg>
          </a>
        )}
        {videoLink && (
          <a href={videoLink} target="_blank" rel="noopener noreferrer" class="quick-link" aria-label="Vidéo">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m22 8-6 4 6 4V8z"></path>
              <rect x="2" y="6" width="14" height="12" rx="2"></rect>
            </svg>
          </a>
        )}
      </div>
    </>
  )}
</div>
```

- [ ] **Step 4: Add styles**

In the `<style>` block, update `.hero-meta` to allow wrapping, and add `.quick-links` and `.quick-link` rules. Find the existing `.hero-meta` rule and replace it:

```css
.hero-meta {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}
```

Then add after the existing `.meta-divider` rule:

```css
.quick-links {
  display: flex;
  gap: 0.5rem;
}

.quick-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 0.375rem;
  color: rgba(255, 255, 255, 0.55);
  text-decoration: none;
  transition: color 0.2s ease-in-out, border-color 0.2s ease-in-out;
}

.quick-link:hover {
  color: rgba(255, 255, 255, 1);
  border-color: rgba(255, 255, 255, 0.5);
}
```

- [ ] **Step 5: Verify build**

```bash
pnpm astro check
```

Expected: no type errors.

---

### Task 3: Wire props in the slug page

**Files:**
- Modify: `src/pages/conferences/[...slug].astro`

**Interfaces:**
- Consumes: `conference.data.slides` and `conference.data.videoLink` (both `string | undefined`)

- [ ] **Step 1: Destructure the new fields**

On line 22, add `slides` and `videoLink` to the destructuring:

```ts
const { title, events, authors, tags, thumbnail, photos, slides, videoLink } = conference.data;
```

- [ ] **Step 2: Pass props to ConferenceHero**

Update the `<ConferenceHero />` call (around line 45–51):

```astro
<ConferenceHero
  title={title}
  tags={tags}
  eventsCount={events.length}
  thumbnail={thumbnail}
  coSpeaker={coSpeaker?.data}
  slides={slides}
  videoLink={videoLink}
/>
```

- [ ] **Step 3: Final build and visual check**

```bash
pnpm build
```

Expected: build succeeds with no errors.

Then start dev server and open a conference page to verify:

```bash
pnpm dev
```

- Open `http://localhost:4321/conferences/<any-slug>`
- Confirm: no buttons shown when no links are set
- Add `slides: "https://example.com/slides"` to a local `.mdx` frontmatter temporarily, confirm the slides button appears after the event count
- Add `videoLink: "https://example.com/video"` too, confirm both buttons appear
- Resize to mobile width: confirm the meta row wraps cleanly
- Revert the temporary frontmatter change
