# Spec : Refonte de la page Home

**Date** : 2026-06-20  
**Scope** : Page d'accueil uniquement (`src/pages/index.astro`, `src/components/Hero.astro`, `src/components/Navigation.astro`, `src/styles/global.css`)  
**Source design** : projet claude.ai/design `f3bc706d-2c04-4a91-bb0d-e11375e7f4df`, fichier `Portfolio Home.dc.html`

---

## 1. Navigation (`Navigation.astro`)

Changements ciblés sur le `<nav>` existant :

- Wrapper dans un `<header>` avec `position: sticky; top: 0; z-index: 20; background: var(--color-bg); border-bottom: 1px solid var(--color-border)`
- Hauteur interne fixée à `3.25rem` via `height: 3.25rem` sur le div intérieur (au lieu du padding actuel)
- Le reste du composant (liens, toggle thème, icônes soleil/lune) reste inchangé

## 2. Hero (`Hero.astro`)

Refonte complète du composant. Le layout abandonne la grille CSS au profit d'un positionnement absolu.

### Structure globale

```
<section.hero>               height: calc(100dvh - 3.25rem), position: relative, overflow: hidden
  <p.ghost>                  position absolute, ghost text "Frontend"
  <div.photo>                position absolute, right: 0, bottom: 0, width: 52%
    <img>                    placeholder en attendant la photo réelle
    <div.photo-fade>         gradient overlay de gauche à droite (bg → transparent)
  <div.content>              position relative z-index 2
                             max-width: 72rem, margin: 0 auto
                             padding: 4rem 2rem 0, padding-right: calc(2rem + 46%)
    <div.eyebrow>            ligne + "01 — Développeur Frontend"
    <h1>                     "Lucas / Audart"
  <div.rule>                 position relative z-index 2, full-bleed 1px border
  <div.bio-block>            position relative z-index 2
                             max-width: 72rem, margin: 0 auto
                             padding: 0 2rem 7rem, padding-right: calc(2rem + 46%)
    <p.bio>
    <ul.socials>
```

### Ghost text

- `position: absolute; top: -0.75rem; left: 50%; transform: translateX(-50%)`
- `font-size: clamp(7rem, 34vw, 22rem)` (vs actuel `clamp(5rem, 28vw, 16rem)`)
- `-webkit-text-stroke: 1.5px var(--color-stroke)` (nouvelle variable)
- `z-index: 0`

### Photo placeholder

- `position: absolute; right: 0; bottom: 0; width: 52%; z-index: 1`
- `<img>` avec `width: 100%; height: auto`
- Placeholder : élément `<div>` avec fond `var(--color-block)` et opacité réduite jusqu'à ce que la vraie photo soit intégrée
- Gradient fade : `linear-gradient(to right, var(--color-bg) 0%, rgba(var(--color-bg-rgb), 0.8) 22%, rgba(var(--color-bg-rgb), 0.2) 52%, transparent 78%)`

### Eyebrow

Remplace l'actuel `<p class="eyebrow">` :

```html
<div class="eyebrow">
  <span class="eyebrow-line"></span>
  <span class="eyebrow-text">01 — Développeur Frontend</span>
</div>
```

- `.eyebrow` : `display: flex; align-items: center; gap: 0.875rem; margin-bottom: 2.75rem`
- `.eyebrow-line` : `width: 1.75rem; height: 1px; background: var(--color-accent); flex-shrink: 0`
- `.eyebrow-text` : `font-size: 0.72rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--color-accent)`

### Titre

- `font-size: clamp(5rem, 13.5vw, 10.5rem)` (vs actuel `clamp(3.5rem, 16vw, 7rem)`)
- `line-height: 0.86`
- `letter-spacing: -0.03em`

### Séparateur full-bleed

```html
<div class="rule"></div>
```

- `position: relative; z-index: 2; width: 100%; height: 1px; background: var(--color-border); margin: 3.25rem 0`

### Bio + socials

- Wrapper avec `padding: 0 2rem 7rem; padding-right: calc(2rem + 46%)`
- `max-width: 72rem; margin: 0 auto`
- Bio : `font-size: 1.125rem; line-height: 1.8; color: var(--color-text-muted)`
- Socials : conservés, style inchangé (border-radius `0.375rem`, color `var(--color-text-muted)`)

## 3. CSS global (`global.css`)

Deux nouvelles variables à ajouter dans `:root` et `[data-theme="dark"]` :

| Variable | Light | Dark |
|---|---|---|
| `--color-bg-rgb` | `239,236,228` | `26,25,22` |
| `--color-stroke` | `#dcd7cc` | `#2e2b25` |

`--color-stroke` est identique à `--color-border` — utilisé spécifiquement pour le ghost text afin de pouvoir le surcharger indépendamment si besoin.

## 4. Placeholder photo

Jusqu'à intégration de la vraie photo (remove-bg DevFest Lille), le bloc photo sera un `<div>` stylé :

```html
<div class="photo-placeholder" aria-hidden="true"></div>
```

- Fond : `var(--color-block)` avec opacité 0.25
- Silhouette SVG centrée (même que l'actuelle dans Hero.astro) pour maintenir le rendu visuel

## 5. Ce qui ne change pas

- Le composant `VerticalLabel.astro` et son positionnement fixe
- Le `Layout.astro` (pas de modification)
- La logique JS du toggle thème dans `Navigation.astro`
- Les liens des réseaux sociaux (toujours `https://google.com` en placeholder)
- Le contenu textuel (bio, nom)
