import { supabase } from '../../supabase'
import type { CreateAddOnDealForm } from '../../components/discount/create/types'
import type { AddOnDealRow, PromotionStatus } from '../../components/discount/types'

type AddOnListResult = {
  items: AddOnDealRow[]
  authRequired: boolean
  noShop: boolean
}

type ShopContext = {
  authRequired: boolean
  shopId: string | null
  noShop: boolean
}

type AddOnItemDbRow = {
  id: string
  product_id: string
  required_quantity: number | null
  max_addon_quantity: number | null
  products?: {
    prodname?: string | null
    image?: string | null
    image_url?: string | null
  } | null
}

type AddOnDealDbRow = {
  id: string
  shop_id: string
  name: string
  trigger_product_id: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  start_at: string
  end_at: string
  max_uses: number | null
  is_active: boolean | null
  trigger_product?: {
    prodname?: string | null
    image?: string | null
    image_url?: string | null
  } | null
  addon_deal_items?: AddOnItemDbRow[] | null
}

type ValidatedAddOnPayload = {
  promotionName: string
  startAtIso: string
  endAtIso: string
  maxUses: number | null
  triggerProductId: string
  addonProductId: string
  discountValue: number
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
    lowerMessage.includes('relation "addon_deals" does not exist') ||
    lowerMessage.includes("table 'addon_deals' not found")
  ) {
    return new Error(
      `${message}. The database schema is not up to date. Apply migration 004_addon_deals.sql to the same Supabase project used by this app.`,
    )
  }

  if (lowerMessage.includes('row-level security') || lowerMessage.includes('permission denied')) {
    return new Error(
      `${message}. RLS may be blocking this action. Verify addon_deals/addon_deal_items policies in your live DB.`,
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

function validateAddOnForm(form: CreateAddOnDealForm): ValidatedAddOnPayload {
  const promotionName = form.promotionName.trim()
  if (!promotionName) {
    throw new Error('Add-on deal name is required.')
  }

  if (!form.triggerProductId) {
    throw new Error('Select a trigger product.')
  }

  if (!form.addonProductId) {
    throw new Error('Select an add-on product.')
  }

  if (form.triggerProductId === form.addonProductId) {
    throw new Error('Trigger and add-on products must be different.')
  }

  const startAt = parseLocalDateTimeInput(form.startDateTime)
  const endAt = parseLocalDateTimeInput(form.endDateTime)
  if (!startAt || !endAt || endAt.getTime() <= startAt.getTime()) {
    throw new Error('End time must be later than start time.')
  }

  if (endAt.getTime() - startAt.getTime() > MAX_PROMOTION_DURATION_MS) {
    throw new Error('Add-on deal period must be less than or equal to 180 days.')
  }

  let maxUses: number | null = null
  const trimmedLimit = form.purchaseLimit.trim()
  if (trimmedLimit.length > 0) {
    if (!/^\d+$/.test(trimmedLimit)) {
      throw new Error('Purchase limit must be a whole number.')
    }
    maxUses = Number(trimmedLimit)
  }

  const rawDiscount = form.discountValue.trim()
  const discountValue = Number(rawDiscount)
  if (!rawDiscount || Number.isNaN(discountValue) || discountValue <= 0 || discountValue > 100) {
    throw new Error('Discount must be greater than 0 and at most 100.')
  }

  return {
    promotionName,
    startAtIso: startAt.toISOString(),
    endAtIso: endAt.toISOString(),
    maxUses,
    triggerProductId: form.triggerProductId,
    addonProductId: form.addonProductId,
    discountValue,
  }
}

export async function listAddOnDeals(): Promise<AddOnListResult> {
  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired || !shopId) {
    return { items: [], authRequired, noShop }
  }

  const { data, error } = await supabase
    .from('addon_deals')
    .select(
      'id,shop_id,name,trigger_product_id,discount_type,discount_value,start_at,end_at,max_uses,is_active,trigger_product:products!addon_deals_trigger_product_id_fkey(prodname,image,image_url),addon_deal_items(id,product_id,required_quantity,max_addon_quantity,products:products!addon_deal_items_product_id_fkey(prodname,image,image_url))',
    )
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (error) {
    throw toDatabaseError(error, 'Failed to load add-on deals')
  }

  const rows = (data ?? []) as AddOnDealDbRow[]
  const items: AddOnDealRow[] = rows.map((row, rowIndex) => {
    const addOnItem = row.addon_deal_items?.[0]
    const triggerName = row.trigger_product?.prodname?.trim() || `Trigger Product ${rowIndex + 1}`
    const addonName = addOnItem?.products?.prodname?.trim() || `Add-on Product ${rowIndex + 1}`
    const triggerImage = row.trigger_product?.image_url ?? row.trigger_product?.image ?? null
    const addonImage = addOnItem?.products?.image_url ?? addOnItem?.products?.image ?? null
    const status = toPromotionStatus(row.start_at, row.end_at, row.is_active ?? true)

    return {
      id: row.id || `addon-${rowIndex + 1}`,
      status,
      name: row.name,
      type: 'Add-on Deal',
      campaignType: 'add-on',
      products: [triggerName, addonName],
      productPreviews: [
        { id: row.trigger_product_id, name: triggerName, image: triggerImage },
        { id: addOnItem?.product_id ?? `addon-${rowIndex + 1}`, name: addonName, image: addonImage },
      ],
      triggerProductId: row.trigger_product_id,
      triggerProductName: triggerName,
      triggerProductImage: triggerImage,
      addonProductId: addOnItem?.product_id ?? '',
      addonProductName: addonName,
      addonProductImage: addonImage,
      discountValue:
        row.discount_value !== null && typeof row.discount_value === 'number'
          ? formatDecimal(row.discount_value)
          : '',
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

export async function createAddOnDeal(form: CreateAddOnDealForm) {
  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired) {
    throw new Error('Sign in to create add-on deals.')
  }
  if (!shopId || noShop) {
    throw new Error('No shop found for this account.')
  }

  const payload = validateAddOnForm(form)
  const { data: deal, error: dealError } = await supabase
    .from('addon_deals')
    .insert({
      shop_id: shopId,
      name: payload.promotionName,
      trigger_product_id: payload.triggerProductId,
      discount_type: 'percentage',
      discount_value: payload.discountValue,
      start_at: payload.startAtIso,
      end_at: payload.endAtIso,
      max_uses: payload.maxUses,
      is_active: true,
    })
    .select('id')
    .single()

  if (dealError) {
    throw toDatabaseError(dealError, 'Failed to create add-on deal')
  }

  const dealId = deal?.id
  if (!dealId) {
    throw new Error('Unable to create add-on deal.')
  }

  const { error: itemError } = await supabase.from('addon_deal_items').insert({
    addon_deal_id: dealId,
    product_id: payload.addonProductId,
    required_quantity: 1,
    max_addon_quantity: null,
  })

  if (itemError) {
    throw toDatabaseError(itemError, 'Failed to add add-on product')
  }
}

export async function updateAddOnDeal(addOnDealId: string, form: CreateAddOnDealForm) {
  if (!addOnDealId) {
    throw new Error('Add-on deal ID is required.')
  }

  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired) {
    throw new Error('Sign in to update add-on deals.')
  }
  if (!shopId || noShop) {
    throw new Error('No shop found for this account.')
  }

  const payload = validateAddOnForm(form)
  const { error: dealError } = await supabase
    .from('addon_deals')
    .update({
      name: payload.promotionName,
      trigger_product_id: payload.triggerProductId,
      discount_type: 'percentage',
      discount_value: payload.discountValue,
      start_at: payload.startAtIso,
      end_at: payload.endAtIso,
      max_uses: payload.maxUses,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', addOnDealId)
    .eq('shop_id', shopId)

  if (dealError) {
    throw toDatabaseError(dealError, 'Failed to update add-on deal')
  }

  const { error: deleteError } = await supabase
    .from('addon_deal_items')
    .delete()
    .eq('addon_deal_id', addOnDealId)

  if (deleteError) {
    throw toDatabaseError(deleteError, 'Failed to replace add-on product')
  }

  const { error: insertError } = await supabase.from('addon_deal_items').insert({
    addon_deal_id: addOnDealId,
    product_id: payload.addonProductId,
    required_quantity: 1,
    max_addon_quantity: null,
  })

  if (insertError) {
    throw toDatabaseError(insertError, 'Failed to save add-on product')
  }
}

export async function deleteAddOnDeal(addOnDealId: string) {
  if (!addOnDealId) {
    throw new Error('Add-on deal ID is required.')
  }

  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired) {
    throw new Error('Sign in to delete add-on deals.')
  }
  if (!shopId || noShop) {
    throw new Error('No shop found for this account.')
  }

  const { error } = await supabase
    .from('addon_deals')
    .delete()
    .eq('id', addOnDealId)
    .eq('shop_id', shopId)

  if (error) {
    throw toDatabaseError(error, 'Failed to delete add-on deal')
  }
}
