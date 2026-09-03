import {
  getCurrentProfile,
  updateProfile,
  type FractionRoundResult,
  type ProfileSettings,
  type UserProfile,
} from '@/lib/profile-manager'
import { TIER_RANK } from '@/lib/safe/safe-progress'
import {
  getPastry,
  nextPastryForRung,
  pastryTier,
  type Pastry,
  type PastryEntry,
} from './pastries'
import { isRungComplete, rungDef } from './ladder'
import type { FractionProgress, Rung } from './types'

export type RoundOutcome = {
  /** The gebakje this round earned, or null when the rung set is full. */
  pastry: Pastry | null
  tier: PastryEntry['tier'] | null
  /** True when an already-owned gebakje moved up a tier. */
  upgraded: boolean
  /** True when this round pushed the rung over the finish line. */
  rungCompleted: boolean
  /** True when the rung it unlocks was still shut before this round. */
  unlockedNextRung: boolean
}

export type CompleteRoundArgs = {
  rung: Rung
  correct: number
  total: number
  /** Longest run of correct answers in this round. */
  bestStreak: number
  now?: () => string
}

/**
 * Apply a finished round to the current profile. Pure bookkeeping lives
 * in `applyRound` below so it can be tested without localStorage.
 */
export function completeRound(args: CompleteRoundArgs): RoundOutcome | null {
  const profile = getCurrentProfile()
  if (!profile) return null

  const { updates, outcome } = applyRound(profile, args)
  updateProfile(profile.id, updates)
  return outcome
}

export type ApplyRoundResult = {
  updates: Partial<UserProfile>
  outcome: RoundOutcome
}

/** The whole state transition for one finished round, as a pure function. */
export function applyRound(
  profile: UserProfile,
  { rung, correct, total, bestStreak, now = () => new Date().toISOString() }: CompleteRoundArgs,
): ApplyRoundResult {
  const timestamp = now()
  const mistakes = total - correct

  // Rung n+1 unlocks exactly when rung n completes, so "was it already
  // complete" answers both questions.
  const wasComplete = isRungComplete(rung, profile.fractionProgress)

  const previous = profile.fractionProgress[rung]
  const merged: FractionProgress = {
    ...profile.fractionProgress,
    [rung]: {
      correct: previous.correct + correct,
      attempts: previous.attempts + total,
      bestStreak: Math.max(previous.bestStreak, bestStreak),
      completedAt: previous.completedAt,
    },
  }

  const nowComplete = isRungComplete(rung, merged)
  if (nowComplete && !merged[rung].completedAt) {
    merged[rung] = { ...merged[rung], completedAt: timestamp }
  }

  // --- award a gebakje ------------------------------------------------
  const tier = pastryTier(mistakes)
  const candidate = nextPastryForRung(rung, profile.pastries)
  let pastries = profile.pastries
  let awarded: Pastry | null = null
  let upgraded = false

  if (candidate) {
    awarded = candidate
    pastries = [
      ...profile.pastries,
      {
        pastryIndex: candidate.index,
        tier,
        firstEarnedAt: timestamp,
        lastUpgradedAt: timestamp,
      },
    ]
  } else {
    // Set already complete for this rung — a better round upgrades the
    // weakest gebakje in it rather than awarding nothing.
    const inRung = profile.pastries.filter(
      (entry) => getPastry(entry.pastryIndex).rung === rung,
    )
    const weakest = [...inRung].sort((a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier])[0]
    if (weakest && TIER_RANK[tier] > TIER_RANK[weakest.tier]) {
      upgraded = true
      pastries = profile.pastries.map((entry) =>
        entry.pastryIndex === weakest.pastryIndex
          ? { ...entry, tier, lastUpgradedAt: timestamp }
          : entry,
      )
      awarded = getPastry(weakest.pastryIndex)
    }
  }

  const result: FractionRoundResult = {
    id: `${timestamp}-${rung}`,
    rung,
    score: correct,
    total,
    mistakes,
    date: timestamp,
  }

  return {
    updates: {
      fractionProgress: merged,
      pastries,
      recentFractionResults: [result, ...profile.recentFractionResults].slice(0, 20),
      lastActive: timestamp,
    },
    outcome: {
      pastry: awarded,
      tier: awarded ? tier : null,
      upgraded,
      rungCompleted: nowComplete && !wasComplete,
      unlockedNextRung: nowComplete && !wasComplete && rung < 4,
    },
  }
}

/** How many items are still needed to finish a rung. */
export function itemsRemaining(rung: Rung, progress: FractionProgress): number {
  return Math.max(0, rungDef(rung).itemsToComplete - progress[rung].correct)
}

export function getSettings(): ProfileSettings {
  const profile = getCurrentProfile()
  return profile?.settings ?? { unlockAllRungs: false }
}

export function updateSettings(patch: Partial<ProfileSettings>) {
  const profile = getCurrentProfile()
  if (!profile) return
  updateProfile(profile.id, { settings: { ...profile.settings, ...patch } })
}
