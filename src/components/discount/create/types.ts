export type CreateDiscountPromotionForm = {
  promotionName: string
  startDateTime: string
  endDateTime: string
  purchaseLimit: string
  products: string[]
  productDiscounts: Record<string, string>
}

export type DiscountDateTimeField = 'startDateTime' | 'endDateTime'

export type BundleDealItem = {
  productId: string
  quantity: number
}

export type CreateBundleDealForm = {
  promotionName: string
  startDateTime: string
  endDateTime: string
  purchaseLimit: string
  bundlePrice: string
  currency: string
  items: BundleDealItem[]
}

export type CreateAddOnDealForm = {
  promotionName: string
  startDateTime: string
  endDateTime: string
  purchaseLimit: string
  triggerProductId: string
  addonProductId: string
  discountValue: string
}
