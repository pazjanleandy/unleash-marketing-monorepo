import { supabase } from '../../supabase'
import type { CreateVoucherForm } from '../../components/vouchers/create/types'
import type { VoucherItem, VoucherStatus } from '../../components/vouchers/types'
import type { Database } from '../../types/database'

type VoucherRow = Database['public']['Tables']['vouchers']['Row']
type VoucherInsert = Database['public']['Tables']['vouchers']['Insert']
type VoucherUpdate = Database['public']['Tables']['vouchers']['Update']

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

function toVoucherItem(row: VoucherRow): VoucherItem {
  const status = getVoucherStatus(row.start_at, row.end_at)
  const usedCount = row.used_count ?? 0
  const usageLimit = row.usage_limit ?? 0
  const isPercentage = row.discount_type === 'percentage'

  return {
    id: row.id,
    code: row.code,
    name: row.description?.trim() || row.code,
    type: 'Shop Voucher (all products)',
    discountAmount: isPercentage ? `${row.discount_value}%` : formatMoney(row.discount_value),
    quantity: usageLimit,
    usageLimit: row.usage_limit === null ? '-' : `${row.usage_limit}`,
    claimed: usedCount,
    usage: usedCount,
    status,
    claimingPeriod: {
      start: formatDateTimeLabel(row.start_at),
      end: formatDateTimeLabel(row.end_at),
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
  if (form.productScope !== 'all-products') {
    throw new Error('Specific-product vouchers are not supported yet.')
  }

  const now = new Date()
  const end = new Date(now.getTime() + DEFAULT_VOUCHER_DURATION_DAYS * 24 * 60 * 60 * 1000)

  return {
    shop_id: shopId,
    code: `V-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    description: form.displaySetting === 'voucher-code' ? 'Voucher Code Campaign' : 'Shop Voucher',
    discount_type: form.discountType === 'percentage' ? 'percentage' : 'fixed',
    discount_value: parseDecimalInput(form.discountAmount, 0),
    min_spend: parseDecimalInput(form.minimumBasketPrice, 0),
    usage_limit: parseIntInput(form.usageQuantity, 0),
    used_count: 0,
    start_at: now.toISOString(),
    end_at: end.toISOString(),
    is_active: true,
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
      'id,shop_id,code,description,discount_type,discount_value,min_spend,max_discount,usage_limit,used_count,start_at,end_at,is_active,created_at,updated_at',
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

  if (form.productScope !== 'all-products') {
    throw new Error('Specific-product vouchers are not supported yet.')
  }

  const payload: VoucherUpdate = {
    description: form.displaySetting === 'voucher-code' ? 'Voucher Code Campaign' : 'Shop Voucher',
    discount_type: form.discountType === 'percentage' ? 'percentage' : 'fixed',
    discount_value: parseDecimalInput(form.discountAmount, 0),
    min_spend: parseDecimalInput(form.minimumBasketPrice, 0),
    usage_limit: parseIntInput(form.usageQuantity, 0),
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
