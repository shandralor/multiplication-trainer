'use client'

type Field = 'n' | 'd'

type FractionInputProps = {
  numerator: string
  denominator: string
  /** Which box the numpad is currently typing into. */
  active: Field
  onFocusField: (field: Field) => void
  /** Locked denominator — rung 1 pre-fills it from the drawing. */
  lockDenominator?: boolean
  state?: 'idle' | 'goed' | 'fout'
}

/**
 * Teller over noemer, stacked with a real rule between them, because a
 * kid typing "3/8" into one box learns the keyboard, not the notation.
 */
export function FractionInput({
  numerator,
  denominator,
  active,
  onFocusField,
  lockDenominator = false,
  state = 'idle',
}: FractionInputProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <Box
        value={numerator}
        label="teller"
        focused={active === 'n'}
        state={state}
        onClick={() => onFocusField('n')}
      />
      <span aria-hidden className="h-0.5 w-[52px] rounded-sm bg-vault-ink" />
      <Box
        value={denominator}
        label="noemer"
        focused={active === 'd' && !lockDenominator}
        state={state}
        locked={lockDenominator}
        onClick={lockDenominator ? undefined : () => onFocusField('d')}
      />
    </div>
  )
}

function Box({
  value,
  label,
  focused,
  locked = false,
  state,
  onClick,
}: {
  value: string
  label: string
  focused: boolean
  locked?: boolean
  state: 'idle' | 'goed' | 'fout'
  onClick?: () => void
}) {
  const border =
    state === 'goed'
      ? 'border-goed text-goed'
      : state === 'fout'
        ? 'border-fout text-fout'
        : focused
          ? 'border-world text-world'
          : locked
            ? 'border-vault-line text-vault-dim'
            : 'border-vault-line text-vault-ink'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={`${label}${value ? `: ${value}` : ', leeg'}`}
      className={`grid h-11 w-[52px] place-items-center rounded-xl border bg-vault-card font-mono text-[22px] font-semibold tabular transition-colors disabled:cursor-default ${border}`}
    >
      {value || ' '}
    </button>
  )
}
