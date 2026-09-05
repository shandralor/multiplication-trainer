'use client'

import SafePage from '@/app/tafels/kluis/page'

/**
 * The deelkluis. Same dial, same numpad, same animals and medals — only
 * the slots pose 60 ÷ 6 instead of 6 × 10, which is the same fact read
 * backwards. Cracking the ÷7 safe frees the same monkey.
 */
export default function DeelkluisPage() {
  return <SafePage operation="divide" />
}
