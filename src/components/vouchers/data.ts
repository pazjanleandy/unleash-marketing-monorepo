import type { VoucherItem } from './types'

export const voucherTabs = ['All', 'Ongoing', 'Upcoming', 'Expired'] as const

export const sampleVouchers: VoucherItem[] = [
  {
    code: 'PETFURDELIVER',
    name: 'Pet Fur Day Deliver',
    type: 'Shop Voucher (all products)',
    discountAmount: 'PHP 30.00',
    quantity: 50,
    usageLimit: '-',
    claimed: 20,
    usage: 1,
    status: 'Expired',
    claimingPeriod: {
      start: '02-11-2026 16:50',
      end: '14-02-2026 17:50',
    },
    actions: [
      { label: 'Details' },
      { label: 'Orders' },
      { label: 'Duplicate' },
    ],
    icon: 'money',
  },
  {
    code: 'PETLIFE',
    name: 'Clearance Sale',
    type: 'Product Voucher (87 products)',
    discountAmount: 'PHP 20.00',
    quantity: 100,
    usageLimit: '-',
    claimed: 30,
    usage: 12,
    status: 'Ongoing',
    claimingPeriod: {
      start: '11-02-2026 18:09',
      end: '28-02-2026 19:09',
    },
    actions: [
      { label: 'Edit' },
      { label: 'Duplicate' },
      { label: 'Orders' },
      { label: 'Delete', danger: true },
    ],
    icon: 'percent',
  },
  {
    code: 'PETSAVE',
    name: 'Save100',
    type: 'Shop Voucher (all products)',
    discountAmount: 'PHP 100.00',
    quantity: 120,
    usageLimit: '-',
    claimed: 14,
    usage: 6,
    status: 'Upcoming',
    claimingPeriod: {
      start: '11-05-2026 07:18',
      end: '11-07-2026 08:18',
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
    code: 'PETPALS',
    name: 'Weekend Pet Pals',
    type: 'Shop Voucher (all products)',
    discountAmount: 'PHP 15.00',
    quantity: 80,
    usageLimit: '-',
    claimed: 18,
    usage: 8,
    status: 'Ongoing',
    claimingPeriod: {
      start: '17-02-2026 09:30',
      end: '22-02-2026 21:30',
    },
    actions: [
      { label: 'Edit' },
      { label: 'Duplicate' },
      { label: 'Orders' },
      { label: 'Delete', danger: true },
    ],
    icon: 'money',
  },
]
