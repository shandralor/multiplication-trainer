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

/**
 * The four metals stay literal colours rather than world tokens: the
 * tier IS the meaning here, and a kid reads bronze/silver/gold/platina
 * by hue. Flat fills with a solid ring, in keeping with everything else.
 */
const TIER_FRAME: Record<AnimalTier, string> = {
  bronze:   'bg-[#C88A4B] ring-[#A97142]',
  silver:   'bg-[#D6DDE1] ring-[#A8B3BA]',
  gold:     'bg-gold ring-[#E0A800]',
  platinum: 'bg-[#A8E6E0] ring-[#6FC7BF]',
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
    ? `${TIER_FRAME[tier]} ring-4`
    : 'bg-line ring-2 ring-line'

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
