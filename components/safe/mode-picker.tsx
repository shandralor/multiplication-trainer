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
    <div className="grid grid-cols-2 gap-3 md:gap-5">
      {options.map((opt) => {
        const active = opt.id === value
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            aria-pressed={active}
            className={`rounded-xl border p-4 text-left transition-all ${
              active
                ? 'border-world bg-world-dim'
                : 'border-line bg-surface hover:border-dim'
            }`}
          >
            <div
              className={`font-display text-lg font-extrabold tracking-tight ${
                active ? 'text-world' : 'text-ink'
              }`}
            >
              {opt.label}
            </div>
            <div className="mt-0.5 text-[12px] leading-snug text-dim">
              {opt.desc}
            </div>
          </button>
        )
      })}
    </div>
  )
}
