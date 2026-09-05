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
        <span className="font-display text-base font-extrabold text-ink">
          Dieren verzameling · {earnedCount} / 10
        </span>
        {allGold && (
          <span className="font-display text-base font-extrabold text-gold">🏆 Kluis compleet!</span>
        )}
      </div>
      <div className={`flex flex-nowrap justify-center gap-1.5 overflow-x-auto rounded-2xl border-2 border-line bg-surface p-3 ${compact ? 'py-2' : ''}`}>
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
