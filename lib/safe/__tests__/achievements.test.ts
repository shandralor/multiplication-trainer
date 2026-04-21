import { describe, it, expect } from 'vitest'
import { evaluateAchievements, alreadyEarnedForCycle } from '@/lib/safe/achievements'
import type { AnimalEntry, EarnedAchievement } from '@/lib/profile-manager'

const animal = (tableIndex: number, tier: 'bronze' | 'silver' | 'gold' | 'platinum'): AnimalEntry => ({
  tableIndex,
  tier,
  firstEarnedAt: '2026-01-01',
  lastUpgradedAt: '2026-01-01',
})

const all10 = (tier: 'bronze' | 'silver' | 'gold'): AnimalEntry[] =>
  Array.from({ length: 10 }, (_, i) => animal(i + 1, tier))

describe('evaluateAchievements', () => {
  it('awards first-safe when one animal exists', () => {
    const out = evaluateAchievements({
      animals: [animal(3, 'bronze')],
      alreadyEarned: new Set(),
      collectionCycle: 1,
    })
    expect(out).toContain('first-safe')
  })

  it('does not re-award already-earned ones', () => {
    const out = evaluateAchievements({
      animals: [animal(3, 'bronze')],
      alreadyEarned: new Set(['first-safe']),
      collectionCycle: 1,
    })
    expect(out).not.toContain('first-safe')
  })

  it('awards perfect-safe on zero-mistake lastSafe', () => {
    const out = evaluateAchievements({
      animals: [],
      alreadyEarned: new Set(),
      collectionCycle: 1,
      lastSafe: { tableIndex: 7, tier: 'gold', mistakes: 0, gapsFilled: 4, mode: 'safe-run' },
    })
    expect(out).toContain('perfect-safe')
  })

  it('awards fast-safe only in endless mode with <= 20s and 0 mistakes', () => {
    const fast = evaluateAchievements({
      animals: [],
      alreadyEarned: new Set(),
      collectionCycle: 1,
      lastSafe: { tableIndex: 7, tier: 'gold', mistakes: 0, gapsFilled: 4, mode: 'safe-endless', durationMs: 15_000 },
    })
    expect(fast).toContain('fast-safe')

    const slow = evaluateAchievements({
      animals: [],
      alreadyEarned: new Set(),
      collectionCycle: 1,
      lastSafe: { tableIndex: 7, tier: 'gold', mistakes: 0, gapsFilled: 4, mode: 'safe-endless', durationMs: 25_000 },
    })
    expect(slow).not.toContain('fast-safe')

    const runMode = evaluateAchievements({
      animals: [],
      alreadyEarned: new Set(),
      collectionCycle: 1,
      lastSafe: { tableIndex: 7, tier: 'gold', mistakes: 0, gapsFilled: 4, mode: 'safe-run', durationMs: 10_000 },
    })
    expect(runMode).not.toContain('fast-safe')
  })

  it('awards all-bronze when 10 animals exist', () => {
    const out = evaluateAchievements({
      animals: all10('bronze'),
      alreadyEarned: new Set(),
      collectionCycle: 1,
    })
    expect(out).toContain('all-bronze')
    expect(out).not.toContain('all-silver')
    expect(out).not.toContain('all-gold')
  })

  it('awards all-gold only when every animal is gold', () => {
    const outGold = evaluateAchievements({
      animals: all10('gold'),
      alreadyEarned: new Set(),
      collectionCycle: 1,
    })
    expect(outGold).toContain('all-gold')
    expect(outGold).toContain('all-silver')
    expect(outGold).toContain('all-bronze')

    const mixed = [...all10('gold').slice(0, 9), animal(10, 'silver')]
    const outMixed = evaluateAchievements({
      animals: mixed,
      alreadyEarned: new Set(),
      collectionCycle: 1,
    })
    expect(outMixed).toContain('all-silver')
    expect(outMixed).not.toContain('all-gold')
  })

  it('awards perfect-ronde on zero-mistake safe-run lastRun', () => {
    const out = evaluateAchievements({
      animals: [],
      alreadyEarned: new Set(),
      collectionCycle: 1,
      lastRun: {
        id: 'x', mode: 'safe-run', difficulty: 'medium', tablesPicked: [1, 2, 3],
        safesCracked: 3, tiersEarned: { gold: 3, silver: 0, bronze: 0 },
        totalMistakes: 0, date: '2026-04-20',
      },
    })
    expect(out).toContain('perfect-ronde')
  })

  it('awards endless tiers based on safes cracked', () => {
    const out10 = evaluateAchievements({
      animals: [],
      alreadyEarned: new Set(),
      collectionCycle: 1,
      lastRun: {
        id: 'x', mode: 'safe-endless', difficulty: 'medium', tablesPicked: [1],
        safesCracked: 12, tiersEarned: { gold: 8, silver: 3, bronze: 1 },
        totalMistakes: 5, date: '2026-04-20',
      },
    })
    expect(out10).toContain('endless-10')
    expect(out10).not.toContain('endless-20')

    const out20 = evaluateAchievements({
      animals: [],
      alreadyEarned: new Set(),
      collectionCycle: 1,
      lastRun: {
        id: 'x', mode: 'safe-endless', difficulty: 'medium', tablesPicked: [1],
        safesCracked: 22, tiersEarned: { gold: 10, silver: 7, bronze: 5 },
        totalMistakes: 12, date: '2026-04-20',
      },
    })
    expect(out20).toContain('endless-10')
    expect(out20).toContain('endless-20')
  })

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
})

describe('alreadyEarnedForCycle', () => {
  const mk = (id: string, cycle: number): EarnedAchievement => ({
    id, earnedAt: 'iso', cycle,
  })

  it('cycle-gated achievements gate by current cycle', () => {
    const earned = [mk('all-gold', 1), mk('first-safe', 1)]
    const s1 = alreadyEarnedForCycle(earned, 1)
    expect(s1.has('all-gold')).toBe(true)
    expect(s1.has('first-safe')).toBe(true)

    const s2 = alreadyEarnedForCycle(earned, 2)
    expect(s2.has('all-gold')).toBe(false)     // re-earnable in new cycle
    expect(s2.has('first-safe')).toBe(true)    // lifetime-once
  })

  it('cycle-gates all-platinum', () => {
    const earned = [mk('all-platinum', 1)]
    expect(alreadyEarnedForCycle(earned, 1).has('all-platinum')).toBe(true)
    expect(alreadyEarnedForCycle(earned, 2).has('all-platinum')).toBe(false)
  })
})
