import { useEffect, useMemo, useState } from 'react'
import type { TouchEventHandler } from 'react'
import { createPortal } from 'react-dom'
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
type MobileVoucherViewMode = 'cards' | 'list'

const mobileStatusBadgeClasses: Record<VoucherStatus, string> = {
  Ongoing: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  Upcoming: 'border border-amber-200 bg-amber-50 text-amber-700',
  Expired: 'border border-slate-200 bg-slate-100 text-slate-600',
}

const statusBorderClasses: Record<VoucherStatus, string> = {
  Ongoing: 'border-l-[#10B981]',
  Upcoming: 'border-l-[#F59E0B]',
  Expired: 'border-l-slate-300',
}

const mobileVoucherStateStyles: Record<
  VoucherStatus,
  {
    cardSurface: string
    listSurface: string
    title: string
    amount: string
    meta: string
    detail: string
    time: string
    code: string
    divider: string
    icon: string
    primaryAction: string
    secondaryAction: string
    dangerAction: string
  }
> = {
  Ongoing: {
    cardSurface:
      'border-emerald-100 bg-white shadow-[0_18px_26px_-24px_rgba(16,185,129,0.22)]',
    listSurface: 'bg-white',
    title: 'text-slate-900',
    amount: 'text-slate-950',
    meta: 'text-slate-600',
    detail: 'text-slate-500',
    time: 'text-slate-700',
    code: 'text-slate-400',
    divider: 'border-slate-100',
    icon: '',
    primaryAction: 'bg-[#345DB8] text-white shadow-[0_10px_18px_-14px_rgba(52,93,184,0.55)]',
    secondaryAction: 'text-slate-600',
    dangerAction: 'text-[#c2410c]',
  },
  Upcoming: {
    cardSurface:
      'border-amber-100 bg-[#fffdfa] shadow-[0_18px_26px_-24px_rgba(245,158,11,0.16)]',
    listSurface: 'bg-[#fffdfa]',
    title: 'text-slate-800',
    amount: 'text-slate-900',
    meta: 'text-slate-600',
    detail: 'text-slate-500',
    time: 'text-[#9a6700]',
    code: 'text-slate-400',
    divider: 'border-amber-100/70',
    icon: 'opacity-95',
    primaryAction: 'border border-[#C9D7F8] bg-[#F3F7FF] text-[#335CBA]',
    secondaryAction: 'text-slate-600',
    dangerAction: 'text-[#c2410c]',
  },
  Expired: {
    cardSurface:
      'border-slate-200 bg-[#eef2f6] shadow-[0_12px_20px_-26px_rgba(15,23,42,0.12)]',
    listSurface: 'bg-[#eef2f6]',
    title: 'text-slate-600',
    amount: 'text-slate-600',
    meta: 'text-slate-500',
    detail: 'text-slate-400',
    time: 'text-slate-500',
    code: 'text-slate-300',
    divider: 'border-slate-200',
    icon: 'opacity-50 saturate-[0.55]',
    primaryAction: 'border border-slate-200 bg-[#f8fafc] text-slate-500',
    secondaryAction: 'text-slate-500',
    dangerAction: 'text-[#cb6f5f]',
  },
}

const desktopVoucherStateStyles: Record<
  VoucherStatus,
  {
    row: string
    title: string
    amount: string
    meta: string
    code: string
    icon: string
    typeBadge: string
  }
> = {
  Ongoing: {
    row: 'bg-white',
    title: 'text-slate-900',
    amount: 'text-slate-900',
    meta: 'text-slate-600',
    code: 'text-slate-500',
    icon: '',
    typeBadge: '',
  },
  Upcoming: {
    row: 'bg-[#fffdfa]',
    title: 'text-slate-900',
    amount: 'text-slate-900',
    meta: 'text-slate-600',
    code: 'text-slate-500',
    icon: '',
    typeBadge: '',
  },
  Expired: {
    row: 'bg-[#f3f5f8]',
    title: 'text-slate-700',
    amount: 'text-slate-700',
    meta: 'text-slate-500',
    code: 'text-slate-400',
    icon: 'opacity-50 saturate-[0.55]',
    typeBadge: 'opacity-80',
  },
}

const voucherIconContainerClasses: Record<
  VoucherType,
  { money: string; percent: string }
> = {
  shop: {
    money: 'bg-gradient-to-br from-[#99d5ff] to-[#67b8f6] text-white',
    percent: 'bg-gradient-to-br from-[#ffb061] to-[#ff7f32] text-white',
  },
  product: {
    money: 'bg-gradient-to-br from-[#98e7b3] to-[#43c17a] text-white',
    percent: 'bg-gradient-to-br from-[#7dd3fc] to-[#0ea5e9] text-white',
  },
  private: {
    money: 'bg-gradient-to-br from-[#d8c4ff] to-[#9b7cf7] text-white',
    percent: 'bg-gradient-to-br from-[#d8c4ff] to-[#9b7cf7] text-white',
  },
  live: {
    money: 'bg-gradient-to-br from-[#f9d48a] to-[#f59e0b] text-white',
    percent: 'bg-gradient-to-br from-[#fbbf24] to-[#f97316] text-white',
  },
  video: {
    money: 'bg-gradient-to-br from-[#f9a8d4] to-[#ec4899] text-white',
    percent: 'bg-gradient-to-br from-[#fb7185] to-[#e11d48] text-white',
  },
}

function VoucherVisualIcon({
  voucherType,
  icon,
  size = 'sm',
  className = '',
}: {
  voucherType: VoucherType
  icon: VoucherIcon
  size?: 'sm' | 'lg'
  className?: string
}) {
  const classes = voucherIconContainerClasses[voucherType]?.[icon] ?? voucherIconContainerClasses.shop[icon]
  const sizeClasses =
    size === 'lg'
      ? 'h-12 w-12 rounded-sm'
      : 'h-8 w-8 rounded-md'
  const iconSize = size === 'lg' ? 19 : 14

  return (
    <div
      className={`flex flex-none items-center justify-center ${sizeClasses} ${classes} ${className}`}
      aria-hidden="true"
    >
      {voucherType === 'private' ? (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 10V7.75C8 5.68 9.68 4 11.75 4C13.82 4 15.5 5.68 15.5 7.75V10"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <rect
            x="6.5"
            y="10"
            width="10.5"
            height="9.5"
            rx="2.4"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M11.75 13.3V16.2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ) : voucherType === 'product' ? (
        icon === 'percent' ? (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 8.2L12 4L19 8.2V15.8L12 20L5 15.8V8.2Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M9 15L15 9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <circle cx="9" cy="9" r="1.2" fill="currentColor" />
            <circle cx="15" cy="15" r="1.2" fill="currentColor" />
          </svg>
        ) : (
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 8.2L12 4L19 8.2V15.8L12 20L5 15.8V8.2Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M12 8V16"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M8.7 12H15.3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        )
      ) : icon === 'percent' ? (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.8 10.2L12 6L19.2 10.2V17.2H4.8V10.2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M7.2 10.1L12 6.8L16.8 10.1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.2 15L14.8 11"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="9.1" cy="11.5" r="1" fill="currentColor" />
          <circle cx="14.9" cy="14.5" r="1" fill="currentColor" />
        </svg>
      ) : (
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.8 10.2L12 6L19.2 10.2V17.2H4.8V10.2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M7.2 10.1L12 6.8L16.8 10.1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 11V15.4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M9.8 13.2H14.2"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  )
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
  shop: { bg: 'bg-[#F2F4FF]', text: 'text-[#3A56C5]' },
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

function formatMobileDiscountValue(voucher: VoucherItem) {
  if (voucher.icon === 'percent') {
    return voucher.discountAmount
  }

  return toCompactCurrency(voucher.discountAmount)
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

  const hasDistinctSecondary =
    actions.length > 1 &&
    (secondaryAction.label !== primaryAction.label ||
      Boolean(secondaryAction.danger) !== Boolean(primaryAction.danger))

  return {
    primaryAction,
    secondaryAction: hasDistinctSecondary ? secondaryAction : null,
  }
}

function MobileVoucherViewToggle({
  value,
  onChange,
}: {
  value: MobileVoucherViewMode
  onChange: (value: MobileVoucherViewMode) => void
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-[0_8px_18px_-18px_rgba(15,23,42,0.45)]">
      {(['cards', 'list'] as const).map((option) => {
        const active = option === value

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold capitalize transition ${
              active
                ? 'bg-[#EAF1FF] text-[#335CBA] shadow-[inset_0_0_0_1px_rgba(96,126,196,0.18)]'
                : 'text-slate-500'
            }`}
          >
            {option === 'cards' ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect x="1.25" y="1.25" width="3.5" height="3.5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
                <rect x="7.25" y="1.25" width="3.5" height="3.5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
                <rect x="1.25" y="7.25" width="3.5" height="3.5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
                <rect x="7.25" y="7.25" width="3.5" height="3.5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            ) : (
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M2 3H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M2 6H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <path d="M2 9H10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            )}
            {option}
          </button>
        )
      })}
    </div>
  )
}

function MobileVoucherCardCompact({
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
  const discountValue = formatMobileDiscountValue(voucher)
  const minimumSpend = voucher.minimumSpend
  const claimingLine = formatMobileClaimingLine(voucher.claimingPeriod)
  const statsLine = `Claimed ${voucher.claimed} | Used ${voucher.usage} | ${unusedCount} left`
  const hasDangerOnlyAction = Boolean(primaryAction.danger) && !secondaryAction
  const stateStyles = mobileVoucherStateStyles[voucher.status]

  const [swipeOffset, setSwipeOffset] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [isSwiping, setIsSwiping] = useState(false)

  const swipeThreshold = 78
  const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator
  const swipeAction =
    swipeOffset <= -swipeThreshold
      ? primaryAction.label
      : swipeOffset >= swipeThreshold && secondaryAction
        ? secondaryAction.label
        : null

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
      className={`mobile-voucher-card motion-rise relative overflow-hidden rounded-lg border px-3 py-2.5 border-l-2 ${statusBorderClasses[voucher.status]} ${stateStyles.cardSurface}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div
        className="relative transition-transform duration-200 ease-out"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <VoucherVisualIcon
                voucherType={voucher.voucherType}
                icon={voucher.icon}
                className={stateStyles.icon}
              />
              <p className={`truncate text-[14px] font-semibold leading-tight ${stateStyles.title}`}>
                {voucher.name}
              </p>
            </div>

            <div className="mt-1.5 flex items-baseline gap-1.5">
              <p className={`text-[18px] font-bold leading-none tracking-tight ${stateStyles.amount}`}>
                {discountValue}
              </p>
              <span className={`text-[9px] font-semibold uppercase tracking-[0.14em] ${stateStyles.code}`}>
                off
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span
              className={`inline-flex min-w-[64px] justify-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${mobileStatusBadgeClasses[voucher.status]}`}
            >
              {voucher.status}
            </span>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${voucherTypeBadgeColors[voucher.voucherType]?.bg ?? ''} ${voucherTypeBadgeColors[voucher.voucherType]?.text ?? ''} ${voucher.status === 'Expired' ? 'opacity-75' : ''}`}
          >
            {voucher.type}
          </span>
          <span className={`text-[11px] ${stateStyles.meta}`}>Min spend {minimumSpend}</span>
        </div>

        <p className={`mt-1.5 text-[11px] ${stateStyles.time}`}>{claimingLine}</p>

        <div className={`mt-1.5 flex items-center justify-between gap-3 text-[10.5px] ${stateStyles.detail}`}>
          <p className="min-w-0 truncate">{statsLine}</p>
          <code className={`shrink-0 font-mono text-[10px] tracking-wide ${stateStyles.code}`}>
            {voucher.code}
          </code>
        </div>

        <div className={`mt-2 flex items-center justify-between gap-3 border-t pt-2 ${stateStyles.divider}`}>
          {hasDangerOnlyAction ? <span /> : (
            <button
              type="button"
              onClick={() => handleActionClick(primaryAction)}
              disabled={!canManage}
              className={`inline-flex h-8 items-center justify-center rounded-md px-3 text-[12px] font-semibold transition active:scale-[0.98] disabled:opacity-45 ${stateStyles.primaryAction}`}
            >
              {primaryAction.label}
            </button>
          )}
          {secondaryAction || hasDangerOnlyAction ? (
            <button
              type="button"
              onClick={() => handleActionClick(hasDangerOnlyAction ? primaryAction : secondaryAction!)}
              disabled={!canManage}
              className={`inline-flex h-8 items-center justify-center px-1 text-[12px] font-medium transition active:scale-[0.98] disabled:opacity-45 ${
                (hasDangerOnlyAction ? primaryAction : secondaryAction!).danger ? stateStyles.dangerAction : stateStyles.secondaryAction
              }`}
            >
              {(hasDangerOnlyAction ? primaryAction : secondaryAction!).label}
            </button>
          ) : null}
        </div>
      </div>

      {isSwiping && swipeAction ? (
        <div className="absolute bottom-2 right-2 rounded-md bg-slate-800 px-2 py-1 text-[10px] font-semibold text-white shadow-lg">
          {swipeAction}
        </div>
      ) : null}
    </article>
  )
}

function MobileVoucherListItem({
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
  const discountValue = formatMobileDiscountValue(voucher)
  const minimumSpend = voucher.minimumSpend
  const claimingLine = formatMobileClaimingLine(voucher.claimingPeriod)
  const hasDangerOnlyAction = Boolean(primaryAction.danger) && !secondaryAction
  const stateStyles = mobileVoucherStateStyles[voucher.status]

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

  return (
    <article
      className={`motion-rise border-b py-3 pl-3 last:border-b-0 border-l-2 ${statusBorderClasses[voucher.status]} ${stateStyles.listSurface} ${stateStyles.divider}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <p className={`text-[15px] font-bold leading-none ${stateStyles.amount}`}>{discountValue}</p>
            <span className={`text-[9px] font-semibold uppercase tracking-[0.12em] ${stateStyles.code}`}>
              off
            </span>
          </div>
          <p className={`mt-1 truncate text-[13px] font-semibold leading-tight ${stateStyles.title}`}>
            {voucher.name}
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${mobileStatusBadgeClasses[voucher.status]}`}
        >
          {voucher.status}
        </span>
      </div>

      <p className={`mt-1.5 text-[11px] leading-snug ${stateStyles.time}`}>
        {voucher.type} | Min spend {minimumSpend} | {claimingLine}
      </p>

      <div className="mt-1.5 flex items-start justify-between gap-3">
        <p className={`min-w-0 text-[10.5px] leading-snug ${stateStyles.detail}`}>
          <span className={`font-mono tracking-wide ${stateStyles.code}`}>{voucher.code}</span>
          <span> | Claimed {voucher.claimed} | Used {voucher.usage} | {unusedCount} left</span>
        </p>

        <div className="flex shrink-0 items-center gap-3">
          {!hasDangerOnlyAction ? (
            <button
              type="button"
              onClick={() => handleActionClick(primaryAction)}
              disabled={!canManage}
              className={`inline-flex h-7 items-center justify-center rounded-md px-2.5 text-[11px] font-semibold transition active:scale-[0.98] disabled:opacity-45 ${stateStyles.primaryAction}`}
            >
              {primaryAction.label}
            </button>
          ) : null}
          {secondaryAction || hasDangerOnlyAction ? (
            <button
              type="button"
              onClick={() => handleActionClick(hasDangerOnlyAction ? primaryAction : secondaryAction!)}
              disabled={!canManage}
              className={`inline-flex h-7 items-center justify-center text-[11px] font-medium transition active:scale-[0.98] disabled:opacity-45 ${
                (hasDangerOnlyAction ? primaryAction : secondaryAction!).danger ? stateStyles.dangerAction : stateStyles.secondaryAction
              }`}
            >
              {(hasDangerOnlyAction ? primaryAction : secondaryAction!).label}
            </button>
          ) : null}
        </div>
      </div>
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
  const stateStyles = desktopVoucherStateStyles[voucher.status]

  return (
    <tr className={`align-top border-t border-slate-100 text-sm text-slate-700 ${stateStyles.row}`}>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <VoucherVisualIcon
            voucherType={voucher.voucherType}
            icon={voucher.icon}
            size="lg"
            className={stateStyles.icon}
          />
          <div className="min-w-[170px]">
            <p className={`text-[11px] font-semibold uppercase tracking-wide ${stateStyles.code}`}>
              {voucher.status}
            </p>
            <p className={`font-semibold ${stateStyles.title}`}>{voucher.name}</p>
            <p className={`text-xs ${stateStyles.code}`}>Code: {voucher.code}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${voucherTypeBadgeColors[voucher.voucherType]?.bg ?? ''} ${voucherTypeBadgeColors[voucher.voucherType]?.text ?? ''} ${stateStyles.typeBadge}`}>{voucher.type}</span>
      </td>
      <td className={`px-4 py-4 ${stateStyles.meta}`}>
        <p className={`font-medium ${stateStyles.meta}`}>{productSummary}</p>
        {productDetail ? (
          <p className={`mt-1 text-xs ${stateStyles.code}`}>{productDetail}</p>
        ) : null}
      </td>
      <td className={`px-4 py-4 ${stateStyles.meta}`}>{voucher.voucherType === 'private' ? 'Targeted' : 'All Buyers'}</td>
      <td className={`px-4 py-4 font-medium ${stateStyles.amount}`}>{voucher.discountAmount}</td>
      <td className={`px-4 py-4 ${stateStyles.meta}`}>{voucher.quantity}</td>
      <td className={`px-4 py-4 ${stateStyles.meta}`}>{voucher.usage}</td>
      <td className="px-4 py-4">
        <p className={`text-xs ${stateStyles.code}`}>{voucher.claimingPeriod.start}</p>
        <p className={`text-xs ${stateStyles.code}`}>{voucher.claimingPeriod.end}</p>
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
          className="inline-flex h-8 items-center rounded-md border border-[#3A56C5] px-4 text-xs font-semibold text-[#3A56C5] transition hover:bg-[#F2F4FF] disabled:cursor-not-allowed disabled:opacity-45"
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
  const [mobileViewMode, setMobileViewMode] = useState<MobileVoucherViewMode>('cards')
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

  useEffect(() => {
    if (!showMobileTypePicker) {
      return
    }

    const originalOverflow = document.body.style.overflow
    const originalTouchAction = document.body.style.touchAction

    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.touchAction = originalTouchAction
    }
  }, [showMobileTypePicker])

  const mobileTypePickerModal =
    showMobileTypePicker && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <button
              type="button"
              aria-label="Close voucher type picker"
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
          </div>,
          document.body,
        )
      : null

  return (
    <section
      className="motion-rise pb-28 sm:rounded-3xl sm:border sm:border-slate-200/80 sm:bg-white/95 sm:p-8 sm:shadow-[0_24px_50px_-45px_rgba(15,23,42,0.65)]"
      style={{ animationDelay: '80ms' }}
    >
      <div className="sm:hidden">
        <div className="px-3 pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-[0_10px_18px_-18px_rgba(15,23,42,0.4)] transition active:scale-95"
              aria-label="Back to Marketing Centre"
            >
              &larr;
            </button>
            <div>
              <h1 className="text-[22px] font-bold leading-none text-slate-900">Vouchers</h1>
              <p className="mt-1 text-[11px] text-slate-500">
                Manage shop and product offers faster on mobile.
              </p>
            </div>
          </div>
        </div>
        {hasDataState ? (
          <div className="mx-3 mt-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
            {isLoading ? (
              <p>Loading vouchers...</p>
            ) : error ? (
              <div className="space-y-2">
                <p>{error}</p>
                {onRetry ? (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex h-8 items-center rounded-md border border-[#3A56C5] px-3 text-xs font-semibold text-[#3A56C5]"
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

        <div className="mx-3 mt-3 rounded-xl border border-slate-200 bg-white p-1 shadow-[0_14px_24px_-24px_rgba(15,23,42,0.45)]">
          <div className="relative rounded-lg bg-slate-100 p-0.5">
            <div
              className="absolute bottom-0.5 top-0.5 rounded-md bg-white shadow-[0_10px_18px_-18px_rgba(15,23,42,0.55)] transition-all duration-300 ease-out"
              style={{
                left: `calc(${activeTabIndex * tabWidthPercent}% + 0.125rem)`,
                width: `calc(${tabWidthPercent}% - 0.25rem)`,
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
                    className={`z-10 inline-flex h-8 items-center justify-center rounded-md px-1 text-[11px] font-semibold transition-colors ${
                      isActive ? 'text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    {tab}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Filter voucher products</span>
              <select
                value={quickFilter}
                onChange={(event) =>
                  setQuickFilter(event.target.value as (typeof quickFilters)[number])
                }
                className="h-[30px] w-full appearance-none rounded-lg border border-slate-200 bg-[#F8FBFF] pl-2.5 pr-8 text-[11px] font-semibold text-[#49617F] outline-none transition focus:border-[#B7CAF2] focus:bg-white"
              >
                {quickFilters.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M3 4.5L6 7.5L9 4.5"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </label>

            <MobileVoucherViewToggle value={mobileViewMode} onChange={setMobileViewMode} />
          </div>
        </div>

        <div className="mx-3 mt-3 pb-20">
          {cardEntries.length > 0 ? (
            mobileViewMode === 'cards' ? (
              <div className="space-y-2">
                {cardEntries.map((voucher, index) => (
                  <MobileVoucherCardCompact
                    key={`mobile-card-${voucher.code}`}
                    voucher={voucher}
                    delayMs={80 + index * 50}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    canManage={canManage}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white px-3 shadow-[0_16px_24px_-24px_rgba(15,23,42,0.38)]">
                {cardEntries.map((voucher, index) => (
                  <MobileVoucherListItem
                    key={`mobile-list-${voucher.code}`}
                    voucher={voucher}
                    delayMs={80 + index * 40}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    canManage={canManage}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-8 text-center text-sm text-slate-600">
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
              className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#3A56C5] px-4 text-sm font-semibold text-white transition hover:bg-[#3347A8]"
              aria-label="Create new voucher"
            >
              Create Voucher
            </button>
          </div>
        </div>

        {mobileTypePickerModal}
      </div>

      <div className="hidden sm:block">
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
                    className="inline-flex h-8 items-center rounded-md border border-[#3A56C5] px-3 text-xs font-semibold text-[#3A56C5]"
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
            <button type="button" className="ml-1 font-semibold text-[#3A56C5] hover:underline">
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
            className="mt-4 inline-flex w-full items-center justify-center border-t border-dashed border-slate-200 pt-3 text-sm font-medium text-[#3A56C5]"
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
            <button type="button" className="text-sm font-medium text-[#3A56C5]">
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
                  className={`relative pb-2 text-sm font-medium transition ${active ? 'text-[#3A56C5]' : 'text-slate-500 hover:text-[#3A56C5]'
                    }`}
                >
                  {tab}
                  {active ? (
                    <span className="absolute -bottom-[9px] left-0 right-0 h-0.5 bg-[#3A56C5]" />
                  ) : null}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <span className="text-sm text-slate-500">Search</span>
            <select
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-[#B1C2EC] focus:outline-none"
              defaultValue="Voucher Name"
            >
              <option>Voucher Name</option>
            </select>
            <input
              type="text"
              value={desktopSearch}
              onChange={(event) => setDesktopSearch(event.target.value)}
              placeholder="Input"
              className="h-9 min-w-[220px] rounded-md border border-slate-200 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#B1C2EC] focus:outline-none"
            />
            <button
              type="button"
              className="inline-flex h-9 items-center rounded-md border border-[#3A56C5] px-4 text-sm font-medium text-[#3A56C5] transition hover:bg-[#F2F4FF]"
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




