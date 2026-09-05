import { describe, expect, it } from 'vitest'
import {
  RUNGS,
  completedRungCount,
  isRungComplete,
  isRungUnlocked,
  nextRung,
  rungBySlug,
  rungDef,
} from '../ladder'
import { emptyFractionProgress, type FractionProgress, type Rung } from '../types'

function progressWith(done: Rung[]): FractionProgress {
  const p = emptyFractionProgress()
  for (const rung of done) {
    p[rung] = { correct: rungDef(rung).itemsToComplete, attempts: 14, bestStreak: 9 }
  }
  return p
}

describe('rung definitions', () => {
  it('has four rungs in teaching order', () => {
    expect(RUNGS.map((r) => r.rung)).toEqual([1, 2, 3, 4])
  })

  it('looks a rung up by slug', () => {
    expect(rungBySlug('vergelijken')?.rung).toBe(3)
    expect(rungBySlug('onzin')).toBeUndefined()
  })

  it('throws on an unknown rung number', () => {
    expect(() => rungDef(9 as Rung)).toThrow(/Onbekend level/)
  })
})

describe('completion', () => {
  it('needs the full item count', () => {
    const p = emptyFractionProgress()
    p[1] = { correct: 11, attempts: 11, bestStreak: 11 }
    expect(isRungComplete(1, p)).toBe(false)
    p[1] = { correct: 12, attempts: 12, bestStreak: 12 }
    expect(isRungComplete(1, p)).toBe(true)
  })

  it('counts completed rungs for the home chip', () => {
    expect(completedRungCount(emptyFractionProgress())).toBe(0)
    expect(completedRungCount(progressWith([1, 2]))).toBe(2)
  })
})

describe('unlocking', () => {
  it('always leaves rung 1 open', () => {
    expect(isRungUnlocked(1, emptyFractionProgress())).toBe(true)
  })

  it('keeps later rungs shut until the one below is done', () => {
    const fresh = emptyFractionProgress()
    expect(isRungUnlocked(2, fresh)).toBe(false)
    expect(isRungUnlocked(3, fresh)).toBe(false)
    expect(isRungUnlocked(4, fresh)).toBe(false)
  })

  it('opens the next rung when its predecessor completes', () => {
    const p = progressWith([1])
    expect(isRungUnlocked(2, p)).toBe(true)
    expect(isRungUnlocked(3, p)).toBe(false)
  })

  it('opens everything when the override is on', () => {
    const fresh = emptyFractionProgress()
    for (const def of RUNGS) {
      expect(isRungUnlocked(def.rung, fresh, { unlockAll: true })).toBe(true)
    }
  })

  it('the override does not mark anything as completed', () => {
    const fresh = emptyFractionProgress()
    expect(isRungUnlocked(4, fresh, { unlockAll: true })).toBe(true)
    expect(isRungComplete(4, fresh)).toBe(false)
    expect(completedRungCount(fresh)).toBe(0)
  })
})

describe('nextRung', () => {
  it('points at rung 1 on a fresh profile', () => {
    expect(nextRung(emptyFractionProgress())).toBe(1)
  })

  it('points at the first unlocked-but-unfinished rung', () => {
    expect(nextRung(progressWith([1]))).toBe(2)
    expect(nextRung(progressWith([1, 2]))).toBe(3)
  })

  it('stays on the last rung once everything is done', () => {
    expect(nextRung(progressWith([1, 2, 3, 4]))).toBe(4)
  })

  it('with the override on, still points at the lowest unfinished rung', () => {
    // The override opens doors; it does not skip a kid ahead.
    expect(nextRung(emptyFractionProgress(), { unlockAll: true })).toBe(1)
  })
})
