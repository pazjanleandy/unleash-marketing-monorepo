export type RewardType = 'discount' | 'coins-cashback'

export type DiscountType = 'fixed-amount' | 'percentage'

export type ProductScope = 'all-products' | 'specific-products'

export type VoucherDisplaySetting = 'all-pages' | 'voucher-code'

export type VoucherType = 'shop' | 'product' | 'private' | 'live' | 'video'

export type CreateVoucherForm = {
  voucherType: VoucherType
  rewardType: RewardType
  discountType: DiscountType
  voucherCode: string
  discountAmount: string
  minimumBasketPrice: string
  usageQuantity: string
  maxDistributionPerBuyer: string
  displaySetting: VoucherDisplaySetting
  productScope: ProductScope
  startDateTime: string
  endDateTime: string
  selectedProductIds: string[]
  livestreamUrl: string
  videoUrl: string
}
