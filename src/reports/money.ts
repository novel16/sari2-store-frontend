export function averageSale(centavos: string, transactions: number) {
  if (!transactions) return '0'
  const count = BigInt(transactions)
  return ((BigInt(centavos) * 2n + count) / (count * 2n)).toString()
}

export function decimalPesos(centavos: string) {
  const amount = BigInt(centavos)
  const absolute = amount < 0n ? -amount : amount
  return `${amount < 0n ? '-' : ''}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`
}

export function reportPercent(amount: string, total: string) {
  return BigInt(total) <= 0n
    ? 0
    : Math.min(100, Number((BigInt(amount) * 10000n) / BigInt(total)) / 100)
}
