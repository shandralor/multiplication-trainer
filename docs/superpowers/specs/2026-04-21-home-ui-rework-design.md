# Home UI Rework Design Spec

**Date:** 2026-04-21
**Status:** Design approved, implementation pending

## Overview

The current `app/page.tsx` mixes a game portal (Kraak de kluis), an operation toggle (×/÷), a tafelkiezer, a question-count/time config, and three mode buttons onto a single scrolling screen. It feels thrown together — kids see a wall of controls without a clear story about what the app does.

This rework splits the home into a clean portal with three equal-weight worlds, and moves the tafel/modus configuration into dedicated sub-pages per operation. The existing `/safe` route is untouched; two new routes (`/vermenigvuldigen`, `/delen`) absorb the config that used to live on home. Question gameplay (`/quiz`) is unchanged — the sub-pages just build the same URL the current home builds today.

## Goals

- Replace the "thrown-together" home with a clear three-world portal.
- Give multiplication and division their own focused setup pages, mirroring the dedicated feel `/safe` already has.
- Make the mode choice the *first* question on the sub-page (wizard-style: mode → tafels → config → start), instead of the *last*.
- Keep all existing quiz/practice/timed functionality working exactly as today.

## Non-Goals

- Any change to gameplay logic (`/quiz`, `/safe`).
- Any change to the safe minigame itself or to achievements.
- New modes, new operations, or new content.
- A redesign of the Mijn voortgang page.

## Information Architecture

```
/                          Portal (three equal-weight cards)
├── /safe                  Safe cracker — unchanged
├── /vermenigvuldigen      NEW — tafel + modus setup for ×
├── /delen                 NEW — tafel + modus setup for ÷
├── /quiz?...              Unchanged — reached from the two new pages
└── /progress              Mijn voortgang — unchanged
```

The new sub-pages are entry/setup pages. On "Start!" they navigate to `/quiz?tables=...&mode=...&operation=...&count=...&time=...` — exactly the URL the current home builds.

## Home Screen (`/`)

### Chrome

Preserved from current home:

- Header with "Tafel trainer" gradient title.
- Streak chip (🔥 N dagen) and medal chip (🏅 N).
- Profile selector (unchanged component).
- Mijn voortgang link (kept in the header as today).

### Hero

- Mascot (existing `<Mascot>` component) with a short welcome: "Welkom terug! Kies een wereld om te spelen."
- Same emotion/animate hooks as today.

### Three portals

Three **equal-sized, stacked** cards. Each is a full-width tappable button (works on mobile and desktop).

| Order | Label                | Sub-line                       | Gradient                                 |
|:-----:|----------------------|--------------------------------|------------------------------------------|
| 1     | 🔐 Kraak de kluis    | `🦊 🐘 🐯 … N/10 dieren`       | amber → rose → indigo (existing)         |
| 2     | × Vermenigvuldigen   | Quiz · oefen · tijdrace        | emerald (success gradient)               |
| 3     | ÷ Delen              | Quiz · oefen · tijdrace        | blue (primary gradient)                  |

**Kluis hint:** the kluis card breaks strict symmetry with a small live-progress sub-line showing up to 5 collected animal emojis + `N/10 dieren`. This subtly pulls kids toward the gamified path without making the other two feel lesser. The emoji row is computed from the current profile's `animals` array; falls back to `Verzamel alle 10 dieren` when `animals.length === 0`.

### Removed from home

- Operation toggle (×/÷) — now decided by which portal you tap.
- Tafel grid (1–10).
- Aantal vragen pills.
- Tijd per vraag pills.
- Quiz / Oefen / Tijd modus buttons.

All five move to the sub-pages.

## Sub-Page: `/vermenigvuldigen` and `/delen`

Both routes render a shared `<OperationSetup operation="multiply" | "divide">` component from a thin route file each. All setup state lives in the shared component.

### Chrome

- Back link: `← Home` (top-left).
- Page title: `× Vermenigvuldigen` or `÷ Delen` (green or blue accent matching the portal gradient).
- Streak and medal chips (same as home — preserved for consistency and motivation).
- Mascot (existing component at `size="small"`, inline next to the page title; neutral emotion by default, briefly `happy` when the user toggles a tafel — mirrors today's home behavior).

### Flow: mode → tafels → config → start

Step 1 — **Kies je modus** (required). Three horizontal tiles:

- 📝 **Quiz** — emerald gradient when active.
- ♾️ **Oefen** — blue gradient when active.
- ⏱️ **Tijd** — amber gradient when active.

Only one active at a time. Default: Quiz.

Step 2 — **Kies je tafels**. Tafels 1–10 as a single horizontal row of compact square cells (full width divided by 10). "Alles" and "Wissen" as small text buttons in the section header. Selection state mirrors today's behavior.

Step 3 — **Aantal vragen**. Four pills: 10 · 20 · 30 · 50. Default: 10.

Step 3b — **Tijd per vraag** (conditional). Three pills: 3s · 4s · 5s. Default: 5s. **Disabled (greyed out) unless Tijd modus is selected** — this replaces today's "always visible, only used in tijdmodus" approach and reduces cognitive load.

Step 4 — **Start!** button. Full-width, gradient matching the selected mode. Sub-line summarizes the config: e.g. `Quiz · 3 tafels · 10 vragen` or `Tijd · 2 tafels · 20 vragen · 5s`. Disabled (gray) when no tafels selected, with a tooltip/inline-hint: "Kies eerst je tafels".

### Navigation

"Start!" calls `window.location.href = /quiz?${params}` with the exact params the current home uses. This means `/quiz` needs no changes.

## Data Model Changes

**None.** This is pure UI/routing work:

- No new profile fields.
- No new types in `lib/*`.
- No new achievements.
- No changes to `/quiz` or `/safe` internals.

The new sub-pages read:

- `getCurrentProfile()` for streak/medal chips (same as home today).
- For the home's kluis-hint: `profile.animals` (already exists).

## Component Inventory

### New files

- `app/vermenigvuldigen/page.tsx` — thin route mounting `<OperationSetup operation="multiply" />`.
- `app/delen/page.tsx` — thin route mounting `<OperationSetup operation="divide" />`.
- `components/operation-setup.tsx` — shared setup UI (modes row, tafel row, config pills, start button). Holds all local state (selectedMode, selectedTables, questionCount, timePerQuestion).

### Modified files

- `app/page.tsx` — stripped down to portal. Removes `useState` for operation/tables/count/time; removes all mode-start handlers. Adds kluis-hint rendering from `profile.animals`. Keeps profile load, streak/quiz count, mascot.

### Unchanged

- `components/mascot.tsx`
- `components/profile-selector.tsx`
- `components/ui/*`
- `app/quiz/page.tsx` and its internals
- `app/safe/*`
- `app/progress/*`
- All `lib/*` modules
- All `components/safe/*`

## Routing

Next.js App Router uses directory-based routes:

- `app/vermenigvuldigen/page.tsx` → `/vermenigvuldigen`
- `app/delen/page.tsx` → `/delen`

Dutch route paths chosen for consistency with the user-facing copy. This is a kids' app — URLs are rarely shared but when a parent sees them they should read as Dutch, not English.

## Responsive Notes

- **Home:** three stacked cards full-width on mobile; same full-width stack on desktop (capped at `max-w-md mx-auto`). Keeps the focused-portal feel instead of spreading cards side-by-side.
- **Sub-page:** on mobile, tafel row is 10 cells at ~32 px each (works down to 360 px viewport). Config pills wrap cleanly. Start button always full-width.
- Chips and mascot scale the same as today's home.

## Testing Strategy

**Automated:** no unit-testable logic added. Pure UI + routing work with no state machines worth covering in Vitest.

**Manual verification:**

1. Home renders three portals; kluis shows `0/10 dieren` on a fresh profile.
2. After collecting some animals, kluis shows `N/10 dieren` with up to 5 animal emojis.
3. Tapping each portal routes to the correct page (`/safe`, `/vermenigvuldigen`, `/delen`).
4. On `/vermenigvuldigen`: Quiz is pre-selected; tafel 3 toggles; pick 20 vragen; Start! goes to `/quiz?operation=multiply&mode=quiz&tables=3&count=20` and gameplay works.
5. Switching to Tijd modus un-greys the time pills; picking 4s adds `&time=4` to the URL.
6. Start! is disabled when no tafels selected, enabled when one is picked.
7. Same flow on `/delen` with `operation=divide`.
8. Streak and medal chips visible on all three screens (home, vermenigvuldigen, delen).
9. Back link returns to home.
10. Mobile viewport (375 px): nothing clips; tafel row fits.

## Migration / Compatibility

- No localStorage schema changes.
- No URL-param changes — `/quiz` still accepts the same query string.
- Users returning after the update land on the new home; no data loss.
- Bookmarks to `/quiz` or `/safe` still work.

## Edge Cases

- **No profile yet.** Chips show `0 dagen` / `0`. Kluis hint shows `Verzamel alle 10 dieren`. (Same null-safety as today's home.)
- **Deep link to `/vermenigvuldigen` without a profile.** `initializeProfiles()` runs on mount (same pattern as home). Sub-page works standalone.
- **User taps Start! with zero tafels.** Button disabled — no navigation. Inline hint tells them what to fix.
- **User switches mode after configuring.** Tafels/count/time are preserved; only the Start button's sub-line and gradient update.
- **Deep link to `/delen?tables=…`.** Out of scope — sub-pages don't read URL state in v1. If useful later, we add it; YAGNI for now.

## Open Questions

None after the brainstorm round. One implementation-time choice: exact Dutch phrasing for the Start button's disabled hint ("Kies eerst je tafels" vs "Selecteer een tafel"). Pick whichever reads best when wired up.

## Next Step

Invoke `writing-plans` to produce a bite-sized implementation plan covering:

1. Extract shared setup UI into `<OperationSetup>`.
2. New routes `/vermenigvuldigen` and `/delen`.
3. Strip home to portal; add kluis-hint.
4. Wire profile data (streak/medals) into sub-pages.
5. Manual QA pass.
