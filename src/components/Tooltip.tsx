'use client'

import React, { useState } from 'react'

export default function Tooltip({
  children,
  message,
}: {
  children: React.ReactNode
  message: string
}) {
  const [show, setShow] = useState(false)
  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 text-xs bg-gray-900 text-white rounded shadow-lg whitespace-nowrap">
          {message}
        </span>
      )}
    </span>
  )
}
