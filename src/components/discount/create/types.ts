export type CreateDiscountPromotionForm = {
  promotionName: string
  startDateTime: string
  endDateTime: string
  discountRate: string
  purchaseLimit: string
  products: string[]
  productDiscounts: Record<string, string>
}
