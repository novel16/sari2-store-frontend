import { Download, Printer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { downloadSummary } from './summaryText'
import type { SaleDetail } from './types'

export default function SummaryActions({ sale }: { sale: SaleDetail }) {
  return (
    <div className="form-actions">
      <button className="btn btn-secondary" onClick={() => downloadSummary(sale)}>
        <Download size={15} />
        Download summary
      </button>
      <Link
        className="btn btn-primary"
        to={`/sales/${sale.id}/print`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Printer size={15} />
        Print summary
      </Link>
    </div>
  )
}
