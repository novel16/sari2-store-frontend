import { http } from '../api/http'
import { storePath } from '../catalog/api'
import type { ReportRange, ReportReply } from './types'

export function reportPath(storeId: number, range: ReportRange) {
  return `${storePath(storeId)}/reports/sales?${new URLSearchParams({ ...range })}`
}

export async function loadReport(path: string, signal: AbortSignal): Promise<ReportReply> {
  return (await http.get<ReportReply>(path, { signal })).data
}
