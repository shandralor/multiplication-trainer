'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ModePicker, type SafeMode } from '@/components/safe/mode-picker'
import { DifficultyPicker } from '@/components/safe/difficulty-picker'
import { CollectionStrip } from '@/components/safe/collection-strip'
import { AnimalBadge } from '@/components/safe/animal-badge'
import { SafeDial, type SlotStatus } from '@/components/safe/safe-dial'
import { Numpad } from '@/components/safe/numpad'
import { SafeReveal } from '@/components/safe/safe-reveal'
import {
  buildSafe,
  endlessSafeTimer,
  gapsForSafe,
  scoreTier,
  shuffleTables,
  type Difficulty,
  type SafeOperation,
  type SafeSlot,
} from '@/lib/safe/safe-logic'
import { addSafeRunResult, awardAnimalForSafe, resetAnimalCollection, resetAnimalForTable, type SafeRunPerSafe } from '@/lib/safe/safe-progress'
import { confirmToast } from '@/lib/confirm-toast'
import { toast } from 'sonner'
import { MedalRow } from '@/components/safe/medal-row'
import { ACHIEVEMENTS, type AchievementId } from '@/lib/safe/achievements'
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

export type SafePageProps = {
  /**
   * Which sum the slots pose. The dial, numpad, tiers, animals and medals
   * are all identical — a deelkluis is the same safe read backwards.
   */
  operation?: SafeOperation
}

export default function SafePage({ operation = 'multiply' }: SafePageProps) {
  const isDivide = operation === 'divide'
  const worldClass = isDivide ? 'world-delen' : 'world-tafels'
  const backHref = isDivide ? '/delen' : '/tafels'
  const backLabel = isDivide ? 'Delen' : 'Tafels'

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
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [endlessTimedOut, setEndlessTimedOut] = useState(false)
  const [safeStartedAt, setSafeStartedAt] = useState<number | null>(null)
  const [justEarnedAchievements, setJustEarnedAchievements] = useState<AchievementId[]>([])

  useEffect(() => {
    initializeProfiles()
    setProfile(getCurrentProfile())
  }, [])

  // Endless countdown: only ticks while on the play screen with an active timer.
  useEffect(() => {
    if (screen !== 'play' || mode !== 'safe-endless' || timeRemaining === null) return
    if (timeRemaining <= 0) return
    const handle = setInterval(() => {
      setTimeRemaining((t) => (t === null ? null : t - 1))
    }, 1000)
    return () => clearInterval(handle)
  }, [screen, mode, timeRemaining])

  // When time hits 0 in Endless mode, force the safe to complete.
  useEffect(() => {
    if (mode !== 'safe-endless' || screen !== 'play') return
    if (timeRemaining !== 0 || !currentSafe) return
    setEndlessTimedOut(true)
    // Any still-empty gaps count as mistakes; reveal the answers.
    const runtime = currentSafe.runtime.map((r, i) =>
      r.status === 'gap-empty'
        ? { status: 'gap-revealed' as const, display: String(currentSafe.slots[i].answer) }
        : r,
    )
    const newMistakes = currentSafe.runtime.filter((r) => r.status === 'gap-empty').length
    const timedOutSafe: InFlightSafe = {
      ...currentSafe,
      runtime,
      mistakes: currentSafe.mistakes + newMistakes,
      activeFactor: null,
      input: '',
    }
    setCurrentSafe(timedOutSafe)
    completeSafe(timedOutSafe)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining])

  const toggleTable = (t: number) =>
    setSelectedTables((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  const selectAll = () => setSelectedTables([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  const clearAll = () => setSelectedTables([])
  const canStart = selectedTables.length > 0

  // ------- helpers -------

  const drawTable = useCallback(
    (currentDeck: number[]): { table: number; nextDeck: number[] } => {
      // Empty deck means either the very first draw of a run or a subsequent
      // exhaustion. In both cases we (re)shuffle. Run mode's end-of-run check
      // in continueFromReveal prevents us from reshuffling mid-run — we only
      // hit this path for the very first safe or in Eindeloos mode.
      const d = currentDeck.length > 0 ? currentDeck : shuffleTables(selectedTables)
      const [table, ...rest] = d
      return { table, nextDeck: rest }
    },
    [selectedTables],
  )

  const openNextSafe = useCallback(
    (nextIndex: number, d: number[]) => {
      const { table, nextDeck } = drawTable(d)
      const gapCount = gapsForSafe(difficulty, nextIndex)
      const slots = buildSafe({ table, gapCount, operation })
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
      setTimeRemaining(mode === 'safe-endless' ? endlessSafeTimer(nextIndex) : null)
      setSafeStartedAt(Date.now())
    },
    [difficulty, drawTable, mode, operation],
  )

  const resetRunState = () => {
    setPerSafe([])
    setCurrentSafe(null)
    setDeck([])
    setSafeIndex(1)
    setTimeRemaining(null)
    setEndlessTimedOut(false)
    setSafeStartedAt(null)
    setReveal(null)
    setJustEarnedAchievements([])
  }

  const startRun = () => {
    resetRunState()
    openNextSafe(1, [])
    setScreen('play')
  }

  const abortRun = () => {
    confirmToast({
      message: 'Stop met deze ronde? Je voortgang gaat verloren.',
      confirmLabel: 'Stop',
      onConfirm: () => {
        resetRunState()
        setScreen('start')
      },
    })
  }

  const restartRun = () => {
    confirmToast({
      message: 'Deze ronde opnieuw beginnen met dezelfde instellingen?',
      confirmLabel: 'Herstart',
      onConfirm: () => {
        resetRunState()
        openNextSafe(1, [])
        setScreen('play')
      },
    })
  }

  const handleResetTable = (t: number) => {
    confirmToast({
      message: `Dier voor de tafel van ${t} resetten? Medailles blijven bewaard.`,
      confirmLabel: 'Reset',
      onConfirm: () => {
        resetAnimalForTable(t)
        setProfile(getCurrentProfile())
        toast.success(`Tafel van ${t} gereset.`)
      },
    })
  }

  const handleResetAll = () => {
    confirmToast({
      message: 'Alle dieren resetten? Medailles blijven bewaard.',
      confirmLabel: 'Reset alles',
      onConfirm: () => {
        resetAnimalCollection()
        setProfile(getCurrentProfile())
        toast.success('Verzameling gereset.')
      },
    })
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
    const tier: AnimalTier = scoreTier(safe.mistakes, difficulty)
    const durationMs = safeStartedAt !== null ? Date.now() - safeStartedAt : undefined

    const entry: SafeRunPerSafe = {
      tableIndex: safe.table,
      tier,
      mistakes: safe.mistakes,
      gapsFilled,
      durationMs,
      mode,
      difficulty,
    }

    // Persist this safe immediately so the collection strip updates between safes.
    const { upgraded, newAchievements } = awardAnimalForSafe(entry)
    setProfile(getCurrentProfile())
    if (newAchievements.length > 0) {
      setJustEarnedAchievements((prev) => [...prev, ...newAchievements])
    }

    setPerSafe((prev) => [...prev, entry])
    setReveal({ tableIndex: safe.table, tier, upgraded })
    setScreen('reveal')
  }

  const continueFromReveal = () => {
    setReveal(null)
    const nextIndex = safeIndex + 1
    const endlessLock = mode === 'safe-endless' && endlessTimedOut
    const runComplete = mode === 'safe-run' && perSafe.length >= selectedTables.length
    if (endlessLock || runComplete) {
      finalizeRun()
      setScreen('scorecard')
    } else {
      setEndlessTimedOut(false)
      openNextSafe(nextIndex, deck)
      setScreen('play')
    }
  }

  const finalizeRun = () => {
    const { newAchievements } = addSafeRunResult(perSafe, {
      mode,
      difficulty,
      tablesPicked: selectedTables,
    })
    if (newAchievements.length > 0) {
      setJustEarnedAchievements((prev) => [...prev, ...newAchievements])
    }
    setProfile(getCurrentProfile())
  }

  // ------- screens -------

  if (screen === 'start') {
    return (
      <StartScreen
        profile={profile}
        worldClass={worldClass}
        isDivide={isDivide}
        backHref={backHref}
        backLabel={backLabel}
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
        onResetTable={handleResetTable}
        onResetAll={handleResetAll}
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
      <div className={`min-h-screen bg-vault ${worldClass} text-vault-ink`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3 gap-2">
            <button
              onClick={abortRun}
              className="rounded-lg border border-vault-line bg-vault-card px-3 py-1.5 font-display text-sm font-bold text-vault-ink transition-colors hover:border-brass"
            >
              ← Terug
            </button>
            <button
              onClick={restartRun}
              className="rounded-lg border border-vault-line bg-vault-card px-3 py-1.5 font-display text-sm font-bold text-vault-dim transition-colors hover:border-world hover:text-vault-ink"
            >
              ↻ Herstart
            </button>
            <Link
              href={backHref}
              className="rounded-lg border border-vault-line bg-vault-card px-3 py-1.5 font-display text-sm font-bold text-vault-ink transition-colors hover:border-world"
            >
              {backLabel}
            </Link>
          </div>

          {profile && <CollectionStrip animals={profile.animals} compact />}

          <div className="my-3 flex flex-wrap items-center justify-center gap-3 text-center font-mono text-xs text-vault-dim">
            <span>
              {mode === 'safe-run' ? `Kluis ${safeIndex} / ${selectedTables.length}` : `Kluis ${Math.min(safeIndex, 99)}${safeIndex > 99 ? '+' : ''}`}
            </span>
            <span>·</span>
            <span>{gapsResolved} / {gapsTotal} opgelost</span>
            <span>·</span>
            <span>{currentSafe.mistakes} fout</span>
            {mode === 'safe-endless' && timeRemaining !== null && (
              <>
                <span>·</span>
                <span className={`font-bold ${timeRemaining <= 10 ? 'text-red-400 animate-pulse' : 'text-emerald-300'}`}>
                  ⏱ {Math.max(0, timeRemaining)}s
                </span>
              </>
            )}
          </div>

          <div className="py-14 md:py-16">
            <SafeDial
              slots={currentSafe.slots}
              statuses={statuses}
              activeFactor={currentSafe.activeFactor}
              onSlotClick={handleSlotClick}
              label={`${isDivide ? '\u00f7' : '\u00d7'}${currentSafe.table}`}
              title={isDivide ? 'Kraak de deelkluis' : 'Kraak de kluis'}
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
      <div className={`min-h-screen bg-vault ${worldClass} text-vault-ink`}>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-extrabold text-center mb-6">Scorekaart</h1>
          {profile && (
            <div className="mb-6">
              <CollectionStrip animals={profile.animals} />
            </div>
          )}
          <Card className="vault-card mb-6 rounded-2xl">
            <CardContent className="p-5 space-y-2">
              <div className="text-lg">Kluizen gekraakt: <span className="font-extrabold">{perSafe.length}</span></div>
              <div className="flex gap-4 text-lg">
                <span className="text-yellow-300">🥇 {tiers.gold}</span>
                <span className="text-vault-dim">🥈 {tiers.silver}</span>
                <span className="text-amber-600">🥉 {tiers.bronze}</span>
              </div>
              <div className="font-mono text-xs text-vault-dim">
                Totaal fout: {perSafe.reduce((a, s) => a + s.mistakes, 0)}
              </div>
            </CardContent>
          </Card>

          {justEarnedAchievements.length > 0 && (
            <Card className="bg-yellow-500/20 border-yellow-400/50 text-white mb-6">
              <CardContent className="p-5">
                <div className="text-sm font-bold tracking-wider text-yellow-300 mb-3">
                  Nieuwe medailles!
                </div>
                <div className="space-y-2">
                  {justEarnedAchievements.map((id) => (
                    <div key={id} className="flex items-center gap-3">
                      <Image
                        src={ACHIEVEMENTS[id].medalPath}
                        alt={ACHIEVEMENTS[id].label}
                        width={32}
                        height={54}
                        className="object-contain"
                      />
                      <div>
                        <div className="font-bold">{ACHIEVEMENTS[id].label}</div>
                        <div className="text-xs opacity-80">{ACHIEVEMENTS[id].description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {justEarnedAchievements.includes('all-gold') && (
            <Card className="bg-gradient-to-br from-yellow-500/30 to-amber-600/30 border-yellow-400 text-white mb-6">
              <CardContent className="p-5 space-y-3">
                <div className="text-lg font-extrabold">🏆 Kluis compleet!</div>
                <div className="text-sm opacity-90">
                  Alle dieren op goud — een nieuwe ronde start de verzameling opnieuw, maar je medailles blijven bewaard.
                </div>
                <button
                  onClick={() => {
                    resetAnimalCollection()
                    setProfile(getCurrentProfile())
                    setJustEarnedAchievements([])
                    setScreen('start')
                    setPerSafe([])
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 text-white font-bold shadow-lg"
                >
                  Verzameling resetten en opnieuw beginnen
                </button>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setScreen('start')
                setPerSafe([])
                setJustEarnedAchievements([])
              }}
              className="py-3 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 text-white font-bold shadow-lg"
            >
              Nog een keer
            </button>
            <Link href={backHref} className="block">
              <button className="w-full rounded-xl border border-vault-line bg-vault-card py-3 font-display font-bold text-vault-ink transition-colors hover:border-brass">
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
  worldClass: string
  isDivide: boolean
  backHref: string
  backLabel: string
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
  onResetTable: (table: number) => void
  onResetAll: () => void
}) {
  const {
    profile, worldClass, isDivide, backHref, backLabel,
    mode, setMode, difficulty, setDifficulty, selectedTables, toggleTable,
    selectAll, clearAll, canStart, onStart, onResetTable, onResetAll,
  } = props
  const hasAnyAnimals = (profile?.animals?.length ?? 0) > 0
  const tierByTable = new Map<number, 'bronze' | 'silver' | 'gold' | 'platinum'>(
    (profile?.animals ?? []).map((a) => [a.tableIndex, a.tier]),
  )
  return (
    <div className={`min-h-screen bg-vault ${worldClass} text-vault-ink`}>
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
        <div className="mb-6 flex items-center justify-between md:mb-10">
          <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            <span aria-hidden>🔐</span> {isDivide ? 'Kraak de deelkluis' : 'Kraak de kluis'}
          </h1>
          <Link
            href={backHref}
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-vault-dim transition-colors hover:text-vault-ink"
          >
            ← {backLabel}
          </Link>
        </div>

        {profile && profile.achievements && profile.achievements.length > 0 && (
          <div className="mb-4 md:mb-8">
            <MedalRow earned={profile.achievements} />
          </div>
        )}

        <Card className="vault-card mb-4 rounded-2xl md:mb-8">
          <CardContent className="p-5 md:p-8 space-y-4 md:space-y-8">
            <div>
              <h2 className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-vault-dim">
                Modus
              </h2>
              <ModePicker value={mode} onChange={setMode} />
            </div>
            <div>
              <h2 className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-vault-dim">
                Moeilijkheid
              </h2>
              <DifficultyPicker value={difficulty} onChange={setDifficulty} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-mono text-[9px] uppercase tracking-[0.14em] text-vault-dim">
                  Tafels
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="font-mono text-[10px] text-vault-dim underline-offset-2 transition-colors hover:text-brass hover:underline"
                  >
                    alles
                  </button>
                  <button
                    onClick={clearAll}
                    className="font-mono text-[10px] text-vault-dim underline-offset-2 transition-colors hover:text-brass hover:underline"
                  >
                    wissen
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 md:gap-4">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((t) => {
                  const earned = tierByTable.has(t)
                  return (
                    <div key={t} className="relative">
                      <button
                        onClick={() => toggleTable(t)}
                        aria-pressed={selectedTables.includes(t)}
                        className={`flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border p-1 font-mono font-semibold transition-all ${
                          selectedTables.includes(t)
                            ? 'border-brass bg-brass/15 text-brass'
                            : 'border-vault-line bg-vault-card text-vault-ink hover:border-vault-dim'
                        }`}
                      >
                        <span className="text-xl leading-none">{t}</span>
                        <AnimalBadge
                          tableIndex={t}
                          tier={tierByTable.get(t) ?? null}
                          size="small"
                        />
                      </button>
                      {earned && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onResetTable(t)
                          }}
                          className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-vault-night bg-fout text-xs font-bold text-vault-night transition-colors hover:bg-fout/80"
                          aria-label={`Reset tafel ${t}`}
                          title="Reset dit dier"
                        >
                          ↻
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
              {hasAnyAnimals && (
                <div className="mt-3 text-right">
                  <button
                    onClick={onResetAll}
                    className="text-xs font-semibold text-rose-300 hover:text-rose-200 underline-offset-2 hover:underline"
                  >
                    Verzameling resetten
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <button
          onClick={() => canStart && onStart()}
          disabled={!canStart}
          className={`w-full rounded-2xl py-4 font-display text-lg font-extrabold tracking-tight transition-all ${
            canStart
              ? 'bg-brass text-vault-night hover:-translate-y-px'
              : 'cursor-not-allowed border border-vault-line bg-vault-card text-vault-dim'
          }`}
        >
          🔓 Start kraken
        </button>
      </div>
    </div>
  )
}
