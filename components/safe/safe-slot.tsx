'use client'

export type SlotState = 'prefilled' | 'gap-empty' | 'gap-active' | 'gap-correct' | 'gap-revealed'

type SafeSlotProps = {
  factor: number
  table: number
  displayValue: string     // what to render in the big slot body (number, partial input, or '?')
  state: SlotState
  onClick?: () => void
}

export function SafeSlot({ factor, table, displayValue, state, onClick }: SafeSlotProps) {
  const stateClasses: Record<SlotState, string> = {
    'prefilled':     'bg-gray-100 border-gray-300 text-gray-800',
    'gap-empty':     'bg-white border-red-300 border-dashed text-red-600 cursor-pointer hover:border-red-400',
    'gap-active':    'bg-yellow-100 border-amber-500 text-amber-900 ring-4 ring-amber-200 cursor-pointer',
    'gap-correct':   'bg-green-100 border-green-500 text-green-900',
    'gap-revealed':  'bg-amber-200 border-amber-600 text-amber-900',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={state === 'prefilled' || state === 'gap-correct' || state === 'gap-revealed'}
      className={`absolute w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20 rounded-full border-4 flex flex-col items-center justify-center font-bold shadow-lg transition-all ${stateClasses[state]}`}
      style={{ transform: 'translate(-50%, -50%)' }}
      data-factor={factor}
    >
      <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 font-semibold leading-none">
        {factor}&times;{table}
      </span>
      <span className="text-base sm:text-lg md:text-2xl font-extrabold leading-tight">{displayValue}</span>
    </button>
  )
}
