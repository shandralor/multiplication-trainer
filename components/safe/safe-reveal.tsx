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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
      <div className="relative flex flex-col items-center gap-6 p-8">
        {phase === 'spin' && (
          <div className="w-52 h-52 rounded-full border-8 border-yellow-300 border-dashed animate-spin bg-gray-700" />
        )}
        {phase === 'flash' && (
          <div className="w-52 h-52 rounded-full bg-yellow-200 animate-pulse shadow-[0_0_120px_60px_rgba(253,224,71,0.8)]" />
        )}
        {phase === 'animal' && (
          <div className="flex flex-col items-center gap-4 animate-slide-up">
            <AnimalBadge tableIndex={tableIndex} tier={tier} size="large" />
            <div className="text-center text-white">
              <div className="text-3xl font-extrabold">
                {TIER_LABEL[tier]} dier verdiend!
              </div>
              {upgraded && (
                <div className="text-yellow-300 text-lg mt-1">✨ Opgewaardeerd!</div>
              )}
              <div className="text-sm text-gray-300 mt-2">Tafel van {tableIndex}</div>
            </div>
            <button
              onClick={onContinue}
              className="mt-4 px-8 py-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-lg shadow-lg hover:shadow-xl"
            >
              Verder
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
