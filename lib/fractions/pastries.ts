import type { AnimalTier } from '@/lib/safe/safe-logic'
import type { Rung } from './types'

/**
 * The Breuken world's collection. Ten gebakjes, earned the way the ten
 * animals are: one per completed rung pass, upgraded on a better run.
 *
 * Emoji rather than PNGs for now — the animal set came from a paid pack
 * and there is no matching pastry art yet. `emoji` is the seam: swap it
 * for a `pngPath` when the art lands and nothing else changes.
 */
export type Pastry = {
  index: number // 1..10
  slug: string
  nameNl: string
  emoji: string
  /** Which rung earns it. Two or three per rung, hardest last. */
  rung: Rung
}

export const PASTRIES: ReadonlyArray<Pastry> = [
  { index: 1,  slug: 'koekje',     nameNl: 'Koekje',      emoji: '🍪', rung: 1 },
  { index: 2,  slug: 'cupcake',    nameNl: 'Cupcake',     emoji: '🧁', rung: 1 },
  { index: 3,  slug: 'donut',      nameNl: 'Donut',       emoji: '🍩', rung: 1 },
  { index: 4,  slug: 'taart',      nameNl: 'Taartpunt',   emoji: '🍰', rung: 2 },
  { index: 5,  slug: 'appeltaart', nameNl: 'Appeltaart',  emoji: '🥧', rung: 2 },
  { index: 6,  slug: 'croissant',  nameNl: 'Croissant',   emoji: '🥐', rung: 2 },
  { index: 7,  slug: 'pannenkoek', nameNl: 'Pannenkoek',  emoji: '🥞', rung: 3 },
  { index: 8,  slug: 'stroopwafel',nameNl: 'Stroopwafel', emoji: '🍯', rung: 3 },
  { index: 9,  slug: 'ijsje',      nameNl: 'IJsje',       emoji: '🍨', rung: 4 },
  { index: 10, slug: 'bonbon',     nameNl: 'Bonbon',      emoji: '🍫', rung: 4 },
]

export type PastryEntry = {
  pastryIndex: number
  tier: AnimalTier
  firstEarnedAt: string
  lastUpgradedAt: string
}

export function getPastry(index: number): Pastry {
  const pastry = PASTRIES.find((p) => p.index === index)
  if (!pastry) throw new Error(`Geen gebakje met index ${index}`)
  return pastry
}

export function pastriesForRung(rung: Rung): Pastry[] {
  return PASTRIES.filter((p) => p.rung === rung)
}

/**
 * Which gebakje a finished round awards: the first one for this rung the
 * kid does not own yet, or null when the rung's set is already complete.
 */
export function nextPastryForRung(rung: Rung, owned: PastryEntry[]): Pastry | null {
  const ownedIndexes = new Set(owned.map((e) => e.pastryIndex))
  return pastriesForRung(rung).find((p) => !ownedIndexes.has(p.index)) ?? null
}

/**
 * Tier from mistakes in a round of 12. Mirrors scoreTier for the safes so
 * the two collections feel like one system — platina needs a clean run.
 */
export function pastryTier(mistakes: number): AnimalTier {
  if (mistakes === 0) return 'platinum'
  if (mistakes <= 1) return 'gold'
  if (mistakes <= 3) return 'silver'
  return 'bronze'
}
