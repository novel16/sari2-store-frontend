import { Store } from 'lucide-react'

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className={`brand${light ? ' brand-light' : ''}`}>
      <span className="brand-mark">
        <Store size={23} strokeWidth={1.8} />
      </span>
      <div>
        <strong>
          sarisari<span>﹒</span>
        </strong>
        <small>YOUR EVERYDAY STORE PARTNER</small>
      </div>
    </div>
  )
}
