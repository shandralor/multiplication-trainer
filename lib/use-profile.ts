'use client'

import { useEffect, useMemo, useSyncExternalStore } from 'react'
import {
  getCurrentProfile,
  getProfileVersion,
  initializeProfiles,
  subscribeToProfile,
  type UserProfile,
} from '@/lib/profile-manager'

/**
 * The write counter, as a stable primitive snapshot.
 *
 * The server snapshot is -1 rather than 0 so it always differs from the
 * client's: React hydrates with the server value, then re-reads and
 * re-renders with real localStorage data. Returning the profile object
 * itself from getSnapshot would loop forever — React compares snapshots
 * with Object.is, and every read builds a fresh object.
 */
function useProfileVersion(): number {
  return useSyncExternalStore(subscribeToProfile, getProfileVersion, () => -1)
}

/**
 * The current profile, kept in sync across every screen.
 *
 * useSyncExternalStore rather than useState + useEffect: the profile lives
 * in localStorage, which is precisely the external store this hook exists
 * for. No setState during an effect, so reading the profile does not
 * trigger the cascading-render warning.
 */
export function useProfile(): UserProfile | null {
  const version = useProfileVersion()

  return useMemo(() => {
    if (version < 0 || typeof window === 'undefined') return null
    return getCurrentProfile()
  }, [version])
}

/**
 * Create the default profile if this is a first visit. Runs after paint;
 * the write bumps the version, which re-renders anything reading useProfile.
 */
export function useEnsureProfile() {
  useEffect(() => {
    initializeProfiles()
  }, [])
}
