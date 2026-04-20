'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ModePicker, type SafeMode } from '@/components/safe/mode-picker'
import { DifficultyPicker } from '@/components/safe/difficulty-picker'
import { CollectionStrip } from '@/components/safe/collection-strip'
import type { Difficulty } from '@/lib/safe/safe-logic'
import {
  getCurrentProfile,
  initializeProfiles,
  type UserProfile,
} from '@/lib/profile-manager'

type Screen = 'start' | 'play' | 'scorecard'

export default function SafePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [screen, setScreen] = useState<Screen>('start')
  const [mode, setMode] = useState<SafeMode>('safe-run')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [selectedTables, setSelectedTables] = useState<number[]>([])

  useEffect(() => {
    initializeProfiles()
    setProfile(getCurrentProfile())
  }, [])

  const toggleTable = (t: number) => {
    setSelectedTables((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    )
  }

  const selectAll = () => setSelectedTables([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  const clearAll = () => setSelectedTables([])

  const canStart = selectedTables.length > 0

  if (screen !== 'start') {
    // Placeholder; filled in later tasks.
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight">🔐 Kraak de Kluis</h1>
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              ← Terug
            </Button>
          </Link>
        </div>

        {profile && (
          <div className="mb-6">
            <CollectionStrip animals={profile.animals} />
          </div>
        )}

        <Card className="mb-4 bg-white/10 border-white/20 text-white">
          <CardContent className="p-5 space-y-4">
            <div>
              <h2 className="text-lg font-bold mb-2">Modus</h2>
              <ModePicker value={mode} onChange={setMode} />
            </div>
            <div>
              <h2 className="text-lg font-bold mb-2">Moeilijkheid</h2>
              <DifficultyPicker value={difficulty} onChange={setDifficulty} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold">Tafels</h2>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={selectAll} className="text-white border-white/40">
                    Alles
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearAll} className="text-white border-white/40">
                    Wissen
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTable(t)}
                    className={`aspect-square rounded-xl font-bold text-xl transition-all ${
                      selectedTables.includes(t)
                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white scale-105 shadow-lg'
                        : 'bg-white/10 text-gray-200 hover:bg-white/20'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <button
          onClick={() => canStart && setScreen('play')}
          disabled={!canStart}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
            canStart
              ? 'bg-gradient-to-br from-amber-500 to-rose-600 text-white hover:shadow-xl hover:-translate-y-0.5'
              : 'bg-gray-500/40 text-gray-300 cursor-not-allowed'
          }`}
        >
          🔓 Start Kraken
        </button>
      </div>
    </div>
  )
}
