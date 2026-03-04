export type CreateDiscountPromotionForm = {
  promotionName: string
  startDateTime: string
  endDateTime: string
  purchaseLimit: string
  products: string[]
  productDiscounts: Record<string, string>
}

export type DiscountDateTimeField = 'startDateTime' | 'endDateTime'
