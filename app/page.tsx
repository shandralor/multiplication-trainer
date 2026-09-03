'use client'

import Link from 'next/link'
import { AppHeader } from '@/components/app-header'
import { WorldShell } from '@/components/world-shell'
import { ANIMAL_EMOJI } from '@/lib/safe/animals'
import { PASTRIES } from '@/lib/fractions/pastries'
import { completedRungCount, RUNGS } from '@/lib/fractions/ladder'
import { emptyFractionProgress } from '@/lib/fractions/types'
import { useEnsureProfile, useProfile } from '@/lib/use-profile'
import { readResume, type ResumePoint } from '@/lib/resume'

export default function Home() {
  useEnsureProfile()
  const profile = useProfile()

  const animals = profile?.animals ?? []
  const pastries = profile?.pastries ?? []
  const fractionProgress = profile?.fractionProgress ?? emptyFractionProgress()
  const rungsDone = completedRungCount(fractionProgress)
  // Both of these read client-only state (localStorage, the clock). The
  // profile is null until after hydration, which makes it the signal for
  // "safe to render client-only values" — no separate mounted flag needed.
  const hydrated = profile !== null
  const resume = hydrated ? readResume() : null

  const divideAccuracy = accuracyFor(profile?.tableStats, 'divide')

  return (
    <WorldShell world="kluis">
      <AppHeader />

      <div className="pt-6 space-y-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-vault-dim">
            {hydrated ? todayLine() : '\u00a0'}
          </p>
          <h1 className="mt-1.5 font-display text-[2rem] font-extrabold leading-[1.02] tracking-tight text-balance">
            Wat ga je doen?
          </h1>
        </div>

        {resume && <ResumeCard resume={resume} />}

        <nav className="space-y-3" aria-label="Werelden">
          <Door
            href="/tafels"
            world="tafels"
            sign="×"
            name="Tafels"
            detail={`kluis · quiz · ${animals.length}/10 dieren`}
          />
          <Door
            href="/delen"
            world="delen"
            sign="÷"
            name="Delen"
            detail={
              divideAccuracy === null
                ? 'quiz · oefen · tijdrace'
                : `quiz · tijdrace · ${divideAccuracy}% goed`
            }
          />
          <Door
            href="/breuken"
            world="breuken"
            sign="½"
            name="Breuken"
            detail={
              rungsDone === 0
                ? `${RUNGS.length} tredes · nog niet begonnen`
                : `${rungsDone}/${RUNGS.length} tredes af · ${pastries.length}/${PASTRIES.length} gebakjes`
            }
            badge={rungsDone === 0 ? 'NIEUW' : undefined}
          />
        </nav>
      </div>

      <Link
        href="/kluiskamer"
        className="mt-6 flex items-center gap-3 rounded-2xl vault-card px-4 py-3 transition-colors hover:border-vault-green/60"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-vault-dim">
          Kluiskamer
        </span>
        <span className="ml-auto flex gap-1" aria-hidden>
          {Array.from({ length: 10 }, (_, i) => {
            const entry = animals[i]
            return (
              <span
                key={i}
                className={`grid h-6 w-6 place-items-center rounded-md text-[11px] ${
                  entry
                    ? 'border border-brass/35 bg-brass/15'
                    : 'border border-dashed border-vault-line opacity-60'
                }`}
              >
                {entry ? ANIMAL_EMOJI[entry.tableIndex] : ''}
              </span>
            )
          })}
        </span>
      </Link>
    </WorldShell>
  )
}

function ResumeCard({ resume }: { resume: ResumePoint }) {
  return (
    <Link
      href={resume.href}
      className="flex items-center gap-3 rounded-2xl vault-card px-3.5 py-3 transition-colors hover:border-brass/50"
    >
      <span
        aria-hidden
        className="grid h-9 w-9 place-items-center rounded-xl border border-vault-line bg-vault-night text-lg"
      >
        {resume.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-vault-dim">
          Verder waar je was
        </span>
        <span className="block truncate font-display text-[13px] font-bold tracking-tight">
          {resume.label}
        </span>
      </span>
      <span aria-hidden className="text-brass">
        ▶
      </span>
    </Link>
  )
}

function Door({
  href,
  world,
  sign,
  name,
  detail,
  badge,
}: {
  href: string
  world: 'tafels' | 'delen' | 'breuken'
  sign: string
  name: string
  detail: string
  badge?: string
}) {
  return (
    <Link
      href={href}
      className={`world-${world} group relative flex items-center gap-3.5 overflow-hidden rounded-2xl vault-card py-4 pl-[1.0625rem] pr-3.5 transition-all hover:border-world/50 hover:-translate-y-px`}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 bg-world"
      />
      <span
        aria-hidden
        className="grid h-[42px] w-[42px] flex-none place-items-center rounded-xl bg-world-dim font-mono text-xl font-semibold text-world"
      >
        {sign}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-display text-base font-extrabold tracking-tight">
          {name}
          {badge && (
            <span className="rounded bg-world px-1.5 py-0.5 font-mono text-[8px] font-semibold tracking-[0.12em] text-vault-night">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-0.5 block font-mono text-[10px] text-vault-dim">{detail}</span>
      </span>
      <span
        aria-hidden
        className="text-sm text-vault-dim transition-colors group-hover:text-world"
      >
        ›
      </span>
    </Link>
  )
}

function todayLine(): string {
  const days = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
  const months = [
    'januari', 'februari', 'maart', 'april', 'mei', 'juni',
    'juli', 'augustus', 'september', 'oktober', 'november', 'december',
  ]
  const now = new Date()
  return `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`
}

function accuracyFor(
  stats: Record<number, { divide: { attempts: number; correct: number } }> | undefined,
  operation: 'divide',
): number | null {
  if (!stats) return null
  let attempts = 0
  let correct = 0
  for (const table of Object.values(stats)) {
    attempts += table[operation].attempts
    correct += table[operation].correct
  }
  if (attempts === 0) return null
  return Math.round((correct / attempts) * 100)
}
