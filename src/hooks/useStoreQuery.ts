import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { http } from '../api/http'
import { toApiError } from '../api/errors'
import type { AuthError } from '../auth/errors'
import { useAuth } from '../auth/useAuth'

async function getData<T>(path: string, signal: AbortSignal): Promise<T> {
  return (await http.get<T>(path, { signal })).data
}

export function useStoreQuery<T>(
  path: string | null,
  loader: (path: string, signal: AbortSignal) => Promise<T> = getData,
) {
  const { refresh } = useAuth()
  const [revision, setRevision] = useState(0)
  const key = `${path}:${revision}`
  const [state, setState] = useState<{ key: string; data?: T; error?: AuthError }>({ key: '' })
  const reload = useCallback(() => setRevision((value) => value + 1), [])

  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    void loader(path, controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ key, data })
      },
      (failure) => {
        if (controller.signal.aborted || axios.isCancel(failure)) return
        const error = toApiError(failure)
        setState({ key, error })
        if (error.status === 401 || error.status === 403) void refresh()
      },
    )
    return () => controller.abort()
  }, [path, key, loader, refresh])

  const current = state.key === key
  return {
    data: current ? state.data : undefined,
    error: current ? state.error : undefined,
    isLoading: Boolean(path) && (!current || (!state.data && !state.error)),
    reload,
  }
}
