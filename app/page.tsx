'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AppHeader } from '@/components/app-header'
import { Mascot } from '@/components/mascot'
import { getCurrentProfile, type AnimalEntry } from '@/lib/profile-manager'

const ANIMAL_EMOJI: Record<number, string> = {
  1: '🐥', 2: '🦆', 3: '🐰', 4: '🐶', 5: '🐷',
  6: '🐼', 7: '🐵', 8: '🐻', 9: '🦒', 10: '🐘',
}

export default function Home() {
  const [animals, setAnimals] = useState<AnimalEntry[]>([])

  const loadProfileData = useCallback(() => {
    const profile = getCurrentProfile()
    setAnimals(profile?.animals ?? [])
  }, [])

  useEffect(() => {
    loadProfileData()
  }, [loadProfileData])

  const collectedCount = animals.length
  const kluisSub =
    collectedCount === 0
      ? 'Verzamel alle 10 dieren'
      : `${animals
          .slice(0, 5)
          .map((a) => ANIMAL_EMOJI[a.tableIndex] ?? '•')
          .join(' ')}  ${collectedCount}/10 dieren`

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <AppHeader onProfileChange={loadProfileData} />

      <div className="max-w-md mx-auto px-4 py-8 space-y-5">
        {/* Mascot + welcome */}
        <div className="flex items-center gap-4 pt-2">
          <Mascot emotion="neutral" size="medium" />
          <div>
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Welkom terug!
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Kies een wereld om te spelen
            </p>
          </div>
        </div>

        {/* Kluis portal */}
        <Link href="/safe" className="block">
          <button className="w-full py-5 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all bg-gradient-to-br from-amber-500 via-rose-500 to-indigo-700 text-white">
            <div className="flex items-center justify-center gap-2 text-xl">
              <span className="text-2xl">🔐</span>
              <span>Kraak de kluis</span>
            </div>
            <div className="text-xs font-normal opacity-95 mt-1">{kluisSub}</div>
          </button>
        </Link>

        {/* Vermenigvuldigen portal */}
        <Link href="/vermenigvuldigen" className="block">
          <button className="w-full py-5 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
            <div className="flex items-center justify-center gap-2 text-xl">
              <span className="text-2xl">×</span>
              <span>Vermenigvuldigen</span>
            </div>
            <div className="text-xs font-normal opacity-95 mt-1">Quiz · oefen · tijdrace</div>
          </button>
        </Link>

        {/* Delen portal */}
        <Link href="/delen" className="block">
          <button className="w-full py-5 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all bg-gradient-to-br from-blue-500 to-blue-700 text-white">
            <div className="flex items-center justify-center gap-2 text-xl">
              <span className="text-2xl">÷</span>
              <span>Delen</span>
            </div>
            <div className="text-xs font-normal opacity-95 mt-1">Quiz · oefen · tijdrace</div>
          </button>
        </Link>
      </div>
    </div>
  )
}
