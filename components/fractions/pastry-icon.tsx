'use client'

/**
 * The ten gebakjes of the Taartenkluis, drawn flat.
 *
 * Kenney's Food Kit has the right subjects but its previews are angled
 * 3D renders — next to the flat, front-facing Animal Pack they read as a
 * different game. These are drawn to match the app instead: solid fills,
 * one dark outline, no gradients, front-on. Bold enough to survive at
 * 28px in the collection strip.
 */

const OUTLINE = '#5A3A22'

// A small, deliberately warm palette. Kept here rather than in the theme
// because these are pastry colours, not app colours — the world hues have
// no business deciding what a croissant looks like.
const C = {
  dough: '#E8B06B',
  doughDark: '#C98F4C',
  cream: '#FFF1DC',
  choc: '#6B4226',
  chocLight: '#96603A',
  icing: '#FF9EC4',
  berry: '#E0405A',
  butter: '#FFCE45',
  mint: '#8FD9C0',
  white: '#FFFFFF',
}

type Props = {
  slug: string
  /** Rendered size in px. */
  size?: number
  className?: string
  title?: string
}

export function PastryIcon({ slug, size = 32, className, title }: Props) {
  const shape = SHAPES[slug]
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title ?? slug}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {title ? <title>{title}</title> : null}
      {shape ?? <circle cx="24" cy="24" r="17" fill={C.dough} stroke={OUTLINE} strokeWidth="2.5" />}
    </svg>
  )
}

const SHAPES: Record<string, React.ReactNode> = {
  // 1 — Koekje
  koekje: (
    <>
      <circle cx="24" cy="24" r="17" fill={C.dough} stroke={OUTLINE} strokeWidth="2.5" />
      <circle cx="18" cy="18" r="3" fill={C.choc} />
      <circle cx="30" cy="21" r="2.6" fill={C.choc} />
      <circle cx="21" cy="30" r="2.6" fill={C.choc} />
      <circle cx="31" cy="31" r="2.2" fill={C.choc} />
    </>
  ),

  // 2 — Cupcake
  cupcake: (
    <>
      <path
        d="M13 25 Q13 12 24 12 Q35 12 35 25 Z"
        fill={C.icing}
        stroke={OUTLINE}
        strokeWidth="2.5"
      />
      <path
        d="M12 25 H36 L33 42 Q33 44 31 44 H17 Q15 44 15 42 Z"
        fill={C.cream}
        stroke={OUTLINE}
        strokeWidth="2.5"
      />
      <path d="M20 26 L19 43 M24 26 L24 44 M28 26 L29 43" stroke={C.doughDark} strokeWidth="2" />
      <circle cx="24" cy="9" r="3.5" fill={C.berry} stroke={OUTLINE} strokeWidth="2" />
    </>
  ),

  // 3 — Donut. Even-odd keeps the hole genuinely transparent, so the
  // tile colour behind it shows through.
  donut: (
    <>
      <path
        d="M6 24 a18 18 0 1 0 36 0 a18 18 0 1 0 -36 0 Z M17 24 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0 Z"
        fillRule="evenodd"
        fill={C.icing}
        stroke={OUTLINE}
        strokeWidth="2.5"
      />
      <path
        d="M15 15 l3 -3 M31 16 l3 3 M14 31 l3 3 M32 32 l3 -3 M23 8 l0 4"
        stroke={C.white}
        strokeWidth="2.6"
      />
    </>
  ),

  // 4 — Taartpunt. A circular sector rather than a triangle: it reads as
  // a slice instantly, and it echoes the pie the rung-1 items are drawn
  // on, which is a nice thing for a breuken collectible to do.
  taart: (
    <>
      <path
        d="M24 42 L3.4 12.5 A36 36 0 0 1 44.6 12.5 Z"
        fill={C.cream}
        stroke={OUTLINE}
        strokeWidth="2.5"
      />
      <path
        d="M6.5 16.5 A31 31 0 0 1 41.5 16.5"
        fill="none"
        stroke={C.icing}
        strokeWidth="6"
      />
      <circle cx="24" cy="19" r="3.4" fill={C.berry} stroke={OUTLINE} strokeWidth="2" />
    </>
  ),

  // 5 — Appeltaart, in its dish: a shallow ellipse top with lattice over
  // a tapered base. The dome shape it had before read as a bread roll.
  appeltaart: (
    <>
      <path
        d="M5 22 v4 q0 12 19 12 t19 -12 v-4 Z"
        fill={C.doughDark}
        stroke={OUTLINE}
        strokeWidth="2.5"
      />
      <ellipse cx="24" cy="22" rx="19" ry="8" fill={C.dough} stroke={OUTLINE} strokeWidth="2.5" />
      <path
        d="M14 16.5 L34 27.5 M24 14 L24 30 M34 16.5 L14 27.5"
        stroke={C.doughDark}
        strokeWidth="2.2"
      />
    </>
  ),

  // 6 — Croissant
  croissant: (
    <>
      <path
        d="M7 33 Q9 15 24 15 Q39 15 41 33 Q34 27 24 27 Q14 27 7 33 Z"
        fill={C.dough}
        stroke={OUTLINE}
        strokeWidth="2.5"
      />
      <path d="M17 17 L16 28 M24 15 L24 27 M31 17 L32 28" stroke={C.doughDark} strokeWidth="2" />
    </>
  ),

  // 7 — Pannenkoek
  pannenkoek: (
    <>
      <ellipse cx="24" cy="36" rx="17" ry="6" fill={C.dough} stroke={OUTLINE} strokeWidth="2.5" />
      <ellipse cx="24" cy="28" rx="17" ry="6" fill={C.dough} stroke={OUTLINE} strokeWidth="2.5" />
      <ellipse cx="24" cy="20" rx="17" ry="6" fill={C.dough} stroke={OUTLINE} strokeWidth="2.5" />
      <rect
        x="18"
        y="10"
        width="12"
        height="7"
        rx="2"
        fill={C.butter}
        stroke={OUTLINE}
        strokeWidth="2.2"
      />
    </>
  ),

  // 8 — Stroopwafel
  stroopwafel: (
    <>
      <circle cx="24" cy="24" r="17" fill={C.doughDark} stroke={OUTLINE} strokeWidth="2.5" />
      <path
        d="M14 12 L14 36 M20 9 L20 39 M28 9 L28 39 M34 12 L34 36"
        stroke={C.dough}
        strokeWidth="2.4"
      />
      <path
        d="M12 14 L36 14 M9 20 L39 20 M9 28 L39 28 M12 34 L36 34"
        stroke={C.dough}
        strokeWidth="2.4"
      />
      <circle
        cx="24"
        cy="24"
        r="17"
        fill="none"
        stroke={OUTLINE}
        strokeWidth="2.5"
      />
    </>
  ),

  // 9 — IJsje
  ijsje: (
    <>
      <path
        d="M13 25 H35 L26 44 Q24 46 22 44 Z"
        fill={C.dough}
        stroke={OUTLINE}
        strokeWidth="2.5"
      />
      <path d="M18 30 L23 25 M22 36 L30 27" stroke={C.doughDark} strokeWidth="2" />
      <circle cx="18" cy="19" r="8" fill={C.icing} stroke={OUTLINE} strokeWidth="2.5" />
      <circle cx="30" cy="19" r="8" fill={C.mint} stroke={OUTLINE} strokeWidth="2.5" />
      <circle cx="24" cy="12" r="7.5" fill={C.cream} stroke={OUTLINE} strokeWidth="2.5" />
    </>
  ),

  // 10 — Bonbon. A plain brown square read as nothing; the cream drizzle
  // is what makes it a chocolate at 22px.
  bonbon: (
    <>
      <path
        d="M24 8 L42 18 v14 L24 42 L6 32 V18 Z"
        fill={C.choc}
        stroke={OUTLINE}
        strokeWidth="2.5"
      />
      <path d="M24 8 L42 18 L24 27 L6 18 Z" fill={C.chocLight} stroke={OUTLINE} strokeWidth="2.5" />
      <path
        d="M13 15 L21 11 M20 20 L30 14 M29 24 L37 19"
        stroke={C.cream}
        strokeWidth="2.6"
      />
    </>
  ),
}
