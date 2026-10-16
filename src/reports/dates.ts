import type { ReportPreset, ReportRange } from './types'

export const reportPresets: Record<ReportPreset, string> = {
  today: 'Today',
  this_week: 'This week',
  this_month: 'This month',
  custom: 'Custom range',
}

export function presetRange(preset: Exclude<ReportPreset, 'custom'>, today: string): ReportRange {
  const start = new Date(`${today}T00:00:00Z`)
  if (preset === 'this_week') start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7))
  if (preset === 'this_month') start.setUTCDate(1)
  return { date_from: start.toISOString().slice(0, 10), date_to: today }
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1970-01-01' || value > '9998-12-31')
    return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function rangeError(range: ReportRange): string | undefined {
  if (!validDate(range.date_from) || !validDate(range.date_to))
    return 'Enter a valid start and end date.'
  if (range.date_to < range.date_from) return 'The end date must be on or after the start date.'
  const days =
    (Date.parse(`${range.date_to}T00:00:00Z`) - Date.parse(`${range.date_from}T00:00:00Z`)) /
    86400000
  if (days > 365) return 'Choose a date range of up to 366 days.'
}

export function reportDate(date: string) {
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeZone: 'Asia/Manila' }).format(
    new Date(`${date}T00:00:00+08:00`),
  )
}
