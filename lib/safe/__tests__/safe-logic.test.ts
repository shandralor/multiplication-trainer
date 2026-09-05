import { describe, it, expect } from 'vitest'
import {
  gapsForSafe,
  scoreTier,
  buildSafe,
  shuffleTables,
  endlessSafeTimer,
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

  it('gap factors are drawn without duplicates from 1..10', () => {
    const slots = buildSafe({ table: 7, gapCount: 6, rng: mulberry32(4) })
    const gapFactors = slots.filter((s) => s.isGap).map((s) => s.factor)
    expect(new Set(gapFactors).size).toBe(gapFactors.length)
    for (const f of gapFactors) {
      expect(f).toBeGreaterThanOrEqual(1)
      expect(f).toBeLessThanOrEqual(10)
    }
  })

  it('gap placement varies across seeds (not always the same set)', () => {
    const a = buildSafe({ table: 4, gapCount: 5, rng: mulberry32(11) })
      .filter((s) => s.isGap).map((s) => s.factor).sort((x, y) => x - y)
    const b = buildSafe({ table: 4, gapCount: 5, rng: mulberry32(12) })
      .filter((s) => s.isGap).map((s) => s.factor).sort((x, y) => x - y)
    expect(a).not.toEqual(b)
  })

  it('all-gap safe (gapCount=10) marks every slot as gap', () => {
    const slots = buildSafe({ table: 9, gapCount: 10, rng: mulberry32(6) })
    expect(slots.every((s) => s.isGap)).toBe(true)
  })
})

describe('endlessSafeTimer', () => {
  it('starts at 90s for safes 1-5', () => {
    expect(endlessSafeTimer(1)).toBe(90)
    expect(endlessSafeTimer(5)).toBe(90)
  })
  it('drops 15s per tier until safe 21', () => {
    expect(endlessSafeTimer(6)).toBe(75)
    expect(endlessSafeTimer(11)).toBe(60)
    expect(endlessSafeTimer(16)).toBe(45)
    expect(endlessSafeTimer(21)).toBe(30)
  })
  it('after safe 21, drops 5s per tier', () => {
    expect(endlessSafeTimer(26)).toBe(25)
    expect(endlessSafeTimer(31)).toBe(20)
    expect(endlessSafeTimer(36)).toBe(15)
    expect(endlessSafeTimer(41)).toBe(10)
  })
  it('floors at 10s', () => {
    expect(endlessSafeTimer(46)).toBe(10)
    expect(endlessSafeTimer(100)).toBe(10)
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

describe('buildSafe — operation', () => {
  it('poses multiplication by default, unchanged from before', () => {
    const slots = buildSafe({ table: 3, gapCount: 2 })
    for (const slot of slots) {
      expect(slot.answer).toBe(slot.factor * 3)
      expect(slot.label).toBe(`${slot.factor}\u00d73`)
    }
  })

  it('poses division when asked, as the same fact read backwards', () => {
    const slots = buildSafe({ table: 3, gapCount: 2, operation: 'divide' })
    for (const slot of slots) {
      // 21 ÷ 3 = 7 — the answer is the factor, not the product.
      expect(slot.answer).toBe(slot.factor)
      expect(slot.label).toBe(`${slot.factor * 3}\u00f73`)
    }
  })

  it('keeps the same gap count and wheel size either way', () => {
    for (const operation of ['multiply', 'divide'] as const) {
      const slots = buildSafe({ table: 7, gapCount: 4, operation })
      expect(slots).toHaveLength(10)
      expect(slots.filter((s) => s.isGap)).toHaveLength(4)
      expect(new Set(slots.map((s) => s.factor)).size).toBe(10)
    }
  })
})
