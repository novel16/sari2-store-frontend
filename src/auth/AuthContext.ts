import { createContext } from 'react'
import type { AuthError } from './errors'
import type { AuthUser, LoginData, RegisterData } from './types'

export interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  error: AuthError | null
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  replaceUser: (user: AuthUser) => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
