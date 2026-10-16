import type { ReactNode } from 'react'

export default function AuthHeading({
  icon,
  eyebrow,
  title,
  children,
}: {
  icon: ReactNode
  eyebrow: string
  title: string
  children: ReactNode
}) {
  return (
    <div>
      <span className="mb-6 grid size-12 place-items-center rounded-[14px] border border-[#e2e7d9] bg-[#edf0e6] text-[#527447] shadow-[0_3px_0_#e9ece2]">
        {icon}
      </span>
      <div className="mb-2.5 text-[8px] font-bold tracking-[1.5px] text-[#6c7b60]">{eyebrow}</div>
      <h1 className="mb-2.5 font-display text-[27px] font-bold leading-[1.3] tracking-[-1px] text-ink max-[900px]:text-[24px] max-[700px]:text-[27px] min-[1500px]:text-[31px]">
        {title}
      </h1>
      <p className="mb-[30px] text-[11px] leading-[1.8] text-[#687668] max-[700px]:text-[12px]">
        {children}
      </p>
    </div>
  )
}
