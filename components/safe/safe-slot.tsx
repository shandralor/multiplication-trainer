'use client'

export type SlotState = 'prefilled' | 'gap-empty' | 'gap-active' | 'gap-correct' | 'gap-revealed'

type SafeSlotProps = {
  factor: number
  /** The sum above the slot, e.g. "7×3" or "21÷3". */
  label: string
  displayValue: string     // what to render in the big slot body (number, partial input, or '?')
  state: SlotState
  onClick?: () => void
}

export function SafeSlot({ factor, label, displayValue, state, onClick }: SafeSlotProps) {
  const stateClasses: Record<SlotState, string> = {
    'prefilled':    'bg-surface border-line text-dim',
    'gap-empty':    'bg-surface border-dashed border-world text-world cursor-pointer hover:bg-world-dim',
    'gap-active':   'bg-world-dim border-world text-world ring-4 ring-world/30 cursor-pointer',
    'gap-correct':  'bg-goed text-white border-goed',
    'gap-revealed': 'bg-fout text-white border-fout',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === 'prefilled' || state === 'gap-correct' || state === 'gap-revealed'}
      className={`absolute flex h-12 w-12 flex-col items-center justify-center rounded-full border-[3px] transition-all sm:h-14 sm:w-14 md:h-20 md:w-20 ${stateClasses[state]}`}
      style={{ transform: 'translate(-50%, -50%)' }}
      data-factor={factor}
    >
      <span className="text-[11px] font-bold leading-none opacity-75 sm:text-[12px]">
        {label}
      </span>
      <span className="font-display text-lg font-extrabold leading-tight tabular sm:text-xl md:text-3xl">
        {displayValue}
      </span>
    </button>
  )
}
