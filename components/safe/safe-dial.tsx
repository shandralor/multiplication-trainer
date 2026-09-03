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
      <div
        ref={dialRef}
        className={`relative h-full w-full rounded-full border-4 border-vault-line bg-gradient-to-br from-vault-card to-vault-night transition-transform duration-700 ${
          spinning ? 'animate-[spin_0.9s_ease-in-out]' : ''
        } ${flash ? 'ring-4 ring-world' : ''}`}
        style={{
          boxShadow:
            '0 10px 30px rgba(0,0,0,0.4), inset 0 4px 20px rgba(255,255,255,0.1)',
        }}
      >
        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-vault-ink">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-vault-dim">
            {title}
          </span>
          <span className="mt-1 font-display text-5xl font-extrabold tracking-tight">{label}</span>
          {subLabel && (
            <span className="mt-2 font-mono text-[10px] text-world">{subLabel}</span>
          )}
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
