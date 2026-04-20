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
