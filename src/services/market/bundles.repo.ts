import { supabase } from '../../supabase'
import type { CreateBundleDealForm } from '../../components/discount/create/types'
import type { BundleDealRow, PromotionStatus } from '../../components/discount/types'

type BundleListResult = {
  items: BundleDealRow[]
  authRequired: boolean
  noShop: boolean
}

type ShopContext = {
  authRequired: boolean
  shopId: string | null
  noShop: boolean
}

type BundleItemDbRow = {
  id: string
  product_id: string
  quantity: number | null
  products?: {
    prodname?: string | null
  } | null
}

type BundleDbRow = {
  id: string
  promotion_id: string
  name: string | null
  price: number | null
  currency: string | null
  max_uses: number | null
  is_active: boolean | null
  discount_section?: {
    id: string
    name: string
    start_at: string
    end_at: string
    max_uses: number | null
    is_active: boolean | null
  } | null
  bundle_items?: BundleItemDbRow[] | null
}

type ValidatedBundlePayload = {
  promotionName: string
  startAtIso: string
  endAtIso: string
  maxUses: number | null
  bundlePrice: number
  currency: string
  items: Array<{ productId: string; quantity: number }>
}

const MAX_PROMOTION_DURATION_MS = 180 * 24 * 60 * 60 * 1000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toReadableErrorMessage(error: unknown, action: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return `${action}: ${error.message}`
  }

  if (isRecord(error)) {
    const message = typeof error.message === 'string' ? error.message : ''
    const code = typeof error.code === 'string' ? error.code : ''
    const details = typeof error.details === 'string' ? error.details : ''
    const hint = typeof error.hint === 'string' ? error.hint : ''

    const parts = [message, code ? `(code: ${code})` : '', details, hint ? `Hint: ${hint}` : '']
      .map((part) => part.trim())
      .filter((part) => part.length > 0)

    if (parts.length > 0) {
      return `${action}: ${parts.join(' ')}`
    }
  }

  return `${action}: ${JSON.stringify(error)}`
}

function toDatabaseError(error: unknown, action: string) {
  const message = toReadableErrorMessage(error, action)
  const lowerMessage = message.toLowerCase()

  if (
    lowerMessage.includes('relation "bundles" does not exist') ||
    lowerMessage.includes("table 'bundles' not found")
  ) {
    return new Error(
      `${message}. The database schema is not up to date. Apply the bundles migration to the same Supabase project used by this app.`,
    )
  }

  if (lowerMessage.includes('row-level security') || lowerMessage.includes('permission denied')) {
    return new Error(
      `${message}. RLS may be blocking this action. Verify bundles/bundle_items policies in your live DB.`,
    )
  }

  return new Error(message)
}

async function getCurrentUserShopId(): Promise<ShopContext> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) {
    throw userError
  }

  const userId = userData.user?.id
  if (!userId) {
    return { authRequired: true, shopId: null, noShop: false }
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

function parseLocalDateTimeInput(value: string): Date | null {
  if (!value) {
    return null
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])
  return new Date(year, month, day, hour, minute, 0, 0)
}

function formatDecimal(value: number) {
  return Number.isInteger(value) ? `${value}` : `${value}`
}

async function validateBundlePricing(
  shopId: string,
  items: Array<{ productId: string; quantity: number }>,
  bundlePrice: number,
) {
  const productIds = Array.from(new Set(items.map((item) => item.productId)))
  const { data, error } = await supabase
    .from('products')
    .select('product_id,price')
    .eq('shop_id', shopId)
    .in('product_id', productIds)

  if (error) {
    throw toDatabaseError(error, 'Failed to validate bundle pricing')
  }

  const rows = (data ?? []) as Array<{ product_id: string; price: number | null }>
  if (rows.length !== productIds.length) {
    throw new Error('Bundle items must belong to your shop.')
  }

  const priceMap = new Map<string, number>()
  for (const row of rows) {
    priceMap.set(row.product_id, typeof row.price === 'number' ? row.price : 0)
  }

  const totalOriginalPrice = items.reduce((sum, item) => {
    const price = priceMap.get(item.productId) ?? 0
    return sum + price * item.quantity
  }, 0)

  if (!Number.isFinite(totalOriginalPrice) || totalOriginalPrice <= 0) {
    throw new Error('Unable to validate bundle price against product totals.')
  }

  if (bundlePrice > totalOriginalPrice) {
    throw new Error('Bundle price must not exceed the total original price of items.')
  }
}

function validateBundleForm(form: CreateBundleDealForm): ValidatedBundlePayload {
  const promotionName = form.promotionName.trim()
  if (!promotionName) {
    throw new Error('Bundle deal name is required.')
  }

  if (!Array.isArray(form.items) || form.items.length === 0) {
    throw new Error('Select at least two bundle items.')
  }

  if (form.items.length < 2) {
    throw new Error('Select at least two bundle items.')
  }

  const startAt = parseLocalDateTimeInput(form.startDateTime)
  const endAt = parseLocalDateTimeInput(form.endDateTime)
  if (!startAt || !endAt || endAt.getTime() <= startAt.getTime()) {
    throw new Error('End time must be later than start time.')
  }

  if (endAt.getTime() - startAt.getTime() > MAX_PROMOTION_DURATION_MS) {
    throw new Error('Bundle deal period must be less than or equal to 180 days.')
  }

  let maxUses: number | null = null
  const trimmedLimit = form.purchaseLimit.trim()
  if (trimmedLimit.length > 0) {
    if (!/^\d+$/.test(trimmedLimit)) {
      throw new Error('Purchase limit must be a whole number.')
    }
    maxUses = Number(trimmedLimit)
  }

  const rawPrice = form.bundlePrice.trim()
  const bundlePrice = Number(rawPrice)
  if (!rawPrice || Number.isNaN(bundlePrice) || bundlePrice <= 0) {
    throw new Error('Bundle price must be greater than 0.')
  }

  const currency = form.currency.trim().toUpperCase()
  if (!currency) {
    throw new Error('Currency is required.')
  }

  const items = form.items.map((item) => {
    if (!item.productId) {
      throw new Error('Bundle items must include a product.')
    }
    if (!Number.isFinite(item.quantity) || item.quantity < 1) {
      throw new Error('Bundle item quantities must be at least 1.')
    }
    return { productId: item.productId, quantity: Math.floor(item.quantity) }
  })

  return {
    promotionName,
    startAtIso: startAt.toISOString(),
    endAtIso: endAt.toISOString(),
    maxUses,
    bundlePrice,
    currency,
    items,
  }
}

export async function listBundleDeals(): Promise<BundleListResult> {
  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired || !shopId) {
    return { items: [], authRequired, noShop }
  }

  const { data, error } = await supabase
    .from('bundles')
    .select(
      'id,promotion_id,name,price,currency,max_uses,is_active,discount_section:discount_section!bundles_promotion_id_fkey(id,name,start_at,end_at,max_uses,is_active),bundle_items(id,product_id,quantity,products:products!bundle_items_product_id_fkey(prodname))',
    )
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (error) {
    throw toDatabaseError(error, 'Failed to load bundle deals')
  }

  const rows = (data ?? []) as BundleDbRow[]
  const items: BundleDealRow[] = rows.map((row, rowIndex) => {
    const section = row.discount_section
    const children = row.bundle_items ?? []
    const names = children.map((child, childIndex) => {
      const name = child.products?.prodname?.trim()
      return name && name.length > 0 ? name : `Product ${childIndex + 1}`
    })

    const bundleItems = children.map((child, childIndex) => ({
      productId: child.product_id,
      name: child.products?.prodname?.trim() || `Product ${childIndex + 1}`,
      quantity: typeof child.quantity === 'number' && child.quantity > 0 ? child.quantity : 1,
    }))

    const status = section
      ? toPromotionStatus(section.start_at, section.end_at, section.is_active ?? true)
      : 'Expired'

    return {
      id: row.promotion_id || row.id || `bundle-${rowIndex + 1}`,
      status,
      name: row.name || section?.name || `Bundle Deal ${rowIndex + 1}`,
      type: 'Bundle Deal',
      campaignType: 'bundle',
      products: names,
      bundlePrice: row.price !== null && typeof row.price === 'number' ? formatDecimal(row.price) : '0',
      currency: row.currency?.trim() || 'USD',
      bundleItems,
      maxUses: section?.max_uses ?? row.max_uses ?? null,
      period: {
        start: section ? formatPeriod(section.start_at) : '',
        end: section ? formatPeriod(section.end_at) : '',
      },
      actions: status === 'Expired' ? ['View', 'Delete'] : ['Edit', 'View', 'Delete'],
    }
  })

  return { items, authRequired: false, noShop: false }
}

export async function createBundleDeal(form: CreateBundleDealForm) {
  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired) {
    throw new Error('Sign in to create bundle deals.')
  }
  if (!shopId || noShop) {
    throw new Error('No shop found for this account.')
  }

  const payload = validateBundleForm(form)
  await validateBundlePricing(shopId, payload.items, payload.bundlePrice)
  const { data: promotion, error: promotionError } = await supabase
    .from('discount_section')
    .insert({
      shop_id: shopId,
      name: payload.promotionName,
      start_at: payload.startAtIso,
      end_at: payload.endAtIso,
      max_uses: payload.maxUses,
      is_active: true,
      campaign_type: 'bundle',
    })
    .select('id')
    .single()

  if (promotionError) {
    throw toDatabaseError(promotionError, 'Failed to create bundle deal')
  }

  const promotionId = promotion?.id
  if (!promotionId) {
    throw new Error('Unable to create bundle deal.')
  }

  const { data: bundle, error: bundleError } = await supabase
    .from('bundles')
    .insert({
      promotion_id: promotionId,
      shop_id: shopId,
      name: payload.promotionName,
      price: payload.bundlePrice,
      currency: payload.currency,
      max_uses: payload.maxUses,
      is_active: true,
    })
    .select('id')
    .single()

  if (bundleError) {
    throw toDatabaseError(bundleError, 'Failed to create bundle deal')
  }

  const bundleId = bundle?.id
  if (!bundleId) {
    throw new Error('Unable to create bundle deal.')
  }

  const rows = payload.items.map((item) => ({
    bundle_id: bundleId,
    product_id: item.productId,
    quantity: item.quantity,
  }))

  const { error: itemsError } = await supabase.from('bundle_items').insert(rows)
  if (itemsError) {
    throw toDatabaseError(itemsError, 'Failed to add bundle items')
  }
}

export async function updateBundleDeal(promotionId: string, form: CreateBundleDealForm) {
  if (!promotionId) {
    throw new Error('Bundle deal ID is required.')
  }

  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired) {
    throw new Error('Sign in to update bundle deals.')
  }
  if (!shopId || noShop) {
    throw new Error('No shop found for this account.')
  }

  const payload = validateBundleForm(form)
  await validateBundlePricing(shopId, payload.items, payload.bundlePrice)
  const { error: promotionError } = await supabase
    .from('discount_section')
    .update({
      name: payload.promotionName,
      start_at: payload.startAtIso,
      end_at: payload.endAtIso,
      max_uses: payload.maxUses,
      is_active: true,
      campaign_type: 'bundle',
      updated_at: new Date().toISOString(),
    })
    .eq('id', promotionId)
    .eq('shop_id', shopId)

  if (promotionError) {
    throw toDatabaseError(promotionError, 'Failed to update bundle deal')
  }

  const { data: bundleRow, error: bundleFetchError } = await supabase
    .from('bundles')
    .select('id')
    .eq('promotion_id', promotionId)
    .eq('shop_id', shopId)
    .single()

  if (bundleFetchError) {
    throw toDatabaseError(bundleFetchError, 'Failed to load bundle deal')
  }

  const bundleId = bundleRow?.id
  if (!bundleId) {
    throw new Error('Unable to locate bundle deal.')
  }

  const { error: bundleError } = await supabase
    .from('bundles')
    .update({
      name: payload.promotionName,
      price: payload.bundlePrice,
      currency: payload.currency,
      max_uses: payload.maxUses,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bundleId)
    .eq('shop_id', shopId)

  if (bundleError) {
    throw toDatabaseError(bundleError, 'Failed to update bundle deal')
  }

  const { error: deleteError } = await supabase
    .from('bundle_items')
    .delete()
    .eq('bundle_id', bundleId)

  if (deleteError) {
    throw toDatabaseError(deleteError, 'Failed to replace bundle items')
  }

  const rows = payload.items.map((item) => ({
    bundle_id: bundleId,
    product_id: item.productId,
    quantity: item.quantity,
  }))

  const { error: insertError } = await supabase.from('bundle_items').insert(rows)
  if (insertError) {
    throw toDatabaseError(insertError, 'Failed to save bundle items')
  }
}

export async function deleteBundleDeal(promotionId: string) {
  if (!promotionId) {
    throw new Error('Bundle deal ID is required.')
  }

  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired) {
    throw new Error('Sign in to delete bundle deals.')
  }
  if (!shopId || noShop) {
    throw new Error('No shop found for this account.')
  }

  const { error } = await supabase
    .from('discount_section')
    .delete()
    .eq('id', promotionId)
    .eq('shop_id', shopId)

  if (error) {
    throw toDatabaseError(error, 'Failed to delete bundle deal')
  }
}
