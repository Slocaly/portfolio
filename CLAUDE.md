# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Personal portfolio/blog site built with Astro, using the package manager pnpm.

## Commands

- `pnpm dev` — start local dev server at `localhost:4321`
- `pnpm build` — build production site to `./dist/`
- `pnpm preview` — preview the production build locally
- `pnpm astro ...` — run Astro CLI commands (e.g. `pnpm astro check` for type-checking)
- `pnpm lint` — run oxlint

There is no test suite configured.

## Architecture

- **Content collections** (`src/content.config.ts`): two collections are defined using glob loaders:
  - `articles` — loads `**/[^_]*.md` from `src/blog/`, schema requires `title`, `pubDate`, `description`, `author`, `image` (`url`/`alt`), `tags`.
  - `conferences` — loads `**/*.{md,mdx}` from `src/conferences/`, schema requires `title`, `events` (array of `{ name, date, location }`), `description`, `authors` (array of `{ name, link?, image? }`), `tags`.
- **Dynamic routes**: `src/pages/articles/[...slug].astro` and `src/pages/conferences/[...slug].astro` use `getStaticPaths()` + `getCollection()` to render each entry's content via `render()`, both wrapped in `Layout`.
- **Listing pages**: `src/pages/blog.astro` and `src/pages/conferences.astro` fetch their respective collections with `getCollection()` and render a list of links to the dynamic routes above (`/articles/{id}`, `/conferences/{id}`).
- **Layout** (`src/layouts/Layout.astro`): shared HTML shell (head/body) used by all pages.
- **Navigation** (`src/components/Navigation.astro`): shared nav bar; update this when adding new top-level pages/sections.
- When adding a new content collection, follow the existing pattern: define a glob loader + zod schema in `content.config.ts`, add a listing page under `src/pages/`, and a `[...slug].astro` dynamic route under `src/pages/<collection>/`.
