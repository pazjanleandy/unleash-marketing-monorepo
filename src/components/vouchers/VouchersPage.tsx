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

function getMobileActions(actions: VoucherAction[]) {
  const primaryIndex = actions.findIndex((action) => !action.danger)
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
    primaryOrder: primaryIndex >= 0 ? primaryIndex + 1 : 1,
    secondaryOrder: dangerIndex >= 0 ? dangerIndex + 1 : actions.length || 2,
  }
}

function UsageRing({
  label,
  value,
  total,
  color,
}: {
  label: string
  value: number
  total: number
  color: string
}) {
  const ratio = total > 0 ? Math.min(Math.max(value / total, 0), 1) : 0
  const degrees = Math.round(ratio * 360)
  const ringBackground = `conic-gradient(${color} ${degrees}deg, #dbeafe ${degrees}deg)`

  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div
        className="relative flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: ringBackground }}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[13px] font-semibold text-[#1E40AF]">
          {value}
        </div>
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
    </div>
  )
}

function MobileVoucherCard({
  voucher,
  delayMs,
}: {
  voucher: VoucherItem
  delayMs: number
}) {
  const unusedCount = Math.max(voucher.quantity - voucher.usage, 0)
  const { primaryAction, secondaryAction, primaryOrder, secondaryOrder } =
    getMobileActions(voucher.actions)
  const discountLabel = `${voucher.discountAmount} OFF`
  const minimumSpend = `$${(voucher.quantity * 10).toFixed(2)}`

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
      className={`mobile-voucher-card motion-rise relative overflow-hidden rounded-2xl border-l-4 bg-white px-4 pb-4 pt-3 shadow-[0_14px_35px_-22px_rgba(30,64,175,0.85)] ${statusBorderClasses[voucher.status]}`}
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
        <div className="flex items-start gap-3">
          <div className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#60A5FA] text-[24px] font-bold leading-none text-white">
            {voucher.icon === 'percent' ? '%' : '$'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold leading-tight text-[#1E40AF]">
                  {voucher.name}
                </p>
                <p className="mt-1 text-[11px] leading-snug text-slate-500">
                  {voucher.claimingPeriod.start} - {voucher.claimingPeriod.end}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold shadow ${statusPillClasses[voucher.status]}`}
              >
                {voucher.status}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-[32px] font-bold leading-none tracking-tight text-[#2563EB]">
              {discountLabel}
            </p>
            <p className="mt-1 text-[12px] text-slate-500">Min. spend {minimumSpend}</p>
            <p className="text-[12px] text-slate-500">Type: Shop Voucher</p>
          </div>
          <code className="inline-flex h-fit rounded-lg bg-[#DBEAFE] px-2.5 py-1.5 font-mono text-[11px] font-semibold tracking-wide text-[#1D4ED8]">
            {voucher.code}
          </code>
        </div>

        <div className="mt-4 border-y border-[#dbeafe] py-3">
          <div className="grid grid-cols-3 justify-items-center gap-2">
            <UsageRing
              label="Claimed"
              value={voucher.claimed}
              total={voucher.quantity}
              color="#2563EB"
            />
            <UsageRing
              label="Used"
              value={voucher.usage}
              total={voucher.quantity}
              color="#10B981"
            />
            <UsageRing
              label="Unused"
              value={unusedCount}
              total={voucher.quantity}
              color="#60A5FA"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <a
            href="#"
            onClick={(event) => event.preventDefault()}
            className="inline-flex h-11 items-center justify-center gap-1 rounded-xl border border-[#bfdbfe] bg-[#eff6ff] text-[13px] font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe] active:scale-[0.98]"
          >
            {primaryAction.label}
            <span className="rounded-full bg-[#2563EB] px-2 py-0.5 text-[10px] text-white">
              {primaryOrder}
            </span>
          </a>
          <a
            href="#"
            onClick={(event) => event.preventDefault()}
            className="inline-flex h-11 items-center justify-center gap-1 rounded-xl border border-[#fed7aa] bg-[#fff7ed] text-[13px] font-semibold text-[#c2410c] transition hover:bg-[#ffedd5] active:scale-[0.98]"
          >
            {secondaryAction.label}
            <span className="rounded-full bg-[#ea580c] px-2 py-0.5 text-[10px] text-white">
              {secondaryOrder}
            </span>
          </a>
        </div>

        <div className="pointer-events-none mt-2 text-center text-[10px] font-medium tracking-wide text-slate-400">
          Swipe left to {primaryAction.label.toLowerCase()} | right to{' '}
          {secondaryAction.label.toLowerCase()}
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

function VoucherRow({ voucher }: { voucher: VoucherItem }) {
  return (
    <tr className="align-top text-sm text-slate-700">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 flex-none items-center justify-center rounded-sm text-2xl font-semibold text-white ${iconClasses[voucher.icon]}`}
          >
            {voucher.icon === 'percent' ? '%' : '$'}
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
              <a
                href="#"
                onClick={(event) => event.preventDefault()}
                className={`text-sm font-medium transition hover:underline ${
                  action.danger ? 'text-[#dc4f1f]' : 'text-[#2f70db]'
                }`}
              >
                {action.label}
              </a>
            </li>
          ))}
        </ul>
      </td>
    </tr>
  )
}

function VouchersPage({ onBack }: VouchersPageProps) {
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
      className="motion-rise rounded-3xl border border-slate-200/80 bg-white/95 p-3 pb-24 shadow-[0_24px_50px_-45px_rgba(15,23,42,0.65)] sm:p-8"
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
              />
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[#93c5fd] bg-white px-3 py-8 text-center text-sm text-[#1d4ed8]">
              No vouchers in this tab.
            </div>
          )}
        </div>

        <div className="fixed bottom-5 right-4 z-20">
          <button
            type="button"
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#2563EB] text-3xl font-semibold text-white shadow-[0_20px_30px_-18px_rgba(30,64,175,0.95)] transition hover:bg-[#1d4ed8] active:scale-95"
            aria-label="Create new voucher"
          >
            +
          </button>
        </div>
      </div>

      <div className="hidden sm:block">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-medium text-[#2f70db] transition hover:text-[#1f57b7]"
        >
          &larr; Back to Marketing Centre
        </button>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Vouchers</h1>
            <p className="mt-2 text-sm text-slate-600">
              Create and manage your own vouchers for your shop and products
              on Unleash.
              <button
                type="button"
                className="ml-1 font-semibold text-[#2f70db] hover:underline"
              >
                Learn More
              </button>
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#f05d2c] px-5 text-sm font-semibold text-white transition hover:bg-[#e24d1d]"
          >
            + Create
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-2 border-b border-slate-200 pb-3">
          {voucherTabs.map((tab, index) => (
            <button
              key={tab}
              type="button"
              className={`rounded-t-lg border border-b-0 px-4 py-2 text-sm font-medium transition ${
                index === 0
                  ? 'border-[#f05d2c] bg-[#fff3ee] text-[#f05d2c]'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[980px] w-full border-separate border-spacing-0 rounded-xl border border-slate-200">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
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
                <VoucherRow key={voucher.code} voucher={voucher} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default VouchersPage
