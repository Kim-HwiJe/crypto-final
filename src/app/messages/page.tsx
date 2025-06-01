// src/app/messages/page.tsx
import React, { Suspense } from 'react'
import MessagesInner from './MessagesInner'

export const dynamic = 'force-dynamic'

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">로딩 중…</div>}>
      <MessagesInner />
    </Suspense>
  )
}
