import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { storePath } from '../../catalog/api'
import { QueryState } from '../../components/ui/QueryState'
import { useStoreQuery } from '../../hooks/useStoreQuery'
import { useWorkspace } from '../../hooks/useWorkspace'
import SaleSummary from '../../sales/SaleSummary'
import type { SaleDetail } from '../../sales/types'

export default function SalePrintPage() {
  const { store } = useWorkspace()
  const { saleId } = useParams()
  const valid = Number.isSafeInteger(Number(saleId)) && Number(saleId) > 0
  const result = useStoreQuery<{ data: SaleDetail }>(
    store && valid ? `${storePath(store.id)}/sales/${saleId}` : null,
  )
  return (
    <main className="mx-auto min-h-screen max-w-xl bg-white p-5 sm:p-8 print:min-h-0 print:max-w-none">
      <div className="page-actions mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link to="/sales" className="btn btn-secondary">
          <ArrowLeft size={15} />
          Sales history
        </Link>
        <button className="btn btn-primary" disabled={!result.data} onClick={() => window.print()}>
          <Printer size={15} />
          Print summary
        </button>
      </div>
      {!valid || result.error?.status === 404 ? (
        <p role="alert" className="text-sm text-stone-600">
          This sale was not found in your store.
        </p>
      ) : (
        <QueryState loading={result.isLoading} error={result.error} retry={result.reload} />
      )}
      {result.data && <SaleSummary sale={result.data.data} />}
    </main>
  )
}
