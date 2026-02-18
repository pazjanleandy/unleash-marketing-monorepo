import { useMemo, useState } from 'react'
import type { TouchEventHandler } from 'react'
import { sampleVouchers, voucherTabs } from './data'
import type {
  VoucherAction,
  VoucherIcon,
  VoucherItem,
  VoucherStatus,
} from './types'

type VouchersPageProps = {
  onBack: () => void
  onCreate: () => void
  onEdit: (voucher: VoucherItem) => void
}

type MobileTab = (typeof voucherTabs)[number]

const statusClasses: Record<VoucherStatus, string> = {
  Upcoming: 'bg-[#fff0e8] text-[#ea6430]',
  Ongoing: 'bg-[#e8f7ef] text-[#239c70]',
  Expired: 'bg-slate-200 text-slate-600',
}

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
    return '₱0'
  }

  return `₱${parsed.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`
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

function CompactStatChip({
  label,
  value,
  emphasized = false,
}: {
  label: string
  value: number
  emphasized?: boolean
}) {
  return (
    <div
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] leading-none ${
        emphasized
          ? 'border-[#93c5fd] bg-[#dbeafe] text-[#1e3a8a]'
          : 'border-slate-200 bg-white text-slate-700'
      }`}
    >
      <span className="font-medium">
        {label}
      </span>
      <span className={`font-semibold ${emphasized ? 'text-[#1d4ed8]' : 'text-slate-900'}`}>
        {value}
      </span>
    </div>
  )
}

function MobileVoucherCard({
  voucher,
  delayMs,
  onEdit,
}: {
  voucher: VoucherItem
  delayMs: number
  onEdit: (voucher: VoucherItem) => void
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
    : 'border-[#bfdbfe] bg-white text-[#1d4ed8] hover:bg-[#dbeafe]'

  const handleActionClick = (action: VoucherAction) => {
    if (action.label.trim().toLowerCase() === 'edit') {
      onEdit(voucher)
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
      className={`mobile-voucher-card motion-rise relative overflow-hidden rounded-2xl border-l-4 bg-white px-4 pb-4 pt-3 shadow-[0_14px_35px_-22px_rgba(30,64,175,0.85)] max-[480px]:px-3.5 max-[480px]:pb-3.5 ${statusBorderClasses[voucher.status]}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#eff6ff] to-transparent" />

      <div
        className="relative transition-transform duration-200 ease-out"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        <div className="flex items-start justify-between gap-3 max-[480px]:gap-2">
          <div className="min-w-0">
            <p className="text-[34px] font-bold leading-none tracking-tight text-[#2563EB] max-[480px]:text-[30px]">
              <span>{discountValue}</span>
              <span className="ml-1.5 align-middle text-[13px] font-semibold uppercase tracking-wide text-[#1d4ed8]/80">
                OFF
              </span>
            </p>

            <p className="mt-2 truncate text-[15px] font-semibold leading-tight text-slate-900">
              {voucher.name}
            </p>

            <p className="mt-1 text-sm leading-snug text-slate-700">
              Min. spend {minimumSpend} | Type: Shop Voucher
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span
              className={`inline-flex min-w-[76px] justify-center rounded-full px-2.5 py-1 text-[12px] font-semibold shadow ${statusPillClasses[voucher.status]}`}
            >
              {voucher.status}
            </span>
            <code className="inline-flex min-h-[30px] items-center rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 font-mono text-[12px] font-semibold tracking-wide text-[#1d4ed8]">
              {voucher.code}
            </code>
          </div>
        </div>

        <p className="mt-2 text-sm font-medium text-slate-600">{claimingLine}</p>

        <div className="mt-3 flex flex-wrap gap-2 border-y border-[#dbeafe] py-2.5">
          <CompactStatChip label="Claimed" value={voucher.claimed} />
          <CompactStatChip label="Used" value={voucher.usage} />
          <CompactStatChip label="Unused" value={unusedCount} emphasized />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5 min-[481px]:gap-3">
          <button
            type="button"
            onClick={() => handleActionClick(primaryAction)}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#1d4ed8] bg-[#2563EB] px-3 text-[14px] font-semibold text-white transition hover:bg-[#1d4ed8] active:scale-[0.98]"
          >
            {primaryAction.label}
          </button>
          <button
            type="button"
            onClick={() => handleActionClick(secondaryAction)}
            className={`inline-flex h-11 items-center justify-center rounded-xl border px-3 text-[14px] font-semibold transition active:scale-[0.98] ${secondaryActionClasses}`}
          >
            {secondaryAction.label}
          </button>
        </div>
      </div>

      {isSwiping && swipeAction ? (
        <div className="absolute bottom-2 right-2 rounded-full bg-[#1E40AF] px-2.5 py-1 text-[10px] font-semibold text-white shadow-lg">
          {swipeAction}
        </div>
      ) : null}
    </article>
  )
}

function VoucherRow({
  voucher,
  onEdit,
}: {
  voucher: VoucherItem
  onEdit: (voucher: VoucherItem) => void
}) {
  return (
    <tr className="align-top text-sm text-slate-700">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 flex-none items-center justify-center rounded-sm text-2xl font-semibold text-white ${iconClasses[voucher.icon]}`}
          >
            {voucher.icon === 'percent' ? '%' : '₱'}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{voucher.code}</p>
            <p className="text-xs text-slate-500">{voucher.name}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-slate-600">{voucher.type}</td>
      <td className="px-4 py-4 font-medium text-slate-900">{voucher.discountAmount}</td>
      <td className="px-4 py-4">{voucher.quantity}</td>
      <td className="px-4 py-4">{voucher.usageLimit}</td>
      <td className="px-4 py-4">{voucher.claimed}</td>
      <td className="px-4 py-4">{voucher.usage}</td>
      <td className="px-4 py-4">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses[voucher.status]}`}
        >
          {voucher.status}
        </span>
        <p className="mt-2 text-xs text-slate-500">{voucher.claimingPeriod.start}</p>
        <p className="text-xs text-slate-500">{voucher.claimingPeriod.end}</p>
      </td>
      <td className="px-4 py-4">
        <ul className="min-w-[120px] space-y-1.5">
          {voucher.actions.map((action) => (
            <li key={`${voucher.code}-${action.label}`}>
              <button
                type="button"
                onClick={() => {
                  if (action.label.trim().toLowerCase() === 'edit') {
                    onEdit(voucher)
                  }
                }}
                className={`text-sm font-medium transition hover:underline ${
                  action.danger ? 'text-[#dc4f1f]' : 'text-[#2f70db]'
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

function VouchersPage({ onBack, onCreate, onEdit }: VouchersPageProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>('Upcoming')
  const [quickFilter, setQuickFilter] =
    useState<(typeof quickFilters)[number]>('All Products')

  const mobileVouchers =
    mobileTab === 'All'
      ? sampleVouchers
      : sampleVouchers.filter((voucher) => voucher.status === mobileTab)

  const activeTabIndex = mobileCarouselTabs.findIndex((tab) => tab === mobileTab)
  const tabWidthPercent = 100 / mobileCarouselTabs.length

  const cardEntries = useMemo(() => {
    if (quickFilter === 'All Products') {
      return mobileVouchers
    }

    return mobileVouchers.filter((voucher) => voucher.type.toLowerCase().includes('shop'))
  }, [mobileVouchers, quickFilter])

  return (
    <section
      className="motion-rise rounded-3xl border border-slate-200/80 bg-white/95 p-3 pb-28 shadow-[0_24px_50px_-45px_rgba(15,23,42,0.65)] sm:p-8"
      style={{ animationDelay: '80ms' }}
    >
      <div className="sm:hidden">
        <div className="rounded-2xl bg-gradient-to-r from-[#eff6ff] via-[#dbeafe] to-white p-3 shadow-[0_14px_30px_-26px_rgba(37,99,235,0.9)]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-base font-semibold text-[#1E40AF] shadow-sm transition active:scale-95"
              aria-label="Back to Marketing Centre"
            >
              &larr;
            </button>
            <h1 className="text-[24px] font-bold leading-none text-[#1E40AF]">
              Vouchers
            </h1>
          </div>
          <p className="mt-1.5 text-[12px] text-[#1d4ed8]">
            Pull to refresh, tap cards, or swipe for quick actions.
          </p>
        </div>

        <div className="relative mt-3 rounded-full bg-[#dbeafe] p-1 shadow-inner">
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
                  className={`z-10 inline-flex h-11 items-center justify-center rounded-full px-2 text-[13px] font-semibold transition-colors ${
                    isActive ? 'text-white' : 'text-[#1d4ed8]'
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
              className={`inline-flex h-9 items-center whitespace-nowrap rounded-full px-4 text-[12px] font-semibold transition ${
                quickFilter === chip
                  ? 'bg-[#2563EB] text-white shadow-[0_10px_18px_-12px_rgba(30,64,175,0.95)]'
                  : 'bg-[#eff6ff] text-[#1e40af]'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 border-b border-[#bfdbfe] pb-2">
          <button
            type="button"
            className="paw-loader inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#dbeafe] text-[#1e40af]"
            aria-label="Loading"
          >
            &#128062;
          </button>
          <p className="text-[12px] text-[#1d4ed8]">Blue Sync loading ready</p>
        </div>

        <div className="mt-3 space-y-3 pb-20">
          {cardEntries.length > 0 ? (
            cardEntries.map((voucher, index) => (
              <MobileVoucherCard
                key={`mobile-${voucher.code}`}
                voucher={voucher}
                delayMs={90 + index * 70}
                onEdit={onEdit}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[#93c5fd] bg-white px-3 py-8 text-center text-sm text-[#1d4ed8]">
              No vouchers in this tab.
            </div>
          )}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#dbeafe] bg-white/95 backdrop-blur">
          <div className="mx-auto w-full max-w-6xl px-4 py-3">
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#2563EB] px-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
              aria-label="Create new voucher"
            >
              Create Voucher
            </button>
          </div>
        </div>
      </div>

      <div className="hidden sm:block">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center rounded-full bg-[#eff6ff] px-3 py-1.5 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe]"
        >
          &larr; Back to Marketing Centre
        </button>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-[#dbeafe] bg-gradient-to-r from-[#eff6ff] via-[#dbeafe] to-white p-5">
          <div>
            <h1 className="text-3xl font-semibold text-[#1E40AF]">Vouchers</h1>
            <p className="mt-2 text-sm text-[#1d4ed8]">
              Create and manage your own vouchers for your shop and products
              on Unleash.
              <button
                type="button"
                className="ml-1 font-semibold text-[#1e3a8a] hover:underline"
              >
                Learn More
              </button>
            </p>
          </div>
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#2563EB] px-5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
          >
            + Create
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl bg-[#eff6ff] p-2">
          {voucherTabs.map((tab, index) => (
            <button
              key={tab}
              type="button"
              className={`h-10 rounded-full px-4 text-sm font-semibold transition ${
                index === 0
                  ? 'bg-[#2563EB] text-white shadow-[0_8px_18px_-12px_rgba(30,64,175,0.9)]'
                  : 'text-[#1d4ed8] hover:bg-[#dbeafe]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[980px] w-full border-separate border-spacing-0 rounded-2xl border border-[#dbeafe] bg-white shadow-[0_16px_35px_-28px_rgba(30,64,175,0.65)]">
            <thead>
              <tr className="bg-[#f8fbff] text-left text-xs uppercase tracking-wide text-[#1d4ed8]">
                <th className="px-4 py-3 font-semibold">
                  Voucher Code | Name
                </th>
                <th className="px-4 py-3 font-semibold">Voucher Type</th>
                <th className="px-4 py-3 font-semibold">
                  Discount Amount (Off)
                </th>
                <th className="px-4 py-3 font-semibold">Quantity</th>
                <th className="px-4 py-3 font-semibold">Usage Limit</th>
                <th className="px-4 py-3 font-semibold">Claimed</th>
                <th className="px-4 py-3 font-semibold">Usage</th>
                <th className="px-4 py-3 font-semibold">
                  Status | Claiming Period
                </th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sampleVouchers.map((voucher) => (
                <VoucherRow key={voucher.code} voucher={voucher} onEdit={onEdit} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </section>
  )
}

export default VouchersPage
