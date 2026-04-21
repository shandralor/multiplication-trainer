'use client'

import { ANIMALS } from '@/lib/safe/animals'
import type { AnimalEntry, AnimalTier } from '@/lib/profile-manager'
import { AnimalBadge } from './animal-badge'

type CollectionStripProps = {
  animals: AnimalEntry[]
  highlightTable?: number | null   // pulsate this slot (e.g., just earned)
  compact?: boolean
}

export function CollectionStrip({ animals, highlightTable = null, compact = false }: CollectionStripProps) {
  const tierByTable = new Map<number, AnimalTier>(
    animals.map((a) => [a.tableIndex, a.tier]),
  )
  const earnedCount = animals.length
  const allGold = animals.length === 10 && animals.every((a) => a.tier === 'gold')

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 px-2">
        <span className="text-xs font-bold tracking-wider text-amber-700 dark:text-amber-300">
          Dieren verzameling · {earnedCount} / 10
        </span>
        {allGold && (
          <span className="text-xs font-bold text-yellow-600">🏆 Kluis compleet!</span>
        )}
      </div>
      <div className={`flex gap-1.5 p-3 rounded-2xl border-2 border-amber-200 bg-amber-50 dark:bg-amber-950/30 justify-center flex-nowrap overflow-x-auto ${compact ? 'py-2' : ''}`}>
        {ANIMALS.map((animal) => (
          <div
            key={animal.tableIndex}
            className={`shrink-0 ${highlightTable === animal.tableIndex ? 'animate-bounce' : ''}`}
          >
            <AnimalBadge
              tableIndex={animal.tableIndex}
              tier={tierByTable.get(animal.tableIndex) ?? null}
              size={compact ? 'small' : 'medium'}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
