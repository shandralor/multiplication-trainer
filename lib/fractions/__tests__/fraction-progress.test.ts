import { describe, expect, it } from 'vitest'
import { applyRound, itemsRemaining } from '../fraction-progress'
import { emptyFractionProgress, type FractionProgress, type Rung } from '../types'
import { rungDef } from '../ladder'
import { pastriesForRung } from '../pastries'
import { hydrateProfile, type UserProfile } from '@/lib/profile-manager'

const NOW = () => '2026-09-03T08:00:00.000Z'

function profile(overrides: Partial<UserProfile> = {}): UserProfile {
  return hydrateProfile({ id: 'p1', name: 'Tom', ...overrides })
}

function progressWith(rung: Rung, correct: number): FractionProgress {
  const p = emptyFractionProgress()
  p[rung] = { correct, attempts: correct, bestStreak: correct }
  return p
}

describe('applyRound — progress', () => {
  it('adds the round onto the rung it was played on', () => {
    const { updates } = applyRound(profile(), {
      rung: 1,
      correct: 10,
      total: 12,
      bestStreak: 6,
      now: NOW,
    })
    expect(updates.fractionProgress?.[1]).toMatchObject({
      correct: 10,
      attempts: 12,
      bestStreak: 6,
    })
    // Other rungs are untouched.
    expect(updates.fractionProgress?.[2].correct).toBe(0)
  })

  it('keeps the best streak rather than the latest one', () => {
    const p = profile({ fractionProgress: progressWith(1, 4) })
    p.fractionProgress[1].bestStreak = 9
    const { updates } = applyRound(p, {
      rung: 1,
      correct: 3,
      total: 5,
      bestStreak: 2,
      now: NOW,
    })
    expect(updates.fractionProgress?.[1].bestStreak).toBe(9)
  })

  it('stamps completedAt the first time the rung is finished', () => {
    const need = rungDef(1).itemsToComplete
    const { updates, outcome } = applyRound(profile(), {
      rung: 1,
      correct: need,
      total: need,
      bestStreak: need,
      now: NOW,
    })
    expect(outcome.rungCompleted).toBe(true)
    expect(updates.fractionProgress?.[1].completedAt).toBe(NOW())
  })

  it('does not restamp completedAt on a later round', () => {
    const need = rungDef(1).itemsToComplete
    const p = profile({ fractionProgress: progressWith(1, need) })
    p.fractionProgress[1].completedAt = '2026-01-01T00:00:00.000Z'
    const { updates, outcome } = applyRound(p, {
      rung: 1,
      correct: 12,
      total: 12,
      bestStreak: 12,
      now: NOW,
    })
    expect(outcome.rungCompleted).toBe(false)
    expect(updates.fractionProgress?.[1].completedAt).toBe('2026-01-01T00:00:00.000Z')
  })

  it('reports the unlock only on the round that earns it', () => {
    const need = rungDef(2).itemsToComplete
    const first = applyRound(profile(), {
      rung: 2,
      correct: need,
      total: need,
      bestStreak: need,
      now: NOW,
    })
    expect(first.outcome.unlockedNextRung).toBe(true)

    const already = applyRound(profile({ fractionProgress: progressWith(2, need) }), {
      rung: 2,
      correct: 12,
      total: 12,
      bestStreak: 12,
      now: NOW,
    })
    expect(already.outcome.unlockedNextRung).toBe(false)
  })

  it('never claims an unlock on the last rung', () => {
    const need = rungDef(4).itemsToComplete
    const { outcome } = applyRound(profile(), {
      rung: 4,
      correct: need,
      total: need,
      bestStreak: need,
      now: NOW,
    })
    expect(outcome.rungCompleted).toBe(true)
    expect(outcome.unlockedNextRung).toBe(false)
  })
})

describe('applyRound — de bakkerij', () => {
  it('awards the first gebakje of the rung on a first round', () => {
    const { updates, outcome } = applyRound(profile(), {
      rung: 1,
      correct: 12,
      total: 12,
      bestStreak: 12,
      now: NOW,
    })
    expect(outcome.pastry?.slug).toBe('koekje')
    expect(outcome.tier).toBe('platinum')
    expect(updates.pastries).toHaveLength(1)
  })

  it('gives a lower tier when the round had mistakes', () => {
    const { outcome } = applyRound(profile(), {
      rung: 1,
      correct: 9,
      total: 12,
      bestStreak: 5,
      now: NOW,
    })
    expect(outcome.tier).toBe('silver')
  })

  it('works through the rung set one gebakje at a time', () => {
    let p = profile()
    const slugs: string[] = []
    for (let i = 0; i < pastriesForRung(1).length; i++) {
      const { updates, outcome } = applyRound(p, {
        rung: 1,
        correct: 12,
        total: 12,
        bestStreak: 12,
        now: NOW,
      })
      slugs.push(outcome.pastry!.slug)
      p = { ...p, ...updates } as UserProfile
    }
    expect(slugs).toEqual(pastriesForRung(1).map((x) => x.slug))
  })

  it('upgrades the weakest gebakje once the rung set is full', () => {
    let p = profile()
    // Fill rung 1 with bronze rounds (many mistakes).
    for (let i = 0; i < pastriesForRung(1).length; i++) {
      const { updates } = applyRound(p, {
        rung: 1,
        correct: 4,
        total: 12,
        bestStreak: 2,
        now: NOW,
      })
      p = { ...p, ...updates } as UserProfile
    }
    expect(p.pastries.every((entry) => entry.tier === 'bronze')).toBe(true)

    const { updates, outcome } = applyRound(p, {
      rung: 1,
      correct: 12,
      total: 12,
      bestStreak: 12,
      now: NOW,
    })
    expect(outcome.upgraded).toBe(true)
    expect(outcome.tier).toBe('platinum')
    expect(updates.pastries?.filter((e) => e.tier === 'platinum')).toHaveLength(1)
    // No new gebakje was invented.
    expect(updates.pastries).toHaveLength(p.pastries.length)
  })

  it('does not downgrade an existing gebakje on a worse round', () => {
    let p = profile()
    for (let i = 0; i < pastriesForRung(1).length; i++) {
      const { updates } = applyRound(p, {
        rung: 1,
        correct: 12,
        total: 12,
        bestStreak: 12,
        now: NOW,
      })
      p = { ...p, ...updates } as UserProfile
    }
    const { updates, outcome } = applyRound(p, {
      rung: 1,
      correct: 2,
      total: 12,
      bestStreak: 1,
      now: NOW,
    })
    expect(outcome.upgraded).toBe(false)
    expect(outcome.pastry).toBeNull()
    expect(updates.pastries?.every((e) => e.tier === 'platinum')).toBe(true)
  })

  it('only ever touches gebakjes belonging to the rung just played', () => {
    let p = profile()
    // Complete rung 1's set at bronze.
    for (let i = 0; i < pastriesForRung(1).length; i++) {
      const { updates } = applyRound(p, {
        rung: 1, correct: 4, total: 12, bestStreak: 2, now: NOW,
      })
      p = { ...p, ...updates } as UserProfile
    }
    // A perfect rung 2 round must award a rung 2 gebakje, not upgrade rung 1.
    const { outcome } = applyRound(p, {
      rung: 2, correct: 12, total: 12, bestStreak: 12, now: NOW,
    })
    expect(outcome.pastry?.rung).toBe(2)
    expect(outcome.upgraded).toBe(false)
  })
})

describe('round history', () => {
  it('records the round and caps the history at 20', () => {
    const many = Array.from({ length: 25 }, (_, i) => ({
      id: `old-${i}`,
      rung: 1 as Rung,
      score: 1,
      total: 12,
      mistakes: 11,
      date: '2026-01-01T00:00:00.000Z',
    }))
    const { updates } = applyRound(profile({ recentFractionResults: many }), {
      rung: 1, correct: 12, total: 12, bestStreak: 12, now: NOW,
    })
    expect(updates.recentFractionResults).toHaveLength(20)
    expect(updates.recentFractionResults?.[0].date).toBe(NOW())
  })
})

describe('itemsRemaining', () => {
  it('counts down to zero and stops there', () => {
    const need = rungDef(3).itemsToComplete
    expect(itemsRemaining(3, emptyFractionProgress())).toBe(need)
    expect(itemsRemaining(3, progressWith(3, need - 2))).toBe(2)
    expect(itemsRemaining(3, progressWith(3, need + 5))).toBe(0)
  })
})

describe('profile hydration', () => {
  it('backfills breuken fields on a profile saved before they existed', () => {
    const old = hydrateProfile({ id: 'old', name: 'Oud' })
    expect(old.fractionProgress[4]).toEqual({ correct: 0, attempts: 0, bestStreak: 0 })
    expect(old.pastries).toEqual([])
    expect(old.settings.unlockAllRungs).toBe(false)
  })

  it('fills in rungs missing from a partially stored progress object', () => {
    const partial = hydrateProfile({
      id: 'p',
      name: 'P',
      // A profile written when the ladder only had two rungs.
      fractionProgress: {
        1: { correct: 12, attempts: 12, bestStreak: 12 },
        2: { correct: 3, attempts: 5, bestStreak: 2 },
      } as FractionProgress,
    })
    expect(partial.fractionProgress[1].correct).toBe(12)
    expect(partial.fractionProgress[3]).toEqual({ correct: 0, attempts: 0, bestStreak: 0 })
    expect(partial.fractionProgress[4]).toEqual({ correct: 0, attempts: 0, bestStreak: 0 })
  })
})
