import type { AnimalEntry, AnimalTier, EarnedAchievement, SafeRunResult, UserProfile } from '@/lib/profile-manager'
import { getCurrentProfile, updateProfile } from '@/lib/profile-manager'
import {
  type AchievementId,
  alreadyEarnedForCycle,
  evaluateAchievements,
} from '@/lib/safe/achievements'

export const TIER_RANK: Record<AnimalTier, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
}

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

export type SafeRunPerSafe = {
  tableIndex: number
  tier: AnimalTier
  mistakes: number
  gapsFilled: number
  durationMs?: number
  mode?: 'safe-run' | 'safe-endless'
  difficulty?: 'easy' | 'medium' | 'hard'
}

/**
 * Persist a single cracked safe immediately: upgrade the animal entry if applicable,
 * update per-table stats and running totals, evaluate any newly earned achievements.
 * Called after every safe so the collection strip reflects progress in real time.
 */
export function awardAnimalForSafe(
  safe: SafeRunPerSafe,
): { upgraded: boolean; newAchievements: AchievementId[] } {
  const profile = getCurrentProfile()
  if (!profile) return { upgraded: false, newAchievements: [] }

  const now = new Date().toISOString()
  const { animals, upgraded } = applyAnimalAward(profile.animals, {
    tableIndex: safe.tableIndex,
    tier: safe.tier,
    now,
  })

  const tableStats: UserProfile['tableStats'] = { ...profile.tableStats }
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

  const alreadyEarned = alreadyEarnedForCycle(profile.achievements, profile.collectionCycle)
  const newlyEarned = evaluateAchievements({
    animals,
    alreadyEarned,
    collectionCycle: profile.collectionCycle,
    lastSafe: safe.mode
      ? { ...safe, mode: safe.mode, difficulty: safe.difficulty }
      : undefined,
    currentStreak: profile.currentStreak,
  })
  const achievements: EarnedAchievement[] = [
    ...profile.achievements,
    ...newlyEarned.map((id) => ({ id, earnedAt: now, cycle: profile.collectionCycle })),
  ]

  updateProfile(profile.id, {
    animals,
    tableStats,
    totalQuestions: profile.totalQuestions + safe.gapsFilled,
    totalCorrect: profile.totalCorrect + (safe.gapsFilled - safe.mistakes),
    achievements,
  })

  return { upgraded, newAchievements: newlyEarned }
}

/**
 * Resets the animal collection so the user can go for Alle Goud again in a
 * new cycle. Does NOT wipe earned achievements; bumps collectionCycle so the
 * cycle-gated achievements (all-bronze / all-silver / all-gold) become
 * re-earnable.
 */
export function resetAnimalCollection(): void {
  const profile = getCurrentProfile()
  if (!profile) return
  updateProfile(profile.id, {
    animals: [],
    collectionCycle: profile.collectionCycle + 1,
  })
}

/** Remove a single animal so the user can re-earn its tier from scratch. */
export function resetAnimalForTable(tableIndex: number): void {
  const profile = getCurrentProfile()
  if (!profile) return
  updateProfile(profile.id, {
    animals: profile.animals.filter((a) => a.tableIndex !== tableIndex),
  })
}

/**
 * Persist the end-of-run summary: append a SafeRunResult, bump totalQuizzes,
 * update the daily streak. Per-safe animal/stats updates happen in
 * awardAnimalForSafe during play, not here.
 */
export function addSafeRunResult(
  perSafe: SafeRunPerSafe[],
  meta: {
    mode: 'safe-run' | 'safe-endless'
    difficulty: 'easy' | 'medium' | 'hard'
    tablesPicked: number[]
  },
): { newAchievements: AchievementId[] } {
  const profile = getCurrentProfile()
  if (!profile) return { newAchievements: [] }

  const now = new Date().toISOString()

  const tiersEarned = {
    gold: perSafe.filter((s) => s.tier === 'gold').length,
    silver: perSafe.filter((s) => s.tier === 'silver').length,
    bronze: perSafe.filter((s) => s.tier === 'bronze').length,
  }
  const totalMistakes = perSafe.reduce((acc, s) => acc + s.mistakes, 0)

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

  const today = now.split('T')[0]
  const lastPractice = profile.lastPracticeDate.split('T')[0]
  const newStreak =
    lastPractice === today
      ? profile.currentStreak
      : profile.currentStreak + 1

  const alreadyEarned = alreadyEarnedForCycle(profile.achievements, profile.collectionCycle)
  const newlyEarned = evaluateAchievements({
    animals: profile.animals,
    alreadyEarned,
    collectionCycle: profile.collectionCycle,
    lastRun: runResult,
    currentStreak: newStreak,
  })
  const achievements: EarnedAchievement[] = [
    ...profile.achievements,
    ...newlyEarned.map((id) => ({ id, earnedAt: now, cycle: profile.collectionCycle })),
  ]

  updateProfile(profile.id, {
    recentSafeResults,
    totalQuizzes: profile.totalQuizzes + 1,
    currentStreak: newStreak,
    lastPracticeDate: now,
    achievements,
  })

  return { newAchievements: newlyEarned }
}
