# Safe Cracker Minigame — Design Spec

**Date:** 2026-04-20
**Status:** Design approved, implementation pending

## Overview

A new minigame for the Tafel Trainer app: **Kraak de Kluis** ("Crack the Safe"). The player is shown a circular safe dial with multiplication facts for one table arranged around it. Some facts are pre-filled; others are gaps. Filling every gap correctly "cracks" the safe and awards an animal, which is added to a persistent zoo collection.

The game lives at its own route (`/safe`), has two modes (Run and Endless), and three difficulty levels (Easy, Medium, Hard). Earned animals are tiered (bronze/silver/gold) based on how many mistakes were made cracking the safe. The collection persists per profile and maps 1-to-1 to multiplication tables ×1 through ×10.

## Goals

- Give kids a second, visually distinct way to practice multiplication tables that rewards mastery with a collectible zoo.
- Focus drilling on the facts kids are most likely to fumble (the "hard half" of each table).
- Integrate cleanly with the existing profile, streak, and table-stats system without breaking existing data.
- Reward perfection (0 mistakes → gold) without punishing off days (3+ mistakes still earns bronze).

## Non-Goals (v1)

- A second animal pack after the first is maxed out. (Placeholder only; vault-complete screen is terminal for v1.)
- Sound effects for the dial spin/flash. (Existing audio system can be extended later.)
- Leaderboard integration for safe runs.
- Saving partial safe progress on navigate-away.
- Animated confetti on gold (can reuse existing `/quiz` confetti in a follow-up).

## User Flow

```
Home (/)
  └─ [existing] Profile selector, table selector, operation toggle,
      mode buttons (Quiz / Practice / Timed)
  └─ [new]      "Kraak de Kluis" card
                    ├─ Run mode (10 safes, scorecard)
                    └─ Endless mode (until vault locks)

/safe  (new route)
  ├─ Start screen
  │    ├─ Mode toggle: Run / Endless
  │    ├─ Difficulty: Easy / Medium / Hard
  │    ├─ Table selector (reuses existing component — multi-select 1..10)
  │    └─ Collection strip preview ("6 / 10 verzameld")
  │
  ├─ Play screen
  │    ├─ Collection strip (full, animated on earn)
  │    ├─ Safe dial (slots orbiting outside, one random table from selection)
  │    ├─ Numpad (tap or keyboard)
  │    └─ Safe counter ("Kluis 3 / 10" in Run, "Kluis 7" in Endless)
  │
  ├─ Safe-cracked interstitial
  │    ├─ Dial spin + flash
  │    ├─ Animal reveal in tiered frame (bronze/silver/gold)
  │    ├─ "Upgraded!" badge if the tier improved over previous best
  │    └─ Auto-advance → next safe (Run) or continue prompt (Endless)
  │
  └─ Scorecard (Run end / Endless vault-lock)
       ├─ Safes cracked, tier breakdown (× gold, × silver, × bronze)
       ├─ Current collection
       └─ Play again / Home buttons
```

## Modes

### Run mode
Fixed 10 safes back-to-back. Difficulty ramp is relative to the starting difficulty (see table below). Scorecard at end.

### Endless mode
Keep cracking until a safe is completed at **Bronze tier or worse** (3+ mistakes on one safe). Difficulty ramp continues past 10 but gap count is capped at 10. Scorecard at end shows safes cracked and tier breakdown.

## Difficulty — Gap Count per Safe

Cell is the number of empty gaps on that safe (out of 10 total slots). Capped at 10.

| Safe # | Easy | Medium | Hard |
|:------:|:----:|:------:|:----:|
|   1    |  2   |   4    |  6   |
|   2    |  3   |   5    |  7   |
|   3    |  4   |   6    |  8   |
|   4    |  5   |   7    |  9   |
|   5    |  6   |   8    |  10  |
|   6    |  7   |   9    |  10  |
|   7    |  8   |   10   |  10  |
|   8    |  9   |   10   |  10  |
|   9    |  10  |   10   |  10  |
|   10+  |  10  |   10   |  10  |

In **Endless mode** the ramp continues beyond safe #10 but is already capped at 10 gaps, so every post-cap safe is a fully empty dial — challenge shifts from puzzle difficulty to mistake management.

## Gap Selection — Which Facts Become Gaps

Gaps are drawn from the **hard half** of the table first — facts where the multiplier is ≥ 4 (so 4×T, 5×T, 6×T, 7×T, 8×T, 9×T). If more gaps are needed than hard facts (7 or more), additional gaps are drawn randomly from the easier facts (1×T, 2×T, 3×T, 10×T).

This focuses drilling on the facts kids are most likely to fumble.

## Input Mechanic

- On-screen numpad (touch) + keyboard (desktop) — same handlers wired to both.
- **Free order:** kid taps any empty gap to select it; typed answer goes into the selected slot.
- Enter / OK submits; Backspace / ⌫ clears the last digit.
- **Auto-advance focus on correct:** after a correct fill, focus moves to the nearest unfilled gap *clockwise*. Kid can override by tapping any other empty slot.
- **No auto-submit on digit-count match** — answers have variable lengths (e.g., 1×7=7, 2×7=14) and auto-submit risks wrong evaluation.
- **Last-gap completion:** when the final gap in the safe is filled (correctly or auto-revealed), the safe-cracked interstitial is triggered automatically.
- **Mistake counter is per-safe:** resets to 0 at the start of each safe. The cumulative `totalMistakes` in `SafeRunResult` is the sum across all safes in that run.

## Scoring & Rewards

### Per-gap outcome
- **Correct:** slot locks green, mistake counter unchanged.
- **Wrong:** slot shakes red briefly, correct answer reveals in amber, slot locks, mistake counter +1. Kid cannot retry a wrong slot; they move on to the remaining gaps.

### Per-safe tier (based on mistakes in that safe)
- **0 mistakes → Gold** (sparkle effect, plus "Upgraded!" badge if this improves previous best)
- **1–2 mistakes → Silver**
- **3+ mistakes → Bronze**

### Collection updates
- The collection slot for the current safe's table gets updated to the best tier ever achieved. Cracking ×7 always updates the ×7-animal.
- Cracking at a lower or equal tier than the current stored tier: counted in run stats but the stored tier stays at its previous best.
- Cracking at a higher tier: stored tier upgrades, interstitial shows "Upgraded!" celebration.

### Endless lockout
Run ends when a safe is completed at Bronze (3+ mistakes). The Bronze animal is still awarded / upgraded as usual before the scorecard appears.

## Animal Collection

### Mapping
One animal is permanently assigned to each table:

| Table | Animal   | Table | Animal    |
|:-----:|:--------:|:-----:|:---------:|
|  ×1   | Chick    |  ×6   | Panda     |
|  ×2   | Duck     |  ×7   | Monkey    |
|  ×3   | Rabbit   |  ×8   | Bear      |
|  ×4   | Dog      |  ×9   | Giraffe   |
|  ×5   | Pig      |  ×10  | Elephant  |

(A "size-progression" arc: tiny chick at ×1, mighty elephant at ×10.)

### Assets

Source: **Kenney Animal Pack Remastered** (CC0). Using **PNG/Round/** variants only (sheet of ~150px images). Vector SVGs from the pack's `Vector/` folder are used for the large "safe cracked" reveal to stay crisp at size.

Files stored in `public/animals/`:
- `01-chick.png`, `01-chick.svg`
- `02-duck.png`, `02-duck.svg`
- `03-rabbit.png`, `03-rabbit.svg`
- `04-dog.png`, `04-dog.svg`
- `05-pig.png`, `05-pig.svg`
- `06-panda.png`, `06-panda.svg`
- `07-monkey.png`, `07-monkey.svg`
- `08-bear.png`, `08-bear.svg`
- `09-giraffe.png`, `09-giraffe.svg`
- `10-elephant.png`, `10-elephant.svg`

Plus `public/animals/LICENSE.txt` noting the CC0 source.

### Tier visuals (CSS only, no extra assets)
- **Gold:** full saturation, yellow-gradient frame, subtle sparkle animation.
- **Silver:** ~20% desaturated, silver frame.
- **Bronze:** ~50% desaturated, bronze frame.
- **Unearned:** `filter: grayscale(1) opacity(0.45)` + grey frame.

### Vault-complete state
When all 10 animals are gold, the start screen shows a "Kluis Compleet!" badge over the collection strip. Play can still continue; stats still track.

## Table Selection per Safe

Kid picks tables up front (reuses the existing multi-select component from the home page). Each run:

- Tables are shuffled into a **deck**.
- Each safe draws the next table from the deck.
- When the deck is exhausted, it's reshuffled.

This guarantees even distribution in short runs (e.g., a 10-safe Run with 3 selected tables sees each table 3-4 times, not 0 or 7 by chance).

## Integration with Existing App

- **New route `/safe`** — standalone page; does NOT extend `/quiz`. Rationale: safe-cracker's visual language (dark safe aesthetic, circular layout) diverges enough from the quiz flow that cramming it in would be messy.
- **Home page (`app/page.tsx`)** — adds a new "Kraak de Kluis" card alongside the existing mode buttons. If this pushes the page layout past what's maintainable, refactor the mode-card grid into `components/mode-cards.tsx` as part of this work (scoped, minor).
- **Progress dashboard (`app/progress/page.tsx`)** — new "Dieren Verzameling" card at the top showing the collection strip. Reuses the same `collection-strip.tsx` component as the game.
- **Profile/streak/stats sharing** — a safe run counts as a practice session (streak-worthy); each gap filled counts in `totalQuestions` / `totalCorrect` (correct first try = correct; auto-filled mistake = incorrect); `tableStats` for multiplication gets updated per table cracked.
- **Mascot** — the existing mascot component can appear on the scorecard reacting to results. Reuse, don't duplicate.

## Data Model Changes

Additive extensions to `UserProfile` in `lib/profile-manager.ts`. Existing profiles hydrate missing fields to empty defaults on read — no migration required.

```ts
type AnimalTier = 'bronze' | 'silver' | 'gold'

type AnimalEntry = {
  tableIndex: number        // 1..10
  tier: AnimalTier          // best ever achieved
  firstEarnedAt: string     // ISO
  lastUpgradedAt: string    // ISO
}

type SafeRunResult = {
  id: string
  mode: 'safe-run' | 'safe-endless'
  difficulty: 'easy' | 'medium' | 'hard'
  tablesPicked: number[]    // user's table selection for the run
  safesCracked: number
  tiersEarned: {
    gold: number
    silver: number
    bronze: number
  }
  totalMistakes: number
  date: string
}

// appended to UserProfile:
animals: AnimalEntry[]              // one per tableIndex earned, max 10
recentSafeResults: SafeRunResult[]  // last 20
```

Deliberate calls:
- **Separate `recentSafeResults`** (not merged into `recentResults`) so the progress dashboard can render safe runs with a distinct UI.
- **`QuizResult['mode']` union is untouched.** Safe runs don't pretend to be quizzes.
- **Hydration is read-side:** `getCurrentProfile()` (or a new helper) fills missing `animals` / `recentSafeResults` fields with `[]` before returning.

## File Structure

```
app/safe/
  page.tsx                     — route; orchestrates start / play / interstitial / scorecard

components/safe/
  safe-dial.tsx                — circular dial, slot placement, active-slot focus
  safe-slot.tsx                — individual slot (filled / gap / correct / revealed states)
  numpad.tsx                   — on-screen digit pad + binds keyboard events
  collection-strip.tsx         — animal strip (reused on progress page)
  animal-badge.tsx             — one animal rendered in its tier frame
  safe-reveal.tsx              — spin + flash + animal reveal interstitial
  difficulty-picker.tsx        — Easy/Medium/Hard segmented control
  mode-picker.tsx              — Run / Endless segmented control

lib/safe/
  animals.ts                   — pack manifest (10 entries)
  safe-logic.ts                — pure: buildSafe, gapsForSafe, scoreTier, shuffleTables
  safe-progress.ts             — profile mutations (award, upgrade tier, stats)
  __tests__/
    safe-logic.test.ts
    safe-progress.test.ts

public/animals/                — PNG + SVG for each of the 10 animals + LICENSE.txt
```

- **`components/safe/*`** — own folder, isolates safe-cracker from existing quiz components.
- **`lib/safe/` split** — `safe-logic.ts` is pure and trivially unit-testable (no React, no localStorage). `safe-progress.ts` handles persistence side effects.
- **`collection-strip.tsx`** designed for reuse by the progress page.

## Testing Strategy

### Unit tests (Jest-style, co-located in `__tests__/`)
- `safe-logic.ts`:
  - `buildSafe(table, gapCount)` — honors gap count, prefers hard half, no duplicates, all 10 facts covered.
  - `gapsForSafe(difficulty, safeIndex)` — matches the difficulty table above, capped at 10.
  - `scoreTier(mistakes)` — 0→gold, 1-2→silver, 3+→bronze.
  - `shuffleTables(tables)` — deck pattern produces even distribution.
- `safe-progress.ts`:
  - Upgrade logic: bronze stays bronze if already silver; silver upgrades to gold; `upgraded` flag only fires on improvement.
  - New profile hydration: missing `animals` / `recentSafeResults` default to `[]`.
  - Stats integration: cracking a ×7 safe increments ×7 multiply stats.

### Component tests (only where tricky)
- `safe-dial.tsx` — 10 slots positioned correctly around an ellipse; active slot highlight visible; focus advances clockwise after correct fill.
- `numpad.tsx` — keyboard digits fire same handlers as button taps; Enter submits; Backspace clears.

### Manual browser verification (mandatory per the dev rule for frontend changes)
- Start dev server; play Run on Easy, Medium, and Hard end-to-end.
- Trigger Endless vault-lock.
- Verify tier visuals at bronze, silver, gold; confirm upgrade celebration.
- Test on narrow viewport (tablet/mobile): dial and numpad must both be reachable.
- Confirm existing Quiz / Practice / Timed modes still work unchanged.

## Edge Cases

- **Zero tables selected** → start button disabled (matches existing Quiz behavior).
- **Variable answer digit count** (e.g., 1×7=7 vs 2×7=14) → no auto-submit on digit-count match; require Enter/OK.
- **Navigating away mid-safe** → run state is discarded; no partial save. Documented; not worth the complexity.
- **All animals already gold** → still playable, still tracks stats, shows "Vault Complete" badge.
- **Profile missing `animals` field** (existing profiles) → hydrated to `[]` on read.
- **Endless safe counter past 99** → display as "99+" to avoid ugly numbers.
- **Tap-to-focus** — tapping a slot steals focus from any background input so keyboard typing works seamlessly.

## Open Questions

None at design time. All clarifying decisions resolved in brainstorming:

- Slot placement: outside the dial (clock-face style).
- Difficulty: user-selectable Easy/Medium/Hard (Model 1 — sets starting gap count, +1 per safe).
- Table selection: reuses existing multi-select.
- Wrong-answer handling: auto-fill with reveal color + mistake counter (Model B+D combined).
- Reward tiers: bronze/silver/gold, always earn something.
- Session shape: Run (fixed 10) and Endless (until bronze) as separate modes.
- Animal-to-table mapping: α — locked 1-to-1.
- Integration: standalone `/safe` route (option B).

## Next Step

After spec sign-off, hand off to the `writing-plans` skill to produce a detailed, step-wise implementation plan.
