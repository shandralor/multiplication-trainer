'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { saveResume } from '@/lib/resume'
import { useProfile } from '@/lib/use-profile'
import type { TableStats } from '@/lib/profile-manager'

type Operation = 'multiply' | 'divide'
type QuizMode = 'quiz' | 'practice' | 'timed'

const ALL_TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

const MODES: { id: QuizMode; emoji: string; label: string }[] = [
  { id: 'quiz', emoji: '📝', label: 'Quiz' },
  { id: 'practice', emoji: '♾️', label: 'Oefen' },
  { id: 'timed', emoji: '⏱️', label: 'Tijd' },
]

type OperationSetupProps = {
  operation: Operation
  /** Tafels shows the kluis above the practice shelf; delen has no safe yet. */
  showKluis?: boolean
}

/**
 * One screen, not three stacked cards. Everything starts on a sensible
 * default — quiz, alle tafels, 10 vragen — so a kid who just wants to
 * practise can press Start! immediately, and only the ones who care
 * about the settings have to touch them.
 */
export function OperationSetup({ operation, showKluis = false }: OperationSetupProps) {
  const router = useRouter()
  const profile = useProfile()

  const [mode, setMode] = useState<QuizMode>('quiz')
  const [tables, setTables] = useState<number[]>(ALL_TABLES)
  const [count, setCount] = useState(10)
  const [time, setTime] = useState(5)

  const animals = profile?.animals ?? []
  const canStart = tables.length > 0

  const toggleTable = (t: number) =>
    setTables((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  const start = () => {
    if (!canStart) return
    const sorted = [...tables].sort((a, b) => a - b)
    const params = new URLSearchParams({
      tables: sorted.join(','),
      mode,
      operation,
      count: String(count),
      ...(mode === 'timed' && { time: String(time) }),
    })
    saveResume({
      href: `/quiz?${params.toString()}`,
      label: `${operation === 'multiply' ? 'Tafels' : 'Delen'} · ${modeLabel(mode)} · ${tafelLabel(sorted)}`,
      icon: operation === 'multiply' ? '×' : '÷',
    })
    router.push(`/quiz?${params.toString()}`)
  }

  return (
    <div className="space-y-4 pt-4">
      {showKluis && <KluisHero animals={animals} />}

      <Shelf title="Oefenen">
        <div className="grid grid-cols-3 gap-2">
          {MODES.map((m) => {
            const active = mode === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                aria-pressed={active}
                className={`rounded-xl border py-2.5 transition-all ${
                  active
                    ? 'border-world bg-world-dim'
                    : 'border-vault-line bg-vault-card hover:border-vault-dim'
                }`}
              >
                <span aria-hidden className="block text-[15px] leading-none">
                  {m.emoji}
                </span>
                <span
                  className={`mt-1 block font-display text-[11px] font-bold tracking-tight ${
                    active ? 'text-world' : ''
                  }`}
                >
                  {m.label}
                </span>
              </button>
            )
          })}
        </div>
      </Shelf>

      <Shelf
        title="Welke tafels"
        action={
          <div className="flex gap-3">
            <TinyButton onClick={() => setTables(ALL_TABLES)}>alles</TinyButton>
            <TinyButton onClick={() => setTables([])}>wissen</TinyButton>
          </div>
        }
      >
        <div className="grid grid-cols-5 gap-2">
          {ALL_TABLES.map((t) => (
            <TableCell
              key={t}
              table={t}
              selected={tables.includes(t)}
              mastery={masteryFor(profile?.tableStats, t, operation)}
              onToggle={() => toggleTable(t)}
            />
          ))}
        </div>
      </Shelf>

      <Shelf title="Hoeveel vragen">
        <div className="grid grid-cols-4 gap-2">
          {[10, 20, 30, 50].map((n) => (
            <Pill key={n} active={count === n} onClick={() => setCount(n)}>
              {n}
            </Pill>
          ))}
        </div>

        {mode === 'timed' && (
          <div className="mt-3">
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-vault-dim">
              Seconden per vraag
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[3, 4, 5].map((s) => (
                <Pill key={s} active={time === s} onClick={() => setTime(s)}>
                  {s}s
                </Pill>
              ))}
            </div>
          </div>
        )}
      </Shelf>

      <button
        type="button"
        onClick={start}
        disabled={!canStart}
        className={`w-full rounded-2xl py-3.5 transition-all ${
          canStart
            ? 'bg-world text-vault-night hover:-translate-y-px'
            : 'cursor-not-allowed border border-vault-line bg-vault-card text-vault-dim'
        }`}
      >
        <span className="block font-display text-base font-extrabold tracking-tight">Start!</span>
        <span className="mt-0.5 block font-mono text-[10px] opacity-75">
          {canStart
            ? `${modeLabel(mode)} · ${tafelLabel(tables)} · ${count} vragen${
                mode === 'timed' ? ` · ${time}s` : ''
              }`
            : 'Kies eerst je tafels'}
        </span>
      </button>
    </div>
  )
}

function KluisHero({ animals }: { animals: { tableIndex: number }[] }) {
  const remaining = 10 - animals.length
  return (
    <Link
      href="/tafels/kluis"
      className="flex items-center gap-3.5 rounded-2xl vault-card-lit p-4 transition-transform hover:-translate-y-px"
    >
      <span className="flex-1">
        <span className="block font-display text-lg font-extrabold tracking-tight">
          Kraak de kluis
        </span>
        <span className="mt-1 block font-mono text-[10px] text-vault-dim">
          {remaining === 0
            ? 'alle dieren bevrijd — ga voor platina'
            : `nog ${remaining} ${remaining === 1 ? 'dier' : 'dieren'} opgesloten`}
        </span>
        <span className="mt-2.5 inline-block rounded-md bg-brass px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-vault-night">
          {animals.length === 0 ? 'Begin de kraak' : 'Verder kraken'}
        </span>
      </span>
      <span aria-hidden className="text-[44px] leading-none">
        🔐
      </span>
    </Link>
  )
}

function TableCell({
  table,
  selected,
  mastery,
  onToggle,
}: {
  table: number
  selected: boolean
  mastery: number | null
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      aria-label={`Tafel van ${table}${mastery === null ? '' : `, ${mastery}% goed`}`}
      className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border font-mono text-[13px] font-semibold transition-all ${
        selected
          ? 'border-world bg-world-dim text-world'
          : 'border-vault-line bg-vault-card text-vault-ink hover:border-vault-dim'
      }`}
    >
      {table}
      {/* Mastery from tableStats: the picker tells you something instead
          of only asking. An untouched tafel shows a flat rule. */}
      <span
        aria-hidden
        className="block h-0.5 w-3.5 overflow-hidden rounded-sm bg-vault-line"
      >
        {mastery !== null && (
          <span className="block h-full bg-world" style={{ width: `${mastery}%` }} />
        )}
      </span>
    </button>
  )
}

function Shelf({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-3">
        <h2 className="font-mono text-[9px] uppercase tracking-[0.14em] text-vault-dim">
          {title}
        </h2>
        <span aria-hidden className="h-px flex-1 bg-vault-line" />
        {action}
      </div>
      {children}
    </section>
  )
}

function TinyButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-mono text-[10px] text-vault-dim underline-offset-2 transition-colors hover:text-world hover:underline"
    >
      {children}
    </button>
  )
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg border py-2 font-mono text-[13px] font-medium tabular transition-all ${
        active
          ? 'border-world bg-world-dim text-world'
          : 'border-vault-line bg-vault-card text-vault-ink hover:border-vault-dim'
      }`}
    >
      {children}
    </button>
  )
}

function modeLabel(mode: QuizMode): string {
  return mode === 'quiz' ? 'Quiz' : mode === 'practice' ? 'Oefen' : 'Tijd'
}

function tafelLabel(tables: number[]): string {
  if (tables.length === 10) return 'alle tafels'
  return tables.length === 1 ? '1 tafel' : `${tables.length} tafels`
}

/** Percentage correct for one tafel, or null when it has never been tried. */
function masteryFor(
  stats: TableStats | undefined,
  table: number,
  operation: Operation,
): number | null {
  const entry = stats?.[table]?.[operation]
  if (!entry || entry.attempts === 0) return null
  return Math.round((entry.correct / entry.attempts) * 100)
}
