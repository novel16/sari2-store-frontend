export const productIcons = [
  '🛍️',
  '🍜',
  '🥤',
  '☕',
  '🍘',
  '🥫',
  '🧼',
  '🥔',
  '🥛',
  '💧',
  '🧴',
  '🍶',
  '🍚',
  '🥚',
  '🍞',
  '🧊',
]
export const productUnits = ['piece', 'pack', 'bottle', 'sachet', 'can', 'box', 'bag']
export const stockLabel = (quantity: number, threshold: number) =>
  quantity === 0 ? 'Out of stock' : quantity <= threshold ? 'Low stock' : 'In stock'
export const stockTone = (quantity: number, threshold: number) =>
  quantity === 0
    ? ('red' as const)
    : quantity <= threshold
      ? ('orange' as const)
      : ('green' as const)
