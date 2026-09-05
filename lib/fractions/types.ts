import type { Fraction } from './fraction'

/** The four rungs of the breuken ladder, in teaching order. */
export type Rung = 1 | 2 | 3 | 4

export type Shape = 'pie' | 'bar'

/**
 * One exercise item. A discriminated union on `kind` so each screen can
 * switch exhaustively — adding a kind is then a type error everywhere it
 * needs handling, which is the point.
 *
 * `prompt` is Dutch copy carried on the item rather than built in the
 * component, so the wording is covered by the generator tests.
 */
export type FractionItem =
  // --- Rung 1: herkennen & benoemen ---------------------------------
  | {
      rung: 1
      kind: 'read-shape'
      shape: Shape
      parts: number
      shaded: number
      answer: Fraction
      prompt: string
    }
  | {
      rung: 1
      kind: 'colour-shape'
      shape: Shape
      parts: number
      target: Fraction
      /** How many parts the kid must shade. */
      answer: number
      prompt: string
    }
  // --- Rung 2: gelijkwaardig & vereenvoudigen ------------------------
  | {
      rung: 2
      kind: 'missing-numerator'
      given: Fraction
      targetD: number
      answer: number
      prompt: string
    }
  | {
      rung: 2
      kind: 'simplify'
      given: Fraction
      answer: Fraction
      /** The shared factor, so the mascot can name it after an answer. */
      sharedFactor: number
      prompt: string
    }
  // --- Rung 3: vergelijken & ordenen ---------------------------------
  | {
      rung: 3
      kind: 'number-line'
      target: Fraction
      /** Tick count between 0 and 1; the answer is `target.n` steps along. */
      steps: number
      prompt: string
    }
  | {
      rung: 3
      kind: 'compare'
      left: Fraction
      right: Fraction
      answer: '<' | '=' | '>'
      prompt: string
    }
  // --- Rung 4: rekenen ----------------------------------------------
  | {
      rung: 4
      kind: 'add' | 'subtract'
      left: Fraction
      right: Fraction
      answer: Fraction
      /** True when the two denominators differ — the harder case. */
      unlike: boolean
      prompt: string
    }
  | {
      rung: 4
      kind: 'of-number'
      frac: Fraction
      whole: number
      answer: number
      prompt: string
    }

export type ItemKind = FractionItem['kind']

/** Progress through one rung, stored per profile. */
export type RungProgress = {
  correct: number
  attempts: number
  /** Set the first time the rung is finished; never cleared. */
  completedAt?: string
  /** Best run of consecutive correct answers, for the taartenkluis tier. */
  bestStreak: number
}

export type FractionProgress = Record<Rung, RungProgress>

export const EMPTY_RUNG: RungProgress = { correct: 0, attempts: 0, bestStreak: 0 }

export function emptyFractionProgress(): FractionProgress {
  return {
    1: { ...EMPTY_RUNG },
    2: { ...EMPTY_RUNG },
    3: { ...EMPTY_RUNG },
    4: { ...EMPTY_RUNG },
  }
}
