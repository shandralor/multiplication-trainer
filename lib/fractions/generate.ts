import {
  add,
  compare,
  frac,
  fractionOf,
  gcd,
  isWholeResult,
  scaleTo,
  simplify,
  subtract,
  toText,
  toVulgar,
  type Fraction,
} from './fraction'
import type { FractionItem, Rung, Shape } from './types'

/**
 * Item generators, one per rung. All take an injectable `rng` so the
 * tests can pin every draw — same contract as lib/safe/safe-logic.
 */
export type Rng = () => number

/** Denominators a kid meets first: halves through tenths, no sevenths/ninths. */
const FRIENDLY_DENOMINATORS = [2, 3, 4, 5, 6, 8, 10] as const

function pick<T>(arr: readonly T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)]
}

function pickInt(min: number, max: number, rng: Rng): number {
  return min + Math.floor(rng() * (max - min + 1))
}

function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// ---------------------------------------------------------------- rung 1

function generateRung1(rng: Rng): FractionItem {
  const parts = pick(FRIENDLY_DENOMINATORS, rng)
  const shape: Shape = rng() < 0.5 ? 'pie' : 'bar'

  if (rng() < 0.6) {
    // Read a fraction off the drawing. Never all-shaded or none-shaded:
    // both make the question trivial and teach nothing.
    const shaded = pickInt(1, parts - 1, rng)
    return {
      rung: 1,
      kind: 'read-shape',
      shape,
      parts,
      shaded,
      answer: frac(shaded, parts),
      prompt: 'Welk deel is gekleurd?',
    }
  }

  // The reverse: given the fraction, shade the drawing.
  const target = frac(pickInt(1, parts - 1, rng), parts)
  return {
    rung: 1,
    kind: 'colour-shape',
    shape,
    parts,
    target,
    answer: target.n,
    prompt: `Kleur ${toVulgar(target)} van de ${shape === 'pie' ? 'taart' : 'reep'}`,
  }
}

// ---------------------------------------------------------------- rung 2

function generateRung2(rng: Rng): FractionItem {
  if (rng() < 0.5) {
    // ⅗ = ?/10 — scale a simple fraction up by 2, 3 or 4.
    const d = pick([2, 3, 4, 5, 6] as const, rng)
    const n = pickInt(1, d - 1, rng)
    const given = frac(n, d)
    const factor = pickInt(2, 4, rng)
    const targetD = d * factor
    const scaled = scaleTo(given, targetD)
    if (!scaled) throw new Error('scaleTo faalde op een veelvoud')
    return {
      rung: 2,
      kind: 'missing-numerator',
      given,
      targetD,
      answer: scaled.n,
      prompt: `${toVulgar(given)} = ? / ${targetD}`,
    }
  }

  // Vereenvoudig 8/12. Build it backwards from the reduced form so the
  // item always *has* a shared factor to find.
  const d = pick([2, 3, 4, 5, 6] as const, rng)
  const n = pickInt(1, d - 1, rng)
  const reduced = simplify(frac(n, d))
  const factor = pickInt(2, 4, rng)
  const given = frac(reduced.n * factor, reduced.d * factor)
  return {
    rung: 2,
    kind: 'simplify',
    given,
    answer: reduced,
    sharedFactor: gcd(given.n, given.d),
    prompt: `Vereenvoudig ${given.n}/${given.d}`,
  }
}

// ---------------------------------------------------------------- rung 3

function generateRung3(rng: Rng): FractionItem {
  if (rng() < 0.5) {
    const steps = pick([2, 3, 4, 5, 6, 8] as const, rng)
    const target = frac(pickInt(1, steps - 1, rng), steps)
    return {
      rung: 3,
      kind: 'number-line',
      target,
      steps,
      prompt: `Sleep ${toVulgar(target)} op de lijn`,
    }
  }

  // Compare. The three cases are drawn deliberately rather than at
  // random, so a run always covers same-noemer, same-teller, and the
  // one that genuinely needs a common denominator.
  const shape = rng()
  let left: Fraction
  let right: Fraction

  if (shape < 0.34) {
    // Same denominator — read it straight off the numerators. Halves are
    // excluded here: with d = 2 the only numerator is 1, so both sides
    // would come out identical.
    const d = pick(FRIENDLY_DENOMINATORS.filter((x) => x > 2), rng)
    let a = pickInt(1, d - 1, rng)
    let b = pickInt(1, d - 2, rng)
    if (b >= a) b += 1
    ;[a, b] = shuffle([a, b], rng)
    left = frac(a, d)
    right = frac(b, d)
  } else if (shape < 0.67) {
    // Same numerator — the counter-intuitive one: more parts is less each.
    const n = pickInt(1, 3, rng)
    const ds = shuffle(FRIENDLY_DENOMINATORS.filter((d) => d > n), rng)
    left = frac(n, ds[0])
    right = frac(n, ds[1])
  } else {
    const ds = shuffle(FRIENDLY_DENOMINATORS, rng)
    left = frac(pickInt(1, ds[0] - 1, rng), ds[0])
    right = frac(pickInt(1, ds[1] - 1, rng), ds[1])
  }

  // An "=" question is worth asking when the two look different (1/2 vs
  // 2/4), but 1/2 against a literal 1/2 teaches nothing. Nudge the right
  // side onto a different noemer so the pair always reads as a question.
  if (left.n === right.n && left.d === right.d) {
    const scaled = scaleTo(right, right.d * 2)
    if (scaled) right = scaled
  }

  const cmp = compare(left, right)
  return {
    rung: 3,
    kind: 'compare',
    left,
    right,
    answer: cmp < 0 ? '<' : cmp > 0 ? '>' : '=',
    prompt: `${toVulgar(left)} ___ ${toVulgar(right)}`,
  }
}

// ---------------------------------------------------------------- rung 4

function generateRung4(rng: Rng): FractionItem {
  const roll = rng()

  if (roll < 0.35) {
    // Same denominator: add the numerators, keep the noemer. Kept under
    // 1 so the answer never needs a mixed number.
    const d = pick([3, 4, 5, 6, 8, 10] as const, rng)
    const a = pickInt(1, d - 2, rng)
    const b = pickInt(1, d - 1 - a, rng)
    const left = frac(a, d)
    const right = frac(b, d)
    return {
      rung: 4,
      kind: 'add',
      left,
      right,
      answer: add(left, right),
      unlike: false,
      prompt: `${toText(left)} + ${toText(right)}`,
    }
  }

  if (roll < 0.6) {
    // Unlike denominators, but one is a multiple of the other so the
    // common denominator is findable without the full LCM machinery.
    const smallD = pick([2, 3, 4, 5] as const, rng)
    const factor = pickInt(2, 3, rng)
    const bigD = smallD * factor
    const left = frac(1, smallD)

    // In bigD parts, `left` is exactly `factor` of them. Drawing the
    // other numerator anywhere but `factor` keeps the two fractions
    // different, which is what stops a subtraction landing on zero.
    let n = pickInt(1, bigD - 2, rng)
    if (n >= factor) n += 1
    const right = frac(n, bigD)

    if (n + factor < bigD) {
      return {
        rung: 4,
        kind: 'add',
        left,
        right,
        answer: add(left, right),
        unlike: true,
        prompt: `${toText(left)} + ${toText(right)}`,
      }
    }

    // Adding would reach or pass 1, and "1/1" is not something to teach.
    // n > factor is guaranteed here, so the difference stays positive.
    return {
      rung: 4,
      kind: 'subtract',
      left: right,
      right: left,
      answer: subtract(right, left),
      unlike: true,
      prompt: `${toText(right)} - ${toText(left)}`,
    }
  }

  // "¾ van 20" — the rung that closes the loop back onto tafels: this is
  // 20 ÷ 4 × 3, both skills the app already trains.
  const d = pick([2, 3, 4, 5, 10] as const, rng)
  const n = pickInt(1, d - 1, rng)
  const f = frac(n, d)
  const multiples: number[] = []
  for (let w = d; w <= 100; w += d) {
    if (isWholeResult(f, w)) multiples.push(w)
  }
  const whole = pick(multiples, rng)
  return {
    rung: 4,
    kind: 'of-number',
    frac: f,
    whole,
    answer: fractionOf(f, whole),
    prompt: `${toVulgar(f)} van ${whole}`,
  }
}

const GENERATORS: Record<Rung, (rng: Rng) => FractionItem> = {
  1: generateRung1,
  2: generateRung2,
  3: generateRung3,
  4: generateRung4,
}

export function generateItem(rung: Rung, rng: Rng = Math.random): FractionItem {
  return GENERATORS[rung](rng)
}

/**
 * A set for one round. Consecutive duplicates are rejected — repeating
 * the same sum twice in a row reads as a bug to a kid, even when it is
 * a legitimate draw.
 */
export function generateSet(rung: Rung, count: number, rng: Rng = Math.random): FractionItem[] {
  const out: FractionItem[] = []
  let guard = 0
  while (out.length < count && guard < count * 40) {
    guard++
    const item = generateItem(rung, rng)
    const previous = out[out.length - 1]
    if (previous && previous.prompt === item.prompt) continue
    out.push(item)
  }
  // If the guard tripped (a pathological rng), top up without the filter
  // rather than returning a short set.
  while (out.length < count) out.push(generateItem(rung, rng))
  return out
}

/** Is this answer right? One place, so every screen agrees. */
export function checkAnswer(item: FractionItem, answer: unknown): boolean {
  switch (item.kind) {
    case 'read-shape':
      // Accept any equivalent form: 2/4 for a half is genuinely correct.
      return isFraction(answer) && compare(answer, item.answer) === 0
    case 'colour-shape':
      return answer === item.answer
    case 'missing-numerator':
      return answer === item.answer
    case 'simplify':
      // Must be reduced *and* equal — 4/6 for 8/12 is not an answer.
      return (
        isFraction(answer) &&
        answer.n === item.answer.n &&
        answer.d === item.answer.d
      )
    case 'number-line':
      return answer === item.target.n
    case 'compare':
      return answer === item.answer
    case 'add':
    case 'subtract':
      return isFraction(answer) && compare(answer, item.answer) === 0
    case 'of-number':
      return answer === item.answer
  }
}

function isFraction(value: unknown): value is Fraction {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Fraction).n === 'number' &&
    typeof (value as Fraction).d === 'number' &&
    (value as Fraction).d !== 0
  )
}
