'use client'

import { AppHeader } from '@/components/app-header'
import { OperationSetup } from '@/components/operation-setup'
import { WorldShell } from '@/components/world-shell'

export default function TafelsPage() {
  return (
    <WorldShell world="tafels" backHref="/">
      <AppHeader />
      <OperationSetup operation="multiply" showKluis />
    </WorldShell>
  )
}
