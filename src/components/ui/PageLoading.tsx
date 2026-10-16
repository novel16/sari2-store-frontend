import { Store } from 'lucide-react'

export default function PageLoading() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      className="flex min-h-[60dvh] items-center justify-center bg-paper text-forest"
    >
      <span className="flex size-16 items-center justify-center rounded-2xl bg-forest/5">
        <Store size={28} className="animate-pulse motion-reduce:animate-none" />
      </span>
    </div>
  )
}
