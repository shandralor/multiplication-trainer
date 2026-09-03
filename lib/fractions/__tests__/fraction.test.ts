import { describe, expect, it } from 'vitest'
import {
  add,
  compare,
  equals,
  frac,
  fractionOf,
  gcd,
  isSimplified,
  isWholeResult,
  lcm,
  scaleTo,
  simplify,
  subtract,
  toText,
  toVulgar,
} from '../fraction'

describe('gcd / lcm', () => {
  it('finds the greatest common divisor', () => {
    expect(gcd(8, 12)).toBe(4)
    expect(gcd(7, 13)).toBe(1)
    expect(gcd(10, 5)).toBe(5)
  })

  it('never returns 0, so it is always safe to divide by', () => {
    expect(gcd(0, 0)).toBe(1)
  })

  it('finds the least common multiple', () => {
    expect(lcm(4, 6)).toBe(12)
    expect(lcm(3, 5)).toBe(15)
  })
})

describe('frac', () => {
  it('rejects a zero denominator', () => {
    expect(() => frac(1, 0)).toThrow(/Noemer/)
  })

  it('normalises a negative denominator onto the numerator', () => {
    expect(frac(1, -2)).toEqual({ n: -1, d: 2 })
  })
})

describe('simplify', () => {
  it('reduces to lowest terms', () => {
    expect(simplify(frac(8, 12))).toEqual({ n: 2, d: 3 })
    expect(simplify(frac(10, 5))).toEqual({ n: 2, d: 1 })
  })

  it('leaves an already-reduced fraction alone', () => {
    expect(simplify(frac(3, 5))).toEqual({ n: 3, d: 5 })
  })

  it('reports whether a fraction is already reduced', () => {
    expect(isSimplified(frac(2, 3))).toBe(true)
    expect(isSimplified(frac(8, 12))).toBe(false)
  })
})

describe('equals / compare', () => {
  it('treats equivalent fractions as equal', () => {
    expect(equals(frac(2, 4), frac(1, 2))).toBe(true)
    expect(equals(frac(3, 5), frac(6, 10))).toBe(true)
    expect(equals(frac(3, 5), frac(2, 3))).toBe(false)
  })

  it('orders fractions without floating point', () => {
    expect(compare(frac(3, 5), frac(2, 3))).toBe(-1)
    expect(compare(frac(2, 3), frac(3, 5))).toBe(1)
    expect(compare(frac(1, 2), frac(2, 4))).toBe(0)
  })

  it('handles the same-numerator case: more parts means less each', () => {
    expect(compare(frac(1, 8), frac(1, 3))).toBe(-1)
  })
})

describe('add / subtract', () => {
  it('adds with the same denominator', () => {
    expect(add(frac(1, 5), frac(2, 5))).toEqual({ n: 3, d: 5 })
  })

  it('adds with unlike denominators and reduces the result', () => {
    expect(add(frac(1, 4), frac(1, 2))).toEqual({ n: 3, d: 4 })
    expect(add(frac(1, 6), frac(1, 3))).toEqual({ n: 1, d: 2 })
  })

  it('subtracts', () => {
    expect(subtract(frac(5, 6), frac(1, 3))).toEqual({ n: 1, d: 2 })
  })
})

describe('fractionOf', () => {
  it('computes a fraction of a whole number', () => {
    expect(fractionOf(frac(3, 4), 20)).toBe(15)
    expect(fractionOf(frac(2, 5), 30)).toBe(12)
  })

  it('reports when the result would not be whole', () => {
    expect(isWholeResult(frac(3, 4), 20)).toBe(true)
    expect(isWholeResult(frac(3, 4), 10)).toBe(false)
  })
})

describe('scaleTo', () => {
  it('scales up to a multiple denominator', () => {
    expect(scaleTo(frac(3, 5), 10)).toEqual({ n: 6, d: 10 })
    expect(scaleTo(frac(1, 3), 12)).toEqual({ n: 4, d: 12 })
  })

  it('returns null when the target is not a multiple', () => {
    expect(scaleTo(frac(1, 3), 10)).toBeNull()
  })
})

describe('display', () => {
  it('writes the plain form', () => {
    expect(toText(frac(3, 8))).toBe('3/8')
  })

  it('prefers a vulgar glyph where one exists', () => {
    expect(toVulgar(frac(1, 2))).toBe('½')
    expect(toVulgar(frac(3, 5))).toBe('⅗')
  })

  it('falls back to the plain form when there is no glyph', () => {
    expect(toVulgar(frac(4, 10))).toBe('4/10')
  })
})
