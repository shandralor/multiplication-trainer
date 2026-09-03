import { describe, expect, it } from 'vitest'
import { checkAnswer, generateItem, generateSet, type Rng } from '../generate'
import { compare, equals, frac, isSimplified, scaleTo } from '../fraction'
import { RUNGS } from '../ladder'
import type { FractionItem, Rung } from '../types'

/** A deterministic rng that walks a fixed list, then repeats it. */
function seeded(values: number[]): Rng {
  let i = 0
  return () => values[i++ % values.length]
}

/** Draw a lot of items from a rung so invariants get real coverage. */
function sample(rung: Rung, n = 300): FractionItem[] {
  return Array.from({ length: n }, () => generateItem(rung))
}

describe('rung 1 — herkennen', () => {
  it('never shades every part or no parts at all', () => {
    for (const item of sample(1)) {
      if (item.kind === 'read-shape') {
        expect(item.shaded).toBeGreaterThan(0)
        expect(item.shaded).toBeLessThan(item.parts)
      }
    }
  })

  it('the answer matches what is drawn', () => {
    for (const item of sample(1)) {
      if (item.kind === 'read-shape') {
        expect(item.answer).toEqual(frac(item.shaded, item.parts))
      }
    }
  })

  it('asks for the shape it names in the prompt', () => {
    const item = generateItem(1, seeded([0.9, 0.1, 0.5]))
    if (item.kind === 'colour-shape') {
      expect(item.prompt).toContain(item.shape === 'pie' ? 'taart' : 'reep')
    }
  })

  it('accepts an equivalent form when reading a shape', () => {
    const item: FractionItem = {
      rung: 1,
      kind: 'read-shape',
      shape: 'pie',
      parts: 4,
      shaded: 2,
      answer: frac(2, 4),
      prompt: 'Welk deel is gekleurd?',
    }
    expect(checkAnswer(item, frac(2, 4))).toBe(true)
    expect(checkAnswer(item, frac(1, 2))).toBe(true)
    expect(checkAnswer(item, frac(1, 3))).toBe(false)
  })
})

describe('rung 2 — gelijkwaardig', () => {
  it('missing-numerator always has an exact whole answer', () => {
    for (const item of sample(2)) {
      if (item.kind === 'missing-numerator') {
        expect(item.targetD % item.given.d).toBe(0)
        expect(scaleTo(item.given, item.targetD)).toEqual(
          frac(item.answer, item.targetD),
        )
      }
    }
  })

  it('simplify items always have something left to reduce', () => {
    for (const item of sample(2)) {
      if (item.kind === 'simplify') {
        expect(item.sharedFactor).toBeGreaterThan(1)
        expect(isSimplified(item.given)).toBe(false)
        expect(isSimplified(item.answer)).toBe(true)
        expect(equals(item.given, item.answer)).toBe(true)
      }
    }
  })

  it('rejects a partially reduced answer', () => {
    const item: FractionItem = {
      rung: 2,
      kind: 'simplify',
      given: frac(8, 12),
      answer: frac(2, 3),
      sharedFactor: 4,
      prompt: 'Vereenvoudig 8/12',
    }
    expect(checkAnswer(item, frac(2, 3))).toBe(true)
    expect(checkAnswer(item, frac(4, 6))).toBe(false)
  })
})

describe('rung 3 — vergelijken', () => {
  it('number-line targets always sit strictly between 0 and 1', () => {
    for (const item of sample(3)) {
      if (item.kind === 'number-line') {
        expect(item.target.n).toBeGreaterThan(0)
        expect(item.target.n).toBeLessThan(item.steps)
        expect(item.target.d).toBe(item.steps)
      }
    }
  })

  it('the compare answer agrees with the comparison', () => {
    for (const item of sample(3)) {
      if (item.kind === 'compare') {
        const cmp = compare(item.left, item.right)
        const expected = cmp < 0 ? '<' : cmp > 0 ? '>' : '='
        expect(item.answer).toBe(expected)
      }
    }
  })

  it('never puts a fraction against a literal copy of itself', () => {
    // 1/2 ___ 1/2 is answerable without reading it. An "=" question is
    // only worth asking when the two sides look different.
    for (const item of sample(3, 800)) {
      if (item.kind === 'compare') {
        expect(`${item.left.n}/${item.left.d}`).not.toBe(`${item.right.n}/${item.right.d}`)
      }
    }
  })

  it('produces the same-numerator case, where more parts means less', () => {
    const items = sample(3, 600).filter(
      (i) => i.kind === 'compare' && i.left.n === i.right.n && i.left.d !== i.right.d,
    )
    expect(items.length).toBeGreaterThan(0)
  })
})

describe('rung 4 — rekenen', () => {
  it('keeps every answer strictly between 0 and 1', () => {
    // Reaching 1 would want "1/1" or a mixed number as the answer, which
    // is not what this rung teaches.
    for (const item of sample(4, 600)) {
      if (item.kind === 'add' || item.kind === 'subtract') {
        expect(compare(item.answer, frac(1, 1))).toBe(-1)
        expect(item.answer.n).toBeGreaterThan(0)
      }
    }
  })

  it('never subtracts a fraction from an equal one', () => {
    // 1/2 + 2/4 sums to exactly 1, so it falls back to subtraction — and
    // that pair used to land on 0. A subtraction must always have a
    // strictly larger left side. (Equal operands are fine for addition:
    // 2/5 + 2/5 is a real question.)
    for (const item of sample(4, 800)) {
      if (item.kind === 'subtract') {
        expect(compare(item.left, item.right)).toBe(1)
      }
    }
  })

  it('answers are always given in lowest terms', () => {
    for (const item of sample(4, 600)) {
      if (item.kind === 'add' || item.kind === 'subtract') {
        expect(isSimplified(item.answer)).toBe(true)
      }
    }
  })

  it('"breuk van een getal" always lands on a whole number', () => {
    for (const item of sample(4, 600)) {
      if (item.kind === 'of-number') {
        expect(Number.isInteger(item.answer)).toBe(true)
        expect(item.answer).toBe((item.whole * item.frac.n) / item.frac.d)
      }
    }
  })

  it('accepts an unreduced but equal sum', () => {
    const item: FractionItem = {
      rung: 4,
      kind: 'add',
      left: frac(1, 4),
      right: frac(1, 4),
      answer: frac(1, 2),
      unlike: false,
      prompt: '¼ + ¼',
    }
    expect(checkAnswer(item, frac(1, 2))).toBe(true)
    expect(checkAnswer(item, frac(2, 4))).toBe(true)
    expect(checkAnswer(item, frac(1, 3))).toBe(false)
  })
})

describe('generateSet', () => {
  it('returns the requested number of items for every rung', () => {
    for (const def of RUNGS) {
      expect(generateSet(def.rung, 12)).toHaveLength(12)
    }
  })

  it('never repeats the same prompt back to back', () => {
    for (const def of RUNGS) {
      const set = generateSet(def.rung, 20)
      for (let i = 1; i < set.length; i++) {
        expect(set[i].prompt).not.toBe(set[i - 1].prompt)
      }
    }
  })

  it('still fills the set when the rng is degenerate', () => {
    // A constant rng makes every draw identical, which would starve the
    // no-repeat filter; the generator must top up rather than come up short.
    const set = generateSet(1, 10, () => 0)
    expect(set).toHaveLength(10)
  })

  it('tags every item with the rung it came from', () => {
    for (const def of RUNGS) {
      for (const item of generateSet(def.rung, 8)) {
        expect(item.rung).toBe(def.rung)
      }
    }
  })
})
