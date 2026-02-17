export type RewardType = 'discount' | 'coins-cashback'

export type DiscountType = 'fixed-amount' | 'percentage'

export type ProductScope = 'all-products' | 'specific-products'

export type VoucherDisplaySetting = 'all-pages' | 'voucher-code'

export type CreateVoucherForm = {
  rewardType: RewardType
  discountType: DiscountType
  discountAmount: string
  minimumBasketPrice: string
  usageQuantity: string
  maxDistributionPerBuyer: string
  displaySetting: VoucherDisplaySetting
  productScope: ProductScope
}
