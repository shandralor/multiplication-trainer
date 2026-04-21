# Achievement Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the difficulty-aware tier system (adding platinum), three new medals (Alle platina, Moeilijke kraker, Trouwe speler), and the supporting UI per `docs/superpowers/specs/2026-04-21-achievement-rework-design.md`.

**Architecture:** Purely additive changes layered on top of the existing `lib/safe/*` system. `scoreTier` gains a difficulty parameter. A new `platinum` tier flows through `AnimalTier`, `TIER_RANK`, and tier-styled UI. Three medals are added to the existing achievement evaluator and medal row. No new files in `lib/` — only `animations.ts`-style incremental edits — plus three new CC0 asset PNGs under `public/medals/`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, Vitest (already wired up).

---

## Reference: File Changes

```
public/medals/
  alle-platina.png          NEW (from /tmp/puzzle-peek/PNG/Coins/coin_01.png)
  moeilijke-kraker.png      NEW (from /tmp/puzzle-peek/PNG/Particles yellow/particleYellow_3.png)
  trouwe-speler.png         NEW (from /tmp/puzzle-peek/PNG/Coins/coin_19.png)
  LICENSE.txt               MODIFY (credit Puzzle Pack 2 alongside existing Medals pack)

lib/profile-manager.ts              MODIFY (AnimalTier adds 'platinum')
lib/safe/safe-logic.ts              MODIFY (scoreTier takes difficulty)
lib/safe/safe-progress.ts           MODIFY (TIER_RANK gains platinum, award passes difficulty)
lib/safe/achievements.ts            MODIFY (3 new AchievementIds, evaluator, cycle-gate, EvaluateContext)
lib/safe/__tests__/safe-logic.test.ts       MODIFY (scoreTier signature tests)
lib/safe/__tests__/safe-progress.test.ts    MODIFY (platinum upgrade path)
lib/safe/__tests__/achievements.test.ts     MODIFY (new medal tests)

components/safe/animal-badge.tsx    MODIFY (platinum frame + filter)
components/safe/safe-reveal.tsx     MODIFY (Platina label)
components/safe/medal-row.tsx       MODIFY (extend ALL_IDS to 12)

app/safe/page.tsx                   MODIFY (pass difficulty to scoreTier + evaluator)
```

The Kenney Puzzle Pack 2 zip is at `~/Downloads/kenney_puzzle-pack-2.zip`; it has already been extracted to `/tmp/puzzle-peek/` by the brainstorming step. The plan assumes that directory is intact — if missing, re-extract with `rm -rf /tmp/puzzle-peek && mkdir /tmp/puzzle-peek && cd /tmp/puzzle-peek && unzip -q ~/Downloads/kenney_puzzle-pack-2.zip`.

---

## Task 1: Copy the three Puzzle Pack medal assets

**Files:**
- Create: `public/medals/alle-platina.png`
- Create: `public/medals/moeilijke-kraker.png`
- Create: `public/medals/trouwe-speler.png`
- Modify: `public/medals/LICENSE.txt`

- [ ] **Step 1: Verify the Puzzle Pack is extracted**

Run:
```bash
ls "/tmp/puzzle-peek/PNG/Coins/coin_01.png" "/tmp/puzzle-peek/PNG/Coins/coin_19.png" "/tmp/puzzle-peek/PNG/Particles yellow/particleYellow_3.png"
```

Expected: all three files listed. If any is missing, re-extract:
```bash
rm -rf /tmp/puzzle-peek && mkdir /tmp/puzzle-peek && cd /tmp/puzzle-peek && unzip -q ~/Downloads/kenney_puzzle-pack-2.zip
```

- [ ] **Step 2: Copy the three assets into `public/medals/`**

Run:
```bash
cd /mnt/professional/projects/code/tafeltrainer/multiplication-trainer
cp "/tmp/puzzle-peek/PNG/Coins/coin_01.png"                        public/medals/alle-platina.png
cp "/tmp/puzzle-peek/PNG/Particles yellow/particleYellow_3.png"    public/medals/moeilijke-kraker.png
cp "/tmp/puzzle-peek/PNG/Coins/coin_19.png"                        public/medals/trouwe-speler.png
ls public/medals/
```

Expected: the existing `shaded_medal1.png`..`shaded_medal9.png`, `medals_vector.svg`, `LICENSE.txt`, plus the three new files above.

- [ ] **Step 3: Update `public/medals/LICENSE.txt` to credit both packs**

Overwrite `public/medals/LICENSE.txt` with:

```
Medal artwork sources (all CC0 1.0 Universal — Public Domain):

- Kenney Medals pack                https://kenney.nl/assets/medals
  Files: shaded_medal1.png .. shaded_medal9.png, medals_vector.svg

- Kenney Puzzle Pack 2              https://kenney.nl/assets/puzzle-pack-2
  Files: alle-platina.png (from coin_01.png)
         moeilijke-kraker.png (from particleYellow_3.png)
         trouwe-speler.png (from coin_19.png)
```

- [ ] **Step 4: Commit**

```bash
git add public/medals/
git commit -m "chore: add Puzzle Pack 2 medal assets for achievement rework"
```

---

## Task 2: Add `'platinum'` to the `AnimalTier` union

**Files:**
- Modify: `lib/profile-manager.ts`

- [ ] **Step 1: Update the `AnimalTier` type**

Open `lib/profile-manager.ts`. Find:

```ts
export type AnimalTier = 'bronze' | 'silver' | 'gold'
```

Replace with:

```ts
export type AnimalTier = 'bronze' | 'silver' | 'gold' | 'platinum'
```

- [ ] **Step 2: Verify nothing else in this file constrains the tier union**

Run:
```bash
cd /mnt/professional/projects/code/tafeltrainer/multiplication-trainer
grep -n "AnimalTier\|'bronze'\|'silver'\|'gold'\|'platinum'" lib/profile-manager.ts
```

Expected: the only occurrences are the type alias on its definition line and, if present, the existing `bestScores` unrelated-to-safe-cracker literals. No other exhaustive `bronze | silver | gold` union needs editing here.

- [ ] **Step 3: Run the test suite — expect some test failures from other modules**

Run:
```bash
npm test -- --run
```

Expected: tests still pass at this point — the new literal isn't yet used anywhere, so TypeScript is satisfied. If any tests fail here, investigate before proceeding.

- [ ] **Step 4: Commit**

```bash
git add lib/profile-manager.ts
git commit -m "feat: add 'platinum' to AnimalTier union"
```

---

## Task 3: Teach `scoreTier` about difficulty (TDD)

**Files:**
- Modify: `lib/safe/safe-logic.ts`
- Modify: `lib/safe/__tests__/safe-logic.test.ts`

The existing signature is `scoreTier(mistakes: number): AnimalTier`. The new signature is `scoreTier(mistakes: number, difficulty: Difficulty): AnimalTier` with the α mapping from the spec.

- [ ] **Step 1: Rewrite the scoreTier test block to cover the new behavior**

Open `lib/safe/__tests__/safe-logic.test.ts`. Find the `describe('scoreTier', ...)` block (three tests: 0 mistakes → gold, 1-2 → silver, 3+ → bronze). Replace the whole block with:

```ts
describe('scoreTier', () => {
  it('Makkelijk: 0 mistakes → silver, any mistakes → bronze', () => {
    expect(scoreTier(0, 'easy')).toBe('silver')
    expect(scoreTier(1, 'easy')).toBe('bronze')
    expect(scoreTier(2, 'easy')).toBe('bronze')
    expect(scoreTier(5, 'easy')).toBe('bronze')
  })

  it('Normaal: 0 → gold, 1-2 → silver, 3+ → bronze', () => {
    expect(scoreTier(0, 'medium')).toBe('gold')
    expect(scoreTier(1, 'medium')).toBe('silver')
    expect(scoreTier(2, 'medium')).toBe('silver')
    expect(scoreTier(3, 'medium')).toBe('bronze')
    expect(scoreTier(10, 'medium')).toBe('bronze')
  })

  it('Moeilijk: 0 → platinum, 1-2 → gold, 3+ → silver (no bronze)', () => {
    expect(scoreTier(0, 'hard')).toBe('platinum')
    expect(scoreTier(1, 'hard')).toBe('gold')
    expect(scoreTier(2, 'hard')).toBe('gold')
    expect(scoreTier(3, 'hard')).toBe('silver')
    expect(scoreTier(10, 'hard')).toBe('silver')
  })
})
```

- [ ] **Step 2: Run the test — confirm failures**

Run:
```bash
cd /mnt/professional/projects/code/tafeltrainer/multiplication-trainer
npm test -- --run safe-logic.test.ts
```

Expected: FAIL — the `scoreTier` calls pass two arguments but the current implementation takes one, so TypeScript will error, and the expected values like `'platinum'` don't match the current implementation.

- [ ] **Step 3: Rewrite `scoreTier` in `safe-logic.ts`**

Open `lib/safe/safe-logic.ts`. Find the existing `scoreTier`:

```ts
/** Map mistake count to earned tier. */
export function scoreTier(mistakes: number): AnimalTier {
  if (mistakes === 0) return 'gold'
  if (mistakes <= 2) return 'silver'
  return 'bronze'
}
```

Replace with:

```ts
/**
 * Map mistake count + difficulty to an earned tier using the α mapping.
 * Makkelijk: 0 → silver,   any → bronze.
 * Normaal:   0 → gold,     1-2 → silver,   3+ → bronze.
 * Moeilijk:  0 → platinum, 1-2 → gold,     3+ → silver (no bronze).
 */
export function scoreTier(mistakes: number, difficulty: Difficulty): AnimalTier {
  if (difficulty === 'easy') {
    return mistakes === 0 ? 'silver' : 'bronze'
  }
  if (difficulty === 'medium') {
    if (mistakes === 0) return 'gold'
    if (mistakes <= 2) return 'silver'
    return 'bronze'
  }
  // hard
  if (mistakes === 0) return 'platinum'
  if (mistakes <= 2) return 'gold'
  return 'silver'
}
```

Also ensure `AnimalTier` is imported or re-exported correctly in this file. The current `safe-logic.ts` already exports `AnimalTier`; extending the union in Task 2 automatically propagates here. Verify with:

```bash
grep -n "export type AnimalTier" lib/safe/safe-logic.ts
```

Expected: `export type AnimalTier = 'bronze' | 'silver' | 'gold'` appears as a re-export. If found, update it to include `| 'platinum'`:

```ts
export type AnimalTier = 'bronze' | 'silver' | 'gold' | 'platinum'
```

(If `safe-logic.ts` instead imports from `profile-manager.ts`, skip the second edit.)

- [ ] **Step 4: Run the test — confirm it passes**

Run:
```bash
npm test -- --run safe-logic.test.ts
```

Expected: all `scoreTier` tests pass. Other tests in this file (gapsForSafe, buildSafe, shuffleTables, endlessSafeTimer) remain unchanged and should still pass.

- [ ] **Step 5: Run the full test suite**

Run:
```bash
npm test -- --run
```

Expected: tests in `safe-progress.test.ts` and `achievements.test.ts` will break because call sites in non-test code use the old signature. We fix those next. If any *test* file (other than call-site tests updated in later tasks) fails for an unrelated reason, stop and report.

If at this point `safe-progress.test.ts` and `achievements.test.ts` still pass, commit and proceed. If they fail only because of the scoreTier signature flowing through the product code, continue — the next tasks fix the call sites. Either way, you haven't broken logic-level tests.

- [ ] **Step 6: Commit**

```bash
git add lib/safe/safe-logic.ts lib/safe/__tests__/safe-logic.test.ts
git commit -m "feat(safe): scoreTier takes difficulty; adds platinum/α mapping"
```

---

## Task 4: Update `TIER_RANK` and call sites in `safe-progress.ts`

**Files:**
- Modify: `lib/safe/safe-progress.ts`

- [ ] **Step 1: Extend `TIER_RANK` with platinum**

Open `lib/safe/safe-progress.ts`. Find:

```ts
const TIER_RANK: Record<AnimalTier, number> = { bronze: 1, silver: 2, gold: 3 }
```

Replace with:

```ts
const TIER_RANK: Record<AnimalTier, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
}
```

- [ ] **Step 2: Typecheck**

Run:
```bash
cd /mnt/professional/projects/code/tafeltrainer/multiplication-trainer
npx tsc --noEmit
```

Expected: at this point, `app/safe/page.tsx`'s `scoreTier(safe.mistakes)` call should trigger a TypeScript error (missing `difficulty` argument). That's the next task. If errors only come from the expected call site (`completeSafe` / `scoreTier`), proceed. Other errors: investigate.

- [ ] **Step 3: Commit**

```bash
git add lib/safe/safe-progress.ts
git commit -m "feat(safe): extend TIER_RANK with platinum=4"
```

---

## Task 5: Update the `scoreTier` call in `completeSafe`

**Files:**
- Modify: `app/safe/page.tsx`

- [ ] **Step 1: Locate the `completeSafe` call site**

Run:
```bash
grep -n "scoreTier(" app/safe/page.tsx
```

Expected: exactly one call, inside `completeSafe`.

- [ ] **Step 2: Pass `difficulty` to `scoreTier`**

Open `app/safe/page.tsx`. Find the line in `completeSafe`:

```ts
const tier: AnimalTier = scoreTier(safe.mistakes)
```

Replace with:

```ts
const tier: AnimalTier = scoreTier(safe.mistakes, difficulty)
```

(`difficulty` is already available in the closure from the component-level state; no other wiring needed.)

- [ ] **Step 3: Build + typecheck**

Run:
```bash
npx tsc --noEmit
```

Expected: no TypeScript errors.

- [ ] **Step 4: Run the test suite**

Run:
```bash
npm test -- --run
```

Expected: `safe-progress.test.ts` and `achievements.test.ts` may still be failing from leftover assumptions. If so, continue to Tasks 6 and 7. If tests pass, commit here and move on.

- [ ] **Step 5: Commit**

```bash
git add app/safe/page.tsx
git commit -m "feat(safe): pass difficulty into scoreTier at completeSafe"
```

---

## Task 6: Extend `safe-progress` tests to cover platinum upgrade path

**Files:**
- Modify: `lib/safe/__tests__/safe-progress.test.ts`

- [ ] **Step 1: Add a platinum upgrade test**

Open `lib/safe/__tests__/safe-progress.test.ts`. Find the existing `describe('applyAnimalAward', ...)` block. Immediately before its closing `})`, add these new tests:

```ts
  it('upgrades gold → platinum', () => {
    const existing: AnimalEntry[] = [
      { tableIndex: 4, tier: 'gold', firstEarnedAt: '2025-01-01', lastUpgradedAt: '2025-01-01' },
    ]
    const result = applyAnimalAward(existing, { tableIndex: 4, tier: 'platinum', now })
    expect(result.animals[0].tier).toBe('platinum')
    expect(result.upgraded).toBe(true)
  })

  it('does not downgrade platinum → gold', () => {
    const existing: AnimalEntry[] = [
      { tableIndex: 4, tier: 'platinum', firstEarnedAt: '2025-01-01', lastUpgradedAt: '2025-01-01' },
    ]
    const result = applyAnimalAward(existing, { tableIndex: 4, tier: 'gold', now })
    expect(result.animals[0].tier).toBe('platinum')
    expect(result.upgraded).toBe(false)
  })

  it('grandfathered gold-from-Makkelijk stays gold when a new Makkelijk result comes in at silver', () => {
    const existing: AnimalEntry[] = [
      { tableIndex: 4, tier: 'gold', firstEarnedAt: '2025-01-01', lastUpgradedAt: '2025-01-01' },
    ]
    // New Makkelijk perfect safe would now score silver — below current gold.
    const result = applyAnimalAward(existing, { tableIndex: 4, tier: 'silver', now })
    expect(result.animals[0].tier).toBe('gold')
    expect(result.upgraded).toBe(false)
  })
```

- [ ] **Step 2: Run the test file**

Run:
```bash
cd /mnt/professional/projects/code/tafeltrainer/multiplication-trainer
npm test -- --run safe-progress.test.ts
```

Expected: all existing tests plus the three new ones pass (TIER_RANK already understands platinum after Task 4).

- [ ] **Step 3: Commit**

```bash
git add lib/safe/__tests__/safe-progress.test.ts
git commit -m "test(safe): cover platinum upgrade and grandfathered-gold no-op"
```

---

## Task 7: Add the three new achievements (TDD)

**Files:**
- Modify: `lib/safe/achievements.ts`
- Modify: `lib/safe/__tests__/achievements.test.ts`

The new IDs are `all-platinum`, `hard-safe`, `loyal-player`. Evaluator needs:
- Difficulty context for `hard-safe` (requires extending `EvaluateContext`).
- Streak context for `loyal-player` (add `currentStreak` field).

- [ ] **Step 1: Add failing tests for the three new medals**

Open `lib/safe/__tests__/achievements.test.ts`. Inside the `describe('evaluateAchievements', ...)` block, add:

```ts
  it('awards all-platinum when every animal is platinum', () => {
    const animals = Array.from({ length: 10 }, (_, i) => animal(i + 1, 'platinum'))
    const out = evaluateAchievements({
      animals,
      alreadyEarned: new Set(),
      collectionCycle: 1,
    })
    expect(out).toContain('all-platinum')
    expect(out).toContain('all-gold')
    expect(out).toContain('all-silver')
    expect(out).toContain('all-bronze')
  })

  it('does not award all-platinum when any animal is below platinum', () => {
    const mixed = [
      ...Array.from({ length: 9 }, (_, i) => animal(i + 1, 'platinum')),
      animal(10, 'gold'),
    ]
    const out = evaluateAchievements({
      animals: mixed,
      alreadyEarned: new Set(),
      collectionCycle: 1,
    })
    expect(out).not.toContain('all-platinum')
    expect(out).toContain('all-gold')
  })

  it('awards hard-safe for 0 mistakes on a hard safe', () => {
    const out = evaluateAchievements({
      animals: [],
      alreadyEarned: new Set(),
      collectionCycle: 1,
      lastSafe: {
        tableIndex: 7,
        tier: 'platinum',
        mistakes: 0,
        gapsFilled: 10,
        mode: 'safe-run',
        difficulty: 'hard',
      },
    })
    expect(out).toContain('hard-safe')
  })

  it('does not award hard-safe on medium/easy even with 0 mistakes', () => {
    const medium = evaluateAchievements({
      animals: [],
      alreadyEarned: new Set(),
      collectionCycle: 1,
      lastSafe: {
        tableIndex: 7,
        tier: 'gold',
        mistakes: 0,
        gapsFilled: 4,
        mode: 'safe-run',
        difficulty: 'medium',
      },
    })
    expect(medium).not.toContain('hard-safe')
  })

  it('awards loyal-player when currentStreak >= 7', () => {
    const out = evaluateAchievements({
      animals: [],
      alreadyEarned: new Set(),
      collectionCycle: 1,
      currentStreak: 7,
    })
    expect(out).toContain('loyal-player')
  })

  it('does not award loyal-player at streak 6', () => {
    const out = evaluateAchievements({
      animals: [],
      alreadyEarned: new Set(),
      collectionCycle: 1,
      currentStreak: 6,
    })
    expect(out).not.toContain('loyal-player')
  })
```

- [ ] **Step 2: Add a test for the cycle-gate of all-platinum**

Inside the `describe('alreadyEarnedForCycle', ...)` block, add:

```ts
  it('cycle-gates all-platinum', () => {
    const earned = [mk('all-platinum', 1)]
    expect(alreadyEarnedForCycle(earned, 1).has('all-platinum')).toBe(true)
    expect(alreadyEarnedForCycle(earned, 2).has('all-platinum')).toBe(false)
  })
```

- [ ] **Step 3: Run the tests — confirm failures**

Run:
```bash
cd /mnt/professional/projects/code/tafeltrainer/multiplication-trainer
npm test -- --run achievements.test.ts
```

Expected: the six new tests fail — `all-platinum` / `hard-safe` / `loyal-player` don't exist in the `AchievementId` union yet; `currentStreak` and `lastSafe.difficulty` aren't on `EvaluateContext`.

- [ ] **Step 4: Extend `AchievementId`, the definitions map, and `EvaluateContext`**

Open `lib/safe/achievements.ts`.

Find the `AchievementId` union and replace with:

```ts
export type AchievementId =
  | 'first-safe'
  | 'perfect-safe'
  | 'fast-safe'
  | 'all-bronze'
  | 'all-silver'
  | 'all-gold'
  | 'all-platinum'
  | 'perfect-ronde'
  | 'endless-10'
  | 'endless-20'
  | 'hard-safe'
  | 'loyal-player'
```

Find the `ACHIEVEMENTS` record. Extend the existing 9 entries by inserting the three new ones at the order shown below:

```ts
export const ACHIEVEMENTS: Record<AchievementId, AchievementDef> = {
  'first-safe':    { id: 'first-safe',    label: 'Eerste kluis',    description: 'Je eerste kluis gekraakt!',                                medalPath: '/medals/shaded_medal1.png' },
  'perfect-safe':  { id: 'perfect-safe',  label: 'Perfecte kluis',  description: 'Een hele kluis zonder fouten gekraakt.',                   medalPath: '/medals/shaded_medal2.png' },
  'fast-safe':     { id: 'fast-safe',     label: 'Snelle kraker',   description: 'Een eindeloos-kluis in minder dan 20 seconden gekraakt.', medalPath: '/medals/shaded_medal3.png' },
  'all-bronze':    { id: 'all-bronze',    label: 'Alle brons',      description: 'Alle tien dieren verzameld (brons of hoger).',             medalPath: '/medals/shaded_medal4.png' },
  'all-silver':    { id: 'all-silver',    label: 'Alle zilver',     description: 'Alle tien dieren op zilver of hoger.',                     medalPath: '/medals/shaded_medal5.png' },
  'all-gold':      { id: 'all-gold',      label: 'Alle goud',       description: 'Alle tien dieren op goud. Kluis compleet!',                medalPath: '/medals/shaded_medal6.png' },
  'all-platinum':  { id: 'all-platinum',  label: 'Alle platina',    description: 'Alle tien dieren op platina — alleen via moeilijk.',       medalPath: '/medals/alle-platina.png' },
  'perfect-ronde': { id: 'perfect-ronde', label: 'Perfecte ronde',  description: 'Een hele ronde zonder fouten.',                            medalPath: '/medals/shaded_medal7.png' },
  'endless-10':    { id: 'endless-10',    label: 'Doorzetter',      description: '10 kluizen gehaald in eindeloos.',                         medalPath: '/medals/shaded_medal8.png' },
  'endless-20':    { id: 'endless-20',    label: 'Kluizen meester', description: '20 kluizen gehaald in eindeloos.',                         medalPath: '/medals/shaded_medal9.png' },
  'hard-safe':     { id: 'hard-safe',     label: 'Moeilijke kraker', description: 'Een moeilijk-kluis zonder fouten gekraakt.',              medalPath: '/medals/moeilijke-kraker.png' },
  'loyal-player':  { id: 'loyal-player',  label: 'Trouwe speler',   description: '7 dagen op rij geoefend.',                                 medalPath: '/medals/trouwe-speler.png' },
}
```

Find the `EvaluateContext` type and replace with:

```ts
export type EvaluateContext = {
  animals: AnimalEntry[]
  alreadyEarned: Set<string>
  collectionCycle: number
  lastSafe?: SafeRunPerSafe & {
    durationMs?: number
    mode: 'safe-run' | 'safe-endless'
    difficulty?: 'easy' | 'medium' | 'hard'
  }
  lastRun?: SafeRunResult
  currentStreak?: number
}
```

Find `evaluateAchievements`. Inside it, after the existing `endless-20` check and before the `return newOnes`, add:

```ts
  if (animals.length === 10 && animals.every((a) => a.tier === 'platinum')) {
    unlock('all-platinum')
  }

  if (
    lastSafe &&
    lastSafe.mistakes === 0 &&
    lastSafe.difficulty === 'hard'
  ) {
    unlock('hard-safe')
  }

  if ((ctx.currentStreak ?? 0) >= 7) {
    unlock('loyal-player')
  }
```

Find `alreadyEarnedForCycle`. Update the `cycleGated` set:

```ts
  const cycleGated = new Set<AchievementId>(['all-bronze', 'all-silver', 'all-gold', 'all-platinum'])
```

- [ ] **Step 5: Run the tests — confirm they pass**

Run:
```bash
npm test -- --run achievements.test.ts
```

Expected: all tests (original + six new + one new cycle-gate test) pass.

- [ ] **Step 6: Commit**

```bash
git add lib/safe/achievements.ts lib/safe/__tests__/achievements.test.ts
git commit -m "feat(safe): add Alle platina, Moeilijke kraker, Trouwe speler medals"
```

---

## Task 8: Wire difficulty + streak into the runtime evaluator calls

**Files:**
- Modify: `lib/safe/safe-progress.ts`

`awardAnimalForSafe` and `addSafeRunResult` now need to pass `difficulty` (for `hard-safe`) and `currentStreak` (for `loyal-player`) into `evaluateAchievements`.

- [ ] **Step 1: Pass `difficulty` through `awardAnimalForSafe`**

Open `lib/safe/safe-progress.ts`. Find `SafeRunPerSafe`:

```ts
export type SafeRunPerSafe = {
  tableIndex: number
  tier: AnimalTier
  mistakes: number
  gapsFilled: number
  durationMs?: number
  mode?: 'safe-run' | 'safe-endless'
}
```

Extend with difficulty:

```ts
export type SafeRunPerSafe = {
  tableIndex: number
  tier: AnimalTier
  mistakes: number
  gapsFilled: number
  durationMs?: number
  mode?: 'safe-run' | 'safe-endless'
  difficulty?: 'easy' | 'medium' | 'hard'
}
```

Find the call inside `awardAnimalForSafe` that builds `lastSafe`:

```ts
  const newlyEarned = evaluateAchievements({
    animals,
    alreadyEarned,
    collectionCycle: profile.collectionCycle,
    lastSafe: safe.mode ? { ...safe, mode: safe.mode } : undefined,
  })
```

Replace with:

```ts
  const newlyEarned = evaluateAchievements({
    animals,
    alreadyEarned,
    collectionCycle: profile.collectionCycle,
    lastSafe: safe.mode
      ? { ...safe, mode: safe.mode, difficulty: safe.difficulty }
      : undefined,
    currentStreak: profile.currentStreak,
  })
```

- [ ] **Step 2: Pass `currentStreak` through `addSafeRunResult`**

In the same file, find the `evaluateAchievements` call in `addSafeRunResult`:

```ts
  const newlyEarned = evaluateAchievements({
    animals: profile.animals,
    alreadyEarned,
    collectionCycle: profile.collectionCycle,
    lastRun: runResult,
  })
```

The streak has been computed as `newStreak` just above that call. Update to:

```ts
  const newlyEarned = evaluateAchievements({
    animals: profile.animals,
    alreadyEarned,
    collectionCycle: profile.collectionCycle,
    lastRun: runResult,
    currentStreak: newStreak,
  })
```

- [ ] **Step 3: Typecheck + test**

Run:
```bash
cd /mnt/professional/projects/code/tafeltrainer/multiplication-trainer
npx tsc --noEmit && npm test -- --run
```

Expected: clean typecheck; all tests pass.

- [ ] **Step 4: Commit**

```bash
git add lib/safe/safe-progress.ts
git commit -m "feat(safe): plumb difficulty + streak into achievement evaluator"
```

---

## Task 9: Pass difficulty through `completeSafe` in the page

**Files:**
- Modify: `app/safe/page.tsx`

- [ ] **Step 1: Add difficulty to the `SafeRunPerSafe` built inside `completeSafe`**

Open `app/safe/page.tsx`. Find the `entry` object literal in `completeSafe`:

```ts
    const entry: SafeRunPerSafe = {
      tableIndex: safe.table,
      tier,
      mistakes: safe.mistakes,
      gapsFilled,
      durationMs,
      mode,
    }
```

Replace with:

```ts
    const entry: SafeRunPerSafe = {
      tableIndex: safe.table,
      tier,
      mistakes: safe.mistakes,
      gapsFilled,
      durationMs,
      mode,
      difficulty,
    }
```

(`difficulty` is already in the closure — same place `scoreTier(safe.mistakes, difficulty)` now reads it.)

- [ ] **Step 2: Build + tests**

Run:
```bash
cd /mnt/professional/projects/code/tafeltrainer/multiplication-trainer
npx tsc --noEmit && npm test -- --run && npm run build
```

Expected: clean typecheck, all tests pass, build succeeds.

- [ ] **Step 3: Commit**

```bash
git add app/safe/page.tsx
git commit -m "feat(safe): carry difficulty in SafeRunPerSafe for hard-safe medal"
```

---

## Task 10: Platinum visual in `AnimalBadge`

**Files:**
- Modify: `components/safe/animal-badge.tsx`

- [ ] **Step 1: Add platinum to the tier style maps**

Open `components/safe/animal-badge.tsx`. Find:

```ts
const TIER_FRAME: Record<AnimalTier, string> = {
  bronze: 'bg-gradient-to-br from-amber-700 to-amber-500 ring-amber-600',
  silver: 'bg-gradient-to-br from-slate-300 to-slate-100 ring-slate-400',
  gold:   'bg-gradient-to-br from-yellow-300 to-yellow-500 ring-yellow-600',
}

const TIER_IMG_FILTER: Record<AnimalTier, string> = {
  bronze: 'saturate-50 brightness-95',
  silver: 'saturate-75',
  gold:   '',
}
```

Replace both with:

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

Find the gold-pulse class check:

```ts
        tier === 'gold' ? 'animate-pulse' : ''
```

Replace with (both gold and platinum pulse, platinum more strongly):

```ts
        tier === 'gold' || tier === 'platinum' ? 'animate-pulse' : ''
```

- [ ] **Step 2: Typecheck**

Run:
```bash
cd /mnt/professional/projects/code/tafeltrainer/multiplication-trainer
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/safe/animal-badge.tsx
git commit -m "feat(safe): add platinum tier visual to AnimalBadge"
```

---

## Task 11: Platinum label in `SafeReveal`

**Files:**
- Modify: `components/safe/safe-reveal.tsx`

- [ ] **Step 1: Extend the TIER_LABEL map**

Open `components/safe/safe-reveal.tsx`. Find:

```ts
const TIER_LABEL: Record<AnimalTier, string> = {
  bronze: 'Brons',
  silver: 'Zilver',
  gold:   'Goud',
}
```

Replace with:

```ts
const TIER_LABEL: Record<AnimalTier, string> = {
  bronze:   'Brons',
  silver:   'Zilver',
  gold:     'Goud',
  platinum: 'Platina',
}
```

- [ ] **Step 2: Typecheck + build**

Run:
```bash
npx tsc --noEmit && npm run build
```

Expected: clean; build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/safe/safe-reveal.tsx
git commit -m "feat(safe): add 'Platina' label to SafeReveal TIER_LABEL"
```

---

## Task 12: Extend `MedalRow`'s `ALL_IDS` to 12 medals

**Files:**
- Modify: `components/safe/medal-row.tsx`

- [ ] **Step 1: Add the three new IDs to `ALL_IDS`**

Open `components/safe/medal-row.tsx`. Find:

```ts
const ALL_IDS: AchievementId[] = [
  'first-safe',
  'perfect-safe',
  'fast-safe',
  'all-bronze',
  'all-silver',
  'all-gold',
  'perfect-ronde',
  'endless-10',
  'endless-20',
]
```

Replace with (order groups "per-safe feats", "collection", "run feats", "dedication"):

```ts
const ALL_IDS: AchievementId[] = [
  'first-safe',
  'perfect-safe',
  'fast-safe',
  'hard-safe',
  'all-bronze',
  'all-silver',
  'all-gold',
  'all-platinum',
  'perfect-ronde',
  'endless-10',
  'endless-20',
  'loyal-player',
]
```

- [ ] **Step 2: Typecheck + build + test**

Run:
```bash
cd /mnt/professional/projects/code/tafeltrainer/multiplication-trainer
npx tsc --noEmit && npm test -- --run && npm run build
```

Expected: clean typecheck, all tests pass, build succeeds.

- [ ] **Step 3: Commit**

```bash
git add components/safe/medal-row.tsx
git commit -m "feat(safe): show all 12 medals in MedalRow"
```

---

## Task 13: Manual verification pass

**Files:** none — runtime verification only.

- [ ] **Step 1: Start the dev server on port 3001**

Run:
```bash
cd /mnt/professional/projects/code/tafeltrainer/multiplication-trainer
PORT=3001 HOSTNAME=0.0.0.0 npm run dev
```

Leave it running in a background shell.

- [ ] **Step 2: Reset local profile state**

In the browser DevTools console at `http://localhost:3001/safe`, run:

```js
localStorage.removeItem('tafel-trainer-profiles')
localStorage.removeItem('tafel-trainer-current-profile')
location.reload()
```

Expected: the page reloads with an empty profile — no animals, no medals.

- [ ] **Step 3: Verify the Makkelijk → silver cap**

On `/safe`:
1. Select Makkelijk, one table (e.g. ×7), Ronde mode, start.
2. Solve every gap correctly — 0 mistakes.

Expected: SafeReveal shows "Zilver dier verdiend!" (not Goud). Back on the start screen the ×7 animal shows the silver frame.

- [ ] **Step 4: Verify the Normaal gold path**

1. Start a fresh Ronde: Normaal, ×7 only.
2. Solve everything correctly.

Expected: SafeReveal shows "Goud dier verdiend! ✨ Opgewaardeerd!" (it was silver). The ×7 animal displays the gold frame.

- [ ] **Step 5: Verify the Moeilijk platinum path + hard-safe medal**

1. Start a fresh Ronde: Moeilijk, ×7 only.
2. Solve everything correctly.

Expected:
- SafeReveal shows "Platina dier verdiend! ✨ Opgewaardeerd!" with a distinctly different (icy/violet) frame.
- On the scorecard, a "Nieuwe medailles!" card appears listing both `hard-safe` (Moeilijke kraker) and, if this was the first safe ever, `first-safe` (Eerste kluis).

- [ ] **Step 6: Verify the all-platinum auto-gates to Moeilijk**

Using DevTools console, shortcut progression by manipulating localStorage:

```js
const profiles = JSON.parse(localStorage.getItem('tafel-trainer-profiles'))
const p = profiles[profiles.length - 1]
p.animals = Array.from({length: 10}, (_, i) => ({
  tableIndex: i + 1,
  tier: 'platinum',
  firstEarnedAt: '2026-01-01',
  lastUpgradedAt: '2026-01-01',
}))
localStorage.setItem('tafel-trainer-profiles', JSON.stringify(profiles))
location.reload()
```

Expected: the `/safe` start screen's table grid shows all 10 animals with the platinum (icy) frame. The Alle platina medal is NOT yet in the MedalRow because it only fires via `evaluateAchievements` on a safe completion.

Then play one quick Moeilijk safe to trigger evaluation. Expected: Alle platina medal now visible.

- [ ] **Step 7: Verify the Trouwe speler streak medal**

Simulate a 7-day streak via console:

```js
const profiles = JSON.parse(localStorage.getItem('tafel-trainer-profiles'))
const p = profiles[profiles.length - 1]
p.currentStreak = 6  // Start at 6 so next quiz bumps to 7
p.lastPracticeDate = '2025-01-01T12:00:00.000Z'
localStorage.setItem('tafel-trainer-profiles', JSON.stringify(profiles))
location.reload()
```

Play one Ronde to completion. Expected: on the scorecard, the Trouwe speler medal appears in "Nieuwe medailles!".

- [ ] **Step 8: Regression check existing modes**

1. Visit `/` — home page renders, streak counter shown.
2. Visit `/quiz?mode=quiz&operation=multiply&count=10&tables=7` — quiz flow still works (platinum change doesn't touch quiz scoring).
3. Visit `/progress` — Dieren verzameling card shows the platinum animals correctly.

- [ ] **Step 9: Stop the dev server**

Ctrl+C the background shell running `npm run dev`.

- [ ] **Step 10: Final commit if any loose ends surfaced**

If QA revealed any minor polish (text truncation, layout creak, etc.), make one cleanup commit:

```bash
git add -A
git commit -m "chore(safe): achievement rework QA polish"
```

If nothing needed, skip.

---

## Self-Review Notes

**Spec coverage:**
- Tier system with platinum + α mapping → Tasks 2, 3, 4, 5.
- Grandfather rule → Task 6 (explicit test).
- Alle platina medal → Tasks 1, 7, 12.
- Moeilijke kraker medal → Tasks 1, 7, 8, 9, 12.
- Trouwe speler medal → Tasks 1, 7, 8, 12.
- Asset copies + LICENSE update → Task 1.
- Platinum UI on AnimalBadge → Task 10.
- Platinum label in SafeReveal → Task 11.
- Cycle-gate extended to all-platinum → Task 7.
- Tests for scoreTier, platinum upgrade, achievements → Tasks 3, 6, 7.
- Manual QA → Task 13.

**Placeholder scan:** no TBDs, no "implement later" instructions. Every code block is concrete.

**Type consistency:**
- `AnimalTier` gains `'platinum'` everywhere it's referenced (Task 2, Task 3 Step 3 if needed, Task 4 TIER_RANK, Task 10 TIER_FRAME/TIER_IMG_FILTER, Task 11 TIER_LABEL).
- `scoreTier(mistakes, difficulty)` signature used consistently — Task 3 defines it, Task 5 is the only call site updated.
- `SafeRunPerSafe` adds optional `difficulty` in Task 8 and is populated in Task 9.
- `EvaluateContext` gains `currentStreak` and `lastSafe.difficulty` in Task 7; callers updated in Task 8.
- `AchievementId` union extended in Task 7; MedalRow's `ALL_IDS` uses those IDs in Task 12.
