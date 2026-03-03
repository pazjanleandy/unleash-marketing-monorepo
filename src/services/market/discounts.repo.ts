import { supabase } from '../../supabase'
import type { PromotionRow, PromotionStatus } from '../../components/discount/types'

type DiscountListResult = {
  items: PromotionRow[]
  authRequired: boolean
  noShop: boolean
}

type ProductDiscountRow = {
  id: string
  discount_value: number
  start_at: string
  end_at: string
  is_active: boolean | null
  products?: {
    prodname?: string | null
  } | null
}

async function getCurrentUserShopId() {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) {
    throw userError
  }

  const userId = userData.user?.id
  if (!userId) {
    return { authRequired: true, shopId: null as string | null, noShop: false }
  }

  const { data: shopRow, error: shopError } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle()

  if (shopError) {
    throw shopError
  }

  return {
    authRequired: false,
    shopId: shopRow?.id ?? null,
    noShop: !shopRow?.id,
  }
}

function toPromotionStatus(startAt: string, endAt: string, isActive: boolean): PromotionStatus {
  const now = Date.now()
  const startMs = new Date(startAt).getTime()
  const endMs = new Date(endAt).getTime()

  if (!isActive || Number.isNaN(startMs) || Number.isNaN(endMs) || now > endMs) {
    return 'Expired'
  }

  if (now < startMs) {
    return 'Upcoming'
  }

  return 'Ongoing'
}

function formatPeriod(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  const day = `${date.getDate()}`.padStart(2, '0')
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const year = date.getFullYear()
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}`
}

export async function listDiscountPromotions(): Promise<DiscountListResult> {
  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired || !shopId) {
    return { items: [], authRequired, noShop }
  }

  const { data, error } = await supabase
    .from('product_discounts')
    .select('id,discount_value,start_at,end_at,is_active,products:products!product_discounts_product_fkey(prodname)')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  const rows = (data ?? []) as ProductDiscountRow[]
  const items: PromotionRow[] = rows.map((row, index) => {
    const productName = row.products?.prodname?.trim() || `Product ${index + 1}`
    const status = toPromotionStatus(row.start_at, row.end_at, row.is_active ?? true)

    return {
      status,
      name: `${row.discount_value}% OFF - ${productName}`,
      type: 'Discount Promotions',
      products: [productName],
      period: {
        start: formatPeriod(row.start_at),
        end: formatPeriod(row.end_at),
      },
      actions: status === 'Expired' ? ['View', 'Delete'] : ['Edit', 'Delete'],
    }
  })

  return { items, authRequired: false, noShop: false }
}
