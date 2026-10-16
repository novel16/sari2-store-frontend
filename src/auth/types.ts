export interface AuthPlan {
  code: string
  name: string
  active_product_limit: number | null
  store_limit: number | null
  staff_limit: number | null
  ads_enabled: boolean
}

export interface AuthStore {
  id: number
  account_id: number
  name: string
  slug: string
  status: string
  phone?: string | null
  address?: string | null
}

export interface AuthAccount {
  id: number
  name: string
  status: string
  role: string
  subscription: { plan: AuthPlan; status: string } | null
  stores: AuthStore[]
}

export interface AuthUser {
  id: number
  name: string
  email: string
  platform_role: 'user' | 'platform_admin'
  status: string
  accounts: AuthAccount[]
}

export interface LoginData {
  email: string
  password: string
  remember: boolean
}

export interface RegisterData {
  name: string
  store_name: string
  email: string
  password: string
  password_confirmation: string
}

export interface ResetPasswordData {
  email: string
  token: string
  password: string
  password_confirmation: string
}

export interface UserResponse {
  data: AuthUser
}
