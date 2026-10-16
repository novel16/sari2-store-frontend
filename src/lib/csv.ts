export function csvCell(value: string | number): string {
  // Spreadsheet apps may execute formula-like names, even inside quoted CSV fields.
  const raw = String(value)
  const safe = /^[\s]*[=+\-@\t\r]/.test(raw) && !/^-\d+(\.\d+)?$/.test(raw) ? `'${raw}` : raw
  return `"${safe.replaceAll('"', '""')}"`
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
