/**
 * Fraction arithmetic for the Breuken world.
 *
 * Everything here is pure and integer-only — no floating point ever
 * touches an answer, because 0.1 + 0.2 problems in a kid's maths app
 * are indefensible. Comparison is by cross-multiplication.
 */

export type Fraction = {
  n: number // numerator (teller)
  d: number // denominator (noemer), always > 0
}

export function frac(n: number, d: number): Fraction {
  if (d === 0) throw new Error('Noemer mag niet 0 zijn')
  // Keep the sign on the numerator so comparison stays a single rule.
  return d < 0 ? { n: -n, d: -d } : { n, d }
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) {
    ;[x, y] = [y, x % y]
  }
  return x || 1
}

export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b)
}

/** Reduce to lowest terms. simplify(8/12) === 2/3 */
export function simplify(f: Fraction): Fraction {
  const g = gcd(f.n, f.d)
  return frac(f.n / g, f.d / g)
}

/** True when the fraction is already in lowest terms. */
export function isSimplified(f: Fraction): boolean {
  return gcd(f.n, f.d) === 1
}

/** Value equality after reduction: 2/4 equals 1/2. */
export function equals(a: Fraction, b: Fraction): boolean {
  return a.n * b.d === b.n * a.d
}

/** -1 when a < b, 0 when equal, 1 when a > b. */
export function compare(a: Fraction, b: Fraction): -1 | 0 | 1 {
  const left = a.n * b.d
  const right = b.n * a.d
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

export function add(a: Fraction, b: Fraction): Fraction {
  return simplify(frac(a.n * b.d + b.n * a.d, a.d * b.d))
}

export function subtract(a: Fraction, b: Fraction): Fraction {
  return simplify(frac(a.n * b.d - b.n * a.d, a.d * b.d))
}

/** "¾ van 20" — only defined when it lands on a whole number. */
export function fractionOf(f: Fraction, whole: number): number {
  return (whole * f.n) / f.d
}

export function isWholeResult(f: Fraction, whole: number): boolean {
  return (whole * f.n) % f.d === 0
}

/** Scale a fraction up to a target denominator: scaleTo(3/5, 10) → 6/10. */
export function scaleTo(f: Fraction, targetD: number): Fraction | null {
  if (targetD % f.d !== 0) return null
  const factor = targetD / f.d
  return frac(f.n * factor, f.d * factor)
}

export function toText(f: Fraction): string {
  return `${f.n}/${f.d}`
}

/**
 * The typographic form where one exists — ½ reads better than 1/2 on a
 * button. Falls back to the plain form, so callers never have to check.
 */
const VULGAR: Record<string, string> = {
  '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾',
  '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘', '1/6': '⅙',
  '5/6': '⅚', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞',
}

export function toVulgar(f: Fraction): string {
  return VULGAR[toText(f)] ?? toText(f)
}
