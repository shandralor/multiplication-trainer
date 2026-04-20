import { describe, it, expect } from 'vitest'
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
