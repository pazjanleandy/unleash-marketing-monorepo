export type DiscountToolType =
  | 'discount-promotions'
  | 'bundle-deal'
  | 'add-on-deal'

export type DiscountCreateTool = {
  type: DiscountToolType
  title: string
  description: string
}

export type DiscountPromotionTab =
  | 'All'
  | 'Discount Promotions'
  | 'Bundle Deal'
  | 'Add-on Deal'

export type PromotionMetric = {
  label: string
  value: string
  comparisonLabel: string
  comparisonValue: string
}

export type PromotionStatus = 'Ongoing' | 'Upcoming' | 'Expired'

export type PromotionRow = {
  status: PromotionStatus
  name: string
  type: Exclude<DiscountPromotionTab, 'All'>
  products: string[]
  period: {
    start: string
    end: string
  }
  actions: string[]
}
