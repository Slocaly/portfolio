# Design : Refactoring de la page Conférences

**Date :** 2026-06-20
**Statut :** Approuvé

## Objectif

Remplacer la page `/conferences` monolithique (rendu côté client via JS) par trois pages Astro indépendantes rendues côté serveur. Supprimer l'onglet "Sur la map" et la dépendance Leaflet.

## URLs cibles

| URL | Vue |
|-----|-----|
| `/conferences` | Par date (page principale) |
| `/conferences/talk` | Par talk |
| `/conferences/conference` | Par conférence |

Les pages de détail `/conferences/[slug]` restent inchangées. En Astro, les routes statiques (`talk.astro`, `conference.astro`) ont priorité sur la route dynamique (`[...slug].astro`).

## Structure des fichiers

```
src/
  lib/
    conferences.ts              ← NOUVEAU
  components/
    ConferencesHeader.astro     ← NOUVEAU
  pages/
    conferences.astro           ← MODIFIÉ
    conferences/
      talk.astro                ← NOUVEAU
      conference.astro          ← NOUVEAU
      [...slug].astro           ← inchangé
```

## `src/lib/conferences.ts`

Fonctions exportées :

### `getTalks()`
- Appelle `getCollection("conferences")`
- Résout le co-speaker via `getEntry(conf.data.authors)` si présent
- Transforme chaque entrée en objet `Talk` :
  ```ts
  type Talk = {
    id: string
    title: string
    description: string      // abstract tronqué à 130 chars, emojis supprimés
    tags: string[]
    authorLabel: string      // "Lucas Audart" ou "Lucas Audart & {nom}"
    link: string             // /conferences/{id}
    events: TalkEvent[]
  }
  type TalkEvent = {
    conf: string
    dateMs: number
    loc: string
    fb: string | null
    vid: string | null
  }
  ```
- Trie les talks par date du dernier événement, décroissant
- Retourne `Talk[]`

### `getConferenceStats(talks: Talk[])`
- Calcule et retourne :
  ```ts
  {
    totalTalks: number
    totalEvents: number
    totalCities: number
    minYear: number
  }
  ```

### Helpers utilitaires
- `fmtDate(ms: number): string` — ex: "12 juin"
- `fmtDateFull(ms: number): string` — ex: "12 juin 2025"

Note : pas de fonction `esc()` — Astro échappe automatiquement les valeurs dans les templates.

## `src/components/ConferencesHeader.astro`

Props :
```ts
{
  stats: { totalTalks: number, totalEvents: number, totalCities: number, minYear: number }
  activeTab: 'date' | 'talk' | 'conference'
}
```

Contient :
- La section hero (titre "Conférences", eyebrow, stats)
- La barre d'onglets avec des `<a>` vers `/conferences`, `/conferences/talk`, `/conferences/conference`
- L'onglet actif est mis en surbrillance via la prop `activeTab` (attribut `data-active` ou classe CSS)

Pas de JavaScript — le state actif est déterminé à la compilation.

## Pages

### `conferences.astro` (vue "Par date")

- Appelle `getTalks()` et `getConferenceStats()`
- Construit la liste plate de tous les événements, triée par date décroissante
- Groupe par année
- Rend `<ConferencesHeader activeTab="date" />`
- Rend la vue date entièrement en HTML Astro (`{groups.map(...)}`)
- Les styles CSS (`.date-group`, `.date-event-row`, etc.) deviennent des styles scopés (suppression des `:global()`)

### `conferences/talk.astro` (vue "Par talk")

- Appelle `getTalks()` et `getConferenceStats()`
- Rend `<ConferencesHeader activeTab="talk" />`
- Rend la grille de cards en HTML Astro (`{talks.map(...)}`)
- Styles scopés pour `.talk-grid`, `.talk-card`, etc.

### `conferences/conference.astro` (vue "Par conférence")

- Appelle `getTalks()` et `getConferenceStats()`
- Construit la map `confName → events[]`, triée par nombre de talks décroissant
- Rend `<ConferencesHeader activeTab="conference" />`
- Rend la liste groupée en HTML Astro (`{confs.map(...)}`)
- Styles scopés pour `.conf-group`, `.conf-event-row`, etc.

## Ce qui est supprimé

- L'intégralité du `<script define:vars={{ talks }}>` dans `conferences.astro`
- Les fonctions JS : `renderDate()`, `renderTalk()`, `renderConf()`, `renderMap()`, `loadLeaflet()`
- L'onglet "Sur la map" et la div `#view-map`
- Les styles `:global(.map-*)` et tout ce qui concerne Leaflet
- Les `<div id="view-date/talk/conf/map" hidden>` remplacés par le contenu Astro direct

## Styles

Les styles CSS actuellement en `:global()` dans `conferences.astro` (nécessaires car injectés via JS) migrent en styles **scopés** dans chaque page concernée. Les styles partagés entre pages (hero, tab bar) restent dans `ConferencesHeader.astro`. Les variables CSS spécifiques à ces pages (ex: `--color-border-sub`) sont dupliquées dans chaque page qui en a besoin — la duplication est acceptable et évite une modification de `global.css` non liée à cette tâche.
