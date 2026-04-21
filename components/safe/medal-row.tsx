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
        <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
          Medailles · {earnedIds.size} / {ALL_IDS.length}
        </span>
      </div>
      <div className="flex gap-2 p-3 rounded-2xl border-2 border-white/20 bg-white/5 justify-center flex-nowrap overflow-x-auto">
        {ALL_IDS.map((id) => {
          const def = ACHIEVEMENTS[id]
          const isEarned = earnedIds.has(id)
          return (
            <button
              key={id}
              type="button"
              onClick={() => setOpen((cur) => (cur === id ? null : id))}
              className={`shrink-0 relative inline-flex items-center justify-center w-14 h-14 rounded-xl transition-all ${
                isEarned ? 'bg-white/10 hover:bg-white/20' : 'bg-black/20 hover:bg-black/30'
              }`}
              title={def.label}
              aria-label={def.label}
            >
              <Image
                src={def.medalPath}
                alt={def.label}
                width={36}
                height={60}
                className={`object-contain ${isEarned ? '' : 'grayscale opacity-30'}`}
              />
            </button>
          )
        })}
      </div>

      {open && (
        <div
          onClick={() => setOpen(null)}
          className="mt-2 p-3 rounded-xl bg-white/10 border border-white/20 text-sm text-white cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Image
              src={ACHIEVEMENTS[open].medalPath}
              alt=""
              width={32}
              height={54}
              className={`object-contain ${earnedIds.has(open) ? '' : 'grayscale opacity-40'}`}
            />
            <div>
              <div className="font-bold">{ACHIEVEMENTS[open].label}</div>
              <div className="text-xs opacity-80">{ACHIEVEMENTS[open].description}</div>
              {!earnedIds.has(open) && (
                <div className="text-xs text-amber-300 mt-1">Nog niet verdiend</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
