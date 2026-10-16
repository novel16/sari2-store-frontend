import { writeWithCsrf } from '../api/http'
import type { UserResponse } from '../auth/types'
import { storePath } from '../catalog/api'

export const settingsApi = {
  store: (id: number, input: { name: string; address: string; phone: string }) =>
    writeWithCsrf<UserResponse>('patch', storePath(id), input),
  profile: (input: { name: string; email: string; current_password?: string }) =>
    writeWithCsrf<UserResponse>('patch', '/api/v1/me/profile', input),
  password: (input: {
    current_password: string
    password: string
    password_confirmation: string
  }) => writeWithCsrf<{ message: string }>('patch', '/api/v1/me/password', input),
}
