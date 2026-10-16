import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import { storePath } from '../../catalog/api'
import { QueryState } from '../../components/ui/QueryState'
import { useStoreQuery } from '../../hooks/useStoreQuery'
import { useWorkspace } from '../../hooks/useWorkspace'
import { loadStatement } from '../../customers/statements/api'
import type { CustomerStatement } from '../../customers/statements/types'
import StatementDocument from '../../customers/statements/StatementDocument'
import { statementRows, statementText } from '../../customers/statements/format'
import { downloadCsv } from '../../lib/csv'
import { downloadText } from '../../lib/downloadText'

export default function CustomerStatementPage() {
  const { store } = useWorkspace(),
    { customerId } = useParams()
  const valid = Number.isSafeInteger(Number(customerId)) && Number(customerId) > 0
  const result = useStoreQuery<CustomerStatement>(
    store && valid ? `${storePath(store.id)}/customers/${customerId}/statement` : null,
    loadStatement,
  )
  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-white p-5 sm:p-8 print:max-w-none">
      <div className="page-actions mb-6 flex flex-wrap items-center gap-2 print:hidden">
        <Link to="/customers" className="btn btn-secondary">
          <ArrowLeft size={15} />
          Customers
        </Link>
        <button
          className="btn btn-secondary"
          disabled={!result.data}
          onClick={() => {
            if (result.data)
              downloadCsv(`customer-${customerId}-statement.csv`, statementRows(result.data))
          }}
        >
          <Download size={15} />
          CSV
        </button>
        <button
          className="btn btn-secondary"
          disabled={!result.data}
          onClick={() => {
            if (result.data)
              downloadText(`customer-${customerId}-statement.txt`, statementText(result.data))
          }}
        >
          Download statement
        </button>
        <button className="btn btn-primary" disabled={!result.data} onClick={() => window.print()}>
          <Printer size={15} />
          Print statement
        </button>
      </div>
      {!valid ? (
        <p role="alert">This customer was not found in your store.</p>
      ) : (
        <QueryState loading={result.isLoading} error={result.error} retry={result.reload} />
      )}
      {result.data && <StatementDocument statement={result.data} />}
    </main>
  )
}
