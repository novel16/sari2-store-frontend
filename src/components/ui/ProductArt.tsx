export function ProductArt({
  product,
  small = false,
}: {
  product: { emoji: string; color: string; name: string }
  small?: boolean
}) {
  return (
    <span
      className={`product-art${small ? ' product-art-small' : ''}`}
      style={{ background: product.color }}
      aria-hidden="true"
    >
      {product.emoji}
    </span>
  )
}
