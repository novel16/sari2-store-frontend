import type { ReactNode } from 'react'
import { Package } from 'lucide-react'

export function EmptyState({
  title = 'Nothing here yet',
  description = 'Try a different search or filter.',
  action,
}: {
  title?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Package size={28} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}
