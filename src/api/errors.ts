import axios from 'axios'
import { AuthError, toAuthError } from '../auth/errors'

export function toApiError(error: unknown): AuthError {
  if (axios.isAxiosError(error) && error.response?.status === 409) {
    const message: unknown = error.response.data?.message
    return new AuthError(
      typeof message === 'string' ? message : 'This record changed. Reload and try again.',
      409,
    )
  }
  return toAuthError(error)
}
