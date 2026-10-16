import { useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../components/ui'
import { QueryState } from '../../components/ui/QueryState'
import { useStoreQuery } from '../../hooks/useStoreQuery'
import { loadReport, reportPath } from '../../reports/api'
import { presetRange, rangeError, reportDate } from '../../reports/dates'
import { exportReport } from '../../reports/exportReport'
import type { ReportPreset, ReportRange, ReportReply } from '../../reports/types'
import { businessDate, saleDateTime } from '../../sales/format'
import ReportFilters from './components/ReportFilters'
import ReportStats from './components/ReportStats'
import CollectionsSummary from './components/CollectionsSummary'
import SalesBreakdown from './components/SalesBreakdown'
import SalesTrend from './components/SalesTrend'
import TopProductsTable from './components/TopProductsTable'
import DailyFigures from './components/DailyFigures'
import ReversalSummary from './components/ReversalSummary'

export default function ReportsWorkspace({ storeId }: { storeId: number }) {
  const [range, setRange] = useState(() => presetRange('this_week', businessDate()))
  const [draft, setDraft] = useState<ReportRange>(range)
  const [preset, setPreset] = useState<ReportPreset>('this_week')
  const [validation, setValidation] = useState<string>()
  const [exported, setExported] = useState(false)
  const result = useStoreQuery<ReportReply>(reportPath(storeId, range), loadReport)
  const report = result.data?.data
  const dirty = draft.date_from !== range.date_from || draft.date_to !== range.date_to

  function choosePreset(value: ReportPreset) {
    setPreset(value)
    setValidation(undefined)
    setExported(false)
    if (value === 'custom') return
    const next = presetRange(value, businessDate())
    setDraft(next)
    setRange(next)
    result.reload()
  }
  function editDates(next: ReportRange) {
    setDraft(next)
    setPreset('custom')
    setValidation(undefined)
    setExported(false)
  }
  function applyDates() {
    const error = rangeError(draft)
    setValidation(error)
    if (error) return
    setRange({ ...draft })
    setExported(false)
    result.reload()
  }

  return (
    <>
      <PageHeader
        eyebrow="A LITTLE CLARITY GOES A LONG WAY"
        title="Store reports"
        description="Your saved sales and collections for the dates you choose."
        actions={
          <>
            <button
              className="btn btn-secondary"
              aria-label="Refresh report"
              disabled={result.isLoading || dirty}
              onClick={() => {
                setExported(false)
                result.reload()
              }}
            >
              <RefreshCw size={15} />
            </button>
            <button
              className="btn btn-primary"
              disabled={!report || dirty || result.isLoading}
              onClick={() => {
                if (report) {
                  exportReport(report)
                  setExported(true)
                }
              }}
            >
              <Download size={16} />
              Export CSV
            </button>
          </>
        }
      />
      <ReportFilters
        preset={preset}
        draft={draft}
        dirty={dirty}
        error={validation}
        onPreset={choosePreset}
        onChange={editDates}
        onApply={applyDates}
      />
      <p className="my-4 text-xs text-stone-500">
        Showing{' '}
        <strong className="text-ink">
          {reportDate(range.date_from)} – {reportDate(range.date_to)}
        </strong>{' '}
        · Asia/Manila
      </p>
      {exported && report && (
        <p role="status" className="mb-4 rounded-lg bg-forest/5 p-3 text-xs text-forest">
          CSV exported for {reportDate(report.date_from)} – {reportDate(report.date_to)}.
        </p>
      )}
      <QueryState loading={result.isLoading} error={result.error} retry={result.reload} />
      {report && (
        <>
          <ReportStats summary={report.summary} />
          <CollectionsSummary summary={report.summary} />
          <ReversalSummary summary={report.summary} />
          <div className="mb-6 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
            <SalesTrend days={report.days} />
            <SalesBreakdown summary={report.summary} />
          </div>
          <TopProductsTable products={report.top_products} limit={report.top_products_limit} />
          <DailyFigures days={report.days} />
          <p className="mt-5 text-[11px] leading-relaxed text-stone-500">
            Updated {saleDateTime.format(new Date(report.generated_at))}. Refresh for the latest
            records. CSV exports this displayed report and its applied dates.
          </p>
        </>
      )}
    </>
  )
}
