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
})
