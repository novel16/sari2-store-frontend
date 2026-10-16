import {
  ChartNoAxesCombined,
  CreditCard,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  ShoppingBasket,
  Tags,
  Users,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const navigation: { label: string; path: string; icon: LucideIcon; count?: string }[] = [
  { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Point of sale', path: '/pos', icon: ShoppingBasket },
  { label: 'Products', path: '/products', icon: Package },
  { label: 'Categories', path: '/categories', icon: Tags },
  { label: 'Inventory', path: '/inventory', icon: ShoppingBag },
  { label: 'Sales history', path: '/sales', icon: Wallet },
  { label: 'Utang & customers', path: '/customers', icon: Users },
  { label: 'Reports', path: '/reports', icon: ChartNoAxesCombined },
  { label: 'Subscription', path: '/subscription', icon: CreditCard },
  { label: 'Settings', path: '/settings', icon: Settings },
]

export const liveStorePages = [
  '/dashboard',
  '/products',
  '/categories',
  '/inventory',
  '/pos',
  '/sales',
  '/customers',
  '/reports',
  '/settings',
]
