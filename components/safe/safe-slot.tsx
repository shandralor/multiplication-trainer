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
    'prefilled':    'bg-vault-card border-vault-line text-vault-dim',
    'gap-empty':    'bg-vault-night border-dashed border-world text-world cursor-pointer hover:bg-world-dim',
    'gap-active':   'bg-world-dim border-world text-world ring-2 ring-world/40 cursor-pointer',
    'gap-correct':  'bg-goed/15 border-goed text-goed',
    'gap-revealed': 'bg-fout/15 border-fout text-fout',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === 'prefilled' || state === 'gap-correct' || state === 'gap-revealed'}
      className={`absolute flex h-12 w-12 flex-col items-center justify-center rounded-full border-2 font-bold transition-all sm:h-14 sm:w-14 md:h-20 md:w-20 ${stateClasses[state]}`}
      style={{ transform: 'translate(-50%, -50%)' }}
      data-factor={factor}
    >
      <span className="font-mono text-[9px] font-medium leading-none opacity-70 sm:text-[10px] md:text-xs">
        {label}
      </span>
      <span className="font-mono text-base font-semibold leading-tight tabular sm:text-lg md:text-2xl">
        {displayValue}
      </span>
    </button>
  )
}
