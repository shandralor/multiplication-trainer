'use client'

import { AppHeader } from '@/components/app-header'
import { OperationSetup } from '@/components/operation-setup'
import { WorldShell } from '@/components/world-shell'

export default function DelenPage() {
  return (
    <WorldShell world="delen" backHref="/">
      <AppHeader />
      <OperationSetup operation="divide" showKluis />
    </WorldShell>
  )
}
