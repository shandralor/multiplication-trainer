import type { FractionProgress, Rung, RungProgress } from './types'

export type RungDef = {
  rung: Rung
  slug: string
  title: string
  /** One line of example items, shown under the title on the ladder. */
  example: string
  /** Dutch school year this rung targets. */
  groep: string
  /** Correct answers needed before the rung counts as done. */
  itemsToComplete: number
}

export const RUNGS: readonly RungDef[] = [
  {
    rung: 1,
    slug: 'herkennen',
    title: 'Herkennen',
    example: 'welk deel is gekleurd?',
    groep: 'groep 5–6',
    itemsToComplete: 12,
  },
  {
    rung: 2,
    slug: 'gelijkwaardig',
    title: 'Gelijkwaardig',
    example: '⅗ = ?/10 · vereenvoudig 8/12',
    groep: 'groep 6–7',
    itemsToComplete: 12,
  },
  {
    rung: 3,
    slug: 'vergelijken',
    title: 'Vergelijken',
    example: 'wat is meer, ⅗ of ⅔?',
    groep: 'groep 6–7',
    itemsToComplete: 12,
  },
  {
    rung: 4,
    slug: 'rekenen',
    title: 'Rekenen',
    example: '¼ + ½ · ¾ van 20',
    groep: 'groep 7–8',
    itemsToComplete: 12,
  },
] as const

export function rungBySlug(slug: string): RungDef | undefined {
  return RUNGS.find((r) => r.slug === slug)
}

export function rungDef(rung: Rung): RungDef {
  const def = RUNGS.find((r) => r.rung === rung)
  if (!def) throw new Error(`Onbekend level ${rung}`)
  return def
}

/** A rung is finished once enough items have been answered correctly. */
export function isRungComplete(rung: Rung, progress: FractionProgress): boolean {
  const p: RungProgress = progress[rung]
  return p.correct >= rungDef(rung).itemsToComplete
}

export type UnlockOptions = {
  /**
   * Parent/dev override. When true every rung is open regardless of what
   * came before it — set from Instellingen, so a kid who is already past
   * rung 1 at school does not have to grind through it first.
   */
  unlockAll?: boolean
}

/**
 * Rung 1 is always open. Every rung after it opens when the one below is
 * complete — unless the override is on, which opens everything.
 */
export function isRungUnlocked(
  rung: Rung,
  progress: FractionProgress,
  opts: UnlockOptions = {},
): boolean {
  if (opts.unlockAll) return true
  if (rung === 1) return true
  return isRungComplete((rung - 1) as Rung, progress)
}

/** The rung the ladder should point at: first unlocked-but-unfinished one. */
export function nextRung(progress: FractionProgress, opts: UnlockOptions = {}): Rung {
  for (const def of RUNGS) {
    if (isRungUnlocked(def.rung, progress, opts) && !isRungComplete(def.rung, progress)) {
      return def.rung
    }
  }
  return 4
}

/** How many rungs are finished — drives the "0/4" chip on home. */
export function completedRungCount(progress: FractionProgress): number {
  return RUNGS.filter((r) => isRungComplete(r.rung, progress)).length
}
