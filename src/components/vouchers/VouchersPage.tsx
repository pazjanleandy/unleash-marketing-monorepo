import { useMemo, useState } from 'react'
import type { TouchEventHandler } from 'react'
import type {
  VoucherAction,
  VoucherIcon,
  VoucherItem,
  VoucherStatus,
} from './types'
import type { VoucherType } from './create/types'

type VouchersPageProps = {
  onBack: () => void
  onCreate: (voucherType: VoucherType) => void
  onEdit: (voucher: VoucherItem) => void
  onDelete?: (voucher: VoucherItem) => void
  vouchers?: VoucherItem[]
  isLoading?: boolean
  error?: string | null
  isAuthRequired?: boolean
  hasNoShop?: boolean
  onRetry?: () => void
  canManage?: boolean
}

const voucherTabs = ['All', 'Ongoing', 'Upcoming', 'Expired'] as const

type MobileTab = (typeof voucherTabs)[number]

const statusPillClasses: Record<VoucherStatus, string> = {
  Ongoing: 'bg-[#10B981] text-white',
  Upcoming: 'bg-[#F59E0B] text-white',
  Expired: 'bg-slate-300 text-slate-700',
}

const statusBorderClasses: Record<VoucherStatus, string> = {
  Ongoing: 'border-l-[#10B981]',
  Upcoming: 'border-l-[#F59E0B]',
  Expired: 'border-l-slate-300',
}

const iconClasses: Record<VoucherIcon, string> = {
  money: 'bg-gradient-to-br from-[#8adcca] to-[#66acf8]',
  percent: 'bg-gradient-to-br from-[#ff9a4c] to-[#f36f2f]',
}

type MobileCarouselTab = (typeof voucherTabs)[number]

const mobileCarouselTabs: MobileCarouselTab[] = [
  'All',
  'Upcoming',
  'Ongoing',
  'Expired',
]

const quickFilters = ['All Products', 'Specific Products'] as const

type VoucherCreateTypeCard = {
  title: string
  description: string
  voucherType: VoucherType
}

type VoucherCreateGroup = {
  title: string
  cards: VoucherCreateTypeCard[]
}

const voucherCreateGroups: VoucherCreateGroup[] = [
  {
    title: 'Improve general conversion',
    cards: [
      {
        title: 'Shop Voucher',
        voucherType: 'shop',
        description: 'Vouchers applicable for all your products to boost shopwide sales.',
      },
      {
        title: 'Product Voucher',
        voucherType: 'product',
        description: 'Vouchers applicable for selected products to run specific promotions.',
      },
    ],
  },
  {
    title: 'Target Specific Distribution Channels',
    cards: [
      {
        title: 'Private Voucher',
        voucherType: 'private',
        description: 'Vouchers that are only sharable via code to targeted customers.',
      },
      {
        title: 'Live Voucher',
        voucherType: 'live',
        description: 'Exclusive vouchers applicable for your products in Live to improve conversion.',
      },
      {
        title: 'Video Voucher',
        voucherType: 'video',
        description:
          'Exclusive vouchers applicable for your products in Video to increase sales.',
      },
    ],
  },
]

const voucherTypeBadgeColors: Record<VoucherType, { bg: string; text: string }> = {
  shop: { bg: 'bg-[#eff6ff]', text: 'text-[#2563EB]' },
  product: { bg: 'bg-[#f0fdf4]', text: 'text-[#16a34a]' },
  private: { bg: 'bg-[#f5f3ff]', text: 'text-[#7c3aed]' },
  live: { bg: 'bg-[#fffbeb]', text: 'text-[#d97706]' },
  video: { bg: 'bg-[#fdf2f8]', text: 'text-[#db2777]' },
}

const monthLabels = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

type ParsedVoucherDate = {
  day: number
  month: number
  year: number
  time: string
}

function toCompactCurrency(value: string) {
  const numeric = value.replace(/[^0-9.]/g, '')
  const parsed = Number.parseFloat(numeric)

  if (!Number.isFinite(parsed)) {
    return 'PHP 0'
  }

  return `PHP ${parsed.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`
}

function parseVoucherDate(value: string): ParsedVoucherDate | null {
  const [datePart = '', timePart = ''] = value.trim().split(/\s+/)
  const dateTokens = datePart.split('-')

  if (dateTokens.length !== 3) {
    return null
  }

  const [firstToken, secondToken, thirdToken] = dateTokens
  const first = Number.parseInt(firstToken, 10)
  const second = Number.parseInt(secondToken, 10)
  const third = Number.parseInt(thirdToken, 10)

  if ([first, second, third].some((token) => Number.isNaN(token))) {
    return null
  }

  let day = first
  let month = second
  let year = third

  if (firstToken.length === 4) {
    year = first
    month = second
    day = third
  }

  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return null
  }

  return {
    day,
    month,
    year,
    time: timePart,
  }
}

function formatMobileClaimingLine(claimingPeriod: VoucherItem['claimingPeriod']) {
  const start = parseVoucherDate(claimingPeriod.start)
  const end = parseVoucherDate(claimingPeriod.end)

  if (!start || !end) {
    return `${claimingPeriod.start} - ${claimingPeriod.end}`
  }

  const startLabel = `${monthLabels[start.month - 1]} ${start.day}`
  const endLabel = `${monthLabels[end.month - 1]} ${end.day}`
  const isSameDay =
    start.day === end.day && start.month === end.month && start.year === end.year

  if (isSameDay && start.time && end.time) {
    return `${startLabel} | ${start.time}-${end.time}`
  }

  if (isSameDay && end.time) {
    return `${startLabel} | Ends ${end.time}`
  }

  if (end.time) {
    return `${startLabel}-${endLabel} | Ends ${end.time}`
  }

  return `${startLabel}-${endLabel}`
}

function getMobileActions(actions: VoucherAction[]) {
  const primaryEditIndex = actions.findIndex(
    (action) => action.label.toLowerCase() === 'edit',
  )
  const primaryIndex =
    primaryEditIndex >= 0 ? primaryEditIndex : actions.findIndex((action) => !action.danger)
  const dangerIndex = actions.findIndex((action) => action.danger)

  const primaryAction =
    primaryIndex >= 0
      ? actions[primaryIndex]
      : actions.length > 0
        ? actions[0]
        : { label: 'Edit' }

  const secondaryAction =
    dangerIndex >= 0
      ? actions[dangerIndex]
      : actions.length > 1
        ? actions[actions.length - 1]
        : { label: 'Delete', danger: true }

  return {
    primaryAction,
    secondaryAction,
  }
}

function MobileVoucherCard({
  voucher,
  delayMs,
  onEdit,
  onDelete,
  canManage = true,
}: {
  voucher: VoucherItem
  delayMs: number
  onEdit: (voucher: VoucherItem) => void
  onDelete?: (voucher: VoucherItem) => void
  canManage?: boolean
}) {
  const unusedCount = Math.max(voucher.quantity - voucher.usage, 0)
  const { primaryAction, secondaryAction } = getMobileActions(voucher.actions)
  const discountValue = toCompactCurrency(voucher.discountAmount)
  const minimumSpend = toCompactCurrency(`${(voucher.quantity * 10).toFixed(2)}`)
  const claimingLine = formatMobileClaimingLine(voucher.claimingPeriod)

  const [swipeOffset, setSwipeOffset] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [isSwiping, setIsSwiping] = useState(false)

  const swipeThreshold = 78
  const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator
  const swipeAction =
    swipeOffset <= -swipeThreshold
      ? primaryAction.label
      : swipeOffset >= swipeThreshold
        ? secondaryAction.label
        : null
  const secondaryActionClasses = secondaryAction.danger
    ? 'border-[#fca5a5] bg-white text-[#b91c1c] hover:bg-[#fef2f2]'
    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'

  const handleActionClick = (action: VoucherAction) => {
    const lowered = action.label.trim().toLowerCase()
    if (lowered === 'edit' && canManage) {
      onEdit(voucher)
      return
    }

    if (lowered === 'delete' && onDelete && canManage) {
      onDelete(voucher)
    }
  }

  const onTouchStart: TouchEventHandler<HTMLDivElement> = (event) => {
    setTouchStartX(event.touches[0]?.clientX ?? null)
    setIsSwiping(true)
  }

  const onTouchMove: TouchEventHandler<HTMLDivElement> = (event) => {
    if (touchStartX === null) {
      return
    }

    const nextOffset = event.touches[0].clientX - touchStartX
    setSwipeOffset(Math.max(-120, Math.min(120, nextOffset)))
  }

  const onTouchEnd = () => {
    if (Math.abs(swipeOffset) >= swipeThreshold && canVibrate) {
      navigator.vibrate(14)
    }

    setTouchStartX(null)
    setIsSwiping(false)
    setSwipeOffset(0)
  }

  return (
    <article
      className={`mobile-voucher-card motion-rise relative overflow-hidden rounded-xl border-l-[3px] bg-white px-3.5 py-3 shadow-[0_12px_26px_-22px_rgba(15,23,42,0.35)] ${statusBorderClasses[voucher.status]}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-slate-100 to-transparent" />

      <div
        className="relative transition-transform duration-200 ease-out"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            <p className="text-[20px] font-bold leading-none tracking-tight text-slate-900">
              <span>{discountValue}</span>
              <span className="ml-1 align-middle text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                OFF
              </span>
            </p>

            <p className="mt-1.5 truncate text-[14px] font-semibold leading-tight text-slate-900">
              {voucher.name}
            </p>

            <p className="mt-0.5 text-[12px] leading-snug text-slate-600">
              <span className={`mr-1 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${voucherTypeBadgeColors[voucher.voucherType]?.bg ?? ''} ${voucherTypeBadgeColors[voucher.voucherType]?.text ?? ''}`}>{voucher.type}</span>
              | Min spend {minimumSpend}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <span
              className={`inline-flex min-w-[70px] justify-center rounded-full px-2 py-1 text-[11px] font-semibold shadow ${statusPillClasses[voucher.status]}`}
            >
              {voucher.status}
            </span>
            <code className="inline-flex min-h-[26px] items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 font-mono text-[11px] font-semibold tracking-wide text-slate-700">
              {voucher.code}
            </code>
          </div>
        </div>

        <p className="mt-1.5 text-[12px] font-medium text-slate-600">{claimingLine}</p>

        <p className="mt-1.5 border-t border-slate-200 pt-1.5 text-[12px] text-slate-600">
          Claimed {voucher.claimed} | Used {voucher.usage} | Unused{' '}
          <span className="font-semibold text-slate-800">{unusedCount}</span>
        </p>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleActionClick(primaryAction)}
            disabled={!canManage}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-[#1d4ed8] bg-[#2563EB] px-3 text-[13px] font-semibold text-white transition hover:bg-[#1d4ed8] active:scale-[0.98]"
          >
            {primaryAction.label}
          </button>
          <button
            type="button"
            onClick={() => handleActionClick(secondaryAction)}
            disabled={!canManage}
            className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-[13px] font-semibold transition active:scale-[0.98] ${secondaryActionClasses}`}
          >
            {secondaryAction.label}
          </button>
        </div>
      </div>

      {isSwiping && swipeAction ? (
        <div className="absolute bottom-2 right-2 rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-semibold text-white shadow-lg">
          {swipeAction}
        </div>
      ) : null}
    </article>
  )
}

function VoucherRow({
  voucher,
  onEdit,
  onDelete,
  canManage = true,
}: {
  voucher: VoucherItem
  onEdit: (voucher: VoucherItem) => void
  onDelete?: (voucher: VoucherItem) => void
  canManage?: boolean
}) {
  const isProductVoucher = voucher.voucherType === 'product'
  const productList =
    isProductVoucher && voucher.productNames.length > 0
      ? voucher.productNames
      : []
  const productSummary = isProductVoucher
    ? productList.length > 0
      ? `Selected products (${voucher.productCount})`
      : 'Selected products'
    : 'All products'
  const productDetail =
    isProductVoucher && productList.length > 0
      ? productList.length <= 2
        ? productList.join(', ')
        : `${productList.slice(0, 2).join(', ')} +${productList.length - 2} more`
      : null

  return (
    <tr className="align-top border-t border-slate-100 text-sm text-slate-700">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 flex-none items-center justify-center rounded-sm text-xl font-semibold text-white ${iconClasses[voucher.icon]}`}
          >
            {voucher.icon === 'percent' ? '%' : 'P'}
          </div>
          <div className="min-w-[170px]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {voucher.status}
            </p>
            <p className="font-semibold text-slate-900">{voucher.name}</p>
            <p className="text-xs text-slate-500">Code: {voucher.code}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${voucherTypeBadgeColors[voucher.voucherType]?.bg ?? ''} ${voucherTypeBadgeColors[voucher.voucherType]?.text ?? ''}`}>{voucher.type}</span>
      </td>
      <td className="px-4 py-4 text-slate-600">
        <p className="font-medium text-slate-700">{productSummary}</p>
        {productDetail ? (
          <p className="mt-1 text-xs text-slate-500">{productDetail}</p>
        ) : null}
      </td>
      <td className="px-4 py-4 text-slate-600">{voucher.voucherType === 'private' ? 'Targeted' : 'All Buyers'}</td>
      <td className="px-4 py-4 font-medium text-slate-900">{voucher.discountAmount}</td>
      <td className="px-4 py-4">{voucher.quantity}</td>
      <td className="px-4 py-4">{voucher.usage}</td>
      <td className="px-4 py-4">
        <p className="text-xs text-slate-500">{voucher.claimingPeriod.start}</p>
        <p className="text-xs text-slate-500">{voucher.claimingPeriod.end}</p>
      </td>
      <td className="px-4 py-4">
        <ul className="min-w-[120px] space-y-1.5">
          {voucher.actions.map((action) => (
            <li key={`${voucher.code}-${action.label}`}>
              <button
                type="button"
                onClick={() => {
                  const lowered = action.label.trim().toLowerCase()
                  if (lowered === 'edit' && canManage) {
                    onEdit(voucher)
                  }
                  if (lowered === 'delete' && onDelete && canManage) {
                    onDelete(voucher)
                  }
                }}
                disabled={!canManage}
                className={`text-sm font-medium transition hover:underline ${action.danger ? 'text-[#dc4f1f]' : 'text-[#2f70db]'
                  }`}
              >
                {action.label}
              </button>
            </li>
          ))}
        </ul>
      </td>
    </tr>
  )
}

function DesktopCreateVoucherTypeCard({
  card,
  onCreate,
  canManage = true,
}: {
  card: VoucherCreateTypeCard
  onCreate: (voucherType: VoucherType) => void
  canManage?: boolean
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <h4 className="text-sm font-semibold text-slate-800">{card.title}</h4>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{card.description}</p>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => onCreate(card.voucherType)}
          disabled={!canManage}
          className="inline-flex h-8 items-center rounded-md border border-[#2563EB] px-4 text-xs font-semibold text-[#2563EB] transition hover:bg-[#eff6ff] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Create
        </button>
      </div>
    </article>
  )
}

function DesktopPerformanceMetricCard({
  label,
  value,
  delta,
}: {
  label: string
  value: string
  delta: string
}) {
  return (
    <div className="min-h-[92px] border-r border-slate-200 px-4 last:border-r-0">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-[28px] font-semibold leading-none text-slate-800">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{delta}</p>
    </div>
  )
}

function VouchersPage({
  onBack,
  onCreate,
  onEdit,
  onDelete,
  vouchers,
  isLoading = false,
  error = null,
  isAuthRequired = false,
  hasNoShop = false,
  onRetry,
  canManage = true,
}: VouchersPageProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>('Upcoming')
  const [quickFilter, setQuickFilter] =
    useState<(typeof quickFilters)[number]>('All Products')
  const [desktopTab, setDesktopTab] = useState<(typeof voucherTabs)[number]>('All')
  const [desktopSearch, setDesktopSearch] = useState('')
  const [showMobileTypePicker, setShowMobileTypePicker] = useState(false)
  const sourceVouchers = useMemo(() => vouchers ?? [], [vouchers])

  const mobileVouchers =
    mobileTab === 'All'
      ? sourceVouchers
      : sourceVouchers.filter((voucher) => voucher.status === mobileTab)

  const activeTabIndex = mobileCarouselTabs.findIndex((tab) => tab === mobileTab)
  const tabWidthPercent = 100 / mobileCarouselTabs.length

  const cardEntries = useMemo(() => {
    if (quickFilter === 'All Products') {
      return mobileVouchers
    }

    return mobileVouchers.filter((voucher) => voucher.voucherType === 'product')
  }, [mobileVouchers, quickFilter])

  const desktopVouchers = useMemo(() => {
    const byTab =
      desktopTab === 'All'
        ? sourceVouchers
        : sourceVouchers.filter((voucher) => voucher.status === desktopTab)

    const query = desktopSearch.trim().toLowerCase()
    if (!query) {
      return byTab
    }

    return byTab.filter(
      (voucher) =>
        voucher.name.toLowerCase().includes(query) ||
        voucher.code.toLowerCase().includes(query),
    )
  }, [desktopSearch, desktopTab, sourceVouchers])

  const performanceSummary = useMemo(() => {
    const totalSales = sourceVouchers.reduce((sum, voucher) => {
      const amount = Number.parseFloat(voucher.discountAmount.replace(/[^0-9.]/g, ''))
      return sum + (Number.isFinite(amount) ? amount : 0)
    }, 0)
    const totalOrders = sourceVouchers.reduce((sum, voucher) => sum + voucher.usage, 0)
    const totalUsageBase = sourceVouchers.reduce((sum, voucher) => sum + voucher.quantity, 0)
    const usageRate = totalUsageBase > 0 ? (totalOrders / totalUsageBase) * 100 : 0

    return {
      sales: `PHP ${totalSales.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      orders: `${totalOrders}`,
      usageRate: `${usageRate.toFixed(2)}%`,
      buyers: `${Math.max(totalOrders, 1)}`,
    }
  }, [sourceVouchers])

  const hasDataState = isLoading || Boolean(error) || isAuthRequired || hasNoShop

  return (
    <section
      className="motion-rise rounded-3xl border border-slate-200/80 bg-white/95 p-3 pb-28 shadow-[0_24px_50px_-45px_rgba(15,23,42,0.65)] sm:p-8"
      style={{ animationDelay: '80ms' }}
    >
      <div className="sm:hidden">
        <div className="rounded-2xl bg-gradient-to-r from-[#f8fafc] via-[#f1f5f9] to-white p-3 shadow-[0_14px_30px_-26px_rgba(15,23,42,0.35)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-base font-semibold text-slate-700 shadow-sm transition active:scale-95"
              aria-label="Back to Marketing Centre"
            >
              &larr;
            </button>
            <h1 className="text-[24px] font-bold leading-none text-slate-900">
              Vouchers
            </h1>
          </div>
          <p className="mt-1.5 text-[12px] text-slate-600">
            Pull to refresh, tap cards, or swipe for quick actions.
          </p>
        </div>
        {hasDataState ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
            {isLoading ? (
              <p>Loading vouchers...</p>
            ) : error ? (
              <div className="space-y-2">
                <p>{error}</p>
                {onRetry ? (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex h-8 items-center rounded-md border border-[#2563EB] px-3 text-xs font-semibold text-[#2563EB]"
                  >
                    Retry
                  </button>
                ) : null}
              </div>
            ) : isAuthRequired ? (
              <p>Sign in to view and manage vouchers.</p>
            ) : hasNoShop ? (
              <p>No shop found for this account.</p>
            ) : null}
          </div>
        ) : null}

        <div className="relative mt-3 rounded-full bg-slate-200 p-1 shadow-inner">
          <div
            className="absolute bottom-1 top-1 rounded-full bg-[#2563EB] shadow-[0_8px_18px_-12px_rgba(30,64,175,0.9)] transition-all duration-300 ease-out"
            style={{
              left: `calc(${activeTabIndex * tabWidthPercent}% + 0.25rem)`,
              width: `calc(${tabWidthPercent}% - 0.5rem)`,
            }}
          />
          <div className="relative grid grid-cols-4">
            {mobileCarouselTabs.map((tab) => {
              const isActive = tab === mobileTab

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setMobileTab(tab)}
                  className={`z-10 inline-flex h-11 items-center justify-center rounded-full px-2 text-[13px] font-semibold transition-colors ${isActive ? 'text-white' : 'text-slate-600'
                    }`}
                >
                  {tab}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          {quickFilters.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setQuickFilter(chip)}
              className={`inline-flex h-9 items-center whitespace-nowrap rounded-full px-4 text-[12px] font-semibold transition ${quickFilter === chip
                  ? 'bg-[#2563EB] text-white shadow-[0_10px_18px_-12px_rgba(30,64,175,0.95)]'
                  : 'border border-slate-200 bg-white text-slate-700'
                }`}
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="mt-2 space-y-2 pb-20">
          {cardEntries.length > 0 ? (
            cardEntries.map((voucher, index) => (
              <MobileVoucherCard
                key={`mobile-${voucher.code}`}
                voucher={voucher}
                delayMs={90 + index * 70}
                onEdit={onEdit}
                onDelete={onDelete}
                canManage={canManage}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-8 text-center text-sm text-slate-600">
              No vouchers in this tab.
            </div>
          )}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto w-full max-w-6xl px-4 py-3">
            <button
              type="button"
              onClick={() => setShowMobileTypePicker(true)}
              disabled={!canManage}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#2563EB] px-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
              aria-label="Create new voucher"
            >
              Create Voucher
            </button>
          </div>
        </div>

        {/* Mobile Voucher Type Picker */}
        {showMobileTypePicker ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowMobileTypePicker(false)}
            />
            <div className="relative w-full max-w-lg rounded-t-2xl border-t border-slate-200 bg-white p-4 pb-8 shadow-xl">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300" />
              <h3 className="text-lg font-semibold text-slate-900">Choose Voucher Type</h3>
              <div className="mt-3 space-y-2">
                {voucherCreateGroups.flatMap((group) =>
                  group.cards.map((card) => (
                    <button
                      key={card.voucherType}
                      type="button"
                      onClick={() => {
                        setShowMobileTypePicker(false)
                        onCreate(card.voucherType)
                      }}
                      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:bg-slate-50 active:scale-[0.99]"
                    >
                      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold ${voucherTypeBadgeColors[card.voucherType].bg} ${voucherTypeBadgeColors[card.voucherType].text}`}>
                        {card.title.charAt(0)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">{card.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{card.description}</p>
                      </div>
                    </button>
                  )),
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowMobileTypePicker(false)}
                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-200 text-sm font-medium text-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="hidden sm:block">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center rounded-full bg-[#eff6ff] px-3 py-1.5 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe]"
        >
          &larr; Back to Marketing Centre
        </button>

        {hasDataState ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            {isLoading ? (
              <p>Loading vouchers...</p>
            ) : error ? (
              <div className="flex items-center justify-between gap-3">
                <p>{error}</p>
                {onRetry ? (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex h-8 items-center rounded-md border border-[#2563EB] px-3 text-xs font-semibold text-[#2563EB]"
                  >
                    Retry
                  </button>
                ) : null}
              </div>
            ) : isAuthRequired ? (
              <p>Sign in to view and manage vouchers.</p>
            ) : hasNoShop ? (
              <p>No shop found for this account.</p>
            ) : null}
          </div>
        ) : null}

        <article className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
          <h1 className="text-[28px] font-semibold text-slate-800">Create Voucher</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Create your own vouchers for your shop and products on Unleash.
            <button type="button" className="ml-1 font-semibold text-[#2563EB] hover:underline">
              Learn More
            </button>
          </p>

          <div className="mt-4 space-y-5">
            {voucherCreateGroups.map((group) => (
              <div key={group.title}>
                <h2 className="text-[17px] font-medium text-slate-700">{group.title}</h2>
                <div
                  className={`mt-2.5 grid gap-3 ${group.cards.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3'
                    }`}
                >
                  {group.cards.map((card) => (
                    <DesktopCreateVoucherTypeCard
                      key={`${group.title}-${card.title}`}
                      card={card}
                      onCreate={onCreate}
                      canManage={canManage}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-4 inline-flex w-full items-center justify-center border-t border-dashed border-slate-200 pt-3 text-sm font-medium text-[#2563EB]"
          >
            More Voucher Types for Specific Buyers
          </button>
        </article>

        <article className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[28px] font-semibold leading-none text-slate-800">
              Voucher Performance
              <span className="ml-2 text-xs font-normal text-slate-400">
                Data from 02-11-2026 (Wed) to 18-02-2026 (Wed) GMT+8
              </span>
            </h2>
            <button type="button" className="text-sm font-medium text-[#2563EB]">
              More &gt;
            </button>
          </div>

          <div className="mt-4 grid grid-cols-4 rounded-lg border border-slate-200 bg-[#fcfdff] py-3">
            <DesktopPerformanceMetricCard
              label="Sales"
              value={performanceSummary.sales}
              delta="vs Previous 7 Days"
            />
            <DesktopPerformanceMetricCard
              label="Orders"
              value={performanceSummary.orders}
              delta="vs Previous 7 Days"
            />
            <DesktopPerformanceMetricCard
              label="Usage Rate"
              value={performanceSummary.usageRate}
              delta="vs Previous 7 Days"
            />
            <DesktopPerformanceMetricCard
              label="Buyers"
              value={performanceSummary.buyers}
              delta="vs Previous 7 Days"
            />
          </div>
        </article>

        <article className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-[28px] font-semibold leading-none text-slate-800">Vouchers List</h2>

          <div className="mt-4 flex items-center gap-5 border-b border-slate-200 pb-2">
            {voucherTabs.map((tab) => {
              const active = tab === desktopTab

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setDesktopTab(tab)}
                  className={`relative pb-2 text-sm font-medium transition ${active ? 'text-[#2563EB]' : 'text-slate-500 hover:text-[#2563EB]'
                    }`}
                >
                  {tab}
                  {active ? (
                    <span className="absolute -bottom-[9px] left-0 right-0 h-0.5 bg-[#2563EB]" />
                  ) : null}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <span className="text-sm text-slate-500">Search</span>
            <select
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-[#93c5fd] focus:outline-none"
              defaultValue="Voucher Name"
            >
              <option>Voucher Name</option>
            </select>
            <input
              type="text"
              value={desktopSearch}
              onChange={(event) => setDesktopSearch(event.target.value)}
              placeholder="Input"
              className="h-9 min-w-[220px] rounded-md border border-slate-200 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#93c5fd] focus:outline-none"
            />
            <button
              type="button"
              className="inline-flex h-9 items-center rounded-md border border-[#2563EB] px-4 text-sm font-medium text-[#2563EB] transition hover:bg-[#eff6ff]"
            >
              Search
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[1120px] w-full border-separate border-spacing-0 rounded-lg border border-slate-200 bg-white">
              <thead>
                <tr className="bg-[#f8fbff] text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-semibold">Voucher Name | Code</th>
                  <th className="px-4 py-3 font-semibold">Voucher Type</th>
                  <th className="px-4 py-3 font-semibold">Product Scope</th>
                  <th className="px-4 py-3 font-semibold">Target Buyer</th>
                  <th className="px-4 py-3 font-semibold">Discount Amount</th>
                  <th className="px-4 py-3 font-semibold">Usage Quantity</th>
                  <th className="px-4 py-3 font-semibold">Usage</th>
                  <th className="px-4 py-3 font-semibold">Claiming Period</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {desktopVouchers.length > 0 ? (
                  desktopVouchers.map((voucher) => (
                    <VoucherRow
                      key={voucher.id}
                      voucher={voucher}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      canManage={canManage}
                    />
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={9}>
                      No vouchers found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  )
}

export default VouchersPage


