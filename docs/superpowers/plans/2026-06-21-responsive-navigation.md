# Responsive Navigation (Bottom Nav Mobile) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une barre de navigation fixe en bas sur mobile, tout en conservant le header existant sur desktop.

**Architecture:** Tout réside dans `Navigation.astro` existant — un `<nav class="bottom-nav">` est ajouté dans le même composant, visible uniquement sur mobile via CSS. Le header masque ses liens et sa bordure sur mobile. Les icônes sont des composants Astro SVG inline, cohérents avec les icônes existantes du projet.

**Tech Stack:** Astro, CSS custom properties (var(--…)), SVG inline

## Global Constraints

- Breakpoint mobile : `max-width: 639px`
- Aucun commit — Lucas gère ses commits lui-même en fin de session
- Pas de librairie d'icônes externe — SVG maison style stroke uniquement
- Pas de suite de tests — vérification manuelle via `pnpm dev`
- Conserver les variables CSS existantes (`var(--color-accent)`, `var(--color-border)`, etc.)

---

### Task 1 : Créer les 4 composants icônes SVG

**Files:**
- Create: `src/components/IconHome.astro`
- Create: `src/components/IconUser.astro`
- Create: `src/components/IconMic.astro`
- Create: `src/components/IconPen.astro`

**Interfaces:**
- Consumes: rien
- Produces: 4 composants Astro sans props, chacun rendant un `<svg>` 24×24 `stroke="currentColor"`, utilisés dans Task 2

---

- [ ] **Step 1 : Créer `IconHome.astro`**

```astro
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
  <polyline points="9,21 9,12 15,12 15,21"/>
</svg>
```

- [ ] **Step 2 : Créer `IconUser.astro`**

```astro
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="8" r="4"/>
  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
</svg>
```

- [ ] **Step 3 : Créer `IconMic.astro`**

```astro
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="9" y="2" width="6" height="12" rx="3"/>
  <path d="M5 10a7 7 0 0 0 14 0"/>
  <line x1="12" y1="19" x2="12" y2="22"/>
  <line x1="8" y1="22" x2="16" y2="22"/>
</svg>
```

- [ ] **Step 4 : Créer `IconPen.astro`**

```astro
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5l-5 1 1-5L17 3z"/>
</svg>
```

- [ ] **Step 5 : Vérification manuelle**

Lancer `pnpm dev`, ouvrir n'importe quelle page et vérifier dans la console navigateur qu'il n'y a pas d'erreur. Les icônes ne sont pas encore visibles à cette étape (elles seront importées en Task 2).

---

### Task 2 : Mettre à jour `Navigation.astro` et `global.css`

**Files:**
- Modify: `src/components/Navigation.astro`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: `IconHome`, `IconUser`, `IconMic`, `IconPen` (Task 1)
- Produces: navigation responsive complète

---

- [ ] **Step 1 : Remplacer le contenu du frontmatter de `Navigation.astro`**

Remplacer le bloc `---` existant (lignes 1–12) par :

```astro
---
import IconSun from "./IconSun.astro";
import IconMoon from "./IconMoon.astro";
import IconHome from "./IconHome.astro";
import IconUser from "./IconUser.astro";
import IconMic from "./IconMic.astro";
import IconPen from "./IconPen.astro";

const desktopLinks = [
  { label: "Accueil", href: "/" },
  { label: "À propos", href: "/about" },
  { label: "Talks", href: "/conferences" },
  { label: "Blog", href: "/blog" },
];

const mobileLinks = [
  { label: "Accueil", href: "/", Icon: IconHome },
  { label: "Moi", href: "/about", Icon: IconUser },
  { label: "Talks", href: "/conferences", Icon: IconMic },
  { label: "Blog", href: "/blog", Icon: IconPen },
];

const current = Astro.url.pathname;
---
```

- [ ] **Step 2 : Mettre à jour le template HTML de `Navigation.astro`**

Remplacer tout le bloc HTML (lignes 15–38 actuelles, du `<header>` au `</header>`) par :

```astro
<header>
  <div class="nav-inner">
    <ul class="links">
      {
        desktopLinks.map((link) => {
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

<nav class="bottom-nav" aria-label="Navigation principale">
  {
    mobileLinks.map(({ label, href, Icon }) => {
      const isActive =
        href === "/" ? current === "/" : current.startsWith(href);
      return (
        <a aria-current={isActive ? "page" : undefined} href={href}>
          <Icon />
          <span>{label}</span>
        </a>
      );
    })
  }
</nav>
```

- [ ] **Step 3 : Remplacer la section `<style>` de `Navigation.astro`**

Remplacer le bloc `<style>…</style>` entier par :

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

  /* Bottom nav */
  .bottom-nav {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 20;
    background: var(--color-bg);
    border-top: 1px solid var(--color-border);
  }

  .bottom-nav a {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;
    color: var(--color-text-muted);
    text-decoration: none;
    font-size: 0.625rem;
    font-weight: 500;
    flex: 1;
    padding: 0.625rem 0;
  }

  .bottom-nav a:hover {
    color: var(--color-text);
  }

  .bottom-nav a[aria-current="page"] {
    color: var(--color-accent);
  }

  :global(.bottom-nav svg) {
    width: 1.5rem;
    height: 1.5rem;
  }

  /* Responsive */
  @media (max-width: 639px) {
    header {
      border-bottom-color: transparent;
    }

    .links {
      display: none;
    }

    .bottom-nav {
      display: flex;
    }
  }
</style>
```

- [ ] **Step 4 : Ajouter le padding-bottom mobile dans `global.css`**

À la fin du fichier `src/styles/global.css`, ajouter :

```css
@media (max-width: 639px) {
  body {
    padding-bottom: 4rem;
  }
}
```

- [ ] **Step 5 : Vérification manuelle desktop**

Lancer `pnpm dev` et ouvrir `http://localhost:4321` dans un navigateur.

Vérifier :
- Le header affiche bien "Accueil", "À propos", "Talks", "Blog" (plus "Conférences")
- Le toggle de thème fonctionne
- La bottom nav n'est pas visible
- Le lien actif est bien mis en évidence

- [ ] **Step 6 : Vérification manuelle mobile**

Dans les DevTools du navigateur, passer en vue mobile (ex. iPhone 390px).

Vérifier :
- Le header n'affiche plus les liens texte
- La bordure du header a disparu
- La bottom nav est visible en bas avec les 4 icônes + labels
- Les labels affichés : "Accueil", "Moi", "Talks", "Blog"
- L'item de la page courante est en rouge/brique (`var(--color-accent)`)
- Naviguer vers `/about`, `/conferences`, `/blog` et vérifier que l'état actif se met à jour
- Le contenu de la page n'est pas masqué derrière la bottom nav (scroll jusqu'en bas)
