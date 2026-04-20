# Safe Cracker Minigame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the "Kraak de Kluis" minigame — a dial-based gap-filling puzzle at `/safe` that rewards a persistent tiered animal collection, per the approved spec at `docs/superpowers/specs/2026-04-20-safe-cracker-minigame-design.md`.

**Architecture:** Standalone Next.js App Router route (`/safe`) with client-side state. Pure game logic in `lib/safe/safe-logic.ts` (unit-tested). Profile mutations in `lib/safe/safe-progress.ts` (unit-tested) extending the existing `lib/profile-manager.ts` localStorage system. UI as focused components under `components/safe/`. Animal assets from the CC0 Kenney Animal Pack Remastered, copied into `public/animals/`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Vitest (added in Task 1). No state management library — `useState` + localStorage is sufficient.

---

## Reference: Final File Structure

```
app/safe/page.tsx                     NEW (route orchestration)
components/safe/
  safe-dial.tsx                       NEW
  safe-slot.tsx                       NEW
  numpad.tsx                          NEW
  collection-strip.tsx                NEW
  animal-badge.tsx                    NEW
  safe-reveal.tsx                     NEW
  difficulty-picker.tsx               NEW
  mode-picker.tsx                     NEW
lib/safe/
  animals.ts                          NEW (pack manifest)
  safe-logic.ts                       NEW (pure functions)
  safe-progress.ts                    NEW (profile mutations)
  __tests__/
    safe-logic.test.ts                NEW
    safe-progress.test.ts             NEW
lib/profile-manager.ts                MODIFY (types + hydration)
app/page.tsx                          MODIFY (add Kluis card)
app/progress/page.tsx                 MODIFY (add collection card)
public/animals/
  01-chick.{png,svg} ... 10-elephant.{png,svg}   NEW
  LICENSE.txt                         NEW
README.md                             MODIFY (acknowledgments)
package.json                          MODIFY (add vitest)
vitest.config.ts                      NEW
```

---

## Task 1: Set up Vitest for unit tests

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `lib/safe/__tests__/smoke.test.ts`

- [ ] **Step 1: Install Vitest**

Run:
```bash
cd /mnt/professional/projects/code/tafeltrainer/multiplication-trainer
npm install -D vitest@^2
```

Expected: installs without error; `package.json` devDependencies gets `vitest`.

- [ ] **Step 2: Add `test` script to package.json**

Find the `scripts` block and add `"test"` after `"lint"`:

```json
"scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest"
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
```

- [ ] **Step 4: Write smoke test**

Create `lib/safe/__tests__/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('vitest setup', () => {
  it('runs a test', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 5: Run tests to confirm setup**

Run: `npm test -- --run`
Expected: 1 passing test.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts lib/safe/__tests__/smoke.test.ts
git commit -m "chore: add Vitest for unit tests"
```

---

## Task 2: Copy Kenney animal assets into `public/animals/`

**Files:**
- Create: `public/animals/01-chick.png` through `10-elephant.png` (from Kenney `PNG/Round/`)
- Create: `public/animals/01-chick.svg` through `10-elephant.svg` (from Kenney `Vector/`)
- Create: `public/animals/LICENSE.txt`

- [ ] **Step 1: Verify the source zip is present**

Run:
```bash
ls ~/Downloads/kenney_animal-pack-remastered.zip
```

Expected: file listed. If missing, abort — user provides this.

- [ ] **Step 2: Extract to a temp directory**

Run:
```bash
rm -rf /tmp/kenney-extract
mkdir /tmp/kenney-extract
cd /tmp/kenney-extract
unzip -q ~/Downloads/kenney_animal-pack-remastered.zip
ls PNG/Round/ | head
ls Vector/ | head
```

Expected: `PNG/Round/` contains 30 `.png` files (bear.png, chick.png, …). `Vector/` contains SVG files.

- [ ] **Step 3: Copy the 10 chosen animals into `public/animals/`**

```bash
cd /mnt/professional/projects/code/tafeltrainer/multiplication-trainer
mkdir -p public/animals

# PNGs (round portrait) — from PNG/Round/
cp /tmp/kenney-extract/PNG/Round/chick.png      public/animals/01-chick.png
cp /tmp/kenney-extract/PNG/Round/duck.png       public/animals/02-duck.png
cp /tmp/kenney-extract/PNG/Round/rabbit.png     public/animals/03-rabbit.png
cp /tmp/kenney-extract/PNG/Round/dog.png        public/animals/04-dog.png
cp /tmp/kenney-extract/PNG/Round/pig.png        public/animals/05-pig.png
cp /tmp/kenney-extract/PNG/Round/panda.png      public/animals/06-panda.png
cp /tmp/kenney-extract/PNG/Round/monkey.png     public/animals/07-monkey.png
cp /tmp/kenney-extract/PNG/Round/bear.png       public/animals/08-bear.png
cp /tmp/kenney-extract/PNG/Round/giraffe.png    public/animals/09-giraffe.png
cp /tmp/kenney-extract/PNG/Round/elephant.png   public/animals/10-elephant.png
```

- [ ] **Step 4: Find and copy matching Vector SVGs**

```bash
ls /tmp/kenney-extract/Vector/
```

Inspect output to identify SVG filenames. Kenney typically names them `animals/bear.svg` or `bear.svg` inside the Vector folder — adapt the paths below to match. For each animal, copy the corresponding SVG:

```bash
# Example — update paths to match actual Vector/ layout:
cp /tmp/kenney-extract/Vector/chick.svg     public/animals/01-chick.svg
cp /tmp/kenney-extract/Vector/duck.svg      public/animals/02-duck.svg
cp /tmp/kenney-extract/Vector/rabbit.svg    public/animals/03-rabbit.svg
cp /tmp/kenney-extract/Vector/dog.svg       public/animals/04-dog.svg
cp /tmp/kenney-extract/Vector/pig.svg       public/animals/05-pig.svg
cp /tmp/kenney-extract/Vector/panda.svg     public/animals/06-panda.svg
cp /tmp/kenney-extract/Vector/monkey.svg    public/animals/07-monkey.svg
cp /tmp/kenney-extract/Vector/bear.svg      public/animals/08-bear.svg
cp /tmp/kenney-extract/Vector/giraffe.svg   public/animals/09-giraffe.svg
cp /tmp/kenney-extract/Vector/elephant.svg  public/animals/10-elephant.svg
```

If the Vector folder uses a subfolder or different naming (e.g., `round/chick.svg`), adjust the source path accordingly. If SVG isn't available for a particular animal, note it (we'll fall back to the PNG for the reveal on that animal).

- [ ] **Step 5: Verify files are in place**

```bash
ls public/animals/
```

Expected: 20 files (10 PNG + 10 SVG) plus LICENSE.txt (next step).

- [ ] **Step 6: Create `public/animals/LICENSE.txt`**

```
Animal artwork: Kenney Animal Pack Remastered
Source: https://kenney.nl/assets/animal-pack-remastered
License: CC0 1.0 Universal (Public Domain)
Attribution not required but provided as courtesy.
```

- [ ] **Step 7: Commit**

```bash
git add public/animals/
git commit -m "chore: add Kenney animal pack assets for safe cracker minigame"
```

---

## Task 3: Create the animals manifest

**Files:**
- Create: `lib/safe/animals.ts`
- Create: `lib/safe/__tests__/animals.test.ts`

- [ ] **Step 1: Write the manifest test**

Create `lib/safe/__tests__/animals.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { ANIMALS, getAnimalForTable } from '@/lib/safe/animals'

describe('animals manifest', () => {
  it('has exactly 10 animals', () => {
    expect(ANIMALS).toHaveLength(10)
  })

  it('covers tables 1..10 exactly once', () => {
    const tables = ANIMALS.map((a) => a.tableIndex).sort((x, y) => x - y)
    expect(tables).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('every animal has non-empty slug and name', () => {
    for (const a of ANIMALS) {
      expect(a.slug).toMatch(/\w+/)
      expect(a.nameNl).toMatch(/\w+/)
    }
  })

  it('getAnimalForTable returns the right entry', () => {
    expect(getAnimalForTable(1).slug).toBe('chick')
    expect(getAnimalForTable(10).slug).toBe('elephant')
  })

  it('getAnimalForTable throws for out-of-range', () => {
    expect(() => getAnimalForTable(0)).toThrow()
    expect(() => getAnimalForTable(11)).toThrow()
  })
})
```

- [ ] **Step 2: Run test — confirm it fails**

Run: `npm test -- --run animals.test.ts`
Expected: FAIL with "Cannot find module '@/lib/safe/animals'".

- [ ] **Step 3: Write the manifest**

Create `lib/safe/animals.ts`:

```ts
export type Animal = {
  tableIndex: number
  slug: string
  nameNl: string
  pngPath: string
  svgPath: string
}

export const ANIMALS: ReadonlyArray<Animal> = [
  { tableIndex: 1,  slug: 'chick',    nameNl: 'Kuiken',   pngPath: '/animals/01-chick.png',    svgPath: '/animals/01-chick.svg' },
  { tableIndex: 2,  slug: 'duck',     nameNl: 'Eend',     pngPath: '/animals/02-duck.png',     svgPath: '/animals/02-duck.svg' },
  { tableIndex: 3,  slug: 'rabbit',   nameNl: 'Konijn',   pngPath: '/animals/03-rabbit.png',   svgPath: '/animals/03-rabbit.svg' },
  { tableIndex: 4,  slug: 'dog',      nameNl: 'Hond',     pngPath: '/animals/04-dog.png',      svgPath: '/animals/04-dog.svg' },
  { tableIndex: 5,  slug: 'pig',      nameNl: 'Varken',   pngPath: '/animals/05-pig.png',      svgPath: '/animals/05-pig.svg' },
  { tableIndex: 6,  slug: 'panda',    nameNl: 'Panda',    pngPath: '/animals/06-panda.png',    svgPath: '/animals/06-panda.svg' },
  { tableIndex: 7,  slug: 'monkey',   nameNl: 'Aap',      pngPath: '/animals/07-monkey.png',   svgPath: '/animals/07-monkey.svg' },
  { tableIndex: 8,  slug: 'bear',     nameNl: 'Beer',     pngPath: '/animals/08-bear.png',     svgPath: '/animals/08-bear.svg' },
  { tableIndex: 9,  slug: 'giraffe',  nameNl: 'Giraffe',  pngPath: '/animals/09-giraffe.png',  svgPath: '/animals/09-giraffe.svg' },
  { tableIndex: 10, slug: 'elephant', nameNl: 'Olifant',  pngPath: '/animals/10-elephant.png', svgPath: '/animals/10-elephant.svg' },
]

export function getAnimalForTable(tableIndex: number): Animal {
  const animal = ANIMALS.find((a) => a.tableIndex === tableIndex)
  if (!animal) {
    throw new Error(`No animal mapped for tableIndex ${tableIndex}`)
  }
  return animal
}
```

- [ ] **Step 4: Run test — confirm it passes**

Run: `npm test -- --run animals.test.ts`
Expected: 5 passing tests.

- [ ] **Step 5: Commit**

```bash
git add lib/safe/animals.ts lib/safe/__tests__/animals.test.ts
git commit -m "feat: add animal manifest for safe cracker minigame"
```

---

## Task 4: Pure game logic (`safe-logic.ts`) with TDD

**Files:**
- Create: `lib/safe/safe-logic.ts`
- Create: `lib/safe/__tests__/safe-logic.test.ts`

- [ ] **Step 1: Write tests for `gapsForSafe`**

Create `lib/safe/__tests__/safe-logic.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  gapsForSafe,
  scoreTier,
  buildSafe,
  shuffleTables,
  type Difficulty,
  type SafeSlot,
} from '@/lib/safe/safe-logic'

describe('gapsForSafe', () => {
  it('Easy starts at 2 gaps and ramps by 1', () => {
    expect(gapsForSafe('easy', 1)).toBe(2)
    expect(gapsForSafe('easy', 2)).toBe(3)
    expect(gapsForSafe('easy', 5)).toBe(6)
  })

  it('Medium starts at 4 gaps', () => {
    expect(gapsForSafe('medium', 1)).toBe(4)
    expect(gapsForSafe('medium', 3)).toBe(6)
  })

  it('Hard starts at 6 gaps', () => {
    expect(gapsForSafe('hard', 1)).toBe(6)
    expect(gapsForSafe('hard', 4)).toBe(9)
  })

  it('caps at 10 gaps regardless of safe index', () => {
    expect(gapsForSafe('easy', 9)).toBe(10)
    expect(gapsForSafe('easy', 100)).toBe(10)
    expect(gapsForSafe('hard', 5)).toBe(10)
    expect(gapsForSafe('hard', 50)).toBe(10)
  })
})

describe('scoreTier', () => {
  it('0 mistakes → gold', () => {
    expect(scoreTier(0)).toBe('gold')
  })

  it('1 or 2 mistakes → silver', () => {
    expect(scoreTier(1)).toBe('silver')
    expect(scoreTier(2)).toBe('silver')
  })

  it('3+ mistakes → bronze', () => {
    expect(scoreTier(3)).toBe('bronze')
    expect(scoreTier(10)).toBe('bronze')
  })
})
```

- [ ] **Step 2: Run tests — confirm they fail**

Run: `npm test -- --run safe-logic.test.ts`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Implement `gapsForSafe` and `scoreTier`**

Create `lib/safe/safe-logic.ts`:

```ts
export type Difficulty = 'easy' | 'medium' | 'hard'
export type AnimalTier = 'bronze' | 'silver' | 'gold'

export type SafeSlot = {
  factor: number         // 1..10 (the multiplier)
  table: number          // the fixed table for this safe (1..10)
  answer: number         // factor * table
  isGap: boolean         // true = player must fill; false = pre-filled
}

const STARTING_GAPS: Record<Difficulty, number> = {
  easy: 2,
  medium: 4,
  hard: 6,
}

/** Gap count for a given safe in a run. Safe index is 1-based. Capped at 10. */
export function gapsForSafe(difficulty: Difficulty, safeIndex: number): number {
  const base = STARTING_GAPS[difficulty]
  return Math.min(10, base + (safeIndex - 1))
}

/** Map mistake count to earned tier. */
export function scoreTier(mistakes: number): AnimalTier {
  if (mistakes === 0) return 'gold'
  if (mistakes <= 2) return 'silver'
  return 'bronze'
}
```

- [ ] **Step 4: Run tests — confirm pass**

Run: `npm test -- --run safe-logic.test.ts`
Expected: 7 passing tests (the two describe blocks).

- [ ] **Step 5: Write tests for `buildSafe`**

Append to `lib/safe/__tests__/safe-logic.test.ts`:

```ts
describe('buildSafe', () => {
  it('returns 10 slots for the given table', () => {
    const slots = buildSafe({ table: 7, gapCount: 4, rng: mulberry32(1) })
    expect(slots).toHaveLength(10)
    for (const s of slots) {
      expect(s.table).toBe(7)
      expect(s.answer).toBe(s.factor * 7)
    }
  })

  it('has factors 1..10 exactly once each', () => {
    const slots = buildSafe({ table: 3, gapCount: 5, rng: mulberry32(2) })
    const factors = slots.map((s) => s.factor).sort((a, b) => a - b)
    expect(factors).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('gap count matches requested', () => {
    const slots = buildSafe({ table: 5, gapCount: 3, rng: mulberry32(3) })
    expect(slots.filter((s) => s.isGap)).toHaveLength(3)
  })

  it('prefers hard-half factors (>= 4) when gapCount <= 6', () => {
    // hard half = factors 4..9 (6 facts). With gapCount=6, all gaps should be in that set.
    const slots = buildSafe({ table: 7, gapCount: 6, rng: mulberry32(4) })
    const gapFactors = slots.filter((s) => s.isGap).map((s) => s.factor).sort((a, b) => a - b)
    for (const f of gapFactors) {
      expect(f).toBeGreaterThanOrEqual(4)
      expect(f).toBeLessThanOrEqual(9)
    }
  })

  it('spills into easy factors when gapCount > 6', () => {
    const slots = buildSafe({ table: 4, gapCount: 8, rng: mulberry32(5) })
    const gaps = slots.filter((s) => s.isGap)
    expect(gaps).toHaveLength(8)
    // At least 2 must come from {1, 2, 3, 10}
    const easyGapCount = gaps.filter((s) => [1, 2, 3, 10].includes(s.factor)).length
    expect(easyGapCount).toBeGreaterThanOrEqual(2)
  })

  it('all-gap safe (gapCount=10) marks every slot as gap', () => {
    const slots = buildSafe({ table: 9, gapCount: 10, rng: mulberry32(6) })
    expect(slots.every((s) => s.isGap)).toBe(true)
  })
})

describe('shuffleTables', () => {
  it('returns a permutation of the input', () => {
    const input = [1, 3, 5, 7]
    const out = shuffleTables(input, mulberry32(42))
    expect(out.sort((a, b) => a - b)).toEqual([1, 3, 5, 7])
  })

  it('is deterministic given the same seed', () => {
    const a = shuffleTables([1, 2, 3, 4, 5], mulberry32(99))
    const b = shuffleTables([1, 2, 3, 4, 5], mulberry32(99))
    expect(a).toEqual(b)
  })
})

// Simple seeded PRNG for deterministic tests.
function mulberry32(seed: number): () => number {
  let t = seed
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}
```

- [ ] **Step 6: Run tests — confirm they fail**

Run: `npm test -- --run safe-logic.test.ts`
Expected: new tests FAIL with "buildSafe is not a function" / "shuffleTables is not a function".

- [ ] **Step 7: Implement `buildSafe` and `shuffleTables`**

Append to `lib/safe/safe-logic.ts`:

```ts
export type BuildSafeArgs = {
  table: number
  gapCount: number
  rng?: () => number
}

const HARD_FACTORS = [4, 5, 6, 7, 8, 9]
const EASY_FACTORS = [1, 2, 3, 10]

/** Build a safe's 10 slots for a given table. Gaps are drawn from hard-half first. */
export function buildSafe({ table, gapCount, rng = Math.random }: BuildSafeArgs): SafeSlot[] {
  const gaps = gapCount <= HARD_FACTORS.length
    ? pickN(HARD_FACTORS, gapCount, rng)
    : [...HARD_FACTORS, ...pickN(EASY_FACTORS, gapCount - HARD_FACTORS.length, rng)]

  const gapSet = new Set(gaps)
  const slots: SafeSlot[] = []
  for (let factor = 1; factor <= 10; factor++) {
    slots.push({
      factor,
      table,
      answer: factor * table,
      isGap: gapSet.has(factor),
    })
  }
  return slots
}

/** Shuffle a list of tables into a deck for even per-run distribution. */
export function shuffleTables(tables: number[], rng: () => number = Math.random): number[] {
  const out = [...tables]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function pickN<T>(arr: readonly T[], n: number, rng: () => number): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, n)
}
```

- [ ] **Step 8: Run tests — confirm pass**

Run: `npm test -- --run safe-logic.test.ts`
Expected: all tests pass (13+ total).

- [ ] **Step 9: Commit**

```bash
git add lib/safe/safe-logic.ts lib/safe/__tests__/safe-logic.test.ts
git commit -m "feat: add pure safe-cracker game logic (buildSafe, scoreTier, etc.)"
```

---

## Task 5: Extend `UserProfile` with animals + hydration

**Files:**
- Modify: `lib/profile-manager.ts`
- Create: `lib/safe/__tests__/profile-hydration.test.ts`

- [ ] **Step 1: Write a hydration test**

Create `lib/safe/__tests__/profile-hydration.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { hydrateProfile, type RawProfile } from '@/lib/profile-manager'

describe('hydrateProfile', () => {
  it('adds empty animals array when missing', () => {
    const raw = { id: 'a', name: 'x' } as RawProfile
    const hydrated = hydrateProfile(raw)
    expect(hydrated.animals).toEqual([])
  })

  it('adds empty recentSafeResults when missing', () => {
    const raw = { id: 'a', name: 'x' } as RawProfile
    const hydrated = hydrateProfile(raw)
    expect(hydrated.recentSafeResults).toEqual([])
  })

  it('preserves existing animals', () => {
    const raw = {
      id: 'a',
      name: 'x',
      animals: [
        { tableIndex: 3, tier: 'silver', firstEarnedAt: 'iso', lastUpgradedAt: 'iso' },
      ],
    } as unknown as RawProfile
    const hydrated = hydrateProfile(raw)
    expect(hydrated.animals).toHaveLength(1)
    expect(hydrated.animals[0].tier).toBe('silver')
  })
})
```

- [ ] **Step 2: Run — confirm fail**

Run: `npm test -- --run profile-hydration.test.ts`
Expected: FAIL, "hydrateProfile is not exported".

- [ ] **Step 3: Add types and hydration to `lib/profile-manager.ts`**

Open `lib/profile-manager.ts`. Add these type declarations near the top, right after the existing `QuizResult` type:

```ts
export type AnimalTier = 'bronze' | 'silver' | 'gold'

export type AnimalEntry = {
  tableIndex: number
  tier: AnimalTier
  firstEarnedAt: string
  lastUpgradedAt: string
}

export type SafeRunResult = {
  id: string
  mode: 'safe-run' | 'safe-endless'
  difficulty: 'easy' | 'medium' | 'hard'
  tablesPicked: number[]
  safesCracked: number
  tiersEarned: {
    gold: number
    silver: number
    bronze: number
  }
  totalMistakes: number
  date: string
}
```

Then in the existing `UserProfile` type, add two fields at the end (before the closing `}`):

```ts
  animals: AnimalEntry[]
  recentSafeResults: SafeRunResult[]
```

Export a `RawProfile` type representing a pre-hydration shape and add the `hydrateProfile` function. Add this block after the type declarations:

```ts
/** Raw shape read from localStorage — may be missing new fields from older profile versions. */
export type RawProfile = Partial<UserProfile> & Pick<UserProfile, 'id' | 'name'>

/** Fill in missing fields on an older profile so it matches the current UserProfile shape. */
export function hydrateProfile(raw: RawProfile): UserProfile {
  return {
    createdAt: '',
    lastActive: '',
    totalQuizzes: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    currentStreak: 0,
    lastPracticeDate: '',
    bestScores: {
      quiz: { multiply: null, divide: null },
      timed: { multiply: null, divide: null },
    },
    tableStats: {},
    recentResults: [],
    ...raw,
    animals: raw.animals ?? [],
    recentSafeResults: raw.recentSafeResults ?? [],
  }
}
```

Also update `createProfile` to include the new fields — find the `profile: UserProfile = { ... }` block and add these two lines before the closing `}`:

```ts
    animals: [],
    recentSafeResults: [],
```

Update `getAllProfiles` to hydrate existing data. Replace its body with:

```ts
export function getAllProfiles(): UserProfile[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []
  try {
    const raw = JSON.parse(data) as RawProfile[]
    return raw.map(hydrateProfile)
  } catch {
    return []
  }
}
```

- [ ] **Step 4: Run hydration test — confirm pass**

Run: `npm test -- --run profile-hydration.test.ts`
Expected: 3 passing.

- [ ] **Step 5: Run all tests to confirm nothing broke**

Run: `npm test -- --run`
Expected: everything still passes.

- [ ] **Step 6: Verify the app still builds**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add lib/profile-manager.ts lib/safe/__tests__/profile-hydration.test.ts
git commit -m "feat: add animal/safe fields to UserProfile with hydration"
```

---

## Task 6: Safe progress mutations (`safe-progress.ts`) with TDD

**Files:**
- Create: `lib/safe/safe-progress.ts`
- Create: `lib/safe/__tests__/safe-progress.test.ts`

- [ ] **Step 1: Write the upgrade logic test**

Create `lib/safe/__tests__/safe-progress.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { applyAnimalAward } from '@/lib/safe/safe-progress'
import type { AnimalEntry } from '@/lib/profile-manager'

describe('applyAnimalAward', () => {
  const now = '2026-04-20T10:00:00.000Z'

  it('creates a new entry when none exists', () => {
    const result = applyAnimalAward([], { tableIndex: 4, tier: 'silver', now })
    expect(result.animals).toHaveLength(1)
    expect(result.animals[0]).toEqual({
      tableIndex: 4,
      tier: 'silver',
      firstEarnedAt: now,
      lastUpgradedAt: now,
    })
    expect(result.upgraded).toBe(true)
  })

  it('upgrades bronze → silver', () => {
    const existing: AnimalEntry[] = [
      { tableIndex: 4, tier: 'bronze', firstEarnedAt: '2025-01-01', lastUpgradedAt: '2025-01-01' },
    ]
    const result = applyAnimalAward(existing, { tableIndex: 4, tier: 'silver', now })
    expect(result.animals[0].tier).toBe('silver')
    expect(result.animals[0].firstEarnedAt).toBe('2025-01-01') // preserved
    expect(result.animals[0].lastUpgradedAt).toBe(now)
    expect(result.upgraded).toBe(true)
  })

  it('upgrades silver → gold', () => {
    const existing: AnimalEntry[] = [
      { tableIndex: 4, tier: 'silver', firstEarnedAt: '2025-01-01', lastUpgradedAt: '2025-01-01' },
    ]
    const result = applyAnimalAward(existing, { tableIndex: 4, tier: 'gold', now })
    expect(result.animals[0].tier).toBe('gold')
    expect(result.upgraded).toBe(true)
  })

  it('does not downgrade gold → silver', () => {
    const existing: AnimalEntry[] = [
      { tableIndex: 4, tier: 'gold', firstEarnedAt: '2025-01-01', lastUpgradedAt: '2025-01-01' },
    ]
    const result = applyAnimalAward(existing, { tableIndex: 4, tier: 'silver', now })
    expect(result.animals[0].tier).toBe('gold')
    expect(result.upgraded).toBe(false)
  })

  it('does not "upgrade" same tier', () => {
    const existing: AnimalEntry[] = [
      { tableIndex: 4, tier: 'silver', firstEarnedAt: '2025-01-01', lastUpgradedAt: '2025-01-01' },
    ]
    const result = applyAnimalAward(existing, { tableIndex: 4, tier: 'silver', now })
    expect(result.animals[0].tier).toBe('silver')
    expect(result.animals[0].lastUpgradedAt).toBe('2025-01-01')
    expect(result.upgraded).toBe(false)
  })

  it('leaves other tables untouched', () => {
    const existing: AnimalEntry[] = [
      { tableIndex: 2, tier: 'bronze', firstEarnedAt: '2025-01-01', lastUpgradedAt: '2025-01-01' },
    ]
    const result = applyAnimalAward(existing, { tableIndex: 4, tier: 'gold', now })
    expect(result.animals).toHaveLength(2)
    expect(result.animals.find((a) => a.tableIndex === 2)?.tier).toBe('bronze')
  })
})
```

- [ ] **Step 2: Run — confirm fail**

Run: `npm test -- --run safe-progress.test.ts`
Expected: FAIL, "Cannot find module".

- [ ] **Step 3: Implement `applyAnimalAward`**

Create `lib/safe/safe-progress.ts`:

```ts
import type { AnimalEntry, AnimalTier, SafeRunResult, UserProfile } from '@/lib/profile-manager'
import { getCurrentProfile, updateProfile } from '@/lib/profile-manager'

const TIER_RANK: Record<AnimalTier, number> = { bronze: 1, silver: 2, gold: 3 }

export type AnimalAwardInput = {
  tableIndex: number
  tier: AnimalTier
  now: string
}

export type AnimalAwardResult = {
  animals: AnimalEntry[]
  upgraded: boolean
}

/** Pure: given current animal entries, apply a single award. Returns new list + whether it was an upgrade. */
export function applyAnimalAward(
  current: AnimalEntry[],
  { tableIndex, tier, now }: AnimalAwardInput,
): AnimalAwardResult {
  const existing = current.find((a) => a.tableIndex === tableIndex)

  if (!existing) {
    return {
      animals: [
        ...current,
        { tableIndex, tier, firstEarnedAt: now, lastUpgradedAt: now },
      ],
      upgraded: true,
    }
  }

  const shouldUpgrade = TIER_RANK[tier] > TIER_RANK[existing.tier]
  if (!shouldUpgrade) {
    return { animals: current, upgraded: false }
  }

  return {
    animals: current.map((a) =>
      a.tableIndex === tableIndex
        ? { ...a, tier, lastUpgradedAt: now }
        : a,
    ),
    upgraded: true,
  }
}
```

- [ ] **Step 4: Run — confirm pass**

Run: `npm test -- --run safe-progress.test.ts`
Expected: 6 passing.

- [ ] **Step 5: Add the orchestrating `addSafeRunResult` helper (calls localStorage)**

Append to `lib/safe/safe-progress.ts`:

```ts
export type SafeRunPerSafe = {
  tableIndex: number
  tier: AnimalTier
  mistakes: number
  gapsFilled: number
}

/**
 * Persist the outcome of a completed safe run to the current profile:
 * - Updates each cracked safe's animal entry (upgrading tier where applicable).
 * - Appends a SafeRunResult to recentSafeResults (cap 20).
 * - Updates totals, streak, and tableStats.
 */
export function addSafeRunResult(
  perSafe: SafeRunPerSafe[],
  meta: {
    mode: 'safe-run' | 'safe-endless'
    difficulty: 'easy' | 'medium' | 'hard'
    tablesPicked: number[]
  },
): { upgradedAnimals: number[] } {
  const profile = getCurrentProfile()
  if (!profile) return { upgradedAnimals: [] }

  const now = new Date().toISOString()
  let animals = profile.animals
  const upgradedAnimals: number[] = []

  for (const safe of perSafe) {
    const { animals: next, upgraded } = applyAnimalAward(animals, {
      tableIndex: safe.tableIndex,
      tier: safe.tier,
      now,
    })
    animals = next
    if (upgraded) upgradedAnimals.push(safe.tableIndex)
  }

  const tiersEarned = {
    gold: perSafe.filter((s) => s.tier === 'gold').length,
    silver: perSafe.filter((s) => s.tier === 'silver').length,
    bronze: perSafe.filter((s) => s.tier === 'bronze').length,
  }
  const totalMistakes = perSafe.reduce((acc, s) => acc + s.mistakes, 0)
  const totalGaps = perSafe.reduce((acc, s) => acc + s.gapsFilled, 0)
  const totalCorrect = totalGaps - totalMistakes

  const runResult: SafeRunResult = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
    mode: meta.mode,
    difficulty: meta.difficulty,
    tablesPicked: meta.tablesPicked,
    safesCracked: perSafe.length,
    tiersEarned,
    totalMistakes,
    date: now,
  }

  const recentSafeResults = [runResult, ...profile.recentSafeResults].slice(0, 20)

  // Streak: bump like addQuizResult does — one "practice session" per day max.
  const today = now.split('T')[0]
  const lastPractice = profile.lastPracticeDate.split('T')[0]
  const newStreak =
    lastPractice === today
      ? profile.currentStreak
      : profile.currentStreak + 1

  // Table stats — treat each gap as a multiply attempt on the cracked table.
  const tableStats: UserProfile['tableStats'] = { ...profile.tableStats }
  for (const safe of perSafe) {
    const t = safe.tableIndex
    if (!tableStats[t]) {
      tableStats[t] = {
        multiply: { attempts: 0, correct: 0, bestScore: 0 },
        divide: { attempts: 0, correct: 0, bestScore: 0 },
      }
    }
    const mult = tableStats[t].multiply
    mult.attempts += safe.gapsFilled
    mult.correct += safe.gapsFilled - safe.mistakes
    const pct = mult.attempts > 0 ? (mult.correct / mult.attempts) * 100 : 0
    mult.bestScore = Math.max(mult.bestScore, pct)
  }

  updateProfile(profile.id, {
    animals,
    recentSafeResults,
    totalQuizzes: profile.totalQuizzes + 1,
    totalQuestions: profile.totalQuestions + totalGaps,
    totalCorrect: profile.totalCorrect + totalCorrect,
    currentStreak: newStreak,
    lastPracticeDate: now,
    tableStats,
  })

  return { upgradedAnimals }
}
```

- [ ] **Step 6: Run all tests — confirm nothing broke**

Run: `npm test -- --run`
Expected: all passing.

- [ ] **Step 7: Commit**

```bash
git add lib/safe/safe-progress.ts lib/safe/__tests__/safe-progress.test.ts
git commit -m "feat: add safe-cracker profile mutation helpers"
```

---

## Task 7: `animal-badge` component

**Files:**
- Create: `components/safe/animal-badge.tsx`

- [ ] **Step 1: Write the component**

Create `components/safe/animal-badge.tsx`:

```tsx
'use client'

import Image from 'next/image'
import { getAnimalForTable } from '@/lib/safe/animals'
import type { AnimalTier } from '@/lib/profile-manager'

type AnimalBadgeProps = {
  tableIndex: number
  tier?: AnimalTier | null       // null/undefined = not earned yet
  size?: 'small' | 'medium' | 'large'
  useSvg?: boolean               // true for the big reveal
}

const SIZE_PX: Record<'small' | 'medium' | 'large', number> = {
  small: 48,
  medium: 80,
  large: 180,
}

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

export function AnimalBadge({
  tableIndex,
  tier = null,
  size = 'medium',
  useSvg = false,
}: AnimalBadgeProps) {
  const animal = getAnimalForTable(tableIndex)
  const px = SIZE_PX[size]
  const src = useSvg ? animal.svgPath : animal.pngPath

  const earned = tier !== null && tier !== undefined
  const frameClass = earned
    ? `${TIER_FRAME[tier]} ring-2`
    : 'bg-gray-200 dark:bg-gray-700 ring-2 ring-gray-300'

  const imgClass = earned
    ? TIER_IMG_FILTER[tier]
    : 'grayscale opacity-50'

  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl overflow-hidden ${frameClass} ${
        tier === 'gold' ? 'animate-pulse' : ''
      }`}
      style={{ width: px, height: px }}
      title={`${animal.nameNl} (×${tableIndex})`}
    >
      <Image
        src={src}
        alt={animal.nameNl}
        width={px - 8}
        height={px - 8}
        className={`object-contain ${imgClass}`}
      />
    </div>
  )
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/safe/animal-badge.tsx
git commit -m "feat(safe): add AnimalBadge component with tier framing"
```

---

## Task 8: `collection-strip` component

**Files:**
- Create: `components/safe/collection-strip.tsx`

- [ ] **Step 1: Write the component**

Create `components/safe/collection-strip.tsx`:

```tsx
'use client'

import { ANIMALS } from '@/lib/safe/animals'
import type { AnimalEntry, AnimalTier } from '@/lib/profile-manager'
import { AnimalBadge } from './animal-badge'

type CollectionStripProps = {
  animals: AnimalEntry[]
  highlightTable?: number | null   // pulsate this slot (e.g., just earned)
  compact?: boolean
}

export function CollectionStrip({ animals, highlightTable = null, compact = false }: CollectionStripProps) {
  const tierByTable = new Map<number, AnimalTier>(
    animals.map((a) => [a.tableIndex, a.tier]),
  )
  const earnedCount = animals.length
  const allGold = animals.length === 10 && animals.every((a) => a.tier === 'gold')

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 px-2">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
          Dieren Verzameling · {earnedCount} / 10
        </span>
        {allGold && (
          <span className="text-xs font-bold text-yellow-600">🏆 Kluis Compleet!</span>
        )}
      </div>
      <div className={`flex gap-2 p-3 rounded-2xl border-2 border-amber-200 bg-amber-50 dark:bg-amber-950/30 justify-center flex-wrap ${compact ? 'py-2' : ''}`}>
        {ANIMALS.map((animal) => (
          <div
            key={animal.tableIndex}
            className={highlightTable === animal.tableIndex ? 'animate-bounce' : ''}
          >
            <AnimalBadge
              tableIndex={animal.tableIndex}
              tier={tierByTable.get(animal.tableIndex) ?? null}
              size={compact ? 'small' : 'medium'}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/safe/collection-strip.tsx
git commit -m "feat(safe): add CollectionStrip component"
```

---

## Task 9: `numpad` component with keyboard bindings

**Files:**
- Create: `components/safe/numpad.tsx`

- [ ] **Step 1: Write the component**

Create `components/safe/numpad.tsx`:

```tsx
'use client'

import { useEffect } from 'react'

type NumpadProps = {
  value: string
  onChange: (next: string) => void
  onSubmit: () => void
  disabled?: boolean
}

const DIGITS = ['1','2','3','4','5','6','7','8','9']

export function Numpad({ value, onChange, onSubmit, disabled = false }: NumpadProps) {
  useEffect(() => {
    if (disabled) return
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (value.length >= 3) return
        onChange(value + e.key)
      } else if (e.key === 'Backspace') {
        onChange(value.slice(0, -1))
      } else if (e.key === 'Enter') {
        onSubmit()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [value, disabled, onChange, onSubmit])

  const press = (digit: string) => {
    if (disabled) return
    if (value.length >= 3) return
    onChange(value + digit)
  }

  const backspace = () => {
    if (disabled) return
    onChange(value.slice(0, -1))
  }

  return (
    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
      {DIGITS.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => press(d)}
          disabled={disabled}
          className="h-14 rounded-xl bg-white border-2 border-gray-300 font-bold text-2xl shadow hover:bg-gray-50 active:translate-y-0.5 disabled:opacity-50"
        >
          {d}
        </button>
      ))}
      <button
        type="button"
        onClick={backspace}
        disabled={disabled}
        className="h-14 rounded-xl bg-white border-2 border-gray-300 font-bold text-xl shadow hover:bg-gray-50 disabled:opacity-50"
        aria-label="Backspace"
      >
        ←
      </button>
      <button
        type="button"
        onClick={() => press('0')}
        disabled={disabled}
        className="h-14 rounded-xl bg-white border-2 border-gray-300 font-bold text-2xl shadow hover:bg-gray-50 disabled:opacity-50"
      >
        0
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className="h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-lg shadow hover:shadow-lg disabled:opacity-50"
      >
        OK
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/safe/numpad.tsx
git commit -m "feat(safe): add Numpad with keyboard bindings"
```

---

## Task 10: `safe-slot` and `safe-dial` components

**Files:**
- Create: `components/safe/safe-slot.tsx`
- Create: `components/safe/safe-dial.tsx`

- [ ] **Step 1: Write `safe-slot.tsx`**

Create `components/safe/safe-slot.tsx`:

```tsx
'use client'

export type SlotState = 'prefilled' | 'gap-empty' | 'gap-active' | 'gap-correct' | 'gap-revealed'

type SafeSlotProps = {
  factor: number
  table: number
  displayValue: string     // what to render in the big slot body (number, partial input, or '?')
  state: SlotState
  onClick?: () => void
}

export function SafeSlot({ factor, table, displayValue, state, onClick }: SafeSlotProps) {
  const stateClasses: Record<SlotState, string> = {
    'prefilled':     'bg-gray-100 border-gray-300 text-gray-800',
    'gap-empty':     'bg-white border-red-300 border-dashed text-red-600 cursor-pointer hover:border-red-400',
    'gap-active':    'bg-yellow-100 border-amber-500 text-amber-900 ring-4 ring-amber-200 cursor-pointer',
    'gap-correct':   'bg-green-100 border-green-500 text-green-900',
    'gap-revealed':  'bg-amber-200 border-amber-600 text-amber-900',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === 'prefilled' || state === 'gap-correct' || state === 'gap-revealed'}
      className={`absolute w-16 h-16 md:w-20 md:h-20 rounded-full border-4 flex flex-col items-center justify-center font-bold shadow-lg transition-all ${stateClasses[state]}`}
      style={{ transform: 'translate(-50%, -50%)' }}
      data-factor={factor}
    >
      <span className="text-[10px] md:text-xs text-gray-500 font-semibold leading-none">
        {factor}&times;{table}
      </span>
      <span className="text-xl md:text-2xl font-extrabold leading-tight">{displayValue}</span>
    </button>
  )
}
```

- [ ] **Step 2: Write `safe-dial.tsx`**

Create `components/safe/safe-dial.tsx`:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { SafeSlot, type SlotState } from './safe-slot'
import type { SafeSlot as SafeSlotData } from '@/lib/safe/safe-logic'

export type SlotStatus = {
  state: SlotState
  displayValue: string
}

type SafeDialProps = {
  slots: SafeSlotData[]
  statuses: SlotStatus[]          // parallel array to slots — one per factor (1..10)
  activeFactor: number | null
  onSlotClick: (factor: number) => void
  spinning?: boolean
  flash?: boolean
  label?: string                  // e.g., "×7"
  subLabel?: string               // e.g., "3 / 10 ingevuld"
}

export function SafeDial({
  slots,
  statuses,
  activeFactor,
  onSlotClick,
  spinning = false,
  flash = false,
  label = '',
  subLabel = '',
}: SafeDialProps) {
  const dialRef = useRef<HTMLDivElement | null>(null)

  // Size is responsive: min 320px, stretches to 480px.
  useEffect(() => {
    if (!dialRef.current) return
  }, [])

  return (
    <div className="relative mx-auto" style={{ width: 'min(480px, 92vw)', aspectRatio: '1 / 1' }}>
      <div
        ref={dialRef}
        className={`relative w-full h-full rounded-full border-8 border-gray-400 bg-gradient-to-br from-gray-600 to-gray-900 shadow-2xl transition-transform duration-700 ${
          spinning ? 'animate-[spin_0.9s_ease-in-out]' : ''
        } ${flash ? 'ring-8 ring-yellow-300' : ''}`}
        style={{
          boxShadow:
            '0 10px 30px rgba(0,0,0,0.4), inset 0 4px 20px rgba(255,255,255,0.1)',
        }}
      >
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white pointer-events-none">
          <span className="text-xs tracking-[0.3em] text-gray-300">KRAAK DE KLUIS</span>
          <span className="text-5xl font-extrabold mt-1">{label}</span>
          {subLabel && <span className="text-xs text-emerald-200 mt-2">{subLabel}</span>}
        </div>
      </div>

      {/* Slots orbiting outside */}
      {slots.map((slot, i) => {
        const angle = (i / 10) * Math.PI * 2 - Math.PI / 2
        // 54% of container = just outside the rim (since dial is ~100%).
        const radiusPct = 56
        const x = 50 + Math.cos(angle) * radiusPct
        const y = 50 + Math.sin(angle) * radiusPct
        const status = statuses[i]
        return (
          <div
            key={slot.factor}
            style={{ position: 'absolute', left: `${x}%`, top: `${y}%` }}
          >
            <SafeSlot
              factor={slot.factor}
              table={slot.table}
              displayValue={status.displayValue}
              state={
                activeFactor === slot.factor && status.state === 'gap-empty'
                  ? 'gap-active'
                  : status.state
              }
              onClick={() => onSlotClick(slot.factor)}
            />
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/safe/safe-slot.tsx components/safe/safe-dial.tsx
git commit -m "feat(safe): add SafeSlot and SafeDial components"
```

---

## Task 11: Mode and difficulty pickers

**Files:**
- Create: `components/safe/mode-picker.tsx`
- Create: `components/safe/difficulty-picker.tsx`

- [ ] **Step 1: Write `mode-picker.tsx`**

Create `components/safe/mode-picker.tsx`:

```tsx
'use client'

export type SafeMode = 'safe-run' | 'safe-endless'

type ModePickerProps = {
  value: SafeMode
  onChange: (next: SafeMode) => void
}

export function ModePicker({ value, onChange }: ModePickerProps) {
  const options: { id: SafeMode; label: string; desc: string }[] = [
    { id: 'safe-run',     label: 'Run',     desc: '10 kluizen, scorekaart' },
    { id: 'safe-endless', label: 'Endless', desc: 'Tot je een brons haalt' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((opt) => {
        const active = opt.id === value
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`p-4 rounded-xl font-bold text-left transition-all border-2 ${
              active
                ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white border-indigo-700 shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            }`}
          >
            <div className="text-lg">{opt.label}</div>
            <div className={`text-xs ${active ? 'opacity-90' : 'text-gray-500'}`}>{opt.desc}</div>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Write `difficulty-picker.tsx`**

Create `components/safe/difficulty-picker.tsx`:

```tsx
'use client'

import type { Difficulty } from '@/lib/safe/safe-logic'

type DifficultyPickerProps = {
  value: Difficulty
  onChange: (next: Difficulty) => void
}

export function DifficultyPicker({ value, onChange }: DifficultyPickerProps) {
  const options: { id: Difficulty; label: string; hint: string }[] = [
    { id: 'easy',   label: 'Makkelijk', hint: 'Begin met 2 gaten' },
    { id: 'medium', label: 'Medium',    hint: 'Begin met 4 gaten' },
    { id: 'hard',   label: 'Moeilijk',  hint: 'Begin met 6 gaten' },
  ]

  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((opt) => {
        const active = opt.id === value
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`p-3 rounded-xl font-bold text-center transition-all border-2 ${
              active
                ? 'bg-gradient-to-br from-rose-500 to-rose-700 text-white border-rose-700 shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            }`}
          >
            <div>{opt.label}</div>
            <div className={`text-[10px] ${active ? 'opacity-90' : 'text-gray-500'}`}>{opt.hint}</div>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/safe/mode-picker.tsx components/safe/difficulty-picker.tsx
git commit -m "feat(safe): add ModePicker and DifficultyPicker components"
```

---

## Task 12: `safe-reveal` interstitial component

**Files:**
- Create: `components/safe/safe-reveal.tsx`

- [ ] **Step 1: Write the component**

Create `components/safe/safe-reveal.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { AnimalBadge } from './animal-badge'
import type { AnimalTier } from '@/lib/profile-manager'

type SafeRevealProps = {
  tableIndex: number
  tier: AnimalTier
  upgraded: boolean
  onContinue: () => void
}

const TIER_LABEL: Record<AnimalTier, string> = {
  bronze: 'Brons',
  silver: 'Zilver',
  gold:   'Goud',
}

export function SafeReveal({ tableIndex, tier, upgraded, onContinue }: SafeRevealProps) {
  const [phase, setPhase] = useState<'spin' | 'flash' | 'animal'>('spin')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('flash'), 700)
    const t2 = setTimeout(() => setPhase('animal'), 1100)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
      <div className="relative flex flex-col items-center gap-6 p-8">
        {phase === 'spin' && (
          <div className="w-52 h-52 rounded-full border-8 border-yellow-300 border-dashed animate-spin bg-gray-700" />
        )}
        {phase === 'flash' && (
          <div className="w-52 h-52 rounded-full bg-yellow-200 animate-pulse shadow-[0_0_120px_60px_rgba(253,224,71,0.8)]" />
        )}
        {phase === 'animal' && (
          <div className="flex flex-col items-center gap-4 animate-slide-up">
            <AnimalBadge tableIndex={tableIndex} tier={tier} size="large" useSvg={true} />
            <div className="text-center text-white">
              <div className="text-3xl font-extrabold">
                {TIER_LABEL[tier]} dier verdiend!
              </div>
              {upgraded && (
                <div className="text-yellow-300 text-lg mt-1">✨ Opgewaardeerd!</div>
              )}
              <div className="text-sm text-gray-300 mt-2">Tafel van {tableIndex}</div>
            </div>
            <button
              onClick={onContinue}
              className="mt-4 px-8 py-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-lg shadow-lg hover:shadow-xl"
            >
              Verder
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/safe/safe-reveal.tsx
git commit -m "feat(safe): add SafeReveal interstitial"
```

---

## Task 13: `/safe` route — start screen

**Files:**
- Create: `app/safe/page.tsx`

- [ ] **Step 1: Write the start-screen version of the route**

Create `app/safe/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ModePicker, type SafeMode } from '@/components/safe/mode-picker'
import { DifficultyPicker } from '@/components/safe/difficulty-picker'
import { CollectionStrip } from '@/components/safe/collection-strip'
import type { Difficulty } from '@/lib/safe/safe-logic'
import {
  getCurrentProfile,
  initializeProfiles,
  type UserProfile,
} from '@/lib/profile-manager'

type Screen = 'start' | 'play' | 'scorecard'

export default function SafePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [screen, setScreen] = useState<Screen>('start')
  const [mode, setMode] = useState<SafeMode>('safe-run')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [selectedTables, setSelectedTables] = useState<number[]>([])

  useEffect(() => {
    initializeProfiles()
    setProfile(getCurrentProfile())
  }, [])

  const toggleTable = (t: number) => {
    setSelectedTables((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    )
  }

  const selectAll = () => setSelectedTables([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  const clearAll = () => setSelectedTables([])

  const canStart = selectedTables.length > 0

  if (screen !== 'start') {
    // Placeholder; filled in later tasks.
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight">🔐 Kraak de Kluis</h1>
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              ← Terug
            </Button>
          </Link>
        </div>

        {profile && (
          <div className="mb-6">
            <CollectionStrip animals={profile.animals} />
          </div>
        )}

        <Card className="mb-4 bg-white/10 border-white/20 text-white">
          <CardContent className="p-5 space-y-4">
            <div>
              <h2 className="text-lg font-bold mb-2">Modus</h2>
              <ModePicker value={mode} onChange={setMode} />
            </div>
            <div>
              <h2 className="text-lg font-bold mb-2">Moeilijkheid</h2>
              <DifficultyPicker value={difficulty} onChange={setDifficulty} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold">Tafels</h2>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={selectAll} className="text-white border-white/40">
                    Alles
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearAll} className="text-white border-white/40">
                    Wissen
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTable(t)}
                    className={`aspect-square rounded-xl font-bold text-xl transition-all ${
                      selectedTables.includes(t)
                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white scale-105 shadow-lg'
                        : 'bg-white/10 text-gray-200 hover:bg-white/20'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <button
          onClick={() => canStart && setScreen('play')}
          disabled={!canStart}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
            canStart
              ? 'bg-gradient-to-br from-amber-500 to-rose-600 text-white hover:shadow-xl hover:-translate-y-0.5'
              : 'bg-gray-500/40 text-gray-300 cursor-not-allowed'
          }`}
        >
          🔓 Start Kraken
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify it builds and renders**

Run: `npm run dev`

Open `http://localhost:3000/safe` in browser. Expected:
- Start screen renders with mode picker, difficulty picker, table grid, collection strip.
- "Start Kraken" button disabled when no tables selected, enabled when tables selected.
- Clicking it (in this task) does nothing (will wire up play screen next).

Stop the dev server with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add app/safe/page.tsx
git commit -m "feat(safe): add /safe route start screen"
```

---

## Task 14: `/safe` route — play screen

**Files:**
- Modify: `app/safe/page.tsx`

- [ ] **Step 1: Replace `app/safe/page.tsx` with full play-state logic**

Overwrite the file with this version (keep existing imports and start screen; add play state machine):

```tsx
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ModePicker, type SafeMode } from '@/components/safe/mode-picker'
import { DifficultyPicker } from '@/components/safe/difficulty-picker'
import { CollectionStrip } from '@/components/safe/collection-strip'
import { SafeDial, type SlotStatus } from '@/components/safe/safe-dial'
import { Numpad } from '@/components/safe/numpad'
import { SafeReveal } from '@/components/safe/safe-reveal'
import {
  buildSafe,
  gapsForSafe,
  scoreTier,
  shuffleTables,
  type Difficulty,
  type SafeSlot,
} from '@/lib/safe/safe-logic'
import { addSafeRunResult, applyAnimalAward, type SafeRunPerSafe } from '@/lib/safe/safe-progress'
import {
  getCurrentProfile,
  initializeProfiles,
  type AnimalEntry,
  type AnimalTier,
  type UserProfile,
} from '@/lib/profile-manager'

type Screen = 'start' | 'play' | 'reveal' | 'scorecard'

type SlotRuntime = {
  status: SlotStatus['state']
  display: string             // what's in the slot right now (number, partial entry, or '?')
}

type InFlightSafe = {
  table: number
  slots: SafeSlot[]
  runtime: SlotRuntime[]
  activeFactor: number | null
  input: string
  mistakes: number
}

const RUN_SAFE_COUNT = 10

export default function SafePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [screen, setScreen] = useState<Screen>('start')
  const [mode, setMode] = useState<SafeMode>('safe-run')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [selectedTables, setSelectedTables] = useState<number[]>([])

  // Run state
  const [safeIndex, setSafeIndex] = useState(1)       // 1-based
  const [deck, setDeck] = useState<number[]>([])      // shuffled table queue
  const [currentSafe, setCurrentSafe] = useState<InFlightSafe | null>(null)
  const [perSafe, setPerSafe] = useState<SafeRunPerSafe[]>([])
  const [reveal, setReveal] = useState<{ tableIndex: number; tier: AnimalTier; upgraded: boolean } | null>(null)

  useEffect(() => {
    initializeProfiles()
    setProfile(getCurrentProfile())
  }, [])

  const toggleTable = (t: number) =>
    setSelectedTables((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  const selectAll = () => setSelectedTables([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  const clearAll = () => setSelectedTables([])
  const canStart = selectedTables.length > 0

  // ------- helpers -------

  const drawTable = useCallback(
    (currentDeck: number[]): { table: number; nextDeck: number[] } => {
      const d = currentDeck.length > 0 ? currentDeck : shuffleTables(selectedTables)
      const [table, ...rest] = d
      return { table, nextDeck: rest }
    },
    [selectedTables],
  )

  const openNextSafe = useCallback(
    (nextIndex: number, d: number[]) => {
      const { table, nextDeck } = drawTable(d)
      const gapCount = gapsForSafe(difficulty, nextIndex)
      const slots = buildSafe({ table, gapCount })
      const runtime: SlotRuntime[] = slots.map((s) =>
        s.isGap
          ? { status: 'gap-empty', display: '?' }
          : { status: 'prefilled', display: String(s.answer) },
      )
      const firstGap = slots.find((s) => s.isGap)?.factor ?? null
      setCurrentSafe({
        table,
        slots,
        runtime,
        activeFactor: firstGap,
        input: '',
        mistakes: 0,
      })
      setDeck(nextDeck)
      setSafeIndex(nextIndex)
    },
    [difficulty, drawTable],
  )

  const startRun = () => {
    setPerSafe([])
    openNextSafe(1, [])
    setScreen('play')
  }

  // ------- play interactions -------

  const handleSlotClick = (factor: number) => {
    if (!currentSafe) return
    const slot = currentSafe.slots.find((s) => s.factor === factor)
    if (!slot || !slot.isGap) return
    const idx = factor - 1
    if (currentSafe.runtime[idx].status !== 'gap-empty') return
    setCurrentSafe({ ...currentSafe, activeFactor: factor, input: '' })
  }

  const updateInput = (next: string) => {
    if (!currentSafe || currentSafe.activeFactor === null) return
    setCurrentSafe({ ...currentSafe, input: next })
    // Mirror input into the active slot's display
    setCurrentSafe((prev) => {
      if (!prev || prev.activeFactor === null) return prev
      const idx = prev.activeFactor - 1
      if (prev.runtime[idx].status !== 'gap-empty') return prev
      const runtime = [...prev.runtime]
      runtime[idx] = { ...runtime[idx], display: next.length > 0 ? next : '?' }
      return { ...prev, runtime, input: next }
    })
  }

  const submitInput = () => {
    if (!currentSafe || currentSafe.activeFactor === null) return
    const factor = currentSafe.activeFactor
    const slot = currentSafe.slots[factor - 1]
    const parsed = parseInt(currentSafe.input, 10)
    if (isNaN(parsed)) return

    const runtime = [...currentSafe.runtime]
    let mistakes = currentSafe.mistakes

    if (parsed === slot.answer) {
      runtime[factor - 1] = { status: 'gap-correct', display: String(slot.answer) }
    } else {
      runtime[factor - 1] = { status: 'gap-revealed', display: String(slot.answer) }
      mistakes += 1
    }

    // Find next empty gap clockwise from current
    const nextFactor = findNextGap(runtime, factor)
    const updated: InFlightSafe = {
      ...currentSafe,
      runtime,
      mistakes,
      input: '',
      activeFactor: nextFactor,
    }
    setCurrentSafe(updated)

    // If all gaps resolved, complete the safe.
    if (nextFactor === null) {
      completeSafe(updated)
    }
  }

  const completeSafe = (safe: InFlightSafe) => {
    const gapsFilled = safe.slots.filter((s) => s.isGap).length
    const tier: AnimalTier = scoreTier(safe.mistakes)

    const entry: SafeRunPerSafe = {
      tableIndex: safe.table,
      tier,
      mistakes: safe.mistakes,
      gapsFilled,
    }

    // Compute upgrade relative to current profile state (for interstitial banner).
    const currentAnimals: AnimalEntry[] = profile?.animals ?? []
    const { upgraded } = applyAnimalAward(currentAnimals, {
      tableIndex: safe.table,
      tier,
      now: new Date().toISOString(),
    })

    setPerSafe((prev) => [...prev, entry])
    setReveal({ tableIndex: safe.table, tier, upgraded })
    setScreen('reveal')
  }

  const continueFromReveal = () => {
    setReveal(null)
    const nextIndex = safeIndex + 1
    const endlessLock = mode === 'safe-endless' && perSafe[perSafe.length - 1]?.tier === 'bronze'
    const runComplete = mode === 'safe-run' && perSafe.length >= RUN_SAFE_COUNT
    if (endlessLock || runComplete) {
      finalizeRun()
      setScreen('scorecard')
    } else {
      openNextSafe(nextIndex, deck)
      setScreen('play')
    }
  }

  const finalizeRun = () => {
    addSafeRunResult(perSafe, {
      mode,
      difficulty,
      tablesPicked: selectedTables,
    })
    setProfile(getCurrentProfile())
  }

  // ------- screens -------

  if (screen === 'start') {
    return (
      <StartScreen
        profile={profile}
        mode={mode}
        setMode={setMode}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        selectedTables={selectedTables}
        toggleTable={toggleTable}
        selectAll={selectAll}
        clearAll={clearAll}
        canStart={canStart}
        onStart={startRun}
      />
    )
  }

  if (screen === 'play' && currentSafe) {
    const gapsTotal = currentSafe.slots.filter((s) => s.isGap).length
    const gapsResolved = currentSafe.runtime.filter(
      (r) => r.status === 'gap-correct' || r.status === 'gap-revealed',
    ).length
    const statuses: SlotStatus[] = currentSafe.runtime.map((r) => ({
      state: r.status,
      displayValue: r.display,
    }))
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {profile && <CollectionStrip animals={profile.animals} compact />}

          <div className="text-center my-3 text-sm text-gray-300">
            {mode === 'safe-run' ? `Kluis ${safeIndex} / ${RUN_SAFE_COUNT}` : `Kluis ${Math.min(safeIndex, 99)}${safeIndex > 99 ? '+' : ''}`}
            {' · '}
            {gapsResolved} / {gapsTotal} opgelost · {currentSafe.mistakes} fout
          </div>

          <SafeDial
            slots={currentSafe.slots}
            statuses={statuses}
            activeFactor={currentSafe.activeFactor}
            onSlotClick={handleSlotClick}
            label={`×${currentSafe.table}`}
            subLabel={`${gapsResolved} / ${gapsTotal} ingevuld`}
          />

          <div className="mt-6">
            <Numpad
              value={currentSafe.input}
              onChange={updateInput}
              onSubmit={submitInput}
              disabled={currentSafe.activeFactor === null}
            />
          </div>
        </div>

        {screen === 'play' && reveal === null && null}
      </div>
    )
  }

  if (screen === 'reveal' && reveal) {
    return (
      <SafeReveal
        tableIndex={reveal.tableIndex}
        tier={reveal.tier}
        upgraded={reveal.upgraded}
        onContinue={continueFromReveal}
      />
    )
  }

  if (screen === 'scorecard') {
    const tiers = {
      gold: perSafe.filter((s) => s.tier === 'gold').length,
      silver: perSafe.filter((s) => s.tier === 'silver').length,
      bronze: perSafe.filter((s) => s.tier === 'bronze').length,
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-extrabold text-center mb-6">Scorekaart</h1>
          {profile && (
            <div className="mb-6">
              <CollectionStrip animals={profile.animals} />
            </div>
          )}
          <Card className="bg-white/10 border-white/20 text-white mb-6">
            <CardContent className="p-5 space-y-2">
              <div className="text-lg">Kluizen gekraakt: <span className="font-extrabold">{perSafe.length}</span></div>
              <div className="flex gap-4 text-lg">
                <span className="text-yellow-300">🥇 {tiers.gold}</span>
                <span className="text-gray-200">🥈 {tiers.silver}</span>
                <span className="text-amber-600">🥉 {tiers.bronze}</span>
              </div>
              <div className="text-sm text-gray-300">
                Totaal fout: {perSafe.reduce((a, s) => a + s.mistakes, 0)}
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setScreen('start')
                setPerSafe([])
              }}
              className="py-3 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 text-white font-bold shadow-lg"
            >
              Nog een keer
            </button>
            <Link href="/" className="block">
              <button className="w-full py-3 rounded-xl bg-white/10 border border-white/30 text-white font-bold">
                Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// ---------- helpers ----------

function findNextGap(runtime: SlotRuntime[], fromFactor: number): number | null {
  for (let i = 1; i <= 10; i++) {
    const probe = ((fromFactor - 1 + i) % 10) + 1
    if (runtime[probe - 1].status === 'gap-empty') return probe
  }
  return null
}

function StartScreen(props: {
  profile: UserProfile | null
  mode: SafeMode
  setMode: (m: SafeMode) => void
  difficulty: Difficulty
  setDifficulty: (d: Difficulty) => void
  selectedTables: number[]
  toggleTable: (t: number) => void
  selectAll: () => void
  clearAll: () => void
  canStart: boolean
  onStart: () => void
}) {
  const { profile, mode, setMode, difficulty, setDifficulty, selectedTables, toggleTable, selectAll, clearAll, canStart, onStart } = props
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight">🔐 Kraak de Kluis</h1>
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              ← Terug
            </Button>
          </Link>
        </div>

        {profile && (
          <div className="mb-6">
            <CollectionStrip animals={profile.animals} />
          </div>
        )}

        <Card className="mb-4 bg-white/10 border-white/20 text-white">
          <CardContent className="p-5 space-y-4">
            <div>
              <h2 className="text-lg font-bold mb-2">Modus</h2>
              <ModePicker value={mode} onChange={setMode} />
            </div>
            <div>
              <h2 className="text-lg font-bold mb-2">Moeilijkheid</h2>
              <DifficultyPicker value={difficulty} onChange={setDifficulty} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold">Tafels</h2>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={selectAll} className="text-white border-white/40">Alles</Button>
                  <Button size="sm" variant="outline" onClick={clearAll} className="text-white border-white/40">Wissen</Button>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTable(t)}
                    className={`aspect-square rounded-xl font-bold text-xl transition-all ${
                      selectedTables.includes(t)
                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white scale-105 shadow-lg'
                        : 'bg-white/10 text-gray-200 hover:bg-white/20'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <button
          onClick={() => canStart && onStart()}
          disabled={!canStart}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
            canStart
              ? 'bg-gradient-to-br from-amber-500 to-rose-600 text-white hover:shadow-xl hover:-translate-y-0.5'
              : 'bg-gray-500/40 text-gray-300 cursor-not-allowed'
          }`}
        >
          🔓 Start Kraken
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build & type check**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Smoke-test manually**

Run: `npm run dev`
Open `http://localhost:3000/safe`. Play through:
1. Select 2-3 tables, choose Easy, Run mode, hit Start.
2. Dial appears with 2 gaps. Click a gap → it highlights; type on keyboard → digits appear in the slot; press Enter.
3. Correct answer → slot turns green, focus jumps to next gap. Wrong answer → slot turns amber showing correct, mistake counter +1.
4. When final gap filled, reveal interstitial appears with animal badge.
5. Click Verder → next safe (now 3 gaps). Continue until safe 10 → scorecard.

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add app/safe/page.tsx
git commit -m "feat(safe): full play/reveal/scorecard state machine"
```

---

## Task 15: Endless-mode lockout wiring

**Files:**
- Modify: `app/safe/page.tsx`

The `continueFromReveal` function already checks `perSafe[perSafe.length - 1]?.tier === 'bronze'` for endless — but that array was just updated asynchronously via `setPerSafe`. We need to evaluate the endless-lock condition against the just-completed safe directly, not the state.

- [ ] **Step 1: Fix the endless-lock read**

In `app/safe/page.tsx`, find `continueFromReveal`. Replace with:

```ts
  const continueFromReveal = () => {
    const justFinishedTier = perSafe[perSafe.length - 1]?.tier
    setReveal(null)
    const endlessLock = mode === 'safe-endless' && justFinishedTier === 'bronze'
    const runComplete = mode === 'safe-run' && perSafe.length >= RUN_SAFE_COUNT
    if (endlessLock || runComplete) {
      finalizeRun()
      setScreen('scorecard')
    } else {
      openNextSafe(safeIndex + 1, deck)
      setScreen('play')
    }
  }
```

(This is equivalent to what was written, but kept for clarity after `setPerSafe` has flushed — `perSafe` state reflects the just-completed safe by the time the user clicks Verder in the interstitial.)

- [ ] **Step 2: Smoke test endless mode**

`npm run dev`, open `/safe`, select Endless + Hard difficulty + one table. Play until a safe is completed at bronze tier (3+ mistakes) — verify that the next Verder click lands on scorecard, not a new safe.

- [ ] **Step 3: Commit**

```bash
git add app/safe/page.tsx
git commit -m "fix(safe): finalize endless mode when bronze completion is reached"
```

---

## Task 16: Home page — add "Kraak de Kluis" card

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add the Kluis card**

In `app/page.tsx`, find the end of the mode selection buttons block (the three existing buttons: Quiz / Practice / Timed — ending around line 343). After the closing `</div>` of that `.space-y-2` block, add:

```tsx
        <div className="mt-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Link href="/safe">
            <button
              className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all duration-200 bg-gradient-to-br from-amber-500 via-rose-500 to-indigo-700 text-white hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">🔐</span>
                <div className="text-left">
                  <div>Kraak de Kluis</div>
                  <div className="text-xs opacity-90">Verzamel dieren door tafels te kraken</div>
                </div>
              </div>
            </button>
          </Link>
        </div>
```

The Kluis link goes to `/safe` directly (no querystring — that route has its own start screen).

- [ ] **Step 2: Smoke test**

`npm run dev`. On `/`, scroll down — new button below the three existing mode buttons. Click → lands on `/safe` start screen.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add 'Kraak de Kluis' button to home page"
```

---

## Task 17: Progress page — add Dieren Verzameling card

**Files:**
- Modify: `app/progress/page.tsx`

- [ ] **Step 1: Import and render `CollectionStrip` at the top of the progress content**

Open `app/progress/page.tsx`. Near the top where other components are imported, add:

```tsx
import { CollectionStrip } from '@/components/safe/collection-strip'
```

Find where the profile's existing stats cards start rendering (after the header). Immediately before the first existing card, add:

```tsx
        {profile && profile.animals && profile.animals.length >= 0 && (
          <Card className="mb-6 border-2 shadow-xl">
            <CardContent className="p-5">
              <CollectionStrip animals={profile.animals} />
            </CardContent>
          </Card>
        )}
```

If `Card` and `CardContent` aren't already imported in that file, they are already in use elsewhere in the progress page. If not, add:

```tsx
import { Card, CardContent } from '@/components/ui/card'
```

- [ ] **Step 2: Smoke test**

`npm run dev`. Visit `/progress`. Expected: a Dieren Verzameling card appears at the top of the dashboard with the current collection (empty initially, populated after playing a run).

- [ ] **Step 3: Commit**

```bash
git add app/progress/page.tsx
git commit -m "feat(progress): show animal collection on progress dashboard"
```

---

## Task 18: README animal attribution update

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the Acknowledgments line**

In `README.md`, find this line (currently near line 409):

```
- Graphics style inspired by [Kenney.nl](https://kenney.nl/) (CC0 assets)
```

Replace with:

```
- Animal artwork from [Kenney Animal Pack Remastered](https://kenney.nl/assets/animal-pack-remastered) by [Kenney.nl](https://kenney.nl/) (CC0)
```

- [ ] **Step 2: Add a Features entry for the new minigame**

Near the top of the Features section, add under "Game Modes":

```markdown
- **Safe Cracker Mode**: Crack combination-dial safes by filling missing answers. Build a persistent zoo — each multiplication table awards one animal, with bronze/silver/gold tiers based on accuracy. Includes Run (10 safes) and Endless sub-modes.
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document safe cracker minigame and animal attribution"
```

---

## Task 19: Final verification

**Files:** none — manual verification pass.

- [ ] **Step 1: All tests pass**

Run: `npm test -- --run`
Expected: every test passes (counts from all previous tasks).

- [ ] **Step 2: Type check and build are clean**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors, build succeeds.

- [ ] **Step 3: Manual browser smoke test — full user journey**

Run: `npm run dev`. Open browser. Execute this script:

1. Home page → click Kraak de Kluis → lands on `/safe`.
2. On `/safe`: pick Easy, Run mode, select tables 2, 5, 7. Start.
3. Crack safes 1–10, intentionally making a mix of 0-mistake, 1-2-mistake, and 3+-mistake safes. Verify:
   - Dial slots appear outside the safe correctly.
   - Clicking a gap highlights it; keyboard and on-screen numpad both work.
   - Correct answer → green lock; wrong answer → amber reveal with correct digit.
   - Mistake counter increments.
   - Reveal interstitial shows the right tier (gold / silver / bronze) and animal.
   - "Upgraded!" shows the second time you crack the same table at higher tier.
4. Scorecard shows correct tier counts. Click "Nog een keer" → back to start.
5. Run again with Endless + Hard mode + single table. Deliberately make 3+ mistakes on a safe → verify run ends immediately after the interstitial.
6. Visit `/progress`. Verify Dieren Verzameling card shows up with any earned animals.
7. Visit `/`. Check existing Quiz / Practice / Timed modes still work (regression check).

- [ ] **Step 4: Final commit if any loose ends**

If any small polish fixes came out of the manual test, commit them as a single cleanup commit:

```bash
git add -A
git commit -m "chore(safe): manual QA pass cleanup"
```

---

## Self-Review Notes

- **Spec coverage:** every requirement in `docs/superpowers/specs/2026-04-20-safe-cracker-minigame-design.md` has a task: Run + Endless modes (Tasks 13–15), difficulty ramp (Task 4), gap selection (Task 4), input mechanic with free order + auto-advance (Tasks 9, 14), tier scoring (Tasks 4, 14), collection persistence + upgrade logic (Tasks 5–6), table deck (Tasks 4, 14), `/safe` integration (Tasks 13–14, 16), progress dashboard card (Task 17), animal assets (Task 2), README update (Task 18).
- **Placeholder scan:** no TBDs, no "implement later" instructions. Every code block is complete.
- **Type consistency:** `AnimalTier`, `Difficulty`, `SafeMode`, `SafeSlot`, `SafeRunPerSafe`, `AnimalEntry`, `UserProfile` fields all used consistently across tasks. `hydrateProfile` exposed and used in `getAllProfiles`.
- **Untested branch:** `addSafeRunResult` has no direct unit test — it depends on localStorage and profile side effects. Its core logic is the pure `applyAnimalAward` (unit tested) plus straightforward mutation. Covered by Task 19 manual verification.
- **Known minor risks:**
  - Kenney `Vector/` layout unknown — Task 2 Step 4 is adaptive and assumes inspection. If SVGs are arranged differently, the step's copy paths may need adjustment (noted in-step).
  - `next/image` with unoptimized SVG may need `next.config.ts` adjustment if Next refuses to serve them. If the build fails at Task 13, add `images: { unoptimized: true }` or use the PNG for the reveal.
