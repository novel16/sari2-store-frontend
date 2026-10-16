import { ChevronLeft, ChevronRight } from 'lucide-react'
type PaginationInfo = {
  current_page: number
  last_page: number
  total: number
  from: number | null
  to: number | null
}

export function Pagination({
  meta,
  onPage,
}: {
  meta: PaginationInfo
  onPage: (page: number) => void
}) {
  return (
    <nav
      aria-label="Pagination"
      className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[11px] text-stone-500"
    >
      <span>
        Showing {meta.from ?? 0}–{meta.to ?? 0} of {meta.total}
      </span>
      {meta.last_page > 1 && (
        <div className="flex items-center gap-3">
          <button
            className="btn btn-secondary"
            disabled={meta.current_page <= 1}
            onClick={() => onPage(meta.current_page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </button>
          <span>
            Page {meta.current_page} of {meta.last_page}
          </span>
          <button
            className="btn btn-secondary"
            disabled={meta.current_page >= meta.last_page}
            onClick={() => onPage(meta.current_page + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </nav>
  )
}
