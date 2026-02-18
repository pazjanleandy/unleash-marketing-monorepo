import type { FlashDealRow, FlashDealsMetric } from './types'

export const flashDealsPerformanceDateLabel =
  'Data from 11-02-2026 to 18-02-2026 GMT+8'

export const flashDealsPerformanceMetrics: FlashDealsMetric[] = [
  {
    label: 'Sales',
    value: '₱1,209.00',
    comparisonLabel: 'vs Previous 7 Days',
    comparisonValue: '0.09%',
    trend: 'up',
  },
  {
    label: 'Orders',
    value: '2',
    comparisonLabel: 'vs Previous 7 Days',
    comparisonValue: '0.23%',
    trend: 'down',
  },
  {
    label: 'Buyers',
    value: '2',
    comparisonLabel: 'vs Previous 7 Days',
    comparisonValue: '0.00%',
    trend: 'neutral',
  },
  {
    label: 'Click-Through Rate (CTR)',
    value: '0.00%',
    comparisonLabel: 'vs Previous 7 Days',
    comparisonValue: '-%',
    trend: 'neutral',
  },
]

export const flashDealRows: FlashDealRow[] = [
  {
    id: 'fd-1',
    timeSlot: '19-02-2026 09:00 - 12:00',
    enabledProducts: 6,
    totalAvailable: 44,
    remindersSet: null,
    productClicks: null,
    status: 'Upcoming',
    enabled: true,
    actions: ['Edit', 'Duplicate', 'Share', 'More'],
  },
  {
    id: 'fd-2',
    timeSlot: '19-02-2026 00:00 - 09:00',
    enabledProducts: 3,
    totalAvailable: 47,
    remindersSet: null,
    productClicks: null,
    status: 'Upcoming',
    enabled: true,
    actions: ['Edit', 'Duplicate', 'Share', 'More'],
  },
  {
    id: 'fd-3',
    timeSlot: '18-02-2026 18:00 - 00:00',
    enabledProducts: 4,
    totalAvailable: 46,
    remindersSet: null,
    productClicks: null,
    status: 'Upcoming',
    enabled: true,
    actions: ['Edit', 'Duplicate', 'Share', 'More'],
  },
  {
    id: 'fd-4',
    timeSlot: '18-02-2026 12:00 - 18:00',
    enabledProducts: 4,
    totalAvailable: 46,
    remindersSet: 2,
    productClicks: 13,
    status: 'Ongoing',
    enabled: true,
    actions: ['Edit', 'Duplicate', 'Share', 'More'],
  },
  {
    id: 'fd-5',
    timeSlot: '17-02-2026 09:00 - 12:00',
    enabledProducts: 5,
    totalAvailable: 45,
    remindersSet: 4,
    productClicks: 26,
    status: 'Expired',
    enabled: false,
    actions: ['View', 'Delete'],
  },
]
