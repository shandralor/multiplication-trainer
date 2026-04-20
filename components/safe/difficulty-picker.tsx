'use client'

import type { Difficulty } from '@/lib/safe/safe-logic'

type DifficultyPickerProps = {
  value: Difficulty
  onChange: (next: Difficulty) => void
}

export function DifficultyPicker({ value, onChange }: DifficultyPickerProps) {
  const options: { id: Difficulty; label: string; hint: string }[] = [
    { id: 'easy',   label: 'Makkelijk', hint: 'Begin met 2 gaten' },
    { id: 'medium', label: 'Medium',    hint: 'Begin met 4 gaten' },
    { id: 'hard',   label: 'Moeilijk',  hint: 'Begin met 6 gaten' },
  ]

  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((opt) => {
        const active = opt.id === value
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`p-3 rounded-xl font-bold text-center transition-all border-2 ${
              active
                ? 'bg-gradient-to-br from-rose-500 to-rose-700 text-white border-rose-700 shadow-lg scale-105'
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
