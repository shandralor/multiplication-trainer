# Achievement Rework Design Spec

**Date:** 2026-04-21
**Status:** Design approved, implementation pending
**Supersedes parts of:** `2026-04-20-safe-cracker-minigame-design.md` (tier system + achievement list)

## Overview

The first-pass achievement system has a pedagogical flaw: every medal is earnable on Makkelijk, so kids have no reason to ever try Normaal or Moeilijk. This spec reworks the per-animal tier system and extends the medal list so difficulty genuinely matters.

The core change adds a fourth tier (**platinum**) and binds tier caps/floors to difficulty. Three new medals add stretch goals that require stepping up. The existing medal pack is supplemented with three CC0 assets from Kenney's Puzzle Pack 2.

## Goals

- Make Moeilijk worth playing by reserving top-tier rewards for it.
- Preserve early-win energy on Makkelijk — a just-starting kid still earns medals.
- Keep migration graceful: existing profiles aren't punished.
- Add a daily-habit reward to support consistent practice.

## Non-Goals

- Splitting every medal into per-difficulty variants (considered as option B during brainstorming; rejected as too many medal slots for the payoff).
- Per-table medals (e.g., "Alle goud × 7") — out of scope.
- A third difficulty past Moeilijk — Moeilijk is the top.

## Tier System

Four tiers, ordered: `bronze < silver < gold < platinum`.

The `scoreTier` function now takes a difficulty argument and maps mistakes to tier per this table (α mapping, approved):

| Difficulty  | 0 mistakes | 1–2 mistakes | 3+ mistakes |
|:-----------:|:----------:|:------------:|:-----------:|
| Makkelijk   | silver     | bronze       | bronze      |
| Normaal     | gold       | silver       | bronze      |
| Moeilijk    | platinum   | gold         | silver      |

Consequences:

- Makkelijk can only award bronze or silver. A kid who plays only Makkelijk will eventually max out at **Alle zilver** — a satisfying goal in itself, but not the top.
- Normaal unlocks gold. To collect **Alle goud** you must play Normaal or Moeilijk.
- Moeilijk is the only path to platinum, and also eliminates bronze (floor-silver for showing up).
- Animal upgrade logic is unchanged: an animal's tier only ever goes up.

### Migration

Existing profiles may have `gold` animals earned at Makkelijk under the old scoring rules. These are **grandfathered** — no automatic downgrade. The new rule only applies to newly-earned results. Rationale: don't punish players for previous system behavior; the collection-reset cycle already lets them re-earn cleanly on a new cycle.

## Medal List — 12 Total

### Existing (9, unchanged triggers; some auto-gate via the new tier rule)

| # | ID | Label | Trigger |
|---|---|---|---|
| 1 | `first-safe` | Eerste kluis | First safe cracked |
| 2 | `perfect-safe` | Perfecte kluis | Any safe with 0 mistakes |
| 3 | `fast-safe` | Snelle kraker | Eindeloos safe, 0 mistakes, duration ≤ 20 s |
| 4 | `all-bronze` | Alle brons | 10 animals earned |
| 5 | `all-silver` | Alle zilver | 10 animals at silver or higher |
| 6 | `all-gold` | Alle goud | 10 animals at gold or higher (auto-gated to Normaal+) |
| 7 | `perfect-ronde` | Perfecte ronde | A Ronde with 0 total mistakes |
| 8 | `endless-10` | Doorzetter | 10 safes cracked in one Eindeloos run |
| 9 | `endless-20` | Kluizen meester | 20 safes cracked in one Eindeloos run |

### New (3)

| # | ID | Label | Trigger | Pedagogy |
|---|---|---|---|---|
| 10 | `all-platinum` | Alle platina | All 10 animals at platinum | Moeilijk-only mastery badge |
| 11 | `hard-safe` | Moeilijke kraker | 0-mistake safe on Moeilijk | Validates stepping up |
| 12 | `loyal-player` | Trouwe speler | `currentStreak >= 7` | Rewards the daily-practice habit |

### Cycle-gated vs lifetime-once

- **Cycle-gated** (re-earnable after collection reset): `all-bronze`, `all-silver`, `all-gold`, `all-platinum`. Bumping `collectionCycle` lets these fire again.
- **Lifetime-once**: everything else.

## Asset Mapping

Existing medals keep their current paths under `public/medals/`. The three new medals draw on **Kenney Puzzle Pack 2** (CC0):

| ID | Source file | Target path |
|---|---|---|
| `all-platinum` | `Coins/coin_01.png` (gold coin) | `public/medals/alle-platina.png` |
| `hard-safe` | a red-tinted coin (e.g., `Coins/coin_18.png` — will pick the clearest-red one at implementation time) | `public/medals/moeilijke-kraker.png` |
| `loyal-player` | `Particles yellow/particleYellow_1.png` (star burst) | `public/medals/trouwe-speler.png` |

The pack already sits at `~/Downloads/kenney_puzzle-pack-2.zip`. License text added to `public/medals/LICENSE.txt` will credit both packs.

## Data Model Changes

### `lib/profile-manager.ts`

```ts
// Add 'platinum' to the union:
export type AnimalTier = 'bronze' | 'silver' | 'gold' | 'platinum'
```

No new top-level fields. Existing profile hydration already handles `animals`, `achievements`, `currentStreak`, `recentSafeResults`.

### `lib/safe/safe-logic.ts`

```ts
// Before:
export function scoreTier(mistakes: number): AnimalTier { ... }

// After:
export function scoreTier(mistakes: number, difficulty: Difficulty): AnimalTier {
  if (difficulty === 'easy')   return mistakes === 0 ? 'silver'   : 'bronze'
  if (difficulty === 'medium') return mistakes === 0 ? 'gold'     : mistakes <= 2 ? 'silver' : 'bronze'
  /* hard */                     return mistakes === 0 ? 'platinum': mistakes <= 2 ? 'gold'   : 'silver'
}
```

### `lib/safe/safe-progress.ts`

```ts
const TIER_RANK: Record<AnimalTier, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
}
```

No other changes required — the upgrade logic already trusts this ordering.

### `lib/safe/achievements.ts`

Add three new ids to the union and the `ACHIEVEMENTS` map:

```ts
export type AchievementId =
  | 'first-safe' | 'perfect-safe' | 'fast-safe'
  | 'all-bronze' | 'all-silver' | 'all-gold' | 'all-platinum'
  | 'perfect-ronde'
  | 'endless-10' | 'endless-20'
  | 'hard-safe'
  | 'loyal-player'
```

Update `evaluateAchievements`:

- `all-platinum`: fires when `animals.length === 10 && animals.every((a) => a.tier === 'platinum')`.
- `hard-safe`: fires when `lastSafe?.mistakes === 0` **and** the run's difficulty was `hard`. Requires extending the `EvaluateContext` to carry `difficulty`.
- `loyal-player`: fires when `currentStreak >= 7`. Requires plumbing the streak into the context too (new field `lifetimeStreak` or pass via `lastRun`).

Update `alreadyEarnedForCycle`: add `'all-platinum'` to the `cycleGated` set.

### Call-site changes

`completeSafe` in `app/safe/page.tsx` currently calls `scoreTier(safe.mistakes)`. Updates to `scoreTier(safe.mistakes, difficulty)`. Also passes `difficulty` through the award context so achievements can see it.

## UI Changes

### `components/safe/animal-badge.tsx`

Add a platinum visual. Something like an icy-cyan → violet gradient with a brighter ring, distinctly different from gold. Keeps the same size/shape primitives.

```ts
const TIER_FRAME: Record<AnimalTier, string> = {
  bronze:   'bg-gradient-to-br from-amber-700 to-amber-500 ring-amber-600',
  silver:   'bg-gradient-to-br from-slate-300 to-slate-100 ring-slate-400',
  gold:     'bg-gradient-to-br from-yellow-300 to-yellow-500 ring-yellow-600',
  platinum: 'bg-gradient-to-br from-cyan-200 via-sky-300 to-violet-400 ring-cyan-300',
}
const TIER_IMG_FILTER: Record<AnimalTier, string> = {
  bronze:   'saturate-50 brightness-95',
  silver:   'saturate-75',
  gold:     '',
  platinum: 'drop-shadow-[0_0_4px_rgba(167,139,250,0.6)]',
}
```

### `components/safe/medal-row.tsx`

Extend `ALL_IDS` to include the three new ones. Layout is already `flex-nowrap overflow-x-auto`, so it handles 12 medals without further change. Consider a subtle `gap-2.5` tweak on desktop if it looks tight.

### `components/safe/safe-reveal.tsx`

Add a Dutch label for platinum in the tier-label map:

```ts
const TIER_LABEL: Record<AnimalTier, string> = {
  bronze:   'Brons',
  silver:   'Zilver',
  gold:     'Goud',
  platinum: 'Platina',
}
```

## Testing Strategy

**Unit tests (Vitest):**

- `safe-logic.test.ts`:
  - `scoreTier('easy',   0)` → silver; `scoreTier('easy',   1)` → bronze; `scoreTier('easy',   3)` → bronze
  - `scoreTier('medium', 0)` → gold; `scoreTier('medium', 1)` → silver; `scoreTier('medium', 3)` → bronze
  - `scoreTier('hard',   0)` → platinum; `scoreTier('hard',   1)` → gold; `scoreTier('hard',   3)` → silver
- `safe-progress.test.ts`:
  - Upgrade path bronze → silver → gold → platinum all succeed; no-op for same-or-lower incoming tier.
  - Grandfather check: a profile with a gold-from-Makkelijk animal isn't touched when a new Makkelijk result comes in at silver (since silver < gold, no-op).
- `achievements.test.ts`:
  - `all-platinum` fires when every animal is platinum; doesn't fire at gold.
  - `hard-safe` fires for `lastSafe.mistakes === 0 && lastSafe difficulty === 'hard'`; not for medium or easy.
  - `loyal-player` fires at streak 7; not at 6.
  - `alreadyEarnedForCycle` includes `all-platinum` in cycle-gating.

**Manual verification:**

- Play Makkelijk to 10 silvers → Alle zilver lights up; Alle goud stays locked.
- Play one Normaal safe perfectly → that animal goes gold.
- Play one Moeilijk safe perfectly → that animal goes platinum; `hard-safe` medal fires.
- Reach 7-day streak (can fake by manipulating profile in localStorage) → `loyal-player` fires.
- Visit `/progress` — collection strip shows platinum visuals correctly.

## Edge Cases

- **Existing gold from Makkelijk.** Grandfathered, no downgrade. New `completeSafe` won't "improve" a Makkelijk gold to gold again (no-op).
- **Platinum without ever playing Moeilijk.** Impossible. The tier system is the only path.
- **Streak bouncing.** `loyal-player` fires the moment the streak crosses 7 and stays earned forever. If the streak drops back to 0, the medal stays awarded.
- **Medal row overflow on narrow phones.** Already scrollable; 12 items at 56 px each with 1.5 gap = ~700 px — scrolls smoothly on a 375 px viewport.

## Open Questions

None after Section 4 signoff. One implementation-time pick: which coin from the Puzzle Pack reads most clearly as "red medal" (visual check at implementation time).

## Next Step

Invoke `writing-plans` to produce a bite-sized implementation plan covering the type changes, logic changes, UI changes, asset copies, and tests.
