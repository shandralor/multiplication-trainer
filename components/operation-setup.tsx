'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Mascot } from '@/components/mascot'

type Operation = 'multiply' | 'divide'
type QuizMode = 'quiz' | 'practice' | 'timed'

type OperationSetupProps = {
  operation: Operation
}

const OP_CONFIG = {
  multiply: {
    title: '× Vermenigvuldigen',
    accentText: 'text-emerald-700 dark:text-emerald-400',
    tileActive: 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg scale-105',
    pillActive: 'bg-emerald-700 text-white shadow-md',
  },
  divide: {
    title: '÷ Delen',
    accentText: 'text-blue-700 dark:text-blue-400',
    tileActive: 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg scale-105',
    pillActive: 'bg-blue-700 text-white shadow-md',
  },
} as const

const MODE_TILES: { id: QuizMode; emoji: string; label: string }[] = [
  { id: 'quiz',     emoji: '📝', label: 'Quiz' },
  { id: 'practice', emoji: '♾️', label: 'Oefen' },
  { id: 'timed',    emoji: '⏱️', label: 'Tijd' },
]

const MODE_GRADIENT: Record<QuizMode, string> = {
  quiz:     'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white',
  practice: 'bg-gradient-to-br from-blue-500 to-blue-700 text-white',
  timed:    'bg-gradient-to-br from-amber-500 to-amber-700 text-gray-900',
}

export function OperationSetup({ operation }: OperationSetupProps) {
  const cfg = OP_CONFIG[operation]
  const [mode, setMode] = useState<QuizMode>('quiz')
  const [tables, setTables] = useState<number[]>([])
  const [count, setCount] = useState(10)
  const [time, setTime] = useState(5)
  const [mascotEmotion, setMascotEmotion] = useState<
    'happy' | 'sad' | 'neutral' | 'excited' | 'thinking'
  >('neutral')
  const [mascotAnimate, setMascotAnimate] = useState(false)

  const toggleTable = (t: number) => {
    setTables((prev) => {
      const has = prev.includes(t)
      if (!has) {
        setMascotEmotion('happy')
        setMascotAnimate(true)
        setTimeout(() => {
          setMascotEmotion('neutral')
          setMascotAnimate(false)
        }, 600)
      }
      return has ? prev.filter((x) => x !== t) : [...prev, t]
    })
  }

  const selectAll = () => setTables([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  const clearAll = () => setTables([])

  const canStart = tables.length > 0

  const start = () => {
    if (!canStart) return
    const params = new URLSearchParams({
      tables: [...tables].sort((a, b) => a - b).join(','),
      mode,
      operation,
      count: count.toString(),
      ...(mode === 'timed' && { time: time.toString() }),
    })
    window.location.href = `/quiz?${params.toString()}`
  }

  const startSub = (() => {
    const modeLabel = mode === 'quiz' ? 'Quiz' : mode === 'practice' ? 'Oefen' : 'Tijd'
    const tlabel = tables.length === 1 ? '1 tafel' : `${tables.length} tafels`
    const tail = mode === 'timed' ? ` · ${time}s per vraag` : ''
    return canStart
      ? `${modeLabel} · ${tlabel} · ${count} vragen${tail}`
      : 'Kies eerst je tafels'
  })()

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-4 md:space-y-6">
      {/* Back + title + mascot */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
        >
          ← Home
        </Link>
        <h2 className={`ml-auto text-2xl md:text-3xl font-bold ${cfg.accentText}`}>
          {cfg.title}
        </h2>
        <div className="flex-shrink-0">
          <Mascot emotion={mascotEmotion} size="small" animate={mascotAnimate} />
        </div>
      </div>

      {/* Mode row */}
      <Card className="border-2 shadow-xl">
        <CardContent className="p-4 md:p-6">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
            1. Kies je modus
          </h3>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {MODE_TILES.map((t) => {
              const active = mode === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setMode(t.id)}
                  className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                    active
                      ? `${MODE_GRADIENT[t.id]} border-transparent scale-105 shadow-lg`
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="text-xl">{t.emoji}</div>
                  <div>{t.label}</div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tafels */}
      <Card className="border-2 shadow-xl">
        <CardContent className="p-4 md:p-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              2. Kies je tafels
            </h3>
            <div className="flex gap-3 text-xs">
              <button onClick={selectAll} className="text-emerald-600 hover:underline font-semibold">
                alles
              </button>
              <button onClick={clearAll} className="text-gray-500 hover:underline font-semibold">
                wissen
              </button>
            </div>
          </div>
          <div className="grid grid-cols-10 gap-1.5 md:gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((t) => {
              const active = tables.includes(t)
              return (
                <button
                  key={t}
                  onClick={() => toggleTable(t)}
                  className={`aspect-square rounded-lg font-bold text-sm md:text-base transition-all ${
                    active
                      ? cfg.tileActive
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Config */}
      <Card className="border-2 shadow-xl">
        <CardContent className="p-4 md:p-6 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              3. Aantal vragen
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 30, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`py-2 rounded-lg font-bold text-sm transition-all ${
                    count === n
                      ? cfg.pillActive
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className={mode === 'timed' ? '' : 'opacity-50 pointer-events-none'}>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Tijd per vraag{' '}
              <span className="text-xs font-normal text-gray-400">
                (alleen tijdmodus)
              </span>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setTime(s)}
                  className={`py-2 rounded-lg font-bold text-sm transition-all ${
                    time === s
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {s}s
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Start */}
      <button
        onClick={start}
        disabled={!canStart}
        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
          canStart
            ? `${MODE_GRADIENT[mode]} hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0`
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        <div>Start!</div>
        <div className="text-xs font-normal opacity-90 mt-0.5">{startSub}</div>
      </button>
    </div>
  )
}
