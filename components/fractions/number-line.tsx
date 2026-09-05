'use client'

import { toVulgar, type Fraction } from '@/lib/fractions/fraction'

type NumberLineProps = {
  /** Ticks between 0 and 1. */
  steps: number
  /** Which tick the token currently sits on, or null before a first pick. */
  placed: number | null
  onPlace: (step: number) => void
  target: Fraction
  /** Locked after the answer is checked. */
  disabled?: boolean
  state?: 'idle' | 'goed' | 'fout'
}

const W = 280
const H = 110
const LEFT = 26
const RIGHT = W - 26
const AXIS_Y = 74

/**
 * The one representation that makes ⅗ vs ⅔ obvious without finding a
 * common denominator first. Ticks are tap targets rather than a free
 * drag: on a phone, snapping to the tick is what a kid means anyway,
 * and it keeps the whole thing keyboard-reachable for free.
 */
export function NumberLine({
  steps,
  placed,
  onPlace,
  target,
  disabled = false,
  state = 'idle',
}: NumberLineProps) {
  const x = (step: number) => LEFT + ((RIGHT - LEFT) * step) / steps
  const tokenColour =
    state === 'goed' ? 'var(--goed)' : state === 'fout' ? 'var(--fout)' : 'var(--world)'

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="group"
        aria-label={`Getallenlijn van 0 tot 1 in ${steps} stappen`}
      >
        <line
          x1={LEFT}
          y1={AXIS_Y}
          x2={RIGHT}
          y2={AXIS_Y}
          stroke="var(--dim)"
          strokeWidth="2"
        />

        {Array.from({ length: steps + 1 }, (_, i) => {
          const end = i === 0 || i === steps
          return (
            <line
              key={i}
              x1={x(i)}
              y1={AXIS_Y - (end ? 10 : 6)}
              x2={x(i)}
              y2={AXIS_Y + (end ? 10 : 6)}
              stroke="var(--dim)"
              strokeWidth="2"
            />
          )
        })}

        <text
          x={LEFT}
          y={AXIS_Y + 28}
          textAnchor="middle"
          fill="var(--dim)"
          fontSize="12"
          fontFamily="var(--font-geist-mono), monospace"
        >
          0
        </text>
        <text
          x={RIGHT}
          y={AXIS_Y + 28}
          textAnchor="middle"
          fill="var(--dim)"
          fontSize="12"
          fontFamily="var(--font-geist-mono), monospace"
        >
          1
        </text>

        {placed !== null && (
          <g>
            <line
              x1={x(placed)}
              y1={44}
              x2={x(placed)}
              y2={AXIS_Y - 8}
              stroke={tokenColour}
              strokeWidth="2"
              strokeDasharray="3 3"
            />
            <circle cx={x(placed)} cy={AXIS_Y} r="5" fill={tokenColour} />
            <rect
              x={x(placed) - 22}
              y={14}
              width="44"
              height="30"
              rx="8"
              fill={tokenColour}
            />
            <text
              x={x(placed)}
              y={34}
              textAnchor="middle"
              fill="var(--paper)"
              fontSize="15"
              fontWeight="600"
              fontFamily="var(--font-geist-mono), monospace"
            >
              {target.n}/{target.d}
            </text>
          </g>
        )}
      </svg>

      {/* The tap targets sit under the drawing rather than on it: an SVG
          tick is far too small a hit area on a phone. */}
      <div
        className="mt-1 grid gap-1"
        style={{ gridTemplateColumns: `repeat(${steps + 1}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: steps + 1 }, (_, i) => (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => onPlace(i)}
            aria-label={`Zet ${toVulgar(target)} op ${i} van de ${steps}`}
            aria-pressed={placed === i}
            className={`rounded-md border py-2 text-[12px] tabular transition-colors disabled:opacity-60 ${
              placed === i
                ? 'border-world bg-world-dim text-world'
                : 'border-line bg-surface text-dim hover:border-dim'
            }`}
          >
            {i}
          </button>
        ))}
      </div>
    </div>
  )
}
