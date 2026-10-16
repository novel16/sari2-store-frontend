import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'

export function StatCard({
  label,
  value,
  icon,
  note,
  trend,
  className = '',
}: {
  label: string
  value: string
  icon: ReactNode
  note?: string
  trend?: string
  className?: string
}) {
  return (
    <div className={`stat-card ${className}`}>
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <strong className="stat-value">{value}</strong>
      <div className="stat-foot">
        {trend && (
          <span className="stat-trend">
            <ArrowUpRight size={13} />
            {trend}
          </span>
        )}
        <span>{note}</span>
      </div>
    </div>
  )
}
