import { http } from '../api/http'
import { storePath } from '../catalog/api'
import type { DashboardPeriod, DashboardReply } from './types'

export function dashboardPath(storeId: number, period: DashboardPeriod) {
  return `${storePath(storeId)}/dashboard?${new URLSearchParams({ period })}`
}

export async function loadDashboard(path: string, signal: AbortSignal): Promise<DashboardReply> {
  return (await http.get<DashboardReply>(path, { signal })).data
}
