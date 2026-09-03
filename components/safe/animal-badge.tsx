'use client'

import Image from 'next/image'
import { getAnimalForTable } from '@/lib/safe/animals'
import type { AnimalTier } from '@/lib/profile-manager'

type AnimalBadgeProps = {
  tableIndex: number
  tier?: AnimalTier | null       // null/undefined = not earned yet
  size?: 'small' | 'medium' | 'large'
}

const SIZE_PX: Record<'small' | 'medium' | 'large', number> = {
  small: 48,
  medium: 80,
  large: 180,
}

const TIER_FRAME: Record<AnimalTier, string> = {
  bronze:   'bg-gradient-to-br from-amber-700 to-amber-500 ring-amber-600',
  silver:   'bg-gradient-to-br from-slate-300 to-slate-100 ring-slate-400',
  gold:     'bg-gradient-to-br from-yellow-300 to-yellow-500 ring-yellow-600',
  platinum: 'bg-gradient-to-br from-cyan-200 via-sky-300 to-violet-400 ring-cyan-300',
}

const TIER_IMG_FILTER: Record<AnimalTier, string> = {
  bronze:   'saturate-50 brightness-95',
  silver:   'saturate-75',
  gold:     '',
  platinum: 'drop-shadow-[0_0_4px_rgba(167,139,250,0.6)]',
}

export function AnimalBadge({
  tableIndex,
  tier = null,
  size = 'medium',
}: AnimalBadgeProps) {
  const animal = getAnimalForTable(tableIndex)
  const px = SIZE_PX[size]

  const earned = tier !== null && tier !== undefined
  const frameClass = earned
    ? `${TIER_FRAME[tier]} ring-2`
    : 'bg-gray-200 dark:bg-gray-700 ring-2 ring-gray-300'

  const imgClass = earned
    ? TIER_IMG_FILTER[tier]
    : 'grayscale opacity-50'

  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl overflow-hidden ${frameClass} ${
        tier === 'gold' || tier === 'platinum' ? 'animate-pulse' : ''
      }`}
      style={{ width: px, height: px }}
      title={`${animal.nameNl} (×${tableIndex})`}
    >
      <Image
        src={animal.pngPath}
        alt={animal.nameNl}
        width={px - 8}
        height={px - 8}
        className={`object-contain ${imgClass}`}
      />
    </div>
  )
}
