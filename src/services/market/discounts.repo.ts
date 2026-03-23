import { supabase } from '../../supabase'
import type {
  CreateDiscountPromotionForm,
} from '../../components/discount/create/types'
import type { PromotionRow, PromotionStatus, DiscountCampaignRow } from '../../components/discount/types'
import { listBundleDeals } from './bundles.repo'
import { listAddOnDeals } from './addons.repo'

type DiscountListResult = {
  items: PromotionRow[]
  authRequired: boolean
  noShop: boolean
}

type ShopContext = {
  authRequired: boolean
  shopId: string | null
  noShop: boolean
}

type ProductDiscountDbRow = {
  id: string
  product_id: string
  discount_value: number
  discount_type: 'percentage' | 'fixed'
  products?: {
    prodname?: string | null
    image?: string | null
    image_url?: string | null
  } | null
}

type DiscountPromotionDbRow = {
  id: string
  name: string
  start_at: string
  end_at: string
  max_uses: number | null
  is_active: boolean | null
  product_discounts?: ProductDiscountDbRow[] | null
}

type ValidatedDiscountPayload = {
  promotionName: string
  startAtIso: string
  endAtIso: string
  maxUses: number | null
  productDiscounts: Array<{ productId: string; discountValue: number }>
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
    lowerMessage.includes('relation "discount_section" does not exist') ||
    lowerMessage.includes("table 'discount_section' not found")
  ) {
    return new Error(
      `${message}. The database schema is not up to date. Apply migration 003_discount_section.sql to the same Supabase project used by this app.`,
    )
  }

  if (lowerMessage.includes('promotion_id') && lowerMessage.includes('does not exist')) {
    return new Error(
      `${message}. Column product_discounts.promotion_id is missing. Apply migration 003_discount_section.sql.`,
    )
  }

  if (lowerMessage.includes('row-level security') || lowerMessage.includes('permission denied')) {
    return new Error(
      `${message}. RLS may be blocking this action. Verify discount_section/product_discounts owner policies in your live DB.`,
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

function validatePromotionForm(form: CreateDiscountPromotionForm): ValidatedDiscountPayload {
  const promotionName = form.promotionName.trim()
  if (!promotionName) {
    throw new Error('Promotion name is required.')
  }

  if (!Array.isArray(form.products) || form.products.length === 0) {
    throw new Error('Select at least one product.')
  }

  const startAt = parseLocalDateTimeInput(form.startDateTime)
  const endAt = parseLocalDateTimeInput(form.endDateTime)
  if (!startAt || !endAt || endAt.getTime() <= startAt.getTime()) {
    throw new Error('End time must be later than start time.')
  }

  if (endAt.getTime() - startAt.getTime() > MAX_PROMOTION_DURATION_MS) {
    throw new Error('Promotion period must be less than or equal to 180 days.')
  }

  let maxUses: number | null = null
  const trimmedLimit = form.purchaseLimit.trim()
  if (trimmedLimit.length > 0) {
    if (!/^\d+$/.test(trimmedLimit)) {
      throw new Error('Purchase limit must be a whole number.')
    }
    maxUses = Number(trimmedLimit)
  }

  const uniqueProductIds = Array.from(new Set(form.products))
  const productDiscounts = uniqueProductIds.map((productId) => {
    const rawDiscount = form.productDiscounts[productId]?.trim() ?? ''
    if (!rawDiscount) {
      throw new Error('Each selected product must have a discount.')
    }

    const discountValue = Number(rawDiscount)
    if (Number.isNaN(discountValue) || discountValue <= 0 || discountValue > 100) {
      throw new Error('Discount values must be greater than 0 and at most 100.')
    }

    return { productId, discountValue }
  })

  return {
    promotionName,
    startAtIso: startAt.toISOString(),
    endAtIso: endAt.toISOString(),
    maxUses,
    productDiscounts,
  }
}

export async function listDiscountPromotions(): Promise<DiscountListResult> {
  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired || !shopId) {
    return { items: [], authRequired, noShop }
  }

  const { data, error } = await supabase
    .from('discount_section')
    .select(
      'id,name,start_at,end_at,max_uses,is_active,product_discounts(id,product_id,discount_type,discount_value,products:products!product_discounts_product_fkey(prodname,image,image_url))',
    )
    .eq('shop_id', shopId)
    .eq('campaign_type', 'promotion')
    .order('created_at', { ascending: false })

  if (error) {
    throw toDatabaseError(error, 'Failed to load discount promotions')
  }

  const rows = (data ?? []) as DiscountPromotionDbRow[]
  const items: PromotionRow[] = rows.map((row, rowIndex) => {
    const children = row.product_discounts ?? []
    const names = children.map((child, childIndex) => {
      const name = child.products?.prodname?.trim()
      return name && name.length > 0 ? name : `Product ${childIndex + 1}`
    })
    const productPreviews = children.map((child, childIndex) => ({
      id: child.product_id || `product-${childIndex + 1}`,
      name: child.products?.prodname?.trim() || `Product ${childIndex + 1}`,
      image: child.products?.image_url ?? child.products?.image ?? null,
    }))

    const productDiscounts = children.reduce<Record<string, string>>((accumulator, child) => {
      accumulator[child.product_id] = formatDecimal(child.discount_value)
      return accumulator
    }, {})

    const status = toPromotionStatus(row.start_at, row.end_at, row.is_active ?? true)

    return {
      id: row.id || `promotion-${rowIndex + 1}`,
      status,
      name: row.name,
      type: 'Discount Promotions',
      campaignType: 'promotion',
      products: names,
      productPreviews,
      productDiscounts,
      maxUses: row.max_uses ?? null,
      period: {
        start: formatPeriod(row.start_at),
        end: formatPeriod(row.end_at),
      },
      actions: status === 'Expired' ? ['View', 'Delete'] : ['Edit', 'View', 'Delete'],
    }
  })

  return { items, authRequired: false, noShop: false }
}

export async function listDiscountCampaigns(): Promise<{
  items: DiscountCampaignRow[]
  authRequired: boolean
  noShop: boolean
}> {
  const promotionResult = await listDiscountPromotions()
  const bundleResult = await listBundleDeals()
  const addOnResult = await listAddOnDeals()

  if (promotionResult.authRequired || bundleResult.authRequired || addOnResult.authRequired) {
    return { items: [], authRequired: true, noShop: false }
  }

  if (promotionResult.noShop || bundleResult.noShop || addOnResult.noShop) {
    return { items: [], authRequired: false, noShop: true }
  }

  return {
    items: [...promotionResult.items, ...bundleResult.items, ...addOnResult.items],
    authRequired: false,
    noShop: false,
  }
}

export async function createDiscountPromotion(form: CreateDiscountPromotionForm) {
  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired) {
    throw new Error('Sign in to create discount promotions.')
  }
  if (!shopId || noShop) {
    throw new Error('No shop found for this account.')
  }

  const payload = validatePromotionForm(form)
  const { data: promotion, error: promotionError } = await supabase
    .from('discount_section')
    .insert({
      shop_id: shopId,
      name: payload.promotionName,
      start_at: payload.startAtIso,
      end_at: payload.endAtIso,
      max_uses: payload.maxUses,
      is_active: true,
      campaign_type: 'promotion',
    })
    .select('id')
    .single()

  if (promotionError) {
    throw toDatabaseError(promotionError, 'Failed to create discount promotion')
  }

  const promotionId = promotion?.id
  if (!promotionId) {
    throw new Error('Unable to create discount promotion.')
  }

  const rows = payload.productDiscounts.map((item) => ({
    promotion_id: promotionId,
    product_id: item.productId,
    shop_id: shopId,
    discount_type: 'percentage' as const,
    discount_value: item.discountValue,
    start_at: payload.startAtIso,
    end_at: payload.endAtIso,
    is_active: true,
  }))

  const { error: discountsError } = await supabase.from('product_discounts').insert(rows)
  if (discountsError) {
    throw toDatabaseError(discountsError, 'Failed to add products to discount promotion')
  }
}

export async function updateDiscountPromotion(
  promotionId: string,
  form: CreateDiscountPromotionForm,
) {
  if (!promotionId) {
    throw new Error('Promotion ID is required.')
  }

  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired) {
    throw new Error('Sign in to update discount promotions.')
  }
  if (!shopId || noShop) {
    throw new Error('No shop found for this account.')
  }

  const payload = validatePromotionForm(form)
  const { error: promotionError } = await supabase
    .from('discount_section')
    .update({
      name: payload.promotionName,
      start_at: payload.startAtIso,
      end_at: payload.endAtIso,
      max_uses: payload.maxUses,
      is_active: true,
      campaign_type: 'promotion',
      updated_at: new Date().toISOString(),
    })
    .eq('id', promotionId)
    .eq('shop_id', shopId)

  if (promotionError) {
    throw toDatabaseError(promotionError, 'Failed to update discount promotion')
  }

  const { error: deleteError } = await supabase
    .from('product_discounts')
    .delete()
    .eq('promotion_id', promotionId)
    .eq('shop_id', shopId)

  if (deleteError) {
    throw toDatabaseError(deleteError, 'Failed to replace promotion products')
  }

  const rows = payload.productDiscounts.map((item) => ({
    promotion_id: promotionId,
    product_id: item.productId,
    shop_id: shopId,
    discount_type: 'percentage' as const,
    discount_value: item.discountValue,
    start_at: payload.startAtIso,
    end_at: payload.endAtIso,
    is_active: true,
  }))

  const { error: insertError } = await supabase.from('product_discounts').insert(rows)
  if (insertError) {
    throw toDatabaseError(insertError, 'Failed to save updated promotion products')
  }
}

export async function deleteDiscountPromotion(promotionId: string) {
  if (!promotionId) {
    throw new Error('Promotion ID is required.')
  }

  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired) {
    throw new Error('Sign in to delete discount promotions.')
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
    throw toDatabaseError(error, 'Failed to delete discount promotion')
  }
}
