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
