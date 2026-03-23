export type DiscountToolType =
  | 'discount-promotions'
  | 'bundle-deal'
  | 'add-on-deal'

export type DiscountCreateTool = {
  type: DiscountToolType
  title: string
  description: string
  metaTag?: string
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
  tone?: 'neutral' | 'ongoing' | 'upcoming' | 'expired'
}

export type PromotionStatus = 'Ongoing' | 'Upcoming' | 'Expired'

export type DiscountCampaignType = 'promotion' | 'bundle' | 'add-on'

export type DiscountProductPreview = {
  id: string
  name: string
  image: string | null
}

export type BaseCampaignRow = {
  id: string
  status: PromotionStatus
  name: string
  type: Exclude<DiscountPromotionTab, 'All'>
  products: string[]
  productPreviews: DiscountProductPreview[]
  maxUses: number | null
  period: {
    start: string
    end: string
  }
  actions: string[]
}

export type PromotionRow = BaseCampaignRow & {
  campaignType: 'promotion'
  productDiscounts: Record<string, string>
}

export type BundleDealItemRow = {
  productId: string
  name: string
  image: string | null
  quantity: number
}

export type BundleDealRow = BaseCampaignRow & {
  campaignType: 'bundle'
  bundlePrice: string
  currency: string
  bundleItems: BundleDealItemRow[]
}

export type AddOnDealRow = BaseCampaignRow & {
  campaignType: 'add-on'
  triggerProductId: string
  triggerProductName: string
  triggerProductImage: string | null
  addonProductId: string
  addonProductName: string
  addonProductImage: string | null
  discountValue: string
}

export type DiscountCampaignRow = PromotionRow | BundleDealRow | AddOnDealRow
