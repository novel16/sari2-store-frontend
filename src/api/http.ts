import axios from 'axios'

const apiUrl = (
  import.meta.env.VITE_API_URL || 'http://localhost:8000'
).replace(/\/$/, '')

const isNgrok = new URL(apiUrl).hostname.endsWith('.ngrok-free.app')

export const http = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  withXSRFToken: true,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',

    // Bypass ngrok's browser warning when using the development tunnel.
    ...(isNgrok ? { 'ngrok-skip-browser-warning': '1' } : {}),
  },
})

export async function writeWithCsrf<T>(
  method: 'post' | 'patch' | 'delete',
  path: string,
  data?: unknown,
): Promise<T> {
  await http.get('/sanctum/csrf-cookie')
  try {
    return (await http.request<T>({ method, url: path, data })).data
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 419) throw error
    await http.get('/sanctum/csrf-cookie')
    return (await http.request<T>({ method, url: path, data })).data
  }
}
