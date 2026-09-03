export type Difficulty = 'easy' | 'medium' | 'hard'
export type AnimalTier = 'bronze' | 'silver' | 'gold' | 'platinum'

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

/**
 * Seconds allowed to crack a safe in Eindeloos mode. Drops every 5 safes.
 * First five steps drop 15 s (90 → 75 → 60 → 45 → 30); after that each
 * step drops 5 s (30 → 25 → 20 → 15 → 10). Floored at 10 s so extreme
 * runs stay theoretically playable. Safe index is 1-based.
 */
export function endlessSafeTimer(safeIndex: number): number {
  const step = Math.floor((safeIndex - 1) / 5)
  if (step <= 4) return 90 - step * 15
  const smallStep = step - 4
  return Math.max(10, 30 - smallStep * 5)
}

export type BuildSafeArgs = {
  table: number
  gapCount: number
  rng?: () => number
}

const ALL_FACTORS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

/**
 * Build a safe's 10 slots for a given table. Gaps are drawn uniformly at
 * random. The returned array is in wheel-position order (index 0 = top of
 * dial, going clockwise) and the factor at each position is shuffled, so
 * consecutive runs won't show the same sequential 1,2,3,...,10 layout.
 */
export function buildSafe({ table, gapCount, rng = Math.random }: BuildSafeArgs): SafeSlot[] {
  const gaps = pickN(ALL_FACTORS, gapCount, rng)
  const gapSet = new Set(gaps)
  const wheelOrder = pickN(ALL_FACTORS, ALL_FACTORS.length, rng)

  return wheelOrder.map((factor) => ({
    factor,
    table,
    answer: factor * table,
    isGap: gapSet.has(factor),
  }))
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
