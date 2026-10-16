import { LoaderCircle, RefreshCw } from 'lucide-react'
import type { AuthError } from '../../auth/errors'

export function QueryState({
  loading,
  error,
  retry,
}: {
  loading: boolean
  error?: AuthError
  retry: () => void
}) {
  if (loading)
    return (
      <div
        role="status"
        className="panel flex min-h-40 items-center justify-center gap-3 p-6 text-sm text-stone-500"
      >
        <LoaderCircle size={20} className="animate-spin" />
        Loading your store data…
      </div>
    )
  if (error)
    return (
      <div role="alert" className="panel p-6">
        <p className="mb-4 text-sm text-red-700">{error.message}</p>
        <button className="btn btn-secondary" onClick={retry}>
          <RefreshCw size={14} />
          Try again
        </button>
      </div>
    )
  return null
}
