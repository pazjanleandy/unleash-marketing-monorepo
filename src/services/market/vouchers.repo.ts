import { supabase } from '../../supabase'
import type { CreateVoucherForm } from '../../components/vouchers/create/types'
import type { VoucherItem, VoucherStatus } from '../../components/vouchers/types'
import type { Database } from '../../types/database'

type VoucherRow = Database['public']['Tables']['vouchers']['Row']
type VoucherInsert = Database['public']['Tables']['vouchers']['Insert']
type VoucherUpdate = Database['public']['Tables']['vouchers']['Update']
type VoucherMetadata = Database['public']['Tables']['vouchers']['Row']['metadata']

export type VoucherListFilters = {
  tab?: 'All' | VoucherStatus
  search?: string
}

export type VoucherListResult = {
  items: VoucherItem[]
  authRequired: boolean
  noShop: boolean
}

const DEFAULT_VOUCHER_DURATION_DAYS = 30
const VOUCHER_TYPE_LABELS: Record<string, string> = {
  shop: 'Shop Voucher',
  product: 'Product Voucher',
  private: 'Private Voucher',
  live: 'Live Voucher',
  video: 'Video Voucher',
}

type VoucherRowWithRelations = VoucherRow & {
  voucher_products?: Array<{ product_id?: string | null }> | null
}

function formatMoney(value: number) {
  return `PHP ${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDateTimeLabel(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  const day = `${date.getDate()}`.padStart(2, '0')
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const year = `${date.getFullYear()}`
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')

  return `${day}-${month}-${year} ${hours}:${minutes}`
}

function getVoucherStatus(startAt: string, endAt: string): VoucherStatus {
  const now = Date.now()
  const startMs = new Date(startAt).getTime()
  const endMs = new Date(endAt).getTime()

  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return 'Expired'
  }

  if (now < startMs) {
    return 'Upcoming'
  }

  if (now > endMs) {
    return 'Expired'
  }

  return 'Ongoing'
}

function toLowerToken(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function resolveVoucherType(
  row: VoucherRow,
  productLinks: number,
): string {
  const metadata = (row.metadata ?? {}) as VoucherMetadata
  const metadataRecord =
    typeof metadata === 'object' && metadata !== null
      ? (metadata as Record<string, unknown>)
      : {}

  const directTokens = [
    toLowerToken(row.voucher_type),
    toLowerToken(metadataRecord.voucher_type),
    toLowerToken(metadataRecord.voucherType),
    toLowerToken(metadataRecord.channel),
    toLowerToken(row.name),
    toLowerToken(row.description),
  ]

  const matchedKey = (Object.keys(VOUCHER_TYPE_LABELS) as Array<keyof typeof VOUCHER_TYPE_LABELS>)
    .find((key) =>
      directTokens.some((token) => token === key || token.includes(key)),
    )

  if (matchedKey) {
    return VOUCHER_TYPE_LABELS[matchedKey]
  }

  if (productLinks > 0) {
    return VOUCHER_TYPE_LABELS.product
  }

  return VOUCHER_TYPE_LABELS.shop
}

function toVoucherItem(row: VoucherRowWithRelations): VoucherItem {
  const status = getVoucherStatus(row.start_at, row.end_at)
  const productLinks = row.voucher_products?.length ?? 0
  const usedCount = row.total_used ?? row.used_count ?? 0
  const usageQuantity = row.usage_quantity ?? row.usage_limit ?? 0
  const perUserLimit = row.usage_per_user ?? row.usage_limit
  const isPercentage = row.discount_type === 'percentage'
  const discountNumeric = row.discount_amount ?? row.discount_value
  const voucherTypeLabel = resolveVoucherType(row, productLinks)
  const claimingStart = row.claim_start_at ?? row.start_at
  const claimingEnd = row.claim_end_at ?? row.end_at

  return {
    id: row.id,
    code: row.code,
    name: row.name?.trim() || row.description?.trim() || row.code,
    type: voucherTypeLabel,
    discountAmount: isPercentage ? `${discountNumeric}%` : formatMoney(discountNumeric),
    quantity: usageQuantity,
    usageLimit: perUserLimit === null ? '-' : `${perUserLimit}`,
    claimed: usedCount,
    usage: usedCount,
    status,
    claimingPeriod: {
      start: formatDateTimeLabel(claimingStart),
      end: formatDateTimeLabel(claimingEnd),
    },
    actions:
      status === 'Expired'
        ? [{ label: 'Delete', danger: true }]
        : [{ label: 'Edit' }, { label: 'Delete', danger: true }],
    icon: isPercentage ? 'percent' : 'money',
  }
}

function parseDecimalInput(value: string, fallback: number) {
  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ''))
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseIntInput(value: string, fallback: number) {
  const parsed = Number.parseInt(value.replace(/\D/g, ''), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function buildVoucherPayload(form: CreateVoucherForm, shopId: string): VoucherInsert {
  const now = new Date()
  const end = new Date(now.getTime() + DEFAULT_VOUCHER_DURATION_DAYS * 24 * 60 * 60 * 1000)
  const discountAmount = parseDecimalInput(form.discountAmount, 0)
  const usageQuantity = parseIntInput(form.usageQuantity, 0)
  const usagePerUser = parseIntInput(form.maxDistributionPerBuyer, 1)

  return {
    shop_id: shopId,
    code: `V-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    name:
      form.displaySetting === 'voucher-code'
        ? 'Private Voucher'
        : form.productScope === 'specific-products'
          ? 'Product Voucher'
          : 'Shop Voucher',
    description: form.displaySetting === 'voucher-code' ? 'Voucher Code Campaign' : 'Shop Voucher',
    discount_type: form.discountType === 'percentage' ? 'percentage' : 'fixed',
    discount_value: discountAmount,
    discount_amount: discountAmount,
    min_spend: parseDecimalInput(form.minimumBasketPrice, 0),
    usage_limit: usageQuantity,
    usage_quantity: usageQuantity,
    usage_per_user: usagePerUser,
    used_count: 0,
    total_used: 0,
    start_at: now.toISOString(),
    end_at: end.toISOString(),
    claim_start_at: now.toISOString(),
    claim_end_at: end.toISOString(),
    is_active: true,
    metadata: {
      voucher_category:
        form.displaySetting === 'voucher-code'
          ? 'private'
          : form.productScope === 'specific-products'
            ? 'product'
            : 'shop',
    },
  }
}

export async function getCurrentUserShopId() {
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

export async function listVouchers(filters: VoucherListFilters = {}): Promise<VoucherListResult> {
  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired || !shopId) {
    return { items: [], authRequired, noShop }
  }

  const { data, error } = await supabase
    .from('vouchers')
    .select(
      'id,shop_id,code,description,name,voucher_type,discount_type,discount_value,discount_amount,min_spend,max_discount,usage_limit,usage_quantity,usage_per_user,used_count,total_used,start_at,end_at,claim_start_at,claim_end_at,is_active,metadata,created_at,updated_at,voucher_products(product_id)',
    )
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  const rows = (data ?? []) as VoucherRow[]
  let items: VoucherItem[] = rows.map((row) => toVoucherItem(row))
  if (filters.tab && filters.tab !== 'All') {
    items = items.filter((item) => item.status === filters.tab)
  }

  const query = filters.search?.trim().toLowerCase()
  if (query) {
    items = items.filter(
      (item) => item.name.toLowerCase().includes(query) || item.code.toLowerCase().includes(query),
    )
  }

  return { items, authRequired: false, noShop: false }
}

export async function createVoucher(form: CreateVoucherForm) {
  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired) {
    throw new Error('Please sign in to create vouchers.')
  }
  if (noShop || !shopId) {
    throw new Error('No shop found for your account.')
  }

  const payload = buildVoucherPayload(form, shopId)
  const { error } = await supabase.from('vouchers').insert(payload)
  if (error) {
    throw error
  }
}

export async function updateVoucher(voucherId: string, form: CreateVoucherForm) {
  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired) {
    throw new Error('Please sign in to update vouchers.')
  }
  if (noShop || !shopId) {
    throw new Error('No shop found for your account.')
  }

  const discountAmount = parseDecimalInput(form.discountAmount, 0)
  const usageQuantity = parseIntInput(form.usageQuantity, 0)
  const usagePerUser = parseIntInput(form.maxDistributionPerBuyer, 1)
  const payload: VoucherUpdate = {
    name:
      form.displaySetting === 'voucher-code'
        ? 'Private Voucher'
        : form.productScope === 'specific-products'
          ? 'Product Voucher'
          : 'Shop Voucher',
    description: form.displaySetting === 'voucher-code' ? 'Voucher Code Campaign' : 'Shop Voucher',
    discount_type: form.discountType === 'percentage' ? 'percentage' : 'fixed',
    discount_value: discountAmount,
    discount_amount: discountAmount,
    min_spend: parseDecimalInput(form.minimumBasketPrice, 0),
    usage_limit: usageQuantity,
    usage_quantity: usageQuantity,
    usage_per_user: usagePerUser,
    metadata: {
      voucher_category:
        form.displaySetting === 'voucher-code'
          ? 'private'
          : form.productScope === 'specific-products'
            ? 'product'
            : 'shop',
    },
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('vouchers')
    .update(payload)
    .eq('id', voucherId)
    .eq('shop_id', shopId)

  if (error) {
    throw error
  }
}

export async function deleteVoucher(voucherId: string) {
  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired) {
    throw new Error('Please sign in to delete vouchers.')
  }
  if (noShop || !shopId) {
    throw new Error('No shop found for your account.')
  }

  const { error } = await supabase
    .from('vouchers')
    .delete()
    .eq('id', voucherId)
    .eq('shop_id', shopId)

  if (error) {
    throw error
  }
}
