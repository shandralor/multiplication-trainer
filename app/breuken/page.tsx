'use client'

import Link from 'next/link'
import { AppHeader } from '@/components/app-header'
import { WorldShell } from '@/components/world-shell'
import { Mascot } from '@/components/mascot'
import {
  RUNGS,
  completedRungCount,
  isRungComplete,
  isRungUnlocked,
  rungDef,
} from '@/lib/fractions/ladder'
import { PASTRIES, getPastry } from '@/lib/fractions/pastries'
import { PastryIcon } from '@/components/fractions/pastry-icon'
import { emptyFractionProgress, type Rung } from '@/lib/fractions/types'
import { useEnsureProfile, useProfile } from '@/lib/use-profile'

export default function BreukenPage() {
  useEnsureProfile()
  const profile = useProfile()

  const progress = profile?.fractionProgress ?? emptyFractionProgress()
  const pastries = profile?.pastries ?? []
  const unlockAll = profile?.settings.unlockAllRungs ?? false

  const done = completedRungCount(progress)
  const mood = done === RUNGS.length ? 'excited' : done > 0 ? 'happy' : 'neutral'
  const ladderLine =
    done === RUNGS.length
      ? 'Alle vier de tredes gehaald. Je bent een breukenbaas.'
      : done > 0
        ? `Trede ${done + 1} staat voor je klaar.`
        : unlockAll
          ? 'Alle tredes staan open — kies er maar een.'
          : 'Elke trede opent de volgende.'

  return (
    <WorldShell world="breuken" backHref="/">
      <AppHeader />

      <div className="flex items-center gap-4 pt-5">
        {/* The mascot reads the ladder: pleased once a trede is done,
            delighted when the whole thing is. */}
        <Mascot emotion={mood} size="large" />
        <div className="min-w-0">
          <h1 className="font-display text-[1.4rem] font-extrabold tracking-tight text-balance">
            {done === 0
              ? 'Klim de ladder op'
              : done === RUNGS.length
                ? 'De hele ladder is af!'
                : `${done} van de ${RUNGS.length} tredes af`}
          </h1>
          <p className="mt-1.5 text-[12px] leading-snug text-dim">{ladderLine}</p>
        </div>
      </div>

      <ol className="mt-4 space-y-2">
        {RUNGS.map((def) => {
          const p = progress[def.rung]
          const unlocked = isRungUnlocked(def.rung, progress, { unlockAll })
          const complete = isRungComplete(def.rung, progress)
          return (
            <li key={def.rung}>
              <RungRow
                rung={def.rung}
                unlocked={unlocked}
                complete={complete}
                correct={p.correct}
              />
            </li>
          )
        })}
      </ol>

      <section className="mt-5 flex items-center gap-3 rounded-2xl card px-4 py-3.5">
        <h2 className="font-display text-base font-extrabold text-ink">Taartenkluis</h2>
        <span className="ml-auto flex gap-1" aria-hidden>
          {PASTRIES.map((pastry) => {
            const owned = pastries.find((e) => e.pastryIndex === pastry.index)
            return (
              <span
                key={pastry.index}
                title={pastry.nameNl}
                className={`grid h-6 w-6 place-items-center rounded-md text-[12px] ${
                  owned ? 'bg-world-wash ring-2 ring-world' : 'bg-line'
                }`}
              >
                {owned ? (
                  <PastryIcon slug={getPastry(owned.pastryIndex).slug} size={22} />
                ) : null}
              </span>
            )
          })}
        </span>
      </section>
      <p className="mt-2 text-center text-[12px] text-dim">
        {pastries.length} van de {PASTRIES.length} gebakjes buitgemaakt
      </p>
    </WorldShell>
  )
}

function RungRow({
  rung,
  unlocked,
  complete,
  correct,
}: {
  rung: Rung
  unlocked: boolean
  complete: boolean
  correct: number
}) {
  const def = rungDef(rung)
  const pct = Math.min(100, Math.round((correct / def.itemsToComplete) * 100))

  const inner = (
    <>
      <span
        aria-hidden
        className={`grid h-9 w-9 flex-none place-items-center rounded-xl font-display text-base font-extrabold ${
          complete
            ? 'bg-world text-white'
            : unlocked
              ? 'bg-world-wash text-world'
              : 'bg-line text-dim'
        }`}
      >
        {unlocked ? rung : '🔒'}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-display text-base font-extrabold">
          {def.title}
        </span>
        <span className="mt-0.5 block truncate text-[13px] font-semibold text-dim">
          {unlocked ? def.example : `opent na ${rungDef((rung - 1) as Rung).title}`}
        </span>
        {unlocked && (
          <span
            aria-hidden
            className="mt-2 block h-2.5 overflow-hidden rounded-full bg-line"
          >
            <span className="block h-full rounded-full bg-world" style={{ width: `${pct}%` }} />
          </span>
        )}
      </span>

      <span className="flex-none font-display text-sm font-extrabold tabular text-dim">
        {unlocked ? `${Math.min(correct, def.itemsToComplete)}/${def.itemsToComplete}` : '—'}
      </span>
    </>
  )

  const className = `btn-3d-quiet flex w-full items-center gap-3 px-3.5 py-3 text-left ${
    unlocked ? '' : 'opacity-55'
  }`

  if (!unlocked) {
    return (
      <div className={className} aria-disabled="true">
        {inner}
      </div>
    )
  }

  return (
    <Link href={`/breuken/${def.slug}`} className={className}>
      {inner}
    </Link>
  )
}
