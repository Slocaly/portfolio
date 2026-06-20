---
name: conferences-date-view-responsive
description: Responsive improvements for the "Par date" conference list — font size bump and two-line mobile row layout
metadata:
  type: project
---

# Conferences "Par date" — Responsive Design

## Scope

Single file: `src/pages/conferences.astro` (the "Par date" view).  
The other two views ("Par talk", "Par conférence") are not touched.

## Problem

1. **Font sizes are too small** — all text in event rows sits in the `0.63rem–0.8rem` range, unreadable on mobile.
2. **Mobile layout is broken** — the current `< 640px` breakpoint hides the conference name, location, and links, leaving only the date and talk title in an awkward horizontal flex row. Conference name is required by the user.

## Design

### 1. Font size increases (desktop + mobile)

| Element | Before | After |
|---|---|---|
| Date | `0.73rem` | `0.85rem` |
| Conf name | `0.78rem` | `0.88rem` |
| Talk title | `0.8rem` | `0.9rem` |
| Location | `0.71rem` | `0.8rem` |
| Links (Vidéo / Avis) | `0.63rem` | `0.72rem` |

Desktop 5-column table layout is otherwise unchanged.

### 2. Mobile layout (`< 640px`) — two-line row

Each `.date-event-row` switches from a single horizontal flex row to a vertical two-line block:

**Line 1** — date (muted) + separator dot + conf name (bold, display font), both inline on one line.  
**Line 2** — talk title, wraps freely (no `white-space: nowrap` or `text-overflow: ellipsis` on mobile).

Rules:
- Conf name also wraps freely on mobile (no truncation).
- Location (`.date-ev-loc`) and links (`.date-ev-links`) remain hidden on mobile — they are not in the required minimum information set.
- The year column (`.date-year-col`) keeps its current mobile behaviour (collapses to full-width row above events).

### Required information on mobile (per event)
1. Date
2. Conference name
3. Talk title
