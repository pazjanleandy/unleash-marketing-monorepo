import type { CreateVoucherForm } from './types'

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

function VoucherPreviewPanel({ value }: VoucherPreviewPanelProps) {
  const minimumBasketPrice = value.minimumBasketPrice.trim() || '0.00'
  const productScopeText =
    value.productScope === 'specific-products'
      ? 'Buyers can use this voucher on selected products only.'
      : 'Buyers can use this voucher for all products in the shop.'

  return (
    <aside className="h-fit rounded-xl border border-[#dfe3ea] bg-white p-4 shadow-[0_10px_30px_-28px_rgba(15,23,42,0.8)]">
      <div className="mx-auto w-[210px] rounded-[28px] border-[6px] border-slate-900 bg-slate-900 p-2 shadow-[0_22px_38px_-26px_rgba(15,23,42,0.85)]">
        <div className="overflow-hidden rounded-[20px] bg-[#f8fafc]">
          <div className="h-6 bg-[#111827]" />
          <div className="space-y-2 p-2">
            <div className="rounded-lg border border-[#bfdbfe] bg-white p-2">
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

            <div className="grid grid-cols-3 gap-1.5">
              <div className="h-12 rounded bg-[#e2e8f0]" />
              <div className="h-12 rounded bg-[#dbeafe]" />
              <div className="h-12 rounded bg-[#e2e8f0]" />
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-slate-600">{productScopeText}</p>
    </aside>
  )
}

export default VoucherPreviewPanel
