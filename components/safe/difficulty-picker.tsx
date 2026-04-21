'use client'

import type { Difficulty } from '@/lib/safe/safe-logic'

type DifficultyPickerProps = {
  value: Difficulty
  onChange: (next: Difficulty) => void
}

const ACTIVE_CLASSES: Record<Difficulty, string> = {
  easy:   'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-emerald-700 shadow-lg scale-105',
  medium: 'bg-gradient-to-br from-orange-500 to-orange-700 text-white border-orange-700 shadow-lg scale-105',
  hard:   'bg-gradient-to-br from-red-500 to-red-700 text-white border-red-700 shadow-lg scale-105',
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
            className={`p-3 rounded-xl font-bold text-center transition-all border-2 ${
              active
                ? ACTIVE_CLASSES[opt.id]
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            }`}
          >
            <div>{opt.label}</div>
            <div className={`text-[10px] ${active ? 'opacity-90' : 'text-gray-500'}`}>{opt.hint}</div>
          </button>
        )
      })}
    </div>
  )
}
