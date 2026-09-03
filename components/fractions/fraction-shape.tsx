'use client'

import type { Shape } from '@/lib/fractions/types'

type FractionShapeProps = {
  shape: Shape
  parts: number
  shaded: number
  /** Tapping a part toggles it — used by the "kleur ⅔" items. */
  onToggle?: (index: number) => void
  size?: number
  label?: string
}

/**
 * The pie or bar a rung-1 item is read off. Both are drawn to the same
 * scale rules: equal parts, a hairline between them, and the shaded run
 * always starting at the top/left so two drawings of the same fraction
 * look the same.
 */
export function FractionShape({
  shape,
  parts,
  shaded,
  onToggle,
  size = 176,
  label,
}: FractionShapeProps) {
  const interactive = Boolean(onToggle)
  const description = label ?? `${shaded} van de ${parts} delen gekleurd`

  return shape === 'pie' ? (
    <Pie
      parts={parts}
      shaded={shaded}
      size={size}
      onToggle={onToggle}
      interactive={interactive}
      description={description}
    />
  ) : (
    <Bar
      parts={parts}
      shaded={shaded}
      size={size}
      onToggle={onToggle}
      interactive={interactive}
      description={description}
    />
  )
}

type InnerProps = {
  parts: number
  shaded: number
  size: number
  onToggle?: (index: number) => void
  interactive: boolean
  description: string
}

function Pie({ parts, shaded, size, onToggle, interactive, description }: InnerProps) {
  const R = 70
  const C = 80

  // Slice i runs from -90° (top of the dial) clockwise.
  const point = (i: number) => {
    const angle = (-90 + (360 / parts) * i) * (Math.PI / 180)
    return [C + R * Math.cos(angle), C + R * Math.sin(angle)] as const
  }

  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      role="img"
      aria-label={description}
      className="max-w-full"
    >
      <circle cx={C} cy={C} r={R} fill="var(--vault-card)" />
      {Array.from({ length: parts }, (_, i) => {
        const [x1, y1] = point(i)
        const [x2, y2] = point(i + 1)
        const largeArc = 360 / parts > 180 ? 1 : 0
        const isShaded = i < shaded
        return (
          <path
            key={i}
            d={`M${C},${C} L${x1},${y1} A${R},${R} 0 ${largeArc},1 ${x2},${y2} Z`}
            fill={isShaded ? 'var(--world)' : 'var(--vault-card)'}
            stroke="var(--vault-line)"
            strokeWidth="1.5"
            onClick={onToggle ? () => onToggle(i) : undefined}
            className={interactive ? 'cursor-pointer transition-[fill]' : undefined}
          />
        )
      })}
      <circle cx={C} cy={C} r={R} fill="none" stroke="var(--vault-dim)" strokeWidth="2" />
    </svg>
  )
}

function Bar({ parts, shaded, size, onToggle, interactive, description }: InnerProps) {
  const W = 260
  const H = 64
  const partW = W / parts

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={size * 1.5}
      height={(size * 1.5 * H) / W}
      role="img"
      aria-label={description}
      className="max-w-full"
    >
      {Array.from({ length: parts }, (_, i) => (
        <rect
          key={i}
          x={i * partW}
          y={0}
          width={partW}
          height={H}
          fill={i < shaded ? 'var(--world)' : 'var(--vault-card)'}
          stroke="var(--vault-line)"
          strokeWidth="1.5"
          onClick={onToggle ? () => onToggle(i) : undefined}
          className={interactive ? 'cursor-pointer transition-[fill]' : undefined}
        />
      ))}
      <rect
        x="1"
        y="1"
        width={W - 2}
        height={H - 2}
        fill="none"
        stroke="var(--vault-dim)"
        strokeWidth="2"
        rx="4"
      />
    </svg>
  )
}
