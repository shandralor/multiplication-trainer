'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ACHIEVEMENTS, type AchievementId } from '@/lib/safe/achievements'
import type { EarnedAchievement } from '@/lib/profile-manager'

type MedalRowProps = {
  earned: EarnedAchievement[]
}

const ALL_IDS: AchievementId[] = [
  'first-safe',
  'perfect-safe',
  'fast-safe',
  'hard-safe',
  'all-bronze',
  'all-silver',
  'all-gold',
  'all-platinum',
  'perfect-ronde',
  'endless-10',
  'endless-20',
  'loyal-player',
]

export function MedalRow({ earned }: MedalRowProps) {
  const earnedIds = new Set(earned.map((e) => e.id))
  const [open, setOpen] = useState<AchievementId | null>(null)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 px-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-vault-dim">
          Medailles · {earnedIds.size} / {ALL_IDS.length}
        </span>
      </div>
      <div className="flex flex-nowrap justify-center gap-2 overflow-x-auto rounded-2xl vault-card p-3">
        {ALL_IDS.map((id) => {
          const def = ACHIEVEMENTS[id]
          const isEarned = earnedIds.has(id)
          return (
            <button
              key={id}
              type="button"
              onClick={() => setOpen((cur) => (cur === id ? null : id))}
              className={`relative inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                isEarned
                  ? 'border-brass/35 bg-brass/10 hover:border-brass'
                  : 'border-vault-line bg-vault-night hover:border-vault-dim'
              }`}
              title={def.label}
              aria-label={def.label}
            >
              <Image
                src={def.medalPath}
                alt={def.label}
                width={36}
                height={60}
                className={`h-11 w-11 object-contain ${isEarned ? '' : 'opacity-30 grayscale'}`}
              />
            </button>
          )
        })}
      </div>

      {open && (
        <div
          onClick={() => setOpen(null)}
          className="mt-2 cursor-pointer rounded-xl vault-card p-3 text-sm text-vault-ink"
        >
          <div className="flex items-center gap-3">
            <Image
              src={ACHIEVEMENTS[open].medalPath}
              alt=""
              width={32}
              height={54}
              className={`h-10 w-10 object-contain ${earnedIds.has(open) ? '' : 'opacity-40 grayscale'}`}
            />
            <div>
              <div className="font-display font-bold tracking-tight">
                {ACHIEVEMENTS[open].label}
              </div>
              <div className="mt-0.5 text-xs text-vault-dim">
                {ACHIEVEMENTS[open].description}
              </div>
              {!earnedIds.has(open) && (
                <div className="mt-1 font-mono text-[10px] text-brass">Nog niet verdiend</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
