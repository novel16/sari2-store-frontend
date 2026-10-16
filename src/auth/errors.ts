import axios from 'axios'

export type FieldErrors = Record<string, string[]>

export class AuthError extends Error {
  status?: number
  fields: FieldErrors

  constructor(message: string, status?: number, fields: FieldErrors = {}) {
    super(message)
    this.name = 'AuthError'
    this.status = status
    this.fields = fields
  }
}

export function toAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) return error
  if (!axios.isAxiosError(error)) return new AuthError('Something went wrong. Please try again.')

  const status = error.response?.status
  if (!error.response) {
    return new AuthError('We couldn’t connect to your store. Check your connection and try again.')
  }

  const payload = error.response.data as { message?: unknown; errors?: unknown } | undefined
  const fields: FieldErrors = {}
  if (payload?.errors && typeof payload.errors === 'object') {
    for (const [name, messages] of Object.entries(payload.errors)) {
      if (Array.isArray(messages))
        fields[name] = messages.filter((message): message is string => typeof message === 'string')
    }
  }

  if (status === 422)
    return new AuthError('Please check the highlighted fields and try again.', status, fields)
  if (status === 419)
    return new AuthError(
      'Your session has expired. Please try again to reconnect securely.',
      status,
    )
  if (status === 429)
    return new AuthError('Too many attempts. Please wait a moment before trying again.', status)
  if (status === 403)
    return new AuthError(
      'Your account does not have access. Please contact your store administrator.',
      status,
    )
  if (status === 401) return new AuthError('Your session has ended. Please sign in again.', status)
  return new AuthError(
    'The store service is temporarily unavailable. Please try again shortly.',
    status,
  )
}
