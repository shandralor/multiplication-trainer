'use client'

import Link from 'next/link'
import { AppHeader } from '@/components/app-header'
import { Mascot } from '@/components/mascot'
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
        <div className="flex items-center gap-3">
          <Mascot emotion={animals.length >= 10 ? 'excited' : 'happy'} size="medium" />
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-dim">
              {hydrated ? todayLine() : '\u00a0'}
            </p>
            <h1 className="mt-0.5 font-display text-[2.25rem] font-extrabold leading-[1.05] text-balance">
              Wat ga je doen?
            </h1>
          </div>
        </div>

        {resume && <ResumeCard resume={resume} />}

        <nav className="space-y-3.5" aria-label="Werelden">
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
                ? `${RUNGS.length} levels · nog niet begonnen`
                : `${rungsDone}/${RUNGS.length} levels af · ${pastries.length}/${PASTRIES.length} gebakjes`
            }
            badge={rungsDone === 0 ? 'NIEUW' : undefined}
          />
        </nav>
      </div>

      <Link
        href="/kluiskamer"
        className="world-kluis btn-3d-quiet mt-6 flex items-center gap-3 px-4 py-3"
      >
        <span className="font-display text-base font-extrabold text-ink">Kluiskamer</span>
        <span className="ml-auto flex gap-1" aria-hidden>
          {Array.from({ length: 10 }, (_, i) => {
            const entry = animals[i]
            return (
              <span
                key={i}
                className={`grid h-6 w-6 place-items-center rounded-md text-[12px] ${
                  entry
                    ? 'bg-world-wash ring-2 ring-world'
                    : 'bg-line'
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
      className="btn-3d-quiet flex items-center gap-3 px-4 py-3"
    >
      <span
        aria-hidden
        className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-paper text-lg"
      >
        {resume.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] text-dim">
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
      className={`world-${world} btn-3d flex w-full items-center gap-4 px-4 py-4 text-left`}
    >
      <span
        aria-hidden
        className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-white/25 text-2xl font-extrabold text-white"
      >
        {sign}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-display text-xl font-extrabold text-white">
          {name}
          {badge && (
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-extrabold text-world">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-0.5 block text-[13px] font-semibold text-white/85">{detail}</span>
      </span>
      <span aria-hidden className="text-2xl font-bold text-white/70">
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
