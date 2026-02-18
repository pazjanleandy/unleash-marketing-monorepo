import type { CreateDiscountPromotionForm } from './types'

type DiscountPromotionBasicInformationCardProps = {
  value: CreateDiscountPromotionForm
  onChange: (value: CreateDiscountPromotionForm) => void
}

function DiscountPromotionBasicInformationCard({
  value,
  onChange,
}: DiscountPromotionBasicInformationCardProps) {
  const setField = <K extends keyof CreateDiscountPromotionForm>(
    field: K,
    nextValue: CreateDiscountPromotionForm[K],
  ) => {
    onChange({ ...value, [field]: nextValue })
  }

  return (
    <article className="rounded-xl border border-[#dbeafe] bg-white p-4 shadow-[0_10px_30px_-28px_rgba(15,23,42,0.8)] sm:p-5">
      <header>
        <h2 className="text-xl font-semibold text-[#1E40AF]">Basic Information</h2>
      </header>

      <div className="mt-4 space-y-4">
        <div className="grid gap-2 md:grid-cols-[210px_minmax(0,1fr)] md:items-start">
          <p className="pt-1 text-[14px] font-medium text-slate-700">
            Discount Promotion Name
          </p>
          <div>
            <div className="flex h-11 items-center rounded-md border border-[#cbd5e1] bg-white px-3 focus-within:border-[#64748b]">
              <input
                type="text"
                maxLength={150}
                value={value.promotionName}
                onChange={(event) => setField('promotionName', event.target.value)}
                placeholder="Enter promotion name"
                className="w-full border-0 bg-transparent text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <span className="ml-3 text-xs text-slate-400">
                {value.promotionName.length}/150
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Discount promotion name is not visible to buyers.
            </p>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-[210px_minmax(0,1fr)] md:items-start">
          <p className="pt-1 text-[14px] font-medium text-slate-700">
            Discount Promotion Period
          </p>
          <div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                type="datetime-local"
                value={value.startDateTime}
                onChange={(event) => setField('startDateTime', event.target.value)}
                className="h-11 rounded-md border border-[#cbd5e1] bg-white px-3 text-[14px] text-slate-900 focus:border-[#64748b] focus:outline-none"
              />
              <input
                type="datetime-local"
                value={value.endDateTime}
                onChange={(event) => setField('endDateTime', event.target.value)}
                className="h-11 rounded-md border border-[#cbd5e1] bg-white px-3 text-[14px] text-slate-900 focus:border-[#64748b] focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Promotion period must be less than 180 days.
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}

export default DiscountPromotionBasicInformationCard
