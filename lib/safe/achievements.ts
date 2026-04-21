import type { AnimalEntry, EarnedAchievement, SafeRunResult } from '@/lib/profile-manager'
import type { SafeRunPerSafe } from '@/lib/safe/safe-progress'

export type AchievementId =
  | 'first-safe'
  | 'perfect-safe'
  | 'fast-safe'
  | 'all-bronze'
  | 'all-silver'
  | 'all-gold'
  | 'all-platinum'
  | 'perfect-ronde'
  | 'endless-10'
  | 'endless-20'
  | 'hard-safe'
  | 'loyal-player'

export type AchievementDef = {
  id: AchievementId
  label: string
  description: string
  medalPath: string   // path under /public
}

export const ACHIEVEMENTS: Record<AchievementId, AchievementDef> = {
  'first-safe':    { id: 'first-safe',    label: 'Eerste kluis',    description: 'Je eerste kluis gekraakt!',                                medalPath: '/medals/shaded_medal1.png' },
  'perfect-safe':  { id: 'perfect-safe',  label: 'Perfecte kluis',  description: 'Een hele kluis zonder fouten gekraakt.',                   medalPath: '/medals/shaded_medal2.png' },
  'fast-safe':     { id: 'fast-safe',     label: 'Snelle kraker',   description: 'Een eindeloos-kluis in minder dan 20 seconden gekraakt.', medalPath: '/medals/shaded_medal3.png' },
  'all-bronze':    { id: 'all-bronze',    label: 'Alle brons',      description: 'Alle tien dieren verzameld (brons of hoger).',             medalPath: '/medals/shaded_medal4.png' },
  'all-silver':    { id: 'all-silver',    label: 'Alle zilver',     description: 'Alle tien dieren op zilver of hoger.',                     medalPath: '/medals/shaded_medal5.png' },
  'all-gold':      { id: 'all-gold',      label: 'Alle goud',       description: 'Alle tien dieren op goud. Kluis compleet!',                medalPath: '/medals/shaded_medal6.png' },
  'all-platinum':  { id: 'all-platinum',  label: 'Alle platina',    description: 'Alle tien dieren op platina — alleen via moeilijk.',       medalPath: '/medals/alle-platina.png' },
  'perfect-ronde': { id: 'perfect-ronde', label: 'Perfecte ronde',  description: 'Een hele ronde zonder fouten.',                            medalPath: '/medals/shaded_medal7.png' },
  'endless-10':    { id: 'endless-10',    label: 'Doorzetter',      description: '10 kluizen gehaald in eindeloos.',                         medalPath: '/medals/shaded_medal8.png' },
  'endless-20':    { id: 'endless-20',    label: 'Kluizen meester', description: '20 kluizen gehaald in eindeloos.',                         medalPath: '/medals/shaded_medal9.png' },
  'hard-safe':     { id: 'hard-safe',     label: 'Moeilijke kraker', description: 'Een moeilijk-kluis zonder fouten gekraakt.',              medalPath: '/medals/moeilijke-kraker.png' },
  'loyal-player':  { id: 'loyal-player',  label: 'Trouwe speler',   description: '7 dagen op rij geoefend.',                                 medalPath: '/medals/trouwe-speler.png' },
}

export type EvaluateContext = {
  animals: AnimalEntry[]
  alreadyEarned: Set<string>
  collectionCycle: number
  lastSafe?: SafeRunPerSafe & {
    durationMs?: number
    mode: 'safe-run' | 'safe-endless'
    difficulty?: 'easy' | 'medium' | 'hard'
  }
  lastRun?: SafeRunResult
  currentStreak?: number
}

/** Returns the IDs of achievements newly earned given the current context. */
export function evaluateAchievements(ctx: EvaluateContext): AchievementId[] {
  const { animals, alreadyEarned, lastSafe, lastRun } = ctx
  const newOnes: AchievementId[] = []

  const unlock = (id: AchievementId) => {
    // For cycle-gated achievements (all-bronze/silver/gold) we allow re-earning
    // in a new cycle; the caller filters by cycle when building alreadyEarned.
    if (!alreadyEarned.has(id)) newOnes.push(id)
  }

  if (animals.length >= 1) unlock('first-safe')

  if (lastSafe && lastSafe.mistakes === 0) unlock('perfect-safe')

  if (
    lastSafe &&
    lastSafe.mode === 'safe-endless' &&
    lastSafe.mistakes === 0 &&
    lastSafe.durationMs !== undefined &&
    lastSafe.durationMs <= 20_000
  ) {
    unlock('fast-safe')
  }

  if (animals.length === 10) {
    unlock('all-bronze')
    if (animals.every((a) => a.tier === 'silver' || a.tier === 'gold' || a.tier === 'platinum')) unlock('all-silver')
    if (animals.every((a) => a.tier === 'gold' || a.tier === 'platinum')) unlock('all-gold')
    if (animals.every((a) => a.tier === 'platinum')) unlock('all-platinum')
  }

  if (
    lastRun &&
    lastRun.mode === 'safe-run' &&
    lastRun.totalMistakes === 0 &&
    lastRun.safesCracked >= 1
  ) {
    unlock('perfect-ronde')
  }

  if (lastRun && lastRun.mode === 'safe-endless') {
    if (lastRun.safesCracked >= 10) unlock('endless-10')
    if (lastRun.safesCracked >= 20) unlock('endless-20')
  }

  if (
    lastSafe &&
    lastSafe.mistakes === 0 &&
    lastSafe.difficulty === 'hard'
  ) {
    unlock('hard-safe')
  }

  if ((ctx.currentStreak ?? 0) >= 7) {
    unlock('loyal-player')
  }

  return newOnes
}

/**
 * Builds the set of achievement IDs that "count as already earned" for the
 * current cycle. Cycle-gated achievements (all-bronze/silver/gold) reset per
 * cycle so they can be re-earned after a collection reset; everything else
 * is lifetime-once.
 */
export function alreadyEarnedForCycle(
  earned: EarnedAchievement[],
  currentCycle: number,
): Set<string> {
  const cycleGated = new Set<AchievementId>(['all-bronze', 'all-silver', 'all-gold', 'all-platinum'])
  const result = new Set<string>()
  for (const a of earned) {
    if (cycleGated.has(a.id as AchievementId)) {
      if (a.cycle === currentCycle) result.add(a.id)
    } else {
      result.add(a.id)
    }
  }
  return result
}
