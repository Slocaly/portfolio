# Conferences Mobile Tabs → Select Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the conference tab bar with a native `<select>` on screens ≤640px, keeping the tabs visible on desktop.

**Architecture:** Both the tab row and the select are rendered in the HTML at all times. CSS hides one and shows the other per breakpoint. Navigation on select change uses an inline `onchange` attribute — no script block needed.

**Tech Stack:** Astro, CSS (scoped `<style>` block)

## Global Constraints

- CSS only — no JS script blocks, no framework changes
- Only `src/components/ConferencesHeader.astro` touched
- Breakpoint: `640px` (matches the rest of the conference pages)
- No new props — `activeTab: "date" | "talk" | "conference"` is already available
- No commits — user manages commits

---

### Task 1: Add mobile select to ConferencesHeader

**Files:**
- Modify: `src/components/ConferencesHeader.astro`

**Interfaces:**
- Consumes: existing `activeTab` prop (`"date" | "talk" | "conference"`)
- Produces: a `<select>` visible on mobile that navigates to the correct page on change

- [ ] **Step 1: Read the current file**

Open `src/components/ConferencesHeader.astro` and locate:
1. The `.tab-bar` / `.tab-row` section in the HTML (around line 43–57)
2. The `.tab-bar` and `.tab-row` CSS rules in the `<style>` block

- [ ] **Step 2: Add the `<select>` inside `.tab-bar`**

Find this HTML block:

```astro
<div class="tab-bar">
  <div class="container tab-row">
    <a
      href="/conferences"
      class:list={["tab", { "tab--active": activeTab === "date" }]}
    >Par date</a>
    <a
      href="/conferences/talk"
      class:list={["tab", { "tab--active": activeTab === "talk" }]}
    >Par talk</a>
    <a
      href="/conferences/conference"
      class:list={["tab", { "tab--active": activeTab === "conference" }]}
    >Par conférence</a>
  </div>
</div>
```

Replace it with:

```astro
<div class="tab-bar">
  <div class="container tab-row">
    <a
      href="/conferences"
      class:list={["tab", { "tab--active": activeTab === "date" }]}
    >Par date</a>
    <a
      href="/conferences/talk"
      class:list={["tab", { "tab--active": activeTab === "talk" }]}
    >Par talk</a>
    <a
      href="/conferences/conference"
      class:list={["tab", { "tab--active": activeTab === "conference" }]}
    >Par conférence</a>
  </div>
  <div class="container tab-select-wrapper">
    <select class="tab-select" onchange="window.location.href = this.value">
      <option value="/conferences"             selected={activeTab === "date"}>Par date</option>
      <option value="/conferences/talk"        selected={activeTab === "talk"}>Par talk</option>
      <option value="/conferences/conference"  selected={activeTab === "conference"}>Par conférence</option>
    </select>
  </div>
</div>
```

- [ ] **Step 3: Add CSS for the select**

In the `<style>` block, add after the existing `.tab--active` rule:

```css
/* Mobile select — hidden on desktop */
.tab-select-wrapper {
  display: none;
}

@media (max-width: 640px) {
  .tab-row {
    display: none;
  }

  .tab-select-wrapper {
    display: block;
  }

  .tab-select {
    width: 100%;
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--color-text);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    padding: 0.75rem 1rem;
    cursor: pointer;
  }
}
```

- [ ] **Step 4: Start dev server and verify desktop**

```bash
pnpm dev
```

Open `localhost:4321/conferences` at full desktop width (≥900px). Verify:
- The three tabs are visible and the active one is underlined
- No select element is visible
- Tab navigation still works (click each tab)

- [ ] **Step 5: Verify mobile layout**

In browser DevTools, set viewport to 390px wide. On `localhost:4321/conferences`:
- The tab row is hidden
- A `<select>` is visible, full width, showing "PAR DATE" as the selected option
- Change the select to "PAR TALK" → page navigates to `/conferences/talk`, select shows "PAR TALK" as selected
- Change the select to "PAR CONFÉRENCE" → page navigates to `/conferences/conference`, select shows "PAR CONFÉRENCE" as selected
- Navigate back to `/conferences` → select shows "PAR DATE"

- [ ] **Step 6: Verify dark mode**

Toggle dark mode (theme switcher in the nav). At 390px viewport:
- Select background matches dark background (`var(--color-bg)`)
- Text is readable against dark background (`var(--color-text)`)
- Border is visible (`var(--color-border)`)
