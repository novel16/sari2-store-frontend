import type { ReactNode } from 'react'
import { ShieldCheck } from 'lucide-react'

export default function Assurance({ children }: { children: ReactNode }) {
  return (
    <div className="mt-7 flex items-center justify-center gap-1.5 text-center text-[8px] leading-[1.7] text-[#687668] max-[700px]:text-[9px]">
      <ShieldCheck size={15} className="shrink-0 text-[#9eac8b]" />
      <span>{children}</span>
    </div>
  )
}
