'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProfileSelector } from '@/components/profile-selector'
import { initializeProfiles, getCurrentProfile } from '@/lib/profile-manager'

type AppHeaderProps = {
  onProfileChange?: () => void
}

export function AppHeader({ onProfileChange }: AppHeaderProps) {
  const [streak, setStreak] = useState(0)
  const [medalCount, setMedalCount] = useState(0)

  const reload = useCallback(() => {
    const profile = getCurrentProfile()
    if (profile) {
      setStreak(profile.currentStreak)
      setMedalCount(new Set(profile.achievements.map((a) => a.id)).size)
    }
    onProfileChange?.()
  }, [onProfileChange])

  useEffect(() => {
    initializeProfiles()
    reload()
  }, [reload])

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Tafel Trainer
          </h1>
          <div className="flex items-center gap-3">
            <Link href="/progress">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                📊 Mijn voortgang
              </Button>
            </Link>
            <ProfileSelector onProfileChange={reload} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900 px-3 py-1 rounded-full">
            <span className="text-xl">🔥</span>
            <span className="font-bold text-orange-600 dark:text-orange-300 text-sm">
              {streak} dagen
            </span>
          </div>
          <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full">
            <span className="text-xl">🏅</span>
            <span className="font-bold text-green-600 dark:text-green-300 text-sm">
              {medalCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
