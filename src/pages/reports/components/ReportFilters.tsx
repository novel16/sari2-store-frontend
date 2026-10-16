import type { ReportPreset, ReportRange } from '../../../reports/types'
import { reportPresets } from '../../../reports/dates'

export default function ReportFilters({
  preset,
  draft,
  dirty,
  error,
  onPreset,
  onChange,
  onApply,
}: {
  preset: ReportPreset
  draft: ReportRange
  dirty: boolean
  error?: string
  onPreset: (value: ReportPreset) => void
  onChange: (range: ReportRange) => void
  onApply: () => void
}) {
  return (
    <form
      className="panel p-4 sm:p-5"
      onSubmit={(event) => {
        event.preventDefault()
        onApply()
      }}
    >
      <div className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
        <label className="field">
          <span>Report period</span>
          <select
            aria-label="Report period"
            value={preset}
            onChange={(event) => onPreset(event.target.value as ReportPreset)}
          >
            {Object.entries(reportPresets).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>From</span>
          <input
            type="date"
            aria-label="Report start date"
            value={draft.date_from}
            min="1970-01-01"
            max="9998-12-31"
            required
            aria-describedby={error ? 'report-date-error' : 'report-date-help'}
            onChange={(event) => onChange({ ...draft, date_from: event.target.value })}
          />
        </label>
        <label className="field">
          <span>To</span>
          <input
            type="date"
            aria-label="Report end date"
            value={draft.date_to}
            min="1970-01-01"
            max="9998-12-31"
            required
            aria-describedby={error ? 'report-date-error' : 'report-date-help'}
            aria-invalid={Boolean(error)}
            onChange={(event) => onChange({ ...draft, date_to: event.target.value })}
          />
        </label>
        <button className="btn btn-secondary" type="submit">
          Apply dates
        </button>
      </div>
      <p id="report-date-help" className="mt-3 text-[11px] text-stone-500">
        Up to 366 days per report. Weeks start Monday.{' '}
        {dirty
          ? 'Apply the dates to update the report and export.'
          : 'Sales and collections follow the same applied dates.'}
      </p>
      {error && (
        <p id="report-date-error" role="alert" className="mt-3 text-xs text-red-700">
          {error}
        </p>
      )}
    </form>
  )
}
