# Design : Navigation responsive (bottom nav mobile)

## Contraintes

- **Pas de commit** — aucune étape ne doit committer. Lucas gère ses commits lui-même en fin de session.

## Objectif

Ajouter une barre de navigation en bas de l'écran sur mobile, tout en conservant le header existant sur desktop. Les deux coexistent dans le même composant `Navigation.astro`.

## Breakpoint

- **Desktop** : `≥ 640px` — header en haut avec liens texte, toggle de thème
- **Mobile** : `< 640px` — header minimaliste (toggle seul, sans bordure), bottom nav en bas

## Modifications de `Navigation.astro`

### Header sur mobile
- Les liens `.links` sont masqués (`display: none`)
- La `border-bottom` du `<header>` est masquée
- Le toggle de thème reste visible

### Bottom nav (ajout)
- Élément `<nav class="bottom-nav">` ajouté dans le composant
- `position: fixed; bottom: 0; left: 0; right: 0`
- `background: var(--color-bg)`, `border-top: 1px solid var(--color-border)`
- 4 items en flexbox équirépartis
- Masqué sur desktop (`display: none`)

### Items de la bottom nav

| href | Icône | Label mobile |
|---|---|---|
| `/` | `IconHome` | Accueil |
| `/about` | `IconUser` | Moi |
| `/conferences` | `IconMic` | Talks |
| `/blog` | `IconPen` | Blog |

Chaque item : icône (24px) au-dessus du label (0.625rem, font-weight 500).
- Actif : `var(--color-accent)`
- Inactif : `var(--color-text-muted)`

### Renommage "Talks"
Le label "Conférences" devient "Talks" dans le menu desktop également.

## Nouvelles icônes SVG à créer

4 composants `Icon*.astro` style stroke, cohérents avec `IconSun`/`IconMoon` :
- `IconHome.astro` — maison
- `IconUser.astro` — silhouette personne
- `IconMic.astro` — microphone
- `IconPen.astro` — stylo/crayon

## Modification de `global.css`

Ajout d'un `padding-bottom` (~4rem) sur `body` en mobile pour que le contenu ne soit pas masqué par la bottom nav fixe.

## Fichiers impactés

- `src/components/Navigation.astro` — modifications CSS + ajout bottom nav + renommage Talks
- `src/styles/global.css` — padding-bottom body mobile
- `src/components/IconHome.astro` — nouveau
- `src/components/IconUser.astro` — nouveau
- `src/components/IconMic.astro` — nouveau
- `src/components/IconPen.astro` — nouveau

Aucune page n'a besoin d'être modifiée.
