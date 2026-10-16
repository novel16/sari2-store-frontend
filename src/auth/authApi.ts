import { http, writeWithCsrf } from '../api/http'
import type { LoginData, RegisterData, ResetPasswordData, UserResponse } from './types'

export const authApi = {
  async me() {
    const response = await http.get<UserResponse>('/api/v1/me')
    return response.data.data
  },
  async login(data: LoginData) {
    const response = await writeWithCsrf<UserResponse>('post', '/login', data)
    return response.data
  },
  async register(data: RegisterData) {
    const response = await writeWithCsrf<UserResponse>('post', '/register', data)
    return response.data
  },
  logout: () => writeWithCsrf<void>('post', '/logout'),
  forgotPassword: (email: string) =>
    writeWithCsrf<{ message: string }>('post', '/forgot-password', { email }),
  resetPassword: (data: ResetPasswordData) =>
    writeWithCsrf<{ message: string }>('post', '/reset-password', data),
}
