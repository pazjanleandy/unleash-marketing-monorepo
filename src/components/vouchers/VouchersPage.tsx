import { useState } from 'react'
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

function MobileVoucherCard({ voucher }: { voucher: VoucherItem }) {
  const unusedCount = Math.max(voucher.quantity - voucher.usage, 0)
  const { primaryAction, secondaryAction, primaryOrder, secondaryOrder } =
    getMobileActions(voucher.actions)
  const discountLabel = voucher.discountAmount.includes('%')
    ? `${voucher.discountAmount}OFF`
    : `${voucher.discountAmount} OFF`
  const minimumSpend = `$${(voucher.quantity * 10).toFixed(2)}`

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.85)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[16px] font-semibold leading-tight text-slate-900">
            {voucher.name}
          </p>
          <p className="mt-1 text-[10px] font-medium tracking-wide text-slate-400">
            {voucher.claimingPeriod.start} - {voucher.claimingPeriod.end}
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClasses[voucher.status]}`}
        >
          {voucher.status}
        </span>
      </div>

      <div className="mt-3 flex items-start gap-2">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-[3px] bg-[#ff7a1a] text-[24px] font-semibold leading-none text-white">
          {voucher.icon === 'percent' ? '%' : '$'}
        </div>
        <div className="min-w-0 leading-tight">
          <p className="text-[22px] font-bold text-[#ff592f]">{discountLabel}</p>
          <p className="text-[11px] font-medium text-slate-500">
            Min. spend {minimumSpend}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">Shop Voucher</p>
        </div>
        <p className="ml-auto mt-1 text-[12px] font-semibold tracking-wide text-slate-600">
          {voucher.code}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-y border-slate-200 py-2.5">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Claimed
          </p>
          <p className="mt-1 text-[14px] font-semibold text-slate-700">
            {voucher.claimed}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Used
          </p>
          <p className="mt-1 text-[14px] font-semibold text-slate-700">
            {voucher.usage}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
            Unused
          </p>
          <p className="mt-1 text-[14px] font-semibold text-slate-700">
            {unusedCount}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="relative">
          <a
            href="#"
            onClick={(event) => event.preventDefault()}
            className="inline-flex h-9 w-full items-center justify-center rounded-md border border-slate-200 bg-slate-50 pl-5 text-[13px] font-semibold text-slate-700"
          >
            {primaryAction.label}
          </a>
          <span className="absolute -left-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[#f05d2c] text-[14px] font-bold text-white">
            {primaryOrder}
          </span>
        </div>
        <div className="relative">
          <a
            href="#"
            onClick={(event) => event.preventDefault()}
            className={`inline-flex h-9 w-full items-center justify-center rounded-md border border-slate-200 bg-slate-50 pl-5 text-[13px] font-semibold ${
              secondaryAction.danger ? 'text-[#c2410c]' : 'text-slate-700'
            }`}
          >
            {secondaryAction.label}
          </a>
          <span className="absolute -left-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[#f05d2c] text-[14px] font-bold text-white">
            {secondaryOrder}
          </span>
        </div>
      </div>
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
  const mobileVouchers =
    mobileTab === 'All'
      ? sampleVouchers
      : sampleVouchers.filter((voucher) => voucher.status === mobileTab)

  return (
    <section
      className="motion-rise rounded-3xl border border-slate-200/80 bg-white/95 p-3 pb-24 shadow-[0_24px_50px_-45px_rgba(15,23,42,0.65)] sm:p-8"
      style={{ animationDelay: '80ms' }}
    >
      <div className="sm:hidden">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-semibold text-slate-500 transition hover:text-slate-700"
            aria-label="Back to Marketing Centre"
          >
            &larr;
          </button>
          <h1 className="text-[22px] font-semibold leading-none text-slate-900">
            Vouchers
          </h1>
        </div>

        <div className="-mx-3 mt-2 border-b border-slate-200">
          <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-3 pb-1.5">
            {mobileCarouselTabs.map((tab) => {
              const isActive = tab === mobileTab

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setMobileTab(tab)}
                  className={`relative snap-start whitespace-nowrap px-3 py-1.5 text-[13px] font-semibold transition ${
                    isActive
                      ? 'text-[#f05d2c]'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab}
                  {isActive ? (
                    <span className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-[#f05d2c]" />
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-3 space-y-3">
          {mobileVouchers.length > 0 ? (
            mobileVouchers.map((voucher) => (
              <MobileVoucherCard
                key={`mobile-${voucher.code}`}
                voucher={voucher}
              />
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 px-3 py-8 text-center text-sm text-slate-500">
              No vouchers in this tab.
            </div>
          )}
        </div>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-3 pb-3 pt-2 backdrop-blur">
          <button
            type="button"
            className="inline-flex h-10 w-full items-center justify-center rounded-sm bg-[#f05d2c] text-sm font-semibold text-white transition hover:bg-[#e24d1d]"
          >
            Create New Voucher
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
