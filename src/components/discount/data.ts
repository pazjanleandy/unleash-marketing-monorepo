import type {
  DiscountCreateTool,
  DiscountPromotionTab,
  PromotionMetric,
  PromotionRow,
} from './types'

export const discountCreationTools: DiscountCreateTool[] = [
  {
    type: 'discount-promotions',
    title: 'Discount Promotions',
    description: 'Set a discount for a single product.',
  },
  {
    type: 'bundle-deal',
    title: 'Bundle Deal',
    description:
      'Set discounts for your products as bundles to increase average basket size.',
  },
  {
    type: 'add-on-deal',
    title: 'Add-on Deal',
    description: 'Set a discount for products to be sold together.',
  },
]

export const promotionTabs: DiscountPromotionTab[] = [
  'All',
  'Discount Promotions',
  'Bundle Deal',
  'Add-on Deal',
]

export const promotionPerformanceDateLabel =
  'Data from 02-11-2026 (Wed) to 02-18-2026 (Wed) GMT+8'

export const promotionPerformanceMetrics: PromotionMetric[] = [
  {
    label: 'Sales',
    value: '₱0.00',
    comparisonLabel: 'vs Previous 7 Days',
    comparisonValue: '-100.00%',
  },
  {
    label: 'Orders',
    value: '0',
    comparisonLabel: 'vs Previous 7 Days',
    comparisonValue: '-100.00%',
  },
  {
    label: 'Units Sold',
    value: '0',
    comparisonLabel: 'vs Previous 7 Days',
    comparisonValue: '-100.00%',
  },
  {
    label: 'Buyers',
    value: '0',
    comparisonLabel: 'vs Previous 7 Days',
    comparisonValue: '-100.00%',
  },
]

export const promotionRows: PromotionRow[] = [
  {
    status: 'Upcoming',
    name: 'Discount XYZ',
    type: 'Discount Promotions',
    products: ['Hat'],
    period: {
      start: '15/02/2026 19:05',
      end: '16/02/2026 10:00',
    },
    actions: ['Edit', 'Duplicate', 'Delete'],
  },
  {
    status: 'Ongoing',
    name: 'Maka-Shiba',
    type: 'Discount Promotions',
    products: ['Sneaker', 'Bottle', 'Bag', 'Tee'],
    period: {
      start: '17/02/2026 18:30',
      end: '21/02/2026 00:00',
    },
    actions: ['Edit', 'Duplicate', 'Delete'],
  },
  {
    status: 'Expired',
    name: 'Payday Sale',
    type: 'Discount Promotions',
    products: ['Watch', 'Mug', 'Poster', 'Cap', 'Notebook', 'Pin'],
    period: {
      start: '14/02/2026 00:00',
      end: '15/02/2026 00:00',
    },
    actions: ['View', 'Delete'],
  },
  {
    status: 'Expired',
    name: 'Deal Tayo',
    type: 'Bundle Deal',
    products: ['Bundle Pack'],
    period: {
      start: '11/02/2026 18:00',
      end: '14/02/2026 19:00',
    },
    actions: ['View', 'Delete'],
  },
  {
    status: 'Expired',
    name: 'Doggo',
    type: 'Add-on Deal',
    products: ['Dog Collar'],
    period: {
      start: '11/02/2026 17:00',
      end: '12/02/2026 18:00',
    },
    actions: ['View', 'Delete'],
  },
]
