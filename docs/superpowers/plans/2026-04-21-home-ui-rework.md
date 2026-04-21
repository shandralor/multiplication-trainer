# Home UI Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "thrown-together" home with a clean three-equal-portal layout (Kluis / × / ÷) and move tafel + modus configuration into two dedicated sub-pages with a mode-first wizard flow.

**Architecture:** Pure UI + routing. Extract a shared `<AppHeader>` for chrome. Build one `<OperationSetup>` component that powers both new sub-pages. Strip `app/page.tsx` to a portal. No backend/logic changes — `/quiz` and `/safe` untouched; sub-pages build the same `/quiz?...` URL today's home builds.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui.

**Spec:** `docs/superpowers/specs/2026-04-21-home-ui-rework-design.md`

---

## File Structure

| Responsibility                     | File                                      | New? |
|------------------------------------|-------------------------------------------|------|
| Shared top bar (title, chips, links) | `components/app-header.tsx`             | ✅   |
| Mode-first setup wizard (× and ÷)  | `components/operation-setup.tsx`          | ✅   |
| `/vermenigvuldigen` route          | `app/vermenigvuldigen/page.tsx`           | ✅   |
| `/delen` route                     | `app/delen/page.tsx`                      | ✅   |
| Home portal                        | `app/page.tsx`                            | modify |

Nothing else changes. `/quiz`, `/safe`, `/progress`, `lib/*`, and `components/safe/*` stay as-is.

---

## Task 1: Extract `<AppHeader>` and wire it on home

Creates the shared chrome strip (gradient title, streak + medal chips, Mijn voortgang link, profile selector) and swaps it in on the current home. Medal chip (🏅 N) replaces today's quiz-count chip (✅ N quizzen).

**Files:**
- Create: `components/app-header.tsx`
- Modify: `app/page.tsx` (replace inline header block with `<AppHeader />`)

- [ ] **Step 1: Create `components/app-header.tsx`**

```tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProfileSelector } from '@/components/profile-selector'
import { initializeProfiles, getCurrentProfile } from '@/lib/profile-manager'

type AppHeaderProps = {
  onProfileChange?: () => void
}

export function AppHeader({ onProfileChange }: AppHeaderProps) {
  const [streak, setStreak] = useState(0)
  const [medalCount, setMedalCount] = useState(0)

  const reload = useCallback(() => {
    const profile = getCurrentProfile()
    if (profile) {
      setStreak(profile.currentStreak)
      setMedalCount(new Set(profile.achievements.map((a) => a.id)).size)
    }
    onProfileChange?.()
  }, [onProfileChange])

  useEffect(() => {
    initializeProfiles()
    reload()
  }, [reload])

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Tafel Trainer
          </h1>
          <div className="flex items-center gap-3">
            <Link href="/progress">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                📊 Mijn voortgang
              </Button>
            </Link>
            <ProfileSelector onProfileChange={reload} />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900 px-3 py-1 rounded-full">
            <span className="text-xl">🔥</span>
            <span className="font-bold text-orange-600 dark:text-orange-300 text-sm">
              {streak} dagen
            </span>
          </div>
          <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full">
            <span className="text-xl">🏅</span>
            <span className="font-bold text-green-600 dark:text-green-300 text-sm">
              {medalCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Swap inline header in `app/page.tsx`**

Remove the existing `{/* Header with stats */}` block (currently `app/page.tsx` lines ~90–116). Replace with a single `<AppHeader onProfileChange={loadProfileData} />` call. Remove the now-unused `Link`, `ProfileSelector`, `initializeProfiles`, `getCurrentProfile`, and `Button` imports only if nothing else uses them — confirm first (the Kraak de kluis tile still uses `<Link>` and the bottom buttons may use `<Button>`, so likely keep them). Delete the `totalQuizzes` state and `setTotalQuizzes` call if no longer rendered anywhere on the page.

- [ ] **Step 3: Run dev server and smoke-test**

Run: `npm run dev` (from the worktree root). Open `http://localhost:3000/` (or 3001 if 3000 is busy). Expected: header looks identical to before, except the `✅ N quizzen` chip is now `🏅 N` (medal count) with a trophy emoji. Switch profiles via the selector — chips update.

- [ ] **Step 4: Commit**

```bash
git add components/app-header.tsx app/page.tsx
git commit -m "refactor(home): extract <AppHeader>, swap quiz-count chip for medal count

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Create `<OperationSetup>` component

The mode-first wizard shared by `/vermenigvuldigen` and `/delen`. Mounts its own mascot inline next to the page title, holds all setup state, and on Start! navigates to `/quiz?...` with the correct params.

**Files:**
- Create: `components/operation-setup.tsx`

- [ ] **Step 1: Create `components/operation-setup.tsx`**

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Mascot } from '@/components/mascot'

type Operation = 'multiply' | 'divide'
type QuizMode = 'quiz' | 'practice' | 'timed'

type OperationSetupProps = {
  operation: Operation
}

const OP_CONFIG = {
  multiply: {
    title: '× Vermenigvuldigen',
    accentText: 'text-emerald-700 dark:text-emerald-400',
    tileActive: 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg scale-105',
    pillActive: 'bg-emerald-700 text-white shadow-md',
  },
  divide: {
    title: '÷ Delen',
    accentText: 'text-blue-700 dark:text-blue-400',
    tileActive: 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg scale-105',
    pillActive: 'bg-blue-700 text-white shadow-md',
  },
} as const

const MODE_TILES: { id: QuizMode; emoji: string; label: string }[] = [
  { id: 'quiz',     emoji: '📝', label: 'Quiz' },
  { id: 'practice', emoji: '♾️', label: 'Oefen' },
  { id: 'timed',    emoji: '⏱️', label: 'Tijd' },
]

const MODE_GRADIENT: Record<QuizMode, string> = {
  quiz:     'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white',
  practice: 'bg-gradient-to-br from-blue-500 to-blue-700 text-white',
  timed:    'bg-gradient-to-br from-amber-500 to-amber-700 text-gray-900',
}

export function OperationSetup({ operation }: OperationSetupProps) {
  const cfg = OP_CONFIG[operation]
  const [mode, setMode] = useState<QuizMode>('quiz')
  const [tables, setTables] = useState<number[]>([])
  const [count, setCount] = useState(10)
  const [time, setTime] = useState(5)
  const [mascotEmotion, setMascotEmotion] = useState<
    'happy' | 'sad' | 'neutral' | 'excited' | 'thinking'
  >('neutral')
  const [mascotAnimate, setMascotAnimate] = useState(false)

  const toggleTable = (t: number) => {
    setTables((prev) => {
      const has = prev.includes(t)
      if (!has) {
        setMascotEmotion('happy')
        setMascotAnimate(true)
        setTimeout(() => {
          setMascotEmotion('neutral')
          setMascotAnimate(false)
        }, 600)
      }
      return has ? prev.filter((x) => x !== t) : [...prev, t]
    })
  }

  const selectAll = () => setTables([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  const clearAll = () => setTables([])

  const canStart = tables.length > 0

  const start = () => {
    if (!canStart) return
    const params = new URLSearchParams({
      tables: [...tables].sort((a, b) => a - b).join(','),
      mode,
      operation,
      count: count.toString(),
      ...(mode === 'timed' && { time: time.toString() }),
    })
    window.location.href = `/quiz?${params.toString()}`
  }

  const startSub = (() => {
    const modeLabel = mode === 'quiz' ? 'Quiz' : mode === 'practice' ? 'Oefen' : 'Tijd'
    const tlabel = tables.length === 1 ? '1 tafel' : `${tables.length} tafels`
    const tail = mode === 'timed' ? ` · ${time}s per vraag` : ''
    return canStart
      ? `${modeLabel} · ${tlabel} · ${count} vragen${tail}`
      : 'Kies eerst je tafels'
  })()

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-4 md:space-y-6">
      {/* Back + title + mascot */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
        >
          ← Home
        </Link>
        <h2 className={`ml-auto text-2xl md:text-3xl font-bold ${cfg.accentText}`}>
          {cfg.title}
        </h2>
        <div className="flex-shrink-0">
          <Mascot emotion={mascotEmotion} size="small" animate={mascotAnimate} />
        </div>
      </div>

      {/* Mode row */}
      <Card className="border-2 shadow-xl">
        <CardContent className="p-4 md:p-6">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
            1. Kies je modus
          </h3>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {MODE_TILES.map((t) => {
              const active = mode === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setMode(t.id)}
                  className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                    active
                      ? `${MODE_GRADIENT[t.id]} border-transparent scale-105 shadow-lg`
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="text-xl">{t.emoji}</div>
                  <div>{t.label}</div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tafels */}
      <Card className="border-2 shadow-xl">
        <CardContent className="p-4 md:p-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              2. Kies je tafels
            </h3>
            <div className="flex gap-3 text-xs">
              <button onClick={selectAll} className="text-emerald-600 hover:underline font-semibold">
                alles
              </button>
              <button onClick={clearAll} className="text-gray-500 hover:underline font-semibold">
                wissen
              </button>
            </div>
          </div>
          <div className="grid grid-cols-10 gap-1.5 md:gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((t) => {
              const active = tables.includes(t)
              return (
                <button
                  key={t}
                  onClick={() => toggleTable(t)}
                  className={`aspect-square rounded-lg font-bold text-sm md:text-base transition-all ${
                    active
                      ? cfg.tileActive
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Config */}
      <Card className="border-2 shadow-xl">
        <CardContent className="p-4 md:p-6 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              3. Aantal vragen
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 30, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`py-2 rounded-lg font-bold text-sm transition-all ${
                    count === n
                      ? cfg.pillActive
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className={mode === 'timed' ? '' : 'opacity-50 pointer-events-none'}>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Tijd per vraag{' '}
              <span className="text-xs font-normal text-gray-400">
                (alleen tijdmodus)
              </span>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setTime(s)}
                  className={`py-2 rounded-lg font-bold text-sm transition-all ${
                    time === s
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {s}s
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Start */}
      <button
        onClick={start}
        disabled={!canStart}
        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
          canStart
            ? `${MODE_GRADIENT[mode]} hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0`
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        <div>Start!</div>
        <div className="text-xs font-normal opacity-90 mt-0.5">{startSub}</div>
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit (component not yet mounted — no visible change)**

```bash
git add components/operation-setup.tsx
git commit -m "feat(ui): add <OperationSetup> — shared mode-first wizard for × and ÷

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Add `/vermenigvuldigen` and `/delen` routes

Thin page files that render `<AppHeader />` + `<OperationSetup operation="..." />`.

**Files:**
- Create: `app/vermenigvuldigen/page.tsx`
- Create: `app/delen/page.tsx`

- [ ] **Step 1: Create `app/vermenigvuldigen/page.tsx`**

```tsx
'use client'

import { AppHeader } from '@/components/app-header'
import { OperationSetup } from '@/components/operation-setup'

export default function VermenigvuldigenPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <AppHeader />
      <OperationSetup operation="multiply" />
    </div>
  )
}
```

- [ ] **Step 2: Create `app/delen/page.tsx`**

```tsx
'use client'

import { AppHeader } from '@/components/app-header'
import { OperationSetup } from '@/components/operation-setup'

export default function DelenPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <AppHeader />
      <OperationSetup operation="divide" />
    </div>
  )
}
```

- [ ] **Step 3: Smoke-test both routes**

With `npm run dev` running, open `http://localhost:3000/vermenigvuldigen` and `http://localhost:3000/delen`. Expected: page renders with header + green (or blue) title + mascot + three mode tiles + 10 tafel cells + config pills + Start! button. Quiz tile is pre-active; Start! is disabled with "Kies eerst je tafels" sub-line. Pick tafel 3 → Start! enables with "Quiz · 1 tafel · 10 vragen". Click Start! → navigates to `/quiz?tables=3&mode=quiz&operation=multiply&count=10` and gameplay works.

Switch to Tijd modus → time pills un-grey → pick 4s → Start! sub-line becomes "Tijd · 1 tafel · 10 vragen · 4s per vraag" → URL includes `&time=4`.

- [ ] **Step 4: Commit**

```bash
git add app/vermenigvuldigen app/delen
git commit -m "feat(routes): /vermenigvuldigen and /delen — dedicated setup pages

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Rewrite home as three-world portal

Strip the old operation/tafel/config/mode sections. Keep `<AppHeader />` and the mascot/welcome block. Render three equal-weight portals (Kluis with live hint, ×, ÷).

**Files:**
- Modify: `app/page.tsx` (heavy rewrite — most of the file replaced)

- [ ] **Step 1: Read current home for reference**

Keep the existing dark-mode gradient wrapper, the top-level `'use client'`, and the existing `Mascot` emotion hooks. Discard everything related to `selectedOperation`, `selectedTables`, `timePerQuestion`, `questionCount`, `startQuiz`, `toggleTable`, `selectAll`, `clearAll`.

- [ ] **Step 2: Replace `app/page.tsx` with the portal version**

```tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AppHeader } from '@/components/app-header'
import { Mascot } from '@/components/mascot'
import { getCurrentProfile, type AnimalEntry } from '@/lib/profile-manager'

const ANIMAL_EMOJI: Record<number, string> = {
  1: '🐥', 2: '🦆', 3: '🐰', 4: '🐶', 5: '🐷',
  6: '🐼', 7: '🐵', 8: '🐻', 9: '🦒', 10: '🐘',
}

export default function Home() {
  const [animals, setAnimals] = useState<AnimalEntry[]>([])

  const loadProfileData = useCallback(() => {
    const profile = getCurrentProfile()
    setAnimals(profile?.animals ?? [])
  }, [])

  useEffect(() => {
    loadProfileData()
  }, [loadProfileData])

  const collectedCount = animals.length
  const kluisSub =
    collectedCount === 0
      ? 'Verzamel alle 10 dieren'
      : `${animals
          .slice(0, 5)
          .map((a) => ANIMAL_EMOJI[a.tableIndex] ?? '•')
          .join(' ')}  ${collectedCount}/10 dieren`

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <AppHeader onProfileChange={loadProfileData} />

      <div className="max-w-md mx-auto px-4 py-8 space-y-5">
        {/* Mascot + welcome */}
        <div className="flex items-center gap-4 pt-2">
          <Mascot emotion="neutral" size="medium" />
          <div>
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Welkom terug!
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Kies een wereld om te spelen
            </p>
          </div>
        </div>

        {/* Kluis portal */}
        <Link href="/safe" className="block">
          <button className="w-full py-5 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all bg-gradient-to-br from-amber-500 via-rose-500 to-indigo-700 text-white">
            <div className="flex items-center justify-center gap-2 text-xl">
              <span className="text-2xl">🔐</span>
              <span>Kraak de kluis</span>
            </div>
            <div className="text-xs font-normal opacity-95 mt-1">{kluisSub}</div>
          </button>
        </Link>

        {/* Vermenigvuldigen portal */}
        <Link href="/vermenigvuldigen" className="block">
          <button className="w-full py-5 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all bg-gradient-to-br from-emerald-500 to-emerald-700 text-white">
            <div className="flex items-center justify-center gap-2 text-xl">
              <span className="text-2xl">×</span>
              <span>Vermenigvuldigen</span>
            </div>
            <div className="text-xs font-normal opacity-95 mt-1">Quiz · oefen · tijdrace</div>
          </button>
        </Link>

        {/* Delen portal */}
        <Link href="/delen" className="block">
          <button className="w-full py-5 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all bg-gradient-to-br from-blue-500 to-blue-700 text-white">
            <div className="flex items-center justify-center gap-2 text-xl">
              <span className="text-2xl">÷</span>
              <span>Delen</span>
            </div>
            <div className="text-xs font-normal opacity-95 mt-1">Quiz · oefen · tijdrace</div>
          </button>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run type-check and build**

Run: `npm run build`

Expected: build succeeds. If TypeScript flags unused imports in any file touched during Task 1, clean them up now. `AnimalEntry` must be exported from `lib/profile-manager.ts` (already exists per grep earlier — type alias on line 17).

- [ ] **Step 4: Smoke-test home + full flow**

Open `http://localhost:3000/`. Expected:

1. Header visible with streak + medal chips and Mijn voortgang link.
2. Mascot + "Welkom terug! Kies een wereld om te spelen" above the portals.
3. Three stacked portals: Kluis (with `0/10 dieren` or `<emojis> N/10 dieren`), × Vermenigvuldigen, ÷ Delen.
4. Tap Kluis → navigates to `/safe`.
5. Tap Vermenigvuldigen → navigates to `/vermenigvuldigen` → complete a setup → gameplay works.
6. Tap Delen → navigates to `/delen` → complete a setup with Tijd modus → gameplay works.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat(home): three-world portal — kluis, vermenigvuldigen, delen

Strips operation toggle, tafel grid, count/time pills, and mode buttons
from the home. Each world now has its own page. Kluis card shows live
collection progress (N/10 dieren with up to 5 animal emojis).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Manual verification pass

Run through the spec's full QA list. This is the only "test suite" for this feature — no Vitest coverage because it's all UI/routing.

**Files:** None (manual only).

- [ ] **Step 1: Ensure dev server is running**

Run: `npm run dev` and open the reported URL.

- [ ] **Step 2: Walk the checklist**

For each item, confirm the expected behavior. Note any misses, fix, and re-verify.

- [ ] Home renders three portals; kluis shows `0/10 dieren` on a fresh profile.
- [ ] After collecting an animal via `/safe`, return home → kluis shows `<emoji> 1/10 dieren`.
- [ ] Up to 5 animal emojis render in the hint; with 6+ animals only the first 5 appear.
- [ ] Tapping each portal routes correctly (`/safe`, `/vermenigvuldigen`, `/delen`).
- [ ] On `/vermenigvuldigen`: Quiz mode pre-selected; tafel 3 toggles on/off with mascot reacting.
- [ ] Picking 20 vragen → Start! sub-line updates to "Quiz · 1 tafel · 20 vragen".
- [ ] Click Start! → URL is `/quiz?tables=3&mode=quiz&operation=multiply&count=20`; gameplay works and completes.
- [ ] Switching to Tijd modus un-greys the time pills; picking 4s adds `&time=4` to the URL.
- [ ] Start! disabled when no tafels selected; sub-line reads "Kies eerst je tafels".
- [ ] Same flow on `/delen` with `operation=divide`; gradient is blue.
- [ ] Streak and medal chips visible on all three screens (home, vermenigvuldigen, delen) with correct counts.
- [ ] Medal chip count matches unique medals (duplicates across cycles don't double-count).
- [ ] Back link on sub-pages returns to `/`.
- [ ] Mobile viewport (Chrome DevTools 375 × 667): nothing clips; tafel row fits in 10 cells.
- [ ] Desktop viewport: max-w caps keep the portal column narrow and focused.
- [ ] Profile switcher: changing profiles updates chips on home AND on /vermenigvuldigen AND on /delen.

- [ ] **Step 3: Mark task #43 complete**

Once all checks pass, update the superpowers task list — this plan's work is done.
