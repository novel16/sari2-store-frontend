import type { ReactNode } from 'react'

export function Badge({
  children,
  tone = 'green',
}: {
  children: ReactNode
  tone?: 'green' | 'orange' | 'red' | 'neutral' | 'blue'
}) {
  return (
    <span className={`badge badge-${tone}`}>
      <span className="badge-dot" />
      {children}
    </span>
  )
}
