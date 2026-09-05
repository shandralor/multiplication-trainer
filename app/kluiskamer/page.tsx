'use client'

import Image from 'next/image'
import Link from 'next/link'
import { AppHeader } from '@/components/app-header'
import { WorldShell } from '@/components/world-shell'
import { MedalRow } from '@/components/safe/medal-row'
import { ANIMALS } from '@/lib/safe/animals'
import { PASTRIES } from '@/lib/fractions/pastries'
import { useEnsureProfile, useProfile } from '@/lib/use-profile'
import type { AnimalTier } from '@/lib/profile-manager'

const TIER_RING: Record<AnimalTier, string> = {
  bronze: 'border-[#A97142]',
  silver: 'border-[#B8C0C4]',
  gold: 'border-brass',
  platinum: 'border-[#9FE8E2]',
}

const TIER_LABEL: Record<AnimalTier, string> = {
  bronze: 'Brons',
  silver: 'Zilver',
  gold: 'Goud',
  platinum: 'Platina',
}

/**
 * The trophy room. Everything earned across all three worlds in one
 * place — which is the thing the old app never had: the animals and
 * medals were the whole reward loop with nowhere to go and look at them.
 */
export default function KluiskamerPage() {
  useEnsureProfile()
  const profile = useProfile()

  const animals = profile?.animals ?? []
  const pastries = profile?.pastries ?? []
  const earned = profile?.achievements ?? []

  return (
    <WorldShell world="kluis" backHref="/">
      <AppHeader />

      <div className="pt-5">
        <h1 className="font-display text-[1.4rem] font-extrabold tracking-tight">Kluiskamer</h1>
        <p className="mt-1.5 text-[12px] text-dim">
          alles wat je hebt buitgemaakt
        </p>
      </div>

      <Section title="Dieren" count={`${animals.length} / ${ANIMALS.length}`}>
        <div className="grid grid-cols-5 gap-2">
          {ANIMALS.map((animal) => {
            const entry = animals.find((a) => a.tableIndex === animal.tableIndex)
            return (
              <div
                key={animal.slug}
                className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border bg-surface p-1.5 ${
                  entry ? TIER_RING[entry.tier] : 'border-dashed border-line'
                }`}
                title={entry ? `${animal.nameNl} · ${TIER_LABEL[entry.tier]}` : 'Nog opgesloten'}
              >
                {entry ? (
                  <Image
                    src={animal.pngPath}
                    alt={animal.nameNl}
                    width={40}
                    height={40}
                    className="h-9 w-9 object-contain"
                  />
                ) : (
                  <span aria-hidden className="text-lg opacity-40">
                    🔒
                  </span>
                )}
                <span className="text-[12px] uppercase tracking-wide text-dim">
                  {entry ? TIER_LABEL[entry.tier] : `tafel ${animal.tableIndex}`}
                </span>
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="Bakkerij" count={`${pastries.length} / ${PASTRIES.length}`}>
        <div className="grid grid-cols-5 gap-2">
          {PASTRIES.map((pastry) => {
            const entry = pastries.find((p) => p.pastryIndex === pastry.index)
            return (
              <div
                key={pastry.slug}
                className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border bg-surface p-1.5 ${
                  entry ? TIER_RING[entry.tier] : 'border-dashed border-line'
                }`}
                title={entry ? `${pastry.nameNl} · ${TIER_LABEL[entry.tier]}` : 'Nog niet gebakken'}
              >
                <span aria-hidden className={`text-xl ${entry ? '' : 'opacity-25 grayscale'}`}>
                  {pastry.emoji}
                </span>
                <span className="text-[12px] uppercase tracking-wide text-dim">
                  {entry ? TIER_LABEL[entry.tier] : `trede ${pastry.rung}`}
                </span>
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="Medailles" count={String(new Set(earned.map((e) => e.id)).size)}>
        <MedalRow earned={earned} />
      </Section>

      <div className="mt-8 flex gap-2">
        <Link
          href="/progress"
          className="flex-1 rounded-xl border border-line bg-surface py-2.5 text-center font-display text-[13px] font-bold text-dim transition-colors hover:border-world hover:text-ink"
        >
          📊 Statistieken
        </Link>
        <Link
          href="/instellingen"
          className="flex-1 rounded-xl border border-line bg-surface py-2.5 text-center font-display text-[13px] font-bold text-dim transition-colors hover:border-world hover:text-ink"
        >
          ⚙️ Instellingen
        </Link>
      </div>
    </WorldShell>
  )
}

function Section({
  title,
  count,
  children,
}: {
  title: string
  count: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-6">
      <div className="mb-2.5 flex items-center gap-3">
        <h2 className="text-[12px] text-dim">
          {title}
        </h2>
        <span aria-hidden className="h-px flex-1 bg-line" />
        <span className="text-[12px] tabular text-dim">{count}</span>
      </div>
      {children}
    </section>
  )
}
