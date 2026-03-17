import { supabase } from '../../supabase'
import type { FlashDealRow, FlashDealStatus } from '../../components/flash-deals/types'
import type { CreateFlashDealForm } from '../../components/flash-deals/create/CreateFlashDealPage'

type FlashDealsResult = {
  items: FlashDealRow[]
  authRequired: boolean
  noShop: boolean
}

type FlashDealDbRow = {
  id: string
  product_id: string
  flash_price: number
  original_price: number
  start_at: string
  end_at: string
  flash_quantity: number
  sold_quantity: number | null
  purchase_limit: number | null
  is_active: boolean | null
  products?: {
    prodname?: string | null
    quantity?: number | null
  } | null
}

type FlashDealCreatePayload = {
  startAtIso: string
  endAtIso: string
  products: Array<{
    productId: string
    originalPrice: number
    flashPrice: number
    flashQuantity: number
    purchaseLimit: number | null
    isActive: boolean
  }>
}

export type UpdateFlashDealInput = {
  startAt: string
  endAt: string
  discountPercent: number
  flashQuantity: number
  purchaseLimit: number | null
  originalPrice: number
}

function parseDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function toDatabaseError(error: unknown, action: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return new Error(`${action}: ${error.message}`)
  }

  if (typeof error === 'object' && error !== null) {
    const maybeError = error as Record<string, unknown>
    const message = typeof maybeError.message === 'string' ? maybeError.message : ''
    const code = typeof maybeError.code === 'string' ? maybeError.code : ''
    const details = typeof maybeError.details === 'string' ? maybeError.details : ''

    const parts = [message, code ? `(code: ${code})` : '', details]
      .map((part) => part.trim())
      .filter((part) => part.length > 0)

    if (parts.length > 0) {
      return new Error(`${action}: ${parts.join(' ')}`)
    }
  }

  return new Error(`${action}.`)
}

function validateCreateFlashDealForm(form: CreateFlashDealForm): FlashDealCreatePayload {
  const startAt = parseDateTime(form.startAt)
  const endAt = parseDateTime(form.endAt)

  if (!startAt || !endAt || endAt.getTime() <= startAt.getTime()) {
    throw new Error('Flash deal end time must be later than start time.')
  }

  if (!Array.isArray(form.products) || form.products.length === 0) {
    throw new Error('Select at least one flash deal product.')
  }

  const uniqueProducts = Array.from(
    new Map(form.products.map((item) => [item.productId, item])).values(),
  )

  const products = uniqueProducts.map((item) => {
    const productId = item.productId?.trim()
    if (!productId) {
      throw new Error('A selected product is missing its ID.')
    }

    if (!Number.isFinite(item.originalPrice) || item.originalPrice <= 0) {
      throw new Error('Original price must be greater than 0.')
    }

    if (!Number.isFinite(item.flashPrice) || item.flashPrice <= 0) {
      throw new Error('Discounted price must be greater than 0.')
    }

    if (item.flashPrice > item.originalPrice) {
      throw new Error('Discounted price must be less than or equal to original price.')
    }

    if (
      !Number.isFinite(item.flashQuantity) ||
      !Number.isInteger(item.flashQuantity) ||
      item.flashQuantity < 1
    ) {
      throw new Error('Campaign stock must be a whole number greater than 0.')
    }

    if (
      item.purchaseLimit !== null &&
      (!Number.isInteger(item.purchaseLimit) || item.purchaseLimit < 1)
    ) {
      throw new Error('Purchase limit must be empty or a whole number greater than 0.')
    }

    return {
      productId,
      originalPrice: item.originalPrice,
      flashPrice: item.flashPrice,
      flashQuantity: item.flashQuantity,
      purchaseLimit: item.purchaseLimit,
      isActive: item.isActive,
    }
  })

  return {
    startAtIso: startAt.toISOString(),
    endAtIso: endAt.toISOString(),
    products,
  }
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

function toStatus(startAt: string, endAt: string): FlashDealStatus {
  const now = Date.now()
  const startMs = new Date(startAt).getTime()
  const endMs = new Date(endAt).getTime()

  // Status is time-based. "Disabled" is handled separately via `is_active`.
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || now > endMs) {
    return 'Expired'
  }
  if (now < startMs) {
    return 'Upcoming'
  }
  return 'Ongoing'
}

function toTimeSlot(startAt: string, endAt: string) {
  const start = new Date(startAt)
  const end = new Date(endAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startAt} - ${endAt}`
  }

  const day = `${start.getDate()}`.padStart(2, '0')
  const month = `${start.getMonth() + 1}`.padStart(2, '0')
  const year = start.getFullYear()
  const startHour = `${start.getHours()}`.padStart(2, '0')
  const startMinute = `${start.getMinutes()}`.padStart(2, '0')
  const endHour = `${end.getHours()}`.padStart(2, '0')
  const endMinute = `${end.getMinutes()}`.padStart(2, '0')

  return `${day}-${month}-${year} ${startHour}:${startMinute} - ${endHour}:${endMinute}`
}

export async function listFlashDeals(): Promise<FlashDealsResult> {
  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired || !shopId) {
    return { items: [], authRequired, noShop }
  }

  const { data, error } = await supabase
    .from('flash_deals')
    .select(
      'id,product_id,flash_price,original_price,start_at,end_at,flash_quantity,sold_quantity,purchase_limit,is_active,products:products!flash_deals_product_fkey(prodname,quantity)',
    )
    .eq('shop_id', shopId)
    .order('start_at', { ascending: false })

  if (error) {
    throw error
  }

  const rows = (data ?? []) as FlashDealDbRow[]
  const items: FlashDealRow[] = rows.map((row) => {
    const status = toStatus(row.start_at, row.end_at)
    const totalAvailable = row.products?.quantity ?? 0

    return {
      id: row.id,
      timeSlot: toTimeSlot(row.start_at, row.end_at),
      startAt: row.start_at,
      endAt: row.end_at,
      productId: row.product_id,
      productName: row.products?.prodname?.trim() || 'Unnamed product',
      originalPrice: row.original_price,
      flashPrice: row.flash_price,
      flashQuantity: row.flash_quantity,
      soldQuantity: row.sold_quantity ?? 0,
      purchaseLimit: row.purchase_limit ?? null,
      enabledProducts: (row.is_active ?? true) ? 1 : 0,
      totalAvailable,
      remindersSet: null,
      productClicks: null,
      status,
      enabled: row.is_active ?? true,
      actions: status === 'Expired' ? ['View', 'Delete'] : ['Edit', 'View', 'Delete'],
    }
  })

  return { items, authRequired: false, noShop: false }
}

export async function createFlashDeals(form: CreateFlashDealForm) {
  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired) {
    throw new Error('Sign in to create flash deals.')
  }
  if (!shopId || noShop) {
    throw new Error('No shop found for this account.')
  }

  const payload = validateCreateFlashDealForm(form)

  const rows = payload.products.map((item) => ({
    product_id: item.productId,
    shop_id: shopId,
    flash_price: item.flashPrice,
    original_price: item.originalPrice,
    flash_quantity: item.flashQuantity,
    purchase_limit: item.purchaseLimit,
    start_at: payload.startAtIso,
    end_at: payload.endAtIso,
    is_active: item.isActive,
  }))

  const { error } = await supabase.from('flash_deals').insert(rows)
  if (error) {
    throw toDatabaseError(error, 'Failed to create flash deal')
  }
}

export async function deleteFlashDeal(flashDealId: string) {
  if (!flashDealId) {
    throw new Error('Flash deal ID is required.')
  }

  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired) {
    throw new Error('Sign in to delete flash deals.')
  }
  if (!shopId || noShop) {
    throw new Error('No shop found for this account.')
  }

  const { error } = await supabase
    .from('flash_deals')
    .delete()
    .eq('id', flashDealId)
    .eq('shop_id', shopId)

  if (error) {
    throw toDatabaseError(error, 'Failed to delete flash deal')
  }
}

function validateUpdatePayload(input: UpdateFlashDealInput) {
  const startAt = parseDateTime(input.startAt)
  const endAt = parseDateTime(input.endAt)
  if (!startAt || !endAt || endAt.getTime() <= startAt.getTime()) {
    throw new Error('Flash deal end time must be later than start time.')
  }

  if (!Number.isFinite(input.discountPercent) || input.discountPercent <= 0 || input.discountPercent >= 100) {
    throw new Error('Discount percentage must be greater than 0 and less than 100.')
  }

  if (!Number.isFinite(input.originalPrice) || input.originalPrice <= 0) {
    throw new Error('Original price is invalid.')
  }

  if (!Number.isInteger(input.flashQuantity) || input.flashQuantity <= 0) {
    throw new Error('Campaign stock must be a whole number greater than 0.')
  }

  if (
    input.purchaseLimit !== null &&
    (!Number.isInteger(input.purchaseLimit) || input.purchaseLimit < 1)
  ) {
    throw new Error('Purchase limit must be empty or a whole number greater than 0.')
  }

  const flashPrice = Number(
    (input.originalPrice * (1 - input.discountPercent / 100)).toFixed(2),
  )

  if (!Number.isFinite(flashPrice) || flashPrice <= 0 || flashPrice > input.originalPrice) {
    throw new Error('Computed flash price is invalid.')
  }

  return {
    startAtIso: startAt.toISOString(),
    endAtIso: endAt.toISOString(),
    flashPrice,
  }
}

export async function updateFlashDeal(flashDealId: string, input: UpdateFlashDealInput) {
  if (!flashDealId) {
    throw new Error('Flash deal ID is required.')
  }

  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired) {
    throw new Error('Sign in to update flash deals.')
  }
  if (!shopId || noShop) {
    throw new Error('No shop found for this account.')
  }

  const payload = validateUpdatePayload(input)

  const { error } = await supabase
    .from('flash_deals')
    .update({
      start_at: payload.startAtIso,
      end_at: payload.endAtIso,
      flash_price: payload.flashPrice,
      flash_quantity: input.flashQuantity,
      purchase_limit: input.purchaseLimit,
      updated_at: new Date().toISOString(),
    })
    .eq('id', flashDealId)
    .eq('shop_id', shopId)

  if (error) {
    throw toDatabaseError(error, 'Failed to update flash deal')
  }
}

export async function updateFlashDealStatus(flashDealId: string, isActive: boolean) {
  if (!flashDealId) {
    throw new Error('Flash deal ID is required.')
  }

  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired) {
    throw new Error('Sign in to update flash deals.')
  }
  if (!shopId || noShop) {
    throw new Error('No shop found for this account.')
  }

  const { error } = await supabase
    .from('flash_deals')
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', flashDealId)
    .eq('shop_id', shopId)

  if (error) {
    throw toDatabaseError(error, 'Failed to update flash deal status')
  }
}
