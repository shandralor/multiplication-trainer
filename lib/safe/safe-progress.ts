import type { AnimalEntry, AnimalTier, SafeRunResult, UserProfile } from '@/lib/profile-manager'
import { getCurrentProfile, updateProfile } from '@/lib/profile-manager'

const TIER_RANK: Record<AnimalTier, number> = { bronze: 1, silver: 2, gold: 3 }

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
}

/**
 * Persist the outcome of a completed safe run to the current profile:
 * - Updates each cracked safe's animal entry (upgrading tier where applicable).
 * - Appends a SafeRunResult to recentSafeResults (cap 20).
 * - Updates totals, streak, and tableStats.
 */
export function addSafeRunResult(
  perSafe: SafeRunPerSafe[],
  meta: {
    mode: 'safe-run' | 'safe-endless'
    difficulty: 'easy' | 'medium' | 'hard'
    tablesPicked: number[]
  },
): { upgradedAnimals: number[] } {
  const profile = getCurrentProfile()
  if (!profile) return { upgradedAnimals: [] }

  const now = new Date().toISOString()
  let animals = profile.animals
  const upgradedAnimals: number[] = []

  for (const safe of perSafe) {
    const { animals: next, upgraded } = applyAnimalAward(animals, {
      tableIndex: safe.tableIndex,
      tier: safe.tier,
      now,
    })
    animals = next
    if (upgraded) upgradedAnimals.push(safe.tableIndex)
  }

  const tiersEarned = {
    gold: perSafe.filter((s) => s.tier === 'gold').length,
    silver: perSafe.filter((s) => s.tier === 'silver').length,
    bronze: perSafe.filter((s) => s.tier === 'bronze').length,
  }
  const totalMistakes = perSafe.reduce((acc, s) => acc + s.mistakes, 0)
  const totalGaps = perSafe.reduce((acc, s) => acc + s.gapsFilled, 0)
  const totalCorrect = totalGaps - totalMistakes

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

  // Streak: bump like addQuizResult does — one "practice session" per day max.
  const today = now.split('T')[0]
  const lastPractice = profile.lastPracticeDate.split('T')[0]
  const newStreak =
    lastPractice === today
      ? profile.currentStreak
      : profile.currentStreak + 1

  // Table stats — treat each gap as a multiply attempt on the cracked table.
  const tableStats: UserProfile['tableStats'] = { ...profile.tableStats }
  for (const safe of perSafe) {
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
  }

  updateProfile(profile.id, {
    animals,
    recentSafeResults,
    totalQuizzes: profile.totalQuizzes + 1,
    totalQuestions: profile.totalQuestions + totalGaps,
    totalCorrect: profile.totalCorrect + totalCorrect,
    currentStreak: newStreak,
    lastPracticeDate: now,
    tableStats,
  })

  return { upgradedAnimals }
}
