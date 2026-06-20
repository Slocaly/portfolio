# Home Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refondre la page d'accueil pour correspondre au design `Portfolio Home.dc.html` — nav sticky, hero plein-écran avec photo et gradient, nouveau layout de contenu.

**Architecture:** Trois fichiers modifiés uniquement. `global.css` reçoit deux nouvelles variables CSS. `Navigation.astro` est enrobé dans un `<header>` sticky. `Hero.astro` est réécrit avec un layout à positionnement absolu (photo à droite, contenu à gauche via padding-right).

**Tech Stack:** Astro, CSS custom properties, SVG (placeholder photo)

## Global Constraints

- Package manager : `pnpm` exclusivement
- Aucune dépendance externe à ajouter
- Conserver les noms de variables CSS existants (`--color-*`) — ne pas basculer vers `--c-*`
- Pas de suite de tests — vérification visuelle via `pnpm dev`
- Commandes de validation : `pnpm build` (type-check + build), `pnpm lint`

---

### Task 1: Ajouter les variables CSS manquantes

**Files:**
- Modify: `src/styles/global.css`

**Interfaces:**
- Produces: `--color-bg-rgb` (valeur RGB du fond), `--color-stroke` (identique à `--color-border`) dans `:root` et `[data-theme="dark"]`

- [ ] **Step 1: Ajouter les variables dans `:root`**

Dans `src/styles/global.css`, après `--color-accent-2: #5b7c6b;`, ajouter :

```css
  --color-bg-rgb: 239,236,228;
  --color-stroke: #dcd7cc;
```

Le bloc `:root` complet doit ressembler à :

```css
:root {
  --color-bg: #efece4;
  --color-bg-rgb: 239,236,228;
  --color-bg-elevated: #f5f2eb;
  --color-text: #26262b;
  --color-text-muted: #767169;
  --color-muted: #9a958c;
  --color-border: #dcd7cc;
  --color-block: #a4533c;
  --color-block-text: #f7f3ec;
  --color-accent: #a4533c;
  --color-accent-2: #5b7c6b;
  --color-bg-rgb: 239,236,228;
  --color-stroke: #dcd7cc;

  --font-display: "Archivo Expanded", "Archivo", sans-serif;
  --font-sans: "Archivo", -apple-system, "Segoe UI", Roboto, sans-serif;

  --content-width: 40rem;
  --wide-width: 72rem;
  --space-1: 0.5rem;
  --space-2: 1rem;
  --space-3: 1.5rem;
  --space-4: 2.5rem;
  --space-5: 4rem;
}
```

- [ ] **Step 2: Ajouter les variables dans `[data-theme="dark"]`**

Après `--color-accent-2: #6e9680;` dans le bloc dark, ajouter :

```css
  --color-bg-rgb: 26,25,22;
  --color-stroke: #2e2b25;
```

Le bloc dark complet :

```css
[data-theme="dark"] {
  --color-bg: #1a1916;
  --color-bg-elevated: #242119;
  --color-text: #e6e1d8;
  --color-text-muted: #8c8579;
  --color-muted: #5e5952;
  --color-border: #2e2b25;
  --color-block: #c06350;
  --color-block-text: #1a1916;
  --color-accent: #c06350;
  --color-accent-2: #6e9680;
  --color-bg-rgb: 26,25,22;
  --color-stroke: #2e2b25;
}
```

- [ ] **Step 3: Vérifier la build**

```bash
pnpm build
```

Expected: build sans erreur.

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css
git commit -m "style: add --color-bg-rgb and --color-stroke CSS variables"
```

---

### Task 2: Rendre la navigation sticky

**Files:**
- Modify: `src/components/Navigation.astro`

**Interfaces:**
- Consumes: `--color-bg`, `--color-border` (depuis Task 1 — déjà présentes)
- Produces: `<header>` sticky de hauteur `3.25rem`, utilisé par Hero.astro pour `calc(100dvh - 3.25rem)`

- [ ] **Step 1: Enrober le `<nav>` dans un `<header>`**

Remplacer l'élément racine `<nav>` par un `<header>` contenant un div intérieur. Le contenu du nav actuel (liens + bouton) reste inchangé à l'intérieur.

Résultat attendu dans `Navigation.astro` (section template) :

```astro
<header>
  <div class="nav-inner">
    <ul class="links">
      {
        links.map((link) => {
          const isActive =
            link.href === "/" ? current === "/" : current.startsWith(link.href);
          return (
            <li>
              <a aria-current={isActive ? "page" : undefined} href={link.href}>
                {link.label}
              </a>
            </li>
          );
        })
      }
    </ul>

    <button id="theme-toggle" aria-label="Basculer le thème">
      <IconSun class="icon-sun" />
      <IconMoon class="icon-moon" />
    </button>
  </div>
</header>
```

- [ ] **Step 2: Mettre à jour les styles**

Remplacer le bloc `<style>` complet par :

```astro
<style>
  header {
    position: sticky;
    top: 0;
    z-index: 20;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
  }

  .nav-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    max-width: var(--wide-width);
    margin: 0 auto;
    padding: 0 var(--space-2);
    height: 3.25rem;
  }

  .links {
    display: flex;
    gap: var(--space-3);
    list-style: none;
    margin: 0;
    padding: 0;
    font-size: 0.95rem;
  }

  .links a {
    color: var(--color-text-muted);
    text-decoration: none;
    font-weight: 500;
  }

  .links a:hover {
    color: var(--color-text);
  }

  .links a[aria-current="page"] {
    color: var(--color-text);
  }

  #theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    padding: 0;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: var(--color-bg-elevated);
    color: var(--color-text);
    cursor: pointer;
    flex-shrink: 0;
  }

  :global(#theme-toggle svg) {
    width: 1rem;
    height: 1rem;
  }

  :global(.icon-moon) {
    display: none;
  }

  :global(html[data-theme="dark"] .icon-sun) {
    display: none;
  }

  :global(html[data-theme="dark"] .icon-moon) {
    display: block;
  }
</style>
```

- [ ] **Step 3: Vérifier visuellement**

```bash
pnpm dev
```

Ouvrir `http://localhost:4321`. Vérifier :
- La nav reste visible en scrollant
- La bordure inférieure est présente
- Le toggle thème fonctionne toujours

- [ ] **Step 4: Commit**

```bash
git add src/components/Navigation.astro
git commit -m "feat: make navigation sticky with border-bottom"
```

---

### Task 3: Réécrire le composant Hero

**Files:**
- Modify: `src/components/Hero.astro`

**Interfaces:**
- Consumes: `--color-bg-rgb`, `--color-stroke` (Task 1), hauteur nav `3.25rem` (Task 2)

- [ ] **Step 1: Remplacer le contenu de Hero.astro**

Remplacer l'intégralité de `src/components/Hero.astro` par :

```astro
---
const socials = {
  github: "https://google.com",
  linkedin: "https://google.com",
  bluesky: "https://google.com",
  email: "https://google.com",
};
---

<section class="hero">

  <p class="ghost" aria-hidden="true">Frontend</p>

  <div class="photo" aria-hidden="true">
    <div class="photo-placeholder">
      <svg
        class="figure"
        viewBox="0 0 200 280"
        preserveAspectRatio="xMidYMin meet"
        aria-hidden="true"
      >
        <circle cx="100" cy="70" r="48"></circle>
        <path d="M20 280 C20 180 50 150 100 150 C150 150 180 180 180 280 Z"></path>
      </svg>
    </div>
    <div class="photo-fade"></div>
  </div>

  <div class="content">
    <div class="eyebrow">
      <span class="eyebrow-line"></span>
      <span class="eyebrow-text">01 — Développeur Frontend</span>
    </div>
    <h1 class="name">
      Lucas<br />
      Audart
    </h1>
  </div>

  <div class="rule"></div>

  <div class="bio-block">
    <p class="bio">
      Je conçois et développe des interfaces web modernes, accessibles et
      performantes — du prototype à la mise en production.
    </p>
    <ul class="socials">
      <li>
        <a href={socials.github} aria-label="github">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.49 0-.24-.01-1.05-.01-1.9-2.78.6-3.37-1.34-3.37-1.34-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.34-1.11.62-1.36-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.64 1.03 2.76 0 3.94-2.35 4.81-4.58 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
          </svg>
        </a>
      </li>
      <li>
        <a href={socials.linkedin} aria-label="linkedin">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19M18.5 18.5V13.2A3.26 3.26 0 0 0 15.24 9.94C14.39 9.94 13.4 10.46 12.92 11.24V10.13H10.13V18.5H12.92V13.57C12.92 12.8 13.54 12.17 14.31 12.17A1.4 1.4 0 0 1 15.71 13.57V18.5H18.5M6.88 8.56A1.68 1.68 0 0 0 8.56 6.88C8.56 5.95 7.81 5.19 6.88 5.19A1.69 1.69 0 0 0 5.19 6.88C5.19 7.81 5.95 8.56 6.88 8.56M8.27 18.5V10.13H5.5V18.5H8.27Z" />
          </svg>
        </a>
      </li>
      <li>
        <a href={socials.bluesky} aria-label="bluesky">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.86 1.5 1.225 1.5 3.225c0 .4.232 3.348.367 3.83.473 1.673 2.156 2.107 3.67 1.847-2.652.452-3.336 1.952-1.875 3.452 2.79 2.871 4.07-.62 4.338-1.418.27.8 1.55 4.288 4.338 1.418 1.46-1.5.776-3-1.876-3.452 1.515.26 3.198-.174 3.67-1.847.136-.482.368-3.43.368-3.83 0-2-1.066-2.365-3.702-.42C16.046 4.747 13.087 8.686 12 10.8Z" />
          </svg>
        </a>
      </li>
      <li>
        <a href={socials.email} aria-label="email">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 6-10 7L2 6" />
          </svg>
        </a>
      </li>
    </ul>
  </div>

</section>

<style>
  .hero {
    position: relative;
    height: calc(100dvh - 3.25rem);
    overflow: hidden;
  }

  /* Ghost text */
  .ghost {
    position: absolute;
    top: -0.75rem;
    left: 50%;
    transform: translateX(-50%);
    margin: 0;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: clamp(7rem, 34vw, 22rem);
    line-height: 1;
    text-transform: uppercase;
    letter-spacing: -0.02em;
    color: transparent;
    -webkit-text-stroke: 1.5px var(--color-stroke);
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
    z-index: 0;
  }

  /* Photo placeholder */
  .photo {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 52%;
    z-index: 1;
    pointer-events: none;
  }

  .photo-placeholder {
    position: relative;
    width: 100%;
    padding-bottom: 120%;
    background: var(--color-block);
    opacity: 0.25;
    overflow: hidden;
  }

  .figure {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    fill: var(--color-text);
  }

  .photo-fade {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to right,
      var(--color-bg) 0%,
      rgba(var(--color-bg-rgb), 0.8) 22%,
      rgba(var(--color-bg-rgb), 0.2) 52%,
      transparent 78%
    );
  }

  /* Content block (eyebrow + title) */
  .content {
    position: relative;
    z-index: 2;
    max-width: var(--wide-width);
    margin: 0 auto;
    padding: 4rem 2rem 0;
    padding-right: calc(2rem + 46%);
  }

  /* Eyebrow */
  .eyebrow {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    margin-bottom: 2.75rem;
  }

  .eyebrow-line {
    width: 1.75rem;
    height: 1px;
    background: var(--color-accent);
    display: block;
    flex-shrink: 0;
  }

  .eyebrow-text {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-accent);
  }

  /* Title */
  .name {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: clamp(5rem, 13.5vw, 10.5rem);
    line-height: 0.86;
    letter-spacing: -0.03em;
    text-transform: uppercase;
    color: var(--color-text);
  }

  /* Full-bleed rule */
  .rule {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 1px;
    background: var(--color-border);
    margin: 3.25rem 0;
  }

  /* Bio + socials block */
  .bio-block {
    position: relative;
    z-index: 2;
    max-width: var(--wide-width);
    margin: 0 auto;
    padding: 0 2rem 7rem;
    padding-right: calc(2rem + 46%);
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
  }

  .bio {
    margin: 0;
    font-size: 1.125rem;
    line-height: 1.8;
    color: var(--color-text-muted);
  }

  .socials {
    display: flex;
    gap: 0.625rem;
    list-style: none;
    padding: 0;
    margin: 0;
    flex-wrap: wrap;
  }

  .socials a {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    color: var(--color-text-muted);
  }

  .socials a:hover {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }

  .socials svg {
    width: 1.1rem;
    height: 1.1rem;
  }
</style>
```

- [ ] **Step 2: Vérifier visuellement dans le navigateur**

```bash
pnpm dev
```

Ouvrir `http://localhost:4321`. Vérifier :
- Le hero occupe toute la hauteur de l'écran (moins la nav)
- Le ghost text "Frontend" est grand et positionné en fond
- Le placeholder photo est à droite avec gradient de fondu à gauche
- L'eyebrow "01 — Développeur Frontend" apparaît avec la ligne accent
- Le titre "Lucas / Audart" est plus grand que l'ancienne version
- La règle horizontale full-bleed sépare le titre du reste
- La bio et les icônes sociales sont en bas à gauche
- Le mode dark fonctionne correctement (toggle thème)
- La nav est sticky et visible en scrollant

- [ ] **Step 3: Vérifier la build**

```bash
pnpm build
```

Expected: build sans erreur ni warning TypeScript.

- [ ] **Step 4: Linter**

```bash
pnpm lint
```

Expected: aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat: redesign home hero with photo placeholder, new layout and typography"
```
