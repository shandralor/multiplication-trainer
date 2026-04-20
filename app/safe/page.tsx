'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ModePicker, type SafeMode } from '@/components/safe/mode-picker'
import { DifficultyPicker } from '@/components/safe/difficulty-picker'
import { CollectionStrip } from '@/components/safe/collection-strip'
import { AnimalBadge } from '@/components/safe/animal-badge'
import { SafeDial, type SlotStatus } from '@/components/safe/safe-dial'
import { Numpad } from '@/components/safe/numpad'
import { SafeReveal } from '@/components/safe/safe-reveal'
import {
  buildSafe,
  gapsForSafe,
  scoreTier,
  shuffleTables,
  type Difficulty,
  type SafeSlot,
} from '@/lib/safe/safe-logic'
import { addSafeRunResult, awardAnimalForSafe, type SafeRunPerSafe } from '@/lib/safe/safe-progress'
import {
  getCurrentProfile,
  initializeProfiles,
  type AnimalTier,
  type UserProfile,
} from '@/lib/profile-manager'

type Screen = 'start' | 'play' | 'reveal' | 'scorecard'

type SlotRuntime = {
  status: SlotStatus['state']
  display: string             // what's in the slot right now (number, partial entry, or '?')
}

type InFlightSafe = {
  table: number
  slots: SafeSlot[]
  runtime: SlotRuntime[]
  activeFactor: number | null
  input: string
  mistakes: number
}

// Run mode length = number of tables the kid selected; Endless keeps going.

export default function SafePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [screen, setScreen] = useState<Screen>('start')
  const [mode, setMode] = useState<SafeMode>('safe-run')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [selectedTables, setSelectedTables] = useState<number[]>([])

  // Run state
  const [safeIndex, setSafeIndex] = useState(1)       // 1-based
  const [deck, setDeck] = useState<number[]>([])      // shuffled table queue
  const [currentSafe, setCurrentSafe] = useState<InFlightSafe | null>(null)
  const [perSafe, setPerSafe] = useState<SafeRunPerSafe[]>([])
  const [reveal, setReveal] = useState<{ tableIndex: number; tier: AnimalTier; upgraded: boolean } | null>(null)

  useEffect(() => {
    initializeProfiles()
    setProfile(getCurrentProfile())
  }, [])

  const toggleTable = (t: number) =>
    setSelectedTables((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  const selectAll = () => setSelectedTables([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  const clearAll = () => setSelectedTables([])
  const canStart = selectedTables.length > 0

  // ------- helpers -------

  const drawTable = useCallback(
    (currentDeck: number[], currentMode: SafeMode): { table: number; nextDeck: number[] } => {
      // Run mode: deck is drained exactly once (one pass through selectedTables).
      // Endless mode: reshuffle when empty so the run can continue indefinitely.
      const d = currentDeck.length > 0
        ? currentDeck
        : currentMode === 'safe-endless'
          ? shuffleTables(selectedTables)
          : currentDeck
      const [table, ...rest] = d
      return { table, nextDeck: rest }
    },
    [selectedTables],
  )

  const openNextSafe = useCallback(
    (nextIndex: number, d: number[]) => {
      const { table, nextDeck } = drawTable(d, mode)
      const gapCount = gapsForSafe(difficulty, nextIndex)
      const slots = buildSafe({ table, gapCount })
      const runtime: SlotRuntime[] = slots.map((s) =>
        s.isGap
          ? { status: 'gap-empty', display: '?' }
          : { status: 'prefilled', display: String(s.answer) },
      )
      const firstGap = slots.find((s) => s.isGap)?.factor ?? null
      setCurrentSafe({
        table,
        slots,
        runtime,
        activeFactor: firstGap,
        input: '',
        mistakes: 0,
      })
      setDeck(nextDeck)
      setSafeIndex(nextIndex)
    },
    [difficulty, drawTable, mode],
  )

  const startRun = () => {
    setPerSafe([])
    openNextSafe(1, [])
    setScreen('play')
  }

  // ------- play interactions -------

  const handleSlotClick = (factor: number) => {
    if (!currentSafe) return
    const idx = currentSafe.slots.findIndex((s) => s.factor === factor)
    if (idx === -1) return
    if (!currentSafe.slots[idx].isGap) return
    if (currentSafe.runtime[idx].status !== 'gap-empty') return
    setCurrentSafe({ ...currentSafe, activeFactor: factor, input: '' })
  }

  const updateInput = (next: string) => {
    if (!currentSafe || currentSafe.activeFactor === null) return
    setCurrentSafe((prev) => {
      if (!prev || prev.activeFactor === null) return prev
      const idx = prev.slots.findIndex((s) => s.factor === prev.activeFactor)
      if (idx === -1 || prev.runtime[idx].status !== 'gap-empty') return prev
      const runtime = [...prev.runtime]
      runtime[idx] = { ...runtime[idx], display: next.length > 0 ? next : '?' }
      return { ...prev, runtime, input: next }
    })
  }

  const submitInput = () => {
    if (!currentSafe || currentSafe.activeFactor === null) return
    const factor = currentSafe.activeFactor
    const idx = currentSafe.slots.findIndex((s) => s.factor === factor)
    if (idx === -1) return
    const slot = currentSafe.slots[idx]
    const parsed = parseInt(currentSafe.input, 10)
    if (isNaN(parsed)) return

    const runtime = [...currentSafe.runtime]
    let mistakes = currentSafe.mistakes

    if (parsed === slot.answer) {
      runtime[idx] = { status: 'gap-correct', display: String(slot.answer) }
    } else {
      runtime[idx] = { status: 'gap-revealed', display: String(slot.answer) }
      mistakes += 1
    }

    // Find next empty gap clockwise by wheel position.
    const nextFactor = findNextGap(currentSafe.slots, runtime, idx)
    const updated: InFlightSafe = {
      ...currentSafe,
      runtime,
      mistakes,
      input: '',
      activeFactor: nextFactor,
    }
    setCurrentSafe(updated)

    if (nextFactor === null) {
      completeSafe(updated)
    }
  }

  const completeSafe = (safe: InFlightSafe) => {
    const gapsFilled = safe.slots.filter((s) => s.isGap).length
    const tier: AnimalTier = scoreTier(safe.mistakes)

    const entry: SafeRunPerSafe = {
      tableIndex: safe.table,
      tier,
      mistakes: safe.mistakes,
      gapsFilled,
    }

    // Persist this safe immediately so the collection strip updates between safes.
    const { upgraded } = awardAnimalForSafe(entry)
    setProfile(getCurrentProfile())

    setPerSafe((prev) => [...prev, entry])
    setReveal({ tableIndex: safe.table, tier, upgraded })
    setScreen('reveal')
  }

  const continueFromReveal = () => {
    setReveal(null)
    const nextIndex = safeIndex + 1
    const endlessLock = mode === 'safe-endless' && perSafe[perSafe.length - 1]?.tier === 'bronze'
    const runComplete = mode === 'safe-run' && perSafe.length >= selectedTables.length
    if (endlessLock || runComplete) {
      finalizeRun()
      setScreen('scorecard')
    } else {
      openNextSafe(nextIndex, deck)
      setScreen('play')
    }
  }

  const finalizeRun = () => {
    addSafeRunResult(perSafe, {
      mode,
      difficulty,
      tablesPicked: selectedTables,
    })
    setProfile(getCurrentProfile())
  }

  // ------- screens -------

  if (screen === 'start') {
    return (
      <StartScreen
        profile={profile}
        mode={mode}
        setMode={setMode}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        selectedTables={selectedTables}
        toggleTable={toggleTable}
        selectAll={selectAll}
        clearAll={clearAll}
        canStart={canStart}
        onStart={startRun}
      />
    )
  }

  if (screen === 'play' && currentSafe) {
    const gapsTotal = currentSafe.slots.filter((s) => s.isGap).length
    const gapsResolved = currentSafe.runtime.filter(
      (r) => r.status === 'gap-correct' || r.status === 'gap-revealed',
    ).length
    const statuses: SlotStatus[] = currentSafe.runtime.map((r) => ({
      state: r.status,
      displayValue: r.display,
    }))
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => {
                if (confirm('Stop met deze kluis? Je vooruitgang in deze run gaat verloren.')) {
                  setScreen('start')
                  setPerSafe([])
                  setCurrentSafe(null)
                }
              }}
              className="text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg"
            >
              ← Terug
            </button>
            <Link href="/" className="text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg">
              Home
            </Link>
          </div>

          {profile && <CollectionStrip animals={profile.animals} compact />}

          <div className="text-center my-3 text-sm text-gray-300">
            {mode === 'safe-run' ? `Kluis ${safeIndex} / ${selectedTables.length}` : `Kluis ${Math.min(safeIndex, 99)}${safeIndex > 99 ? '+' : ''}`}
            {' · '}
            {gapsResolved} / {gapsTotal} opgelost · {currentSafe.mistakes} fout
          </div>

          <div className="py-14 md:py-16">
            <SafeDial
              slots={currentSafe.slots}
              statuses={statuses}
              activeFactor={currentSafe.activeFactor}
              onSlotClick={handleSlotClick}
              label={`×${currentSafe.table}`}
              subLabel={`${gapsResolved} / ${gapsTotal} ingevuld`}
            />
          </div>

          <div className="mt-6">
            <Numpad
              value={currentSafe.input}
              onChange={updateInput}
              onSubmit={submitInput}
              disabled={currentSafe.activeFactor === null}
            />
          </div>
        </div>

        {screen === 'play' && reveal === null && null}
      </div>
    )
  }

  if (screen === 'reveal' && reveal) {
    return (
      <SafeReveal
        tableIndex={reveal.tableIndex}
        tier={reveal.tier}
        upgraded={reveal.upgraded}
        onContinue={continueFromReveal}
      />
    )
  }

  if (screen === 'scorecard') {
    const tiers = {
      gold: perSafe.filter((s) => s.tier === 'gold').length,
      silver: perSafe.filter((s) => s.tier === 'silver').length,
      bronze: perSafe.filter((s) => s.tier === 'bronze').length,
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-extrabold text-center mb-6">Scorekaart</h1>
          {profile && (
            <div className="mb-6">
              <CollectionStrip animals={profile.animals} />
            </div>
          )}
          <Card className="bg-white/10 border-white/20 text-white mb-6">
            <CardContent className="p-5 space-y-2">
              <div className="text-lg">Kluizen gekraakt: <span className="font-extrabold">{perSafe.length}</span></div>
              <div className="flex gap-4 text-lg">
                <span className="text-yellow-300">🥇 {tiers.gold}</span>
                <span className="text-gray-200">🥈 {tiers.silver}</span>
                <span className="text-amber-600">🥉 {tiers.bronze}</span>
              </div>
              <div className="text-sm text-gray-300">
                Totaal fout: {perSafe.reduce((a, s) => a + s.mistakes, 0)}
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setScreen('start')
                setPerSafe([])
              }}
              className="py-3 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 text-white font-bold shadow-lg"
            >
              Nog een keer
            </button>
            <Link href="/" className="block">
              <button className="w-full py-3 rounded-xl bg-white/10 border border-white/30 text-white font-bold">
                Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// ---------- helpers ----------

function findNextGap(slots: SafeSlot[], runtime: SlotRuntime[], fromIndex: number): number | null {
  for (let i = 1; i <= slots.length; i++) {
    const probe = (fromIndex + i) % slots.length
    if (runtime[probe].status === 'gap-empty') return slots[probe].factor
  }
  return null
}

function StartScreen(props: {
  profile: UserProfile | null
  mode: SafeMode
  setMode: (m: SafeMode) => void
  difficulty: Difficulty
  setDifficulty: (d: Difficulty) => void
  selectedTables: number[]
  toggleTable: (t: number) => void
  selectAll: () => void
  clearAll: () => void
  canStart: boolean
  onStart: () => void
}) {
  const { profile, mode, setMode, difficulty, setDifficulty, selectedTables, toggleTable, selectAll, clearAll, canStart, onStart } = props
  const tierByTable = new Map<number, 'bronze' | 'silver' | 'gold'>(
    (profile?.animals ?? []).map((a) => [a.tableIndex, a.tier]),
  )
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
                  <button
                    onClick={selectAll}
                    className="text-sm font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/40 px-3 py-1 rounded-md"
                  >
                    Alles
                  </button>
                  <button
                    onClick={clearAll}
                    className="text-sm font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/40 px-3 py-1 rounded-md"
                  >
                    Wissen
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleTable(t)}
                    className={`aspect-square rounded-xl font-bold transition-all flex flex-col items-center justify-center gap-1 p-1 ${
                      selectedTables.includes(t)
                        ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white scale-105 shadow-lg'
                        : 'bg-white/10 text-gray-200 hover:bg-white/20'
                    }`}
                  >
                    <span className="text-xl leading-none">{t}</span>
                    <AnimalBadge
                      tableIndex={t}
                      tier={tierByTable.get(t) ?? null}
                      size="small"
                    />
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <button
          onClick={() => canStart && onStart()}
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
