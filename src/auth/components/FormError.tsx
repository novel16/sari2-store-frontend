import { AlertCircle } from 'lucide-react'
import type { AuthError } from '../errors'

export default function FormError({ error }: { error: AuthError | null }) {
  if (!error) return null
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-[11px] leading-relaxed text-red-800"
    >
      <AlertCircle size={16} className="mt-px shrink-0" />
      <span>{error.message}</span>
    </div>
  )
}
