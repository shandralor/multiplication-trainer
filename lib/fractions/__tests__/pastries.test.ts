import { describe, expect, it } from 'vitest'
import {
  PASTRIES,
  getPastry,
  nextPastryForRung,
  pastriesForRung,
  pastryTier,
  type PastryEntry,
} from '../pastries'

function owned(indexes: number[]): PastryEntry[] {
  return indexes.map((pastryIndex) => ({
    pastryIndex,
    tier: 'bronze' as const,
    firstEarnedAt: '2026-09-01T10:00:00.000Z',
    lastUpgradedAt: '2026-09-01T10:00:00.000Z',
  }))
}

describe('the bakkerij', () => {
  it('holds ten gebakjes with unique indexes and slugs', () => {
    expect(PASTRIES).toHaveLength(10)
    expect(new Set(PASTRIES.map((p) => p.index)).size).toBe(10)
    expect(new Set(PASTRIES.map((p) => p.slug)).size).toBe(10)
  })

  it('spreads them across all four rungs', () => {
    for (const rung of [1, 2, 3, 4] as const) {
      expect(pastriesForRung(rung).length).toBeGreaterThan(0)
    }
  })

  it('throws on an unknown index', () => {
    expect(() => getPastry(99)).toThrow(/Geen gebakje/)
  })
})

describe('awarding', () => {
  it('gives the first unowned gebakje of the rung', () => {
    expect(nextPastryForRung(1, [])?.slug).toBe('koekje')
    expect(nextPastryForRung(1, owned([1]))?.slug).toBe('cupcake')
  })

  it('returns null once the rung set is complete', () => {
    const all = pastriesForRung(1).map((p) => p.index)
    expect(nextPastryForRung(1, owned(all))).toBeNull()
  })

  it('ignores gebakjes owned from other rungs', () => {
    expect(nextPastryForRung(2, owned([1, 2, 3]))?.slug).toBe('taart')
  })
})

describe('pastryTier', () => {
  it('needs a clean round for platina', () => {
    expect(pastryTier(0)).toBe('platinum')
    expect(pastryTier(1)).toBe('gold')
    expect(pastryTier(3)).toBe('silver')
    expect(pastryTier(4)).toBe('bronze')
  })
})
