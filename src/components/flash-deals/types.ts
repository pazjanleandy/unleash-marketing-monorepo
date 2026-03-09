export type FlashDealStatus = 'Upcoming' | 'Ongoing' | 'Expired'

export type FlashDealsTab = 'All' | FlashDealStatus

export type FlashDealsMetricTrend = 'up' | 'down' | 'neutral'

export type FlashDealsMetric = {
  label: string
  value: string
  comparisonLabel: string
  comparisonValue: string
  trend: FlashDealsMetricTrend
}

export type FlashDealRow = {
  id: string
  timeSlot: string
  startAt: string
  endAt: string
  productId: string
  productName: string
  originalPrice: number
  flashPrice: number
  flashQuantity: number
  soldQuantity: number
  purchaseLimit: number | null
  enabledProducts: number
  totalAvailable: number
  remindersSet: number | null
  productClicks: number | null
  status: FlashDealStatus
  enabled: boolean
  actions: string[]
}
