import type { DashboardDay, DashboardPeriod } from './types'

export const dashboardPeriods: Record<DashboardPeriod, string> = {
  this_week: 'This week',
  last_week: 'Last week',
  this_month: 'This month',
}

export function dashboardDate(date: string, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
    timeZone: 'Asia/Manila',
  }).format(new Date(`${date}T00:00:00+08:00`))
}

export function chartTotals(days: DashboardDay[]) {
  return {
    sales: days.reduce((sum, day) => sum + BigInt(day.net_sales_centavos), 0n).toString(),
    transactions: days.reduce((sum, day) => sum + day.transactions, 0),
  }
}

// Convert only a bounded display ratio to Number, never the currency itself.
export function barPercent(value: string | number, maximum: string | number) {
  const top = BigInt(maximum)
  const amount = BigInt(value)
  if (top <= 0n || amount <= 0n) return 0
  return Math.min(100, Number((amount * 10000n) / top) / 100)
}
