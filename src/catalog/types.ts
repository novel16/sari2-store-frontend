export type RecordStatus = 'active' | 'archived'

export interface Category {
  id: number
  store_id: number
  name: string
  description: string | null
  emoji: string
  color: string
  status: RecordStatus
  products_count: number
}

export interface Product {
  id: number
  store_id: number
  name: string
  description: string | null
  category: Pick<Category, 'id' | 'name' | 'status'> | null
  sku: string | null
  barcode: string | null
  unit: string
  price_centavos: number
  cost_centavos: number
  low_stock_threshold: number
  status: RecordStatus
  emoji: string
  color: string
  inventory: { quantity_on_hand: number; version: number }
  created_at: string
  updated_at: string
}

export interface CatalogSummary {
  active_products: number
  archived_products: number
  total_units: number
  low_stock: number
  out_of_stock: number
  inventory_value_centavos: string
}

export interface ProductQuota {
  active_products: number
  active_product_limit: number | null
  plan_name: string
}

export interface PageMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
  summary?: CatalogSummary
  quota?: ProductQuota
}

export interface PageResponse<T> {
  data: T[]
  meta: PageMeta
}

export interface Movement {
  id: number
  product: Pick<Product, 'id' | 'name' | 'unit'>
  actor: { id: number; name: string }
  movement_type: 'opening' | 'stock_in' | 'stock_out' | 'adjustment' | 'sale' | 'sale_return'
  reversal_sale_id?: number | null
  reversal_reference?: string | null
  sale_id: number | null
  quantity_delta: number
  quantity_before: number
  quantity_after: number
  version_after: number
  reason: string
  created_at: string
}

export interface ProductInput {
  name: string
  description: string | null
  category_id: number | null
  sku: string | null
  barcode: string | null
  unit: string
  price_centavos: number
  cost_centavos: number
  low_stock_threshold: number
  initial_stock?: number
  emoji: string
}

export type CategoryInput = Pick<Category, 'name' | 'description' | 'emoji'>

export interface AdjustmentInput {
  product_id: number
  mode: 'add' | 'remove' | 'set'
  quantity: number
  expected_version?: number
  reason: string
  request_key: string
}
