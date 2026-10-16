import type { ReactNode } from 'react'

export function DemoNote({ children }: { children?: ReactNode }) {
  return (
    <div className="demo-note">
      <span className="demo-dot" />
      {children ?? 'Design preview · You’re exploring sample store data.'}
    </div>
  )
}
