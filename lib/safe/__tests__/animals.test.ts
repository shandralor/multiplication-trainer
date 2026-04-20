import { describe, it, expect } from 'vitest'
import { ANIMALS, getAnimalForTable } from '@/lib/safe/animals'

describe('animals manifest', () => {
  it('has exactly 10 animals', () => {
    expect(ANIMALS).toHaveLength(10)
  })

  it('covers tables 1..10 exactly once', () => {
    const tables = ANIMALS.map((a) => a.tableIndex).sort((x, y) => x - y)
    expect(tables).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('every animal has non-empty slug and name', () => {
    for (const a of ANIMALS) {
      expect(a.slug).toMatch(/\w+/)
      expect(a.nameNl).toMatch(/\w+/)
    }
  })

  it('getAnimalForTable returns the right entry', () => {
    expect(getAnimalForTable(1).slug).toBe('chick')
    expect(getAnimalForTable(10).slug).toBe('elephant')
  })

  it('getAnimalForTable throws for out-of-range', () => {
    expect(() => getAnimalForTable(0)).toThrow()
    expect(() => getAnimalForTable(11)).toThrow()
  })
})
