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
  label?: string                  // e.g., "×7"
  subLabel?: string               // e.g., "3 / 10 ingevuld"
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
}: SafeDialProps) {
  const dialRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!dialRef.current) return
  }, [])

  return (
    <div className="relative mx-auto" style={{ width: 'min(480px, 92vw)', aspectRatio: '1 / 1' }}>
      <div
        ref={dialRef}
        className={`relative w-full h-full rounded-full border-8 border-gray-400 bg-gradient-to-br from-gray-600 to-gray-900 shadow-2xl transition-transform duration-700 ${
          spinning ? 'animate-[spin_0.9s_ease-in-out]' : ''
        } ${flash ? 'ring-8 ring-yellow-300' : ''}`}
        style={{
          boxShadow:
            '0 10px 30px rgba(0,0,0,0.4), inset 0 4px 20px rgba(255,255,255,0.1)',
        }}
      >
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white pointer-events-none">
          <span className="text-xs tracking-[0.3em] text-gray-300">KRAAK DE KLUIS</span>
          <span className="text-5xl font-extrabold mt-1">{label}</span>
          {subLabel && <span className="text-xs text-emerald-200 mt-2">{subLabel}</span>}
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
              table={slot.table}
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
