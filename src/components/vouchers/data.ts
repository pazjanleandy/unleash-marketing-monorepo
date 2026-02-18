import type { VoucherItem } from './types'

export const voucherTabs = ['All', 'Ongoing', 'Upcoming', 'Expired'] as const

export const sampleVouchers: VoucherItem[] = [
  {
    code: 'TEEEWED02',
    name: 'Wednesday Worthies',
    type: 'Shop Voucher (all products)',
    discountAmount: '₱20.00',
    quantity: 10,
    usageLimit: '-',
    claimed: 0,
    usage: 0,
    status: 'Upcoming',
    claimingPeriod: {
      start: '04-11-2020 17:26',
      end: '04-11-2020 18:26',
    },
    actions: [
      { label: 'Edit' },
      { label: 'Duplicate' },
      { label: 'Orders' },
      { label: 'Delete', danger: true },
    ],
    icon: 'money',
  },
  {
    code: 'TEEETUE01',
    name: 'Tuesday Treats',
    type: 'Shop Voucher (all products)',
    discountAmount: '₱10.00',
    quantity: 10,
    usageLimit: '-',
    claimed: 0,
    usage: 0,
    status: 'Ongoing',
    claimingPeriod: {
      start: '03-11-2020 17:18',
      end: '03-11-2020 18:25',
    },
    actions: [
      { label: 'Edit' },
      { label: 'Duplicate' },
      { label: 'Orders' },
      { label: 'End', danger: true },
    ],
    icon: 'money',
  },
]
