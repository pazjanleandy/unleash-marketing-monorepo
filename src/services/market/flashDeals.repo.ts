import { supabase } from '../../supabase'
import type { FlashDealRow, FlashDealStatus } from '../../components/flash-deals/types'

type FlashDealsResult = {
  items: FlashDealRow[]
  authRequired: boolean
  noShop: boolean
}

type FlashDealDbRow = {
  id: string
  start_at: string
  end_at: string
  flash_quantity: number
  sold_quantity: number | null
  is_active: boolean | null
  products?: {
    quantity?: number | null
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

function toStatus(startAt: string, endAt: string, isActive: boolean): FlashDealStatus {
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
    .select('id,start_at,end_at,flash_quantity,sold_quantity,is_active,products:products!flash_deals_product_fkey(quantity)')
    .eq('shop_id', shopId)
    .order('start_at', { ascending: false })

  if (error) {
    throw error
  }

  const rows = (data ?? []) as FlashDealDbRow[]
  const items: FlashDealRow[] = rows.map((row) => {
    const status = toStatus(row.start_at, row.end_at, row.is_active ?? true)
    const totalAvailable = row.products?.quantity ?? 0

    return {
      id: row.id,
      timeSlot: toTimeSlot(row.start_at, row.end_at),
      enabledProducts: (row.is_active ?? true) ? 1 : 0,
      totalAvailable,
      remindersSet: null,
      productClicks: null,
      status,
      enabled: row.is_active ?? true,
      actions: status === 'Expired' ? ['View', 'Delete'] : ['Edit', 'Delete'],
    }
  })

  return { items, authRequired: false, noShop: false }
}
