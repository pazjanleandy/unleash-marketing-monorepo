import type { VoucherType } from './create/types'

export type VoucherStatus = 'Upcoming' | 'Ongoing' | 'Expired'

export type VoucherIcon = 'money' | 'percent'

export type VoucherAction = {
  label: string
  danger?: boolean
}

export type VoucherItem = {
  id: string
  code: string
  name: string
  type: string
  voucherType: VoucherType
  startAtIso: string
  endAtIso: string
  claimStartAtIso: string
  claimEndAtIso: string
  productNames: string[]
  productCount: number
  discountAmount: string
  minimumSpend: string
  quantity: number
  usageLimit: string
  claimed: number
  usage: number
  status: VoucherStatus
  claimingPeriod: {
    start: string
    end: string
  }
  actions: VoucherAction[]
  icon: VoucherIcon
}
