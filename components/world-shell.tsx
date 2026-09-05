'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

export type World = 'tafels' | 'delen' | 'breuken' | 'kluis'

const WORLD_CLASS: Record<World, string> = {
  tafels: 'world-tafels',
  delen: 'world-delen',
  breuken: 'world-breuken',
  kluis: 'world-kluis',
}

export const WORLD_SIGN: Record<World, string> = {
  tafels: '×',
  delen: '÷',
  breuken: '½',
  kluis: '◆',
}

export const WORLD_NAME: Record<World, string> = {
  tafels: 'Tafels',
  delen: 'Delen',
  breuken: 'Breuken',
  kluis: 'Kluiskamer',
}

type WorldShellProps = {
  world: World
  /** Omit for the home screen, which has nowhere to go back to. */
  backHref?: string
  backLabel?: string
  children: ReactNode
}

/**
 * The ground every screen stands on. Setting the world here is the only
 * colour decision a page makes — every accent below reads from --world,
 * which is what stops the app drifting back into five unrelated gradients.
 */
export function WorldShell({
  world,
  backHref,
  backLabel = 'Home',
  children,
}: WorldShellProps) {
  return (
    <div className={`min-h-screen bg-vault text-ink ${WORLD_CLASS[world]}`}>
      <div className="max-w-2xl mx-auto px-4 pb-16">
        {backHref && (
          <div className="flex items-center justify-between gap-3 pt-4 pb-1">
            <Link
              href={backHref}
              className="text-[12px] text-dim transition-colors hover:text-ink"
            >
              ← {backLabel}
            </Link>
            <span className="flex items-baseline gap-2 font-display text-lg font-extrabold tracking-tight text-world">
              <span className="text-sm">{WORLD_SIGN[world]}</span>
              {WORLD_NAME[world]}
            </span>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
