/**
 * "Verder waar je was" — the one-tap return to whatever the kid was
 * last doing.
 *
 * Kept in its own localStorage key rather than on the profile: it is a
 * navigation convenience, not progress, and it should not travel with a
 * profile export or survive a profile reset.
 */

const RESUME_KEY = 'tafel-trainer-resume'

export type ResumePoint = {
  /** Where tapping the card goes. */
  href: string
  /** One line: "Tafels · kluis · tafel 7". */
  label: string
  /** Emoji shown in the card's tile. */
  icon: string
  savedAt: string
}

/** Anything older than this is stale enough to be noise, not a shortcut. */
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7

export function saveResume(point: Omit<ResumePoint, 'savedAt'>) {
  if (typeof window === 'undefined') return
  const stored: ResumePoint = { ...point, savedAt: new Date().toISOString() }
  try {
    localStorage.setItem(RESUME_KEY, JSON.stringify(stored))
  } catch {
    // A full or blocked localStorage must never break navigation.
  }
}

export function readResume(): ResumePoint | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(RESUME_KEY)
    if (!raw) return null
    const point = JSON.parse(raw) as ResumePoint
    if (!point.href || !point.label) return null
    if (Date.now() - new Date(point.savedAt).getTime() > MAX_AGE_MS) return null
    return point
  } catch {
    return null
  }
}

export function clearResume() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(RESUME_KEY)
}
