'use client'

import type { Shape } from '@/lib/fractions/types'

type FractionShapeProps = {
  shape: Shape
  parts: number
  /** How many parts are filled — used for the caption and the count. */
  shaded: number
  /**
   * Which parts are filled. Defaults to the first `shaded` of them, which
   * is what a generated drawing wants; interactive items pass their own
   * so a kid can colour any piece they like.
   */
  isFilled?: (index: number) => boolean
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
  isFilled,
  onToggle,
  size = 176,
  label,
}: FractionShapeProps) {
  const interactive = Boolean(onToggle)
  const filled = isFilled ?? ((i: number) => i < shaded)
  const description = label ?? `${shaded} van de ${parts} delen gekleurd`

  return shape === 'pie' ? (
    <Pie
      parts={parts}
      filled={filled}
      size={size}
      onToggle={onToggle}
      interactive={interactive}
      description={description}
    />
  ) : (
    <Bar
      parts={parts}
      filled={filled}
      size={size}
      onToggle={onToggle}
      interactive={interactive}
      description={description}
    />
  )
}

type InnerProps = {
  parts: number
  filled: (index: number) => boolean
  size: number
  onToggle?: (index: number) => void
  interactive: boolean
  description: string
}

function Pie({ parts, filled, size, onToggle, interactive, description }: InnerProps) {
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
      <circle cx={C} cy={C} r={R} fill="var(--card)" />
      {Array.from({ length: parts }, (_, i) => {
        const [x1, y1] = point(i)
        const [x2, y2] = point(i + 1)
        const largeArc = 360 / parts > 180 ? 1 : 0
        const isShaded = filled(i)
        return (
          <path
            key={i}
            d={`M${C},${C} L${x1},${y1} A${R},${R} 0 ${largeArc},1 ${x2},${y2} Z`}
            fill={isShaded ? 'var(--world)' : 'var(--card)'}
            stroke="var(--line)"
            strokeWidth="1.5"
            onClick={onToggle ? () => onToggle(i) : undefined}
            className={interactive ? 'cursor-pointer transition-[fill]' : undefined}
          />
        )
      })}
      <circle
        cx={C}
        cy={C}
        r={R}
        fill="none"
        stroke="var(--dim)"
        strokeWidth="2"
        pointerEvents="none"
      />
    </svg>
  )
}

function Bar({ parts, filled, size, onToggle, interactive, description }: InnerProps) {
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
          fill={filled(i) ? 'var(--world)' : 'var(--card)'}
          stroke="var(--line)"
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
        stroke="var(--dim)"
        strokeWidth="2"
        rx="4"
        pointerEvents="none"
      />
    </svg>
  )
}
