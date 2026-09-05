'use client'

import { useEffect, useRef } from 'react'
import { SafeSlot, type SlotState } from './safe-slot'
import type { SafeSlot as SafeSlotData } from '@/lib/safe/safe-logic'

export type SlotStatus = {
  state: SlotState
  displayValue: string
}

type SafeDialProps = {
  slots: SafeSlotData[]
  statuses: SlotStatus[]          // parallel array to slots — one per factor (1..10)
  activeFactor: number | null
  onSlotClick: (factor: number) => void
  spinning?: boolean
  flash?: boolean
  label?: string                  // e.g., "×7" or "÷7"
  subLabel?: string               // e.g., "3 / 10 ingevuld"
  /** Sits above the label; names the safe rather than assuming it is a × one. */
  title?: string
}

export function SafeDial({
  slots,
  statuses,
  activeFactor,
  onSlotClick,
  spinning = false,
  flash = false,
  label = '',
  subLabel = '',
  title = 'Kraak de kluis',
}: SafeDialProps) {
  const dialRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!dialRef.current) return
  }, [])

  return (
    <div
      className="relative mx-auto"
      style={{
        // The dial width needs to leave room for slots that orbit at 56% of
        // its width plus their own half-width (~32px). Shrink aggressively on
        // narrow viewports so nothing clips the screen edge.
        width: 'min(480px, calc(100vw - 7rem))',
        aspectRatio: '1 / 1',
      }}
    >
      {/* The safe door: a thick coloured ring, a lighter inner face, and
          six bolts around the rim. Flat shapes and hard edges — cartoon
          depth, not a gradient trying to look like metal. */}
      <div
        ref={dialRef}
        className={`relative h-full w-full rounded-full transition-transform duration-700 ${
          spinning ? 'animate-[spin_0.9s_ease-in-out]' : ''
        }`}
        style={{
          background: 'var(--world)',
          border: '6px solid var(--world-edge)',
          boxShadow: flash ? '0 0 0 10px var(--world-wash)' : '0 8px 0 var(--world-edge)',
        }}
      >
        {/* Bolts around the rim */}
        {Array.from({ length: 6 }, (_, i) => {
          const angle = (i / 6) * Math.PI * 2 - Math.PI / 2
          return (
            <span
              key={i}
              aria-hidden
              className="absolute h-3 w-3 rounded-full sm:h-4 sm:w-4"
              style={{
                background: 'var(--world-edge)',
                left: `${50 + Math.cos(angle) * 41}%`,
                top: `${50 + Math.sin(angle) * 41}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )
        })}

        {/* Inner face */}
        <div
          className="absolute inset-[14%] rounded-full"
          style={{ background: 'var(--surface)', border: '5px solid var(--world-edge)' }}
        />

        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-ink">
          <span className="text-sm font-bold text-dim">{title}</span>
          <span className="mt-1 font-display text-6xl font-extrabold text-world">{label}</span>
          {subLabel && <span className="mt-2 text-sm font-bold text-dim">{subLabel}</span>}
        </div>
      </div>

      {/* Slots orbiting outside */}
      {slots.map((slot, i) => {
        const angle = (i / 10) * Math.PI * 2 - Math.PI / 2
        // 56% of container = just outside the rim (since dial is ~100%).
        const radiusPct = 56
        const x = 50 + Math.cos(angle) * radiusPct
        const y = 50 + Math.sin(angle) * radiusPct
        const status = statuses[i]
        return (
          <div
            key={slot.factor}
            style={{ position: 'absolute', left: `${x}%`, top: `${y}%` }}
          >
            <SafeSlot
              factor={slot.factor}
              label={slot.label}
              displayValue={status.displayValue}
              state={
                activeFactor === slot.factor && status.state === 'gap-empty'
                  ? 'gap-active'
                  : status.state
              }
              onClick={() => onSlotClick(slot.factor)}
            />
          </div>
        )
      })}
    </div>
  )
}
