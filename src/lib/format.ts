const currency = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
})

export function money(centavos: number | string): string {
  if (typeof centavos === 'number') return currency.format(centavos / 100)
  const exact = BigInt(centavos)
  const absolute = exact < 0n ? -exact : exact
  return `${exact < 0n ? '-' : ''}₱${(absolute / 100n).toLocaleString('en-PH')}.${String(absolute % 100n).padStart(2, '0')}`
}

export function parseCentavos(value: string): number {
  if (!/^\d+(\.\d{1,2})?$/.test(value))
    throw new Error('Use a valid price with at most two decimal places.')
  const [pesos, fraction = ''] = value.split('.')
  const centavos = Number(pesos) * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(centavos) || centavos > 1000000000)
    throw new Error('Price must be between ₱0.00 and ₱10,000,000.00.')
  return centavos
}
