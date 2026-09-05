'use client'

import { useEffect, useState } from 'react'
import { AnimalBadge } from './animal-badge'
import type { AnimalTier } from '@/lib/profile-manager'

type SafeRevealProps = {
  tableIndex: number
  tier: AnimalTier
  upgraded: boolean
  onContinue: () => void
}

const TIER_LABEL: Record<AnimalTier, string> = {
  bronze:   'Brons',
  silver:   'Zilver',
  gold:     'Goud',
  platinum: 'Platina',
}

export function SafeReveal({ tableIndex, tier, upgraded, onContinue }: SafeRevealProps) {
  const [phase, setPhase] = useState<'spin' | 'flash' | 'animal'>('spin')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('flash'), 700)
    const t2 = setTimeout(() => setPhase('animal'), 1100)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-ink/85">
      <div className="relative flex flex-col items-center gap-6 p-8">
        {phase === 'spin' && (
          <div className="h-52 w-52 animate-spin rounded-full border-8 border-dashed border-gold bg-ink" />
        )}
        {phase === 'flash' && (
          <div className="h-52 w-52 animate-pulse rounded-full bg-gold shadow-[0_0_120px_60px_rgba(255,200,0,0.7)]" />
        )}
        {phase === 'animal' && (
          <div className="flex flex-col items-center gap-4 animate-slide-up">
            <AnimalBadge tableIndex={tableIndex} tier={tier} size="large" />
            <div className="text-center text-white">
              <div className="font-display text-3xl font-extrabold">
                {TIER_LABEL[tier]} dier verdiend!
              </div>
              {upgraded && (
                <div className="mt-1 font-display text-lg font-extrabold text-gold">✨ Opgewaardeerd!</div>
              )}
              <div className="mt-2 text-sm font-semibold text-white/75">Tafel van {tableIndex}</div>
            </div>
            <button
              onClick={onContinue}
              className="world-tafels btn-3d mt-4 px-8 py-3 font-display text-xl font-extrabold"
            >
              Verder
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
