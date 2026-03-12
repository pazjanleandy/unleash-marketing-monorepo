import type { CreateVoucherForm, VoucherType } from './types'

type VoucherPreviewPanelProps = {
  value: CreateVoucherForm
}

function formatDiscountLabel(value: CreateVoucherForm) {
  const cleanAmount = value.discountAmount.trim()
  const amount = cleanAmount.length > 0 ? cleanAmount : '0.00'

  if (value.discountType === 'percentage') {
    return `${amount}% OFF`
  }

  return `₱${amount} OFF`
}

const typeColors: Record<VoucherType, { bg: string; text: string; border: string }> = {
  shop: { bg: 'bg-[#eff6ff]', text: 'text-[#2563EB]', border: 'border-[#bfdbfe]' },
  product: { bg: 'bg-[#f0fdf4]', text: 'text-[#16a34a]', border: 'border-[#86efac]' },
  private: { bg: 'bg-[#f5f3ff]', text: 'text-[#7c3aed]', border: 'border-[#c4b5fd]' },
  live: { bg: 'bg-[#fffbeb]', text: 'text-[#d97706]', border: 'border-[#fbbf24]' },
  video: { bg: 'bg-[#fdf2f8]', text: 'text-[#db2777]', border: 'border-[#f9a8d4]' },
}

const typeLabels: Record<VoucherType, string> = {
  shop: 'Shop Voucher',
  product: 'Product Voucher',
  private: 'Private Voucher',
  live: 'Live Voucher',
  video: 'Video Voucher',
}

function TypeBadge({ voucherType }: { voucherType: VoucherType }) {
  const colors = typeColors[voucherType]
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {typeLabels[voucherType]}
    </span>
  )
}

function VoucherPreviewPanel({ value }: VoucherPreviewPanelProps) {
  const minimumBasketPrice = value.minimumBasketPrice.trim() || '0.00'
  const voucherType = value.voucherType

  const contextLines: Record<VoucherType, string> = {
    shop: 'Buyers can use this voucher for all products in the shop.',
    product:
      value.selectedProductIds.length > 0
        ? `Applies to ${value.selectedProductIds.length} selected product${value.selectedProductIds.length !== 1 ? 's' : ''} only.`
        : 'Select products this voucher applies to.',
    private:
      'This voucher is code-only. It will not be displayed on the shop page — share the code directly with customers.',
    live: 'Available during livestream. Viewers can claim it while watching.',
    video: 'Appears in product video. Viewers can claim it while watching.',
  }

  return (
    <aside className="h-fit rounded-xl border border-[#dfe3ea] bg-white p-4 shadow-[0_10px_30px_-28px_rgba(15,23,42,0.8)]">
      <div className="mx-auto w-[210px] rounded-[28px] border-[6px] border-slate-900 bg-slate-900 p-2 shadow-[0_22px_38px_-26px_rgba(15,23,42,0.85)]">
        <div className="overflow-hidden rounded-[20px] bg-[#f8fafc]">
          <div className="h-6 bg-[#111827]" />
          <div className="space-y-2 p-2">
            <div className="rounded-lg border border-[#bfdbfe] bg-white p-2">
              <div className="mb-1.5">
                <TypeBadge voucherType={voucherType} />
              </div>
              <p className="text-[10px] font-semibold text-[#2563EB]">
                {formatDiscountLabel(value)}
              </p>
              <p className="text-[9px] text-slate-500">Min. spend ₱{minimumBasketPrice}</p>
              <button
                type="button"
                className="mt-2 inline-flex h-5 items-center rounded bg-[#2563EB] px-2 text-[9px] font-semibold text-white"
              >
                Claim
              </button>
            </div>

            {/* Type-specific visual cues */}
            {voucherType === 'live' ? (
              <div className="flex items-center gap-1.5 rounded-md bg-[#fef3c7] px-2 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-[#92400e]">
                  Live Now
                </span>
              </div>
            ) : null}

            {voucherType === 'video' ? (
              <div className="flex items-center gap-1.5 rounded-md bg-[#fce7f3] px-2 py-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-[#db2777]">
                  <path d="M10 8.5L16 12L10 15.5V8.5Z" fill="currentColor" />
                </svg>
                <span className="text-[8px] font-bold uppercase tracking-wider text-[#9d174d]">
                  In Video
                </span>
              </div>
            ) : null}

            {voucherType === 'private' ? (
              <div className="flex items-center gap-1.5 rounded-md bg-[#ede9fe] px-2 py-1.5">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-[#7c3aed]">
                  <path d="M12 2C9.24 2 7 4.24 7 7V10H5V22H19V10H17V7C17 4.24 14.76 2 12 2ZM12 4C13.66 4 15 5.34 15 7V10H9V7C9 5.34 10.34 4 12 4Z" fill="currentColor" />
                </svg>
                <span className="text-[8px] font-bold uppercase tracking-wider text-[#5b21b6]">
                  Code Only
                </span>
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-1.5">
              <div className="h-12 rounded bg-[#e2e8f0]" />
              <div className="h-12 rounded bg-[#dbeafe]" />
              <div className="h-12 rounded bg-[#e2e8f0]" />
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-600">{contextLines[voucherType]}</p>
    </aside>
  )
}

export default VoucherPreviewPanel
