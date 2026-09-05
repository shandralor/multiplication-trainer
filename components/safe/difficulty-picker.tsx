'use client'

import type { Difficulty } from '@/lib/safe/safe-logic'

type DifficultyPickerProps = {
  value: Difficulty
  onChange: (next: Difficulty) => void
}

/**
 * Difficulty keeps its own three hues rather than taking the world
 * colour: here the colour encodes risk, which is information, not
 * decoration — easy reads calm, hard reads hot.
 */
const ACTIVE_CLASSES: Record<Difficulty, string> = {
  easy:   'border-goed bg-goed/15 text-goed',
  medium: 'border-brass bg-brass/15 text-brass',
  hard:   'border-fout bg-fout/15 text-fout',
}

export function DifficultyPicker({ value, onChange }: DifficultyPickerProps) {
  const options: { id: Difficulty; label: string; hint: string }[] = [
    { id: 'easy',   label: 'Makkelijk', hint: 'Begin met 2 open vakken' },
    { id: 'medium', label: 'Normaal',   hint: 'Begin met 4 open vakken' },
    { id: 'hard',   label: 'Moeilijk',  hint: 'Begin met 6 open vakken' },
  ]

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-4">
      {options.map((opt) => {
        const active = opt.id === value
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            aria-pressed={active}
            className={`rounded-xl border p-3 text-center transition-all ${
              active
                ? ACTIVE_CLASSES[opt.id]
                : 'border-line bg-surface text-ink hover:border-dim'
            }`}
          >
            <div className="font-display text-sm font-bold tracking-tight">{opt.label}</div>
            <div className="mt-0.5 text-[12px] leading-snug text-dim">
              {opt.hint}
            </div>
          </button>
        )
      })}
    </div>
  )
}
