'use client'

import { useEffect } from 'react'

type NumpadProps = {
  value: string
  onChange: (next: string) => void
  onSubmit: () => void
  disabled?: boolean
}

const DIGITS = ['1','2','3','4','5','6','7','8','9']

export function Numpad({ value, onChange, onSubmit, disabled = false }: NumpadProps) {
  useEffect(() => {
    if (disabled) return
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (value.length >= 3) return
        onChange(value + e.key)
      } else if (e.key === 'Backspace') {
        onChange(value.slice(0, -1))
      } else if (e.key === 'Enter') {
        onSubmit()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [value, disabled, onChange, onSubmit])

  const press = (digit: string) => {
    if (disabled) return
    if (value.length >= 3) return
    onChange(value + digit)
  }

  const backspace = () => {
    if (disabled) return
    onChange(value.slice(0, -1))
  }

  return (
    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
      {DIGITS.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => press(d)}
          disabled={disabled}
          className="h-14 rounded-xl border border-vault-line bg-vault-card font-mono text-2xl font-semibold tabular text-vault-ink transition-colors hover:border-vault-dim active:translate-y-px disabled:opacity-50"
        >
          {d}
        </button>
      ))}
      <button
        type="button"
        onClick={backspace}
        disabled={disabled}
        className="h-14 rounded-xl border border-vault-line bg-vault-card font-display text-base font-bold text-vault-dim transition-colors hover:border-vault-dim disabled:opacity-50"
        aria-label="Backspace"
      >
        Wis
      </button>
      <button
        type="button"
        onClick={() => press('0')}
        disabled={disabled}
        className="h-14 rounded-xl border border-vault-line bg-vault-card font-mono text-2xl font-semibold tabular text-vault-ink transition-colors hover:border-vault-dim active:translate-y-px disabled:opacity-50"
      >
        0
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className="h-14 rounded-xl bg-world font-display text-lg font-extrabold text-vault-night transition-transform hover:-translate-y-px disabled:opacity-50"
      >
        OK
      </button>
    </div>
  )
}
