import React, { Suspense } from 'react'
import SearchResults from './SearchResults'

export const dynamic = 'force-dynamic'

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">로딩 중…</div>}>
      <SearchResults />
    </Suspense>
  )
}
