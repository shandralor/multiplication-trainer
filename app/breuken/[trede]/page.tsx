'use client'

import { use } from 'react'
import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { rungBySlug } from '@/lib/fractions/ladder'

/**
 * The round is client-only. Its question set is generated at random, so
 * a server render would produce different items from the client's and
 * hydration would fail — there is nothing meaningful to prerender here
 * anyway, since every value on the screen comes from localStorage.
 */
const Round = dynamic(() => import('./round').then((m) => m.Round), {
  ssr: false,
  loading: () => <RoundSkeleton />,
})

export default function TredePage({ params }: { params: Promise<{ trede: string }> }) {
  const { trede } = use(params)
  const def = rungBySlug(trede)
  if (!def) notFound()

  return <Round slug={def.slug} />
}

function RoundSkeleton() {
  return (
    <div className="min-h-screen bg-vault world-breuken">
      <div className="mx-auto max-w-2xl px-4 pt-16">
        <div className="h-3 w-24 rounded-sm bg-line" />
        <div className="mt-6 h-7 w-2/3 rounded-sm bg-line" />
      </div>
    </div>
  )
}
