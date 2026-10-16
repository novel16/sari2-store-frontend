import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './AuthContext'
import { authApi } from './authApi'
import { toAuthError } from './errors'
import type { AuthError } from './errors'
import type { AuthUser, LoginData, RegisterData } from './types'
import { clearUserDrafts } from '../pages/pos/draft'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const requestVersion = useRef(0)

  const loadSession = useCallback(async (version: number) => {
    try {
      const current = await authApi.me()
      if (version === requestVersion.current) setUser(current)
    } catch (failure) {
      if (version !== requestVersion.current) return
      const nextError = toAuthError(failure)
      setUser(null)
      if (nextError.status !== 401) setError(nextError)
    } finally {
      if (version === requestVersion.current) setIsLoading(false)
    }
  }, [])

  const refresh = useCallback(() => {
    const version = ++requestVersion.current
    setIsLoading(true)
    setError(null)
    return loadSession(version)
  }, [loadSession])

  useEffect(() => {
    const version = ++requestVersion.current
    void loadSession(version)
    return () => {
      requestVersion.current += 1
    }
  }, [loadSession])

  const login = useCallback(async (data: LoginData) => {
    try {
      const current = await authApi.login(data)
      requestVersion.current += 1
      setUser(current)
      setError(null)
    } catch (failure) {
      throw toAuthError(failure)
    }
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    try {
      const current = await authApi.register(data)
      requestVersion.current += 1
      setUser(current)
      setError(null)
    } catch (failure) {
      throw toAuthError(failure)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch (failure) {
      const nextError = toAuthError(failure)
      if (nextError.status !== 401) throw nextError
    }
    requestVersion.current += 1
    if (user) {
      try {
        clearUserDrafts(sessionStorage, user.id)
      } catch {
        /* No draft data is required to sign out. */
      }
    }
    setUser(null)
    setError(null)
  }, [user])

  const replaceUser = useCallback((current: AuthUser) => {
    requestVersion.current += 1
    setUser(current)
    setError(null)
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, error, login, register, logout, refresh, replaceUser }),
    [user, isLoading, error, login, register, logout, refresh, replaceUser],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
