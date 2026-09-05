'use client'

import Link from 'next/link'
import { ProfileSelector } from '@/components/profile-selector'
import { useEnsureProfile, useProfile } from '@/lib/use-profile'

type AppHeaderProps = {
  /** Called after the profile picker switches or edits a profile. */
  onProfileChange?: () => void
}

/**
 * The bar that sits on every screen: who is playing, how long their
 * streak is, and how many medals they hold. Deliberately quiet — the
 * world tiles below it are what should pull the eye.
 */
export function AppHeader({ onProfileChange }: AppHeaderProps) {
  useEnsureProfile()
  const profile = useProfile()

  const streak = profile?.currentStreak ?? 0
  const medals = profile ? new Set(profile.achievements.map((a) => a.id)).size : 0

  return (
    <header className="border-b border-line/70">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <ProfileSelector onProfileChange={onProfileChange} />

        <div className="ml-auto flex items-center gap-2">
          <Chip label={`${streak} dagen`} icon="🔥" />
          <Link
            href="/kluiskamer"
            className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
            aria-label="Naar de kluiskamer"
          >
            <Chip label={String(medals)} icon="🏅" interactive />
          </Link>
        </div>
      </div>
    </header>
  )
}

function Chip({
  icon,
  label,
  interactive = false,
}: {
  icon: string
  label: string
  interactive?: boolean
}) {
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full border-2 border-line bg-surface px-3 py-1 text-sm font-extrabold text-ink tabular ${
        interactive ? 'transition-colors hover:border-world' : ''
      }`}
    >
      <span aria-hidden className="text-base">
        {icon}
      </span>
      {label}
    </span>
  )
}
