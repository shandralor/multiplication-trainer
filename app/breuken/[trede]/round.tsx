'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { WorldShell } from '@/components/world-shell'
import { Mascot } from '@/components/mascot'
import { FractionShape } from '@/components/fractions/fraction-shape'
import { FractionInput } from '@/components/fractions/fraction-input'
import { NumberLine } from '@/components/fractions/number-line'
import { checkAnswer, generateSet } from '@/lib/fractions/generate'
import { frac, toVulgar } from '@/lib/fractions/fraction'
import { rungBySlug, rungDef } from '@/lib/fractions/ladder'
import { completeRound, type RoundOutcome } from '@/lib/fractions/fraction-progress'
import { saveResume } from '@/lib/resume'
import type { FractionItem } from '@/lib/fractions/types'

const ROUND_LENGTH = 12

type Phase = 'asking' | 'checked' | 'done'
type Verdict = 'goed' | 'fout'
type MascotEmotion = 'happy' | 'sad' | 'neutral' | 'excited' | 'thinking'

export function Round({ slug }: { slug: string }) {
  const def = rungDef(rungBySlug(slug)!.rung)

  // One set per mount. Generated lazily so the server render and the
  // first client render agree on nothing random — the whole round is
  // client-side, and re-generating on every render would reshuffle the
  // question under the kid's finger.
  const [items] = useState<FractionItem[]>(() => generateSet(def.rung, ROUND_LENGTH))

  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('asking')
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [correct, setCorrect] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [outcome, setOutcome] = useState<RoundOutcome | null>(null)

  // Per-item answer state. Reset on every advance.
  const [numerator, setNumerator] = useState('')
  const [denominator, setDenominator] = useState('')
  const [field, setField] = useState<'n' | 'd'>('n')
  const [shaded, setShaded] = useState(0)
  const [placed, setPlaced] = useState<number | null>(null)
  const [choice, setChoice] = useState<string | null>(null)

  const item = items[index]

  const resetItem = useCallback(() => {
    setNumerator('')
    setDenominator('')
    setField('n')
    setShaded(0)
    setPlaced(null)
    setChoice(null)
    setVerdict(null)
    setPhase('asking')
  }, [])

  const answerFor = useCallback((): unknown => {
    switch (item.kind) {
      case 'read-shape':
        // The noemer is read off the drawing, not typed — so the answer
        // assembles from the teller alone.
        return numerator ? frac(Number(numerator), item.parts) : null
      case 'colour-shape':
        // Zero shaded parts is a mis-tap, not an answer.
        return shaded > 0 ? shaded : null
      case 'missing-numerator':
        return numerator ? Number(numerator) : null
      case 'simplify':
        return numerator && denominator ? frac(Number(numerator), Number(denominator)) : null
      case 'number-line':
        return placed
      case 'compare':
        return choice
      case 'add':
      case 'subtract':
        return numerator && denominator ? frac(Number(numerator), Number(denominator)) : null
      case 'of-number':
        return numerator ? Number(numerator) : null
    }
  }, [item, numerator, denominator, shaded, placed, choice])

  const answer = answerFor()
  const canCheck = answer !== null && answer !== undefined && answer !== ''
  // Any mark on the item counts as started — a typed digit, a shaded
  // slice, a placed token, a chosen sign.
  const hasStartedAnswering =
    canCheck || numerator !== '' || denominator !== '' || shaded > 0 || placed !== null

  const check = () => {
    if (!canCheck || phase !== 'asking') return
    const right = checkAnswer(item, answer)
    setVerdict(right ? 'goed' : 'fout')
    setPhase('checked')
    if (right) {
      setCorrect((c) => c + 1)
      setStreak((s) => {
        const next = s + 1
        setBestStreak((b) => Math.max(b, next))
        return next
      })
    } else {
      setStreak(0)
    }
  }

  const advance = () => {
    if (index + 1 >= items.length) {
      const finalCorrect = correct
      const result = completeRound({
        rung: def.rung,
        correct: finalCorrect,
        total: items.length,
        bestStreak,
      })
      setOutcome(result)
      setPhase('done')
      saveResume({
        href: `/breuken/${def.slug}`,
        label: `Breuken · ${def.title}`,
        icon: '½',
      })
      return
    }
    setIndex((i) => i + 1)
    resetItem()
  }

  if (phase === 'done') {
    return <Scorecard slug={slug} correct={correct} total={items.length} outcome={outcome} />
  }

  return (
    <WorldShell world="breuken" backHref="/breuken" backLabel="Ladder">
      <div className="mx-auto max-w-sm pt-3">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-plum px-3 py-1 font-mono text-[10px] text-plum">
            Trede {def.rung} · {def.title}
          </span>
          <span className="font-mono text-[10px] tabular text-vault-dim">
            {index + 1} / {items.length}
          </span>
        </div>

        <div className="mt-2.5 flex gap-1" aria-hidden>
          {items.map((_, i) => (
            <span
              key={i}
              className={`h-[3px] flex-1 rounded-sm ${
                i < index ? 'bg-plum' : i === index ? 'bg-plum/55' : 'bg-vault-line'
              }`}
            />
          ))}
        </div>

        <h1 className="mt-6 text-balance text-center font-display text-[19px] font-extrabold tracking-tight">
          {headline(item)}
        </h1>

        <div className="mt-5">
          <ItemBody
            item={item}
            state={verdict ?? 'idle'}
            locked={phase !== 'asking'}
            numerator={numerator}
            denominator={denominator}
            field={field}
            shaded={shaded}
            placed={placed}
            choice={choice}
            setField={setField}
            setShaded={setShaded}
            setPlaced={setPlaced}
            setChoice={setChoice}
          />
        </div>

        <MascotStrip
          item={item}
          verdict={verdict}
          streak={streak}
          started={hasStartedAnswering}
        />

        <div className="mt-5">
          {needsNumpad(item) && phase === 'asking' ? (
            <Numpad
              onDigit={(digit) => {
                const setter = field === 'n' ? setNumerator : setDenominator
                setter((v) => (v.length >= 3 ? v : v + digit))
              }}
              onBackspace={() => {
                const setter = field === 'n' ? setNumerator : setDenominator
                setter((v) => v.slice(0, -1))
              }}
              onConfirm={check}
              canConfirm={canCheck}
            />
          ) : (
            <button
              type="button"
              onClick={phase === 'asking' ? check : advance}
              disabled={phase === 'asking' && !canCheck}
              className={`w-full rounded-2xl py-3 font-display text-base font-extrabold tracking-tight transition-all ${
                phase === 'asking' && !canCheck
                  ? 'cursor-not-allowed border border-vault-line bg-vault-card text-vault-dim'
                  : 'bg-plum text-vault-night hover:-translate-y-px'
              }`}
            >
              <span className="block">{phase === 'asking' ? 'Nakijken' : 'Volgende'}</span>
              {/* A disabled primary button with no reason is a dead end.
                  Say what is still missing, the way Start! does. */}
              {phase === 'asking' && !canCheck && (
                <span className="mt-0.5 block font-mono text-[10px] font-normal">
                  {missingHint(item)}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </WorldShell>
  )
}

// ------------------------------------------------------------------ body

type BodyProps = {
  item: FractionItem
  state: 'idle' | 'goed' | 'fout'
  locked: boolean
  numerator: string
  denominator: string
  field: 'n' | 'd'
  shaded: number
  placed: number | null
  choice: string | null
  setField: (f: 'n' | 'd') => void
  setShaded: (n: number) => void
  setPlaced: (n: number) => void
  setChoice: (c: string) => void
}

function ItemBody(props: BodyProps) {
  const { item, state, locked } = props

  switch (item.kind) {
    case 'read-shape':
      return (
        <div className="flex flex-col items-center gap-5">
          <FractionShape shape={item.shape} parts={item.parts} shaded={item.shaded} />
          <FractionInput
            numerator={props.numerator}
            // Rung 1 teaches reading, not typing: the noemer comes off
            // the drawing so the kid only supplies the teller.
            denominator={props.denominator || String(item.parts)}
            active={props.field}
            onFocusField={props.setField}
            lockDenominator
            state={state}
          />
        </div>
      )

    case 'colour-shape':
      return (
        <div className="flex flex-col items-center gap-4">
          <FractionShape
            shape={item.shape}
            parts={item.parts}
            shaded={props.shaded}
            onToggle={
              locked
                ? undefined
                : (i) => props.setShaded(i + 1 === props.shaded ? i : i + 1)
            }
            label={`${props.shaded} van de ${item.parts} delen gekleurd`}
          />
          <p className="font-mono text-[11px] text-vault-dim">
            {props.shaded} van de {item.parts} gekleurd
          </p>
        </div>
      )

    case 'missing-numerator':
      return (
        <div className="flex items-center justify-center gap-4">
          <StaticFraction n={item.given.n} d={item.given.d} />
          <span className="font-mono text-xl text-vault-dim">=</span>
          <FractionInput
            numerator={props.numerator}
            denominator={String(item.targetD)}
            active="n"
            onFocusField={props.setField}
            lockDenominator
            state={state}
          />
        </div>
      )

    case 'simplify':
      return (
        <div className="flex items-center justify-center gap-4">
          <StaticFraction n={item.given.n} d={item.given.d} />
          <span className="font-mono text-xl text-vault-dim">=</span>
          <FractionInput
            numerator={props.numerator}
            denominator={props.denominator}
            active={props.field}
            onFocusField={props.setField}
            state={state}
          />
        </div>
      )

    case 'number-line':
      return (
        <NumberLine
          steps={item.steps}
          placed={props.placed}
          onPlace={props.setPlaced}
          target={item.target}
          disabled={locked}
          state={state}
        />
      )

    case 'compare':
      return (
        <div className="flex flex-col items-center gap-5">
          <div className="flex items-center gap-5">
            <StaticFraction n={item.left.n} d={item.left.d} />
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-dashed border-vault-line font-mono text-xl text-vault-dim">
              {props.choice ?? '?'}
            </span>
            <StaticFraction n={item.right.n} d={item.right.d} />
          </div>
          <div className="grid w-full grid-cols-3 gap-2">
            {(['<', '=', '>'] as const).map((sign) => (
              <button
                key={sign}
                type="button"
                disabled={locked}
                onClick={() => props.setChoice(sign)}
                aria-pressed={props.choice === sign}
                className={`rounded-xl border py-3 font-mono text-xl transition-colors disabled:opacity-60 ${
                  props.choice === sign
                    ? 'border-plum bg-plum/15 text-plum'
                    : 'border-vault-line bg-vault-card hover:border-vault-dim'
                }`}
              >
                {sign}
              </button>
            ))}
          </div>
        </div>
      )

    case 'add':
    case 'subtract':
      return (
        <div className="flex items-center justify-center gap-3">
          <StaticFraction n={item.left.n} d={item.left.d} />
          <span className="font-mono text-xl text-vault-dim">
            {item.kind === 'add' ? '+' : '−'}
          </span>
          <StaticFraction n={item.right.n} d={item.right.d} />
          <span className="font-mono text-xl text-vault-dim">=</span>
          <FractionInput
            numerator={props.numerator}
            denominator={props.denominator}
            active={props.field}
            onFocusField={props.setField}
            state={state}
          />
        </div>
      )

    case 'of-number':
      return (
        <div className="flex items-center justify-center gap-4">
          <span className="font-display text-2xl font-extrabold tracking-tight">
            {toVulgar(item.frac)} van {item.whole}
          </span>
          <span className="font-mono text-xl text-vault-dim">=</span>
          <span
            className={`grid h-11 min-w-[52px] place-items-center rounded-xl border bg-vault-card px-3 font-mono text-[22px] font-semibold tabular ${
              state === 'goed'
                ? 'border-goed text-goed'
                : state === 'fout'
                  ? 'border-fout text-fout'
                  : 'border-plum text-plum'
            }`}
          >
            {props.numerator || ' '}
          </span>
        </div>
      )
  }
}

// -------------------------------------------------------------- feedback

/**
 * The mascot is on screen for the whole item, not only after a check.
 *
 * Two reasons. It reacts while the kid works — idle until they start,
 * thinking once they do — which is the point of having a mascot at all.
 * And because the row is always rendered, answering no longer shoves the
 * numpad down the screen the moment feedback appears.
 */
function MascotStrip({
  item,
  verdict,
  streak,
  started,
}: {
  item: FractionItem
  verdict: Verdict | null
  streak: number
  started: boolean
}) {
  const emotion: MascotEmotion = verdict
    ? verdict === 'goed'
      // Three in a row earns the bigger reaction, so it means something.
      ? streak >= 3
        ? 'excited'
        : 'happy'
      : 'sad'
    : started
      ? 'thinking'
      : 'neutral'

  return (
    <div className="mt-5 flex min-h-[3.25rem] items-center gap-3">
      <span className="flex-none">
        <Mascot emotion={emotion} size="small" animate={verdict !== null} />
      </span>
      <p className="text-[12px] leading-snug text-vault-dim">
        {verdict === null ? (
          <span className="font-mono text-[11px]">{idleLine(item, started)}</span>
        ) : (
          <>
            {verdict === 'goed' ? (
              <span className="font-semibold text-goed">
                {streak >= 3 ? `${streak} op rij! ` : 'Goed zo! '}
              </span>
            ) : (
              <span className="font-semibold text-fout">Bijna. </span>
            )}
            {explain(item, verdict)}
          </>
        )}
      </p>
    </div>
  )
}

/** What the mascot says while the kid is still working on the item. */
function idleLine(item: FractionItem, started: boolean): string {
  if (started) return 'Denk rustig na…'
  switch (item.kind) {
    case 'read-shape':
      return 'Tel eerst hoeveel stukken er zijn.'
    case 'colour-shape':
      return 'Tik de stukken aan die je wilt kleuren.'
    case 'missing-numerator':
      return 'Hoeveel keer zo groot is de noemer geworden?'
    case 'simplify':
      return 'Zoek een getal waar teller én noemer door kunnen.'
    case 'number-line':
      return 'Tel de stapjes vanaf 0.'
    case 'compare':
      return 'Zijn de noemers gelijk? Kijk dan naar de tellers.'
    case 'add':
    case 'subtract':
      return item.unlike ? 'Maak eerst de noemers gelijk.' : 'Zelfde noemer — tel de tellers op.'
    case 'of-number':
      return 'Deel eerst door de noemer.'
  }
}

/** The one line of teaching that turns a wrong answer into a lesson. */
function explain(item: FractionItem, verdict: Verdict): string {
  switch (item.kind) {
    case 'read-shape':
      return `Onder de streep hoeveel stukken er zijn (${item.parts}), erboven hoeveel er gekleurd zijn (${item.shaded}).`
    case 'colour-shape':
      return `${toVulgar(item.target)} betekent ${item.answer} van de ${item.parts} stukken.`
    case 'missing-numerator':
      return `${item.given.d} × ${item.targetD / item.given.d} = ${item.targetD}, dus de teller gaat ook ${item.targetD / item.given.d}× zo groot: ${item.answer}.`
    case 'simplify':
      return `Teller en noemer kunnen allebei door ${item.sharedFactor}: ${item.given.n} ÷ ${item.sharedFactor} = ${item.answer.n} en ${item.given.d} ÷ ${item.sharedFactor} = ${item.answer.d}.`
    case 'number-line':
      return `${toVulgar(item.target)} is ${item.target.n} stapjes van de ${item.steps}.`
    case 'compare':
      return item.left.d === item.right.d
        ? `Zelfde noemer, dus kijk alleen naar de tellers: ${item.left.n} ${item.answer} ${item.right.n}.`
        : item.left.n === item.right.n
          ? 'Zelfde teller: hoe meer stukken, hoe kleiner elk stuk.'
          : `Maak de noemers gelijk, dan zie je het: ${toVulgar(item.left)} ${item.answer} ${toVulgar(item.right)}.`
    case 'add':
    case 'subtract':
      return item.unlike
        ? `Eerst dezelfde noemer maken, dan de tellers ${item.kind === 'add' ? 'optellen' : 'aftrekken'}. Antwoord: ${item.answer.n}/${item.answer.d}.`
        : `Zelfde noemer, dus alleen de tellers ${item.kind === 'add' ? 'optellen' : 'aftrekken'}. Antwoord: ${item.answer.n}/${item.answer.d}.`
    case 'of-number':
      return verdict === 'goed'
        ? `Precies: ${item.whole} ÷ ${item.frac.d} × ${item.frac.n} = ${item.answer}.`
        : `Deel eerst door de noemer, keer dan de teller: ${item.whole} ÷ ${item.frac.d} = ${item.whole / item.frac.d}, × ${item.frac.n} = ${item.answer}.`
  }
}

// ------------------------------------------------------------- scorecard

function Scorecard({
  slug,
  correct,
  total,
  outcome,
}: {
  slug: string
  correct: number
  total: number
  outcome: RoundOutcome | null
}) {
  const def = rungDef(rungBySlug(slug)!.rung)
  const pct = Math.round((correct / total) * 100)
  const mood: MascotEmotion = pct >= 80 ? 'excited' : pct >= 50 ? 'happy' : 'sad'

  return (
    <WorldShell world="breuken" backHref="/breuken" backLabel="Ladder">
      <div className="pt-8 text-center">
        <div className="flex justify-center">
          <Mascot emotion={mood} size="large" animate />
        </div>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-vault-dim">
          Trede {def.rung} · {def.title}
        </p>
        <p className="mt-3 font-display text-[3.25rem] font-extrabold leading-none tabular tracking-tight text-plum">
          {correct}
          <span className="text-vault-dim">/{total}</span>
        </p>
        <p className="mt-2 font-mono text-xs text-vault-dim">{pct}% goed</p>
        <p className="mt-3 text-sm text-vault-dim">
          {pct >= 80
            ? 'Knap gedaan — die breuken liggen je.'
            : pct >= 50
              ? 'Goed bezig. Nog een rondje en je hebt hem.'
              : 'Nog even oefenen. Dat komt goed.'}
        </p>

        {outcome?.pastry && (
          <div className="mt-7 rounded-2xl vault-card-lit p-5">
            <p className="text-[46px] leading-none" aria-hidden>
              {outcome.pastry.emoji}
            </p>
            <p className="mt-2 font-display text-lg font-extrabold tracking-tight">
              {outcome.upgraded ? 'Opgewaardeerd!' : outcome.pastry.nameNl}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-vault-dim">
              {tierLabel(outcome.tier)} · in de bakkerij
            </p>
          </div>
        )}

        {outcome?.rungCompleted && (
          <p className="mt-5 font-display text-sm font-bold text-plum">
            Trede {def.rung} is af!
            {outcome.unlockedNextRung && ' De volgende trede staat nu open.'}
          </p>
        )}

        <div className="mt-8 space-y-2">
          <Link
            href={`/breuken/${slug}`}
            className="block w-full rounded-2xl bg-plum py-3.5 text-center font-display text-base font-extrabold tracking-tight text-vault-night"
          >
            Nog een ronde
          </Link>
          <Link
            href="/breuken"
            className="block w-full rounded-2xl border border-vault-line bg-vault-card py-3 text-center font-display text-sm font-bold text-vault-dim"
          >
            Terug naar de ladder
          </Link>
        </div>
      </div>
    </WorldShell>
  )
}

function tierLabel(tier: RoundOutcome['tier']): string {
  switch (tier) {
    case 'platinum':
      return 'Platina'
    case 'gold':
      return 'Goud'
    case 'silver':
      return 'Zilver'
    case 'bronze':
      return 'Brons'
    default:
      return ''
  }
}

// ---------------------------------------------------------------- pieces

function StaticFraction({ n, d }: { n: number; d: number }) {
  return (
    <span className="flex flex-col items-center gap-1.5" aria-label={`${n} ${d}de`}>
      <span className="font-mono text-[22px] font-semibold tabular">{n}</span>
      <span aria-hidden className="h-0.5 w-8 rounded-sm bg-vault-ink" />
      <span className="font-mono text-[22px] font-semibold tabular">{d}</span>
    </span>
  )
}

/**
 * The instruction above the item.
 *
 * `item.prompt` carries the sum itself so every generated item is unique
 * (generateSet dedupes on it), but for the kinds whose body already
 * *shows* that sum, repeating it as a heading is just noise. Those get
 * an instruction instead.
 */
function headline(item: FractionItem): string {
  switch (item.kind) {
    case 'missing-numerator':
      return 'Welk getal hoort hier?'
    case 'simplify':
      return 'Vereenvoudig zo ver als het kan'
    case 'compare':
      return 'Wat hoort ertussen?'
    case 'add':
      return 'Tel op'
    case 'subtract':
      return 'Trek af'
    case 'of-number':
      return 'Reken uit'
    default:
      // read-shape, colour-shape and number-line prompts are already
      // instructions, not restatements.
      return item.prompt
  }
}

/** What the kid still has to do before the answer can be checked. */
function missingHint(item: FractionItem): string {
  switch (item.kind) {
    case 'colour-shape':
      return `Tik op de ${item.shape === 'pie' ? 'taart' : 'reep'} om te kleuren`
    case 'number-line':
      return 'Kies een plek op de lijn'
    case 'compare':
      return 'Kies <, = of >'
    default:
      return 'Vul je antwoord in'
  }
}

function needsNumpad(item: FractionItem): boolean {
  return (
    item.kind === 'read-shape' ||
    item.kind === 'missing-numerator' ||
    item.kind === 'simplify' ||
    item.kind === 'add' ||
    item.kind === 'subtract' ||
    item.kind === 'of-number'
  )
}

function Numpad({
  onDigit,
  onBackspace,
  onConfirm,
  canConfirm,
}: {
  onDigit: (d: string) => void
  onBackspace: () => void
  onConfirm: () => void
  canConfirm: boolean
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
        <Key key={d} onClick={() => onDigit(d)}>
          {d}
        </Key>
      ))}
      <Key onClick={onBackspace} muted>
        ⌫
      </Key>
      <Key onClick={() => onDigit('0')}>0</Key>
      <button
        type="button"
        onClick={onConfirm}
        disabled={!canConfirm}
        className={`rounded-xl py-2.5 font-display text-[13px] font-bold transition-colors ${
          canConfirm
            ? 'bg-plum text-vault-night'
            : 'cursor-not-allowed border border-vault-line bg-vault-card text-vault-dim'
        }`}
      >
        OK
      </button>
    </div>
  )
}

function Key({
  onClick,
  muted = false,
  children,
}: {
  onClick: () => void
  muted?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border border-vault-line bg-vault-card py-2.5 font-mono text-base transition-colors hover:border-vault-dim ${
        muted ? 'text-vault-dim' : ''
      }`}
    >
      {children}
    </button>
  )
}
