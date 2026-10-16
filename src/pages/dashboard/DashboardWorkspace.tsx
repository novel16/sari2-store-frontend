import { useState } from 'react'
import { CalendarDays, Plus, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/ui'
import { QueryState } from '../../components/ui/QueryState'
import { dashboardPath, loadDashboard } from '../../dashboard/api'
import { dashboardDate, dashboardPeriods } from '../../dashboard/format'
import type { DashboardPeriod, DashboardReply } from '../../dashboard/types'
import { useStoreQuery } from '../../hooks/useStoreQuery'
import { saleDateTime } from '../../sales/format'
import DashboardStats from './components/DashboardStats'
import CashCollections from './components/CashCollections'
import SalesOverview from './components/SalesOverview'
import StockOverview from './components/StockOverview'
import RecentTransactions from './components/RecentTransactions'
import LowStockList from './components/LowStockList'
import TopProducts from './components/TopProducts'

export default function DashboardWorkspace({ storeId, name }: { storeId: number; name: string }) {
  const [period, setPeriod] = useState<DashboardPeriod>('this_week')
  const result = useStoreQuery<DashboardReply>(dashboardPath(storeId, period), loadDashboard)
  const data = result.data?.data
  return (
    <>
      <PageHeader
        eyebrow="A LITTLE PROGRESS, EVERY DAY"
        title={`Welcome, ${name.trim().split(/\s+/)[0] || 'ka-store'}`}
        description="Your saved sales, collections, and stock in one place."
        actions={
          <>
            <button
              className="btn btn-secondary"
              onClick={result.reload}
              disabled={result.isLoading}
              aria-label="Refresh dashboard"
            >
              <RefreshCw size={15} className={result.isLoading ? 'animate-spin' : ''} />
            </button>
            <Link className="btn btn-primary" to="/pos">
              <Plus size={16} /> New sale
            </Link>
          </>
        }
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
        <span className="flex items-center gap-2">
          <CalendarDays size={15} />
          {data ? dashboardDate(data.business_date, { weekday: 'long' }) : 'Store dashboard'}
          <span className="text-[10px] text-stone-400">Asia/Manila</span>
        </span>
        <label className="flex items-center gap-2">
          <span>Chart & top products</span>
          <select
            aria-label="Dashboard overview period"
            className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-ink outline-none focus:border-forest"
            value={period}
            onChange={(event) => setPeriod(event.target.value as DashboardPeriod)}
          >
            {Object.entries(dashboardPeriods).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <QueryState loading={result.isLoading} error={result.error} retry={result.reload} />
      {data && (
        <>
          <DashboardStats data={data} />
          <CashCollections today={data.today} />
          <div className="mb-6 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(260px,1fr)]">
            <SalesOverview chart={data.chart} />
            <StockOverview stock={data.stock} />
          </div>
          <div className="mb-6 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(260px,1fr)]">
            <RecentTransactions sales={data.recent_sales} />
            <LowStockList stock={data.stock} />
          </div>
          <TopProducts products={data.top_products} chart={data.chart} />
          <p className="mt-4 text-[10px] text-stone-400">
            Updated {saleDateTime.format(new Date(data.generated_at))}. Refresh for the latest
            records.
          </p>
        </>
      )}
    </>
  )
}
