'use client'

export type SafeMode = 'safe-run' | 'safe-endless'

type ModePickerProps = {
  value: SafeMode
  onChange: (next: SafeMode) => void
}

export function ModePicker({ value, onChange }: ModePickerProps) {
  const options: { id: SafeMode; label: string; desc: string }[] = [
    { id: 'safe-run',     label: 'Ronde',     desc: 'Elke gekozen tafel één keer' },
    { id: 'safe-endless', label: 'Eindeloos', desc: 'De tijd tikt steeds sneller' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((opt) => {
        const active = opt.id === value
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`p-4 rounded-xl font-bold text-left transition-all border-2 ${
              active
                ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white border-indigo-700 shadow-lg scale-105'
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            }`}
          >
            <div className="text-lg">{opt.label}</div>
            <div className={`text-xs ${active ? 'opacity-90' : 'text-gray-500'}`}>{opt.desc}</div>
          </button>
        )
      })}
    </div>
  )
}
