import type { CreateBundleDealForm, DiscountDateTimeField } from './types'

type BundleDealBasicInformationCardProps = {
  value: CreateBundleDealForm
  onChange: (value: CreateBundleDealForm) => void
  onOpenPicker: (field: DiscountDateTimeField) => void
  activePickerField: DiscountDateTimeField | null
}

function fromLocalDateTimeInputValue(value: string) {
  if (!value) {
    return null
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)

  if (!match) {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])

  return new Date(year, month, day, hour, minute, 0, 0)
}

function formatDateTimeLabel(value: string) {
  const date = fromLocalDateTimeInputValue(value)

  if (!date) {
    return 'Select date & time'
  }

  const day = `${date.getDate()}`.padStart(2, '0')
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const year = date.getFullYear()
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}`
}

function BundleDealBasicInformationCard({
  value,
  onChange,
  onOpenPicker,
  activePickerField,
}: BundleDealBasicInformationCardProps) {
  const setField = <K extends keyof CreateBundleDealForm>(
    field: K,
    nextValue: CreateBundleDealForm[K],
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
          <p className="pt-1 text-[14px] font-medium text-slate-700">Bundle Deal Name</p>
          <div>
            <div className="flex h-11 items-center rounded-md border border-[#cbd5e1] bg-white px-3 focus-within:border-[#64748b]">
              <input
                type="text"
                maxLength={150}
                value={value.promotionName}
                onChange={(event) => setField('promotionName', event.target.value)}
                placeholder="Enter bundle deal name"
                className="w-full border-0 bg-transparent text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <span className="ml-3 text-xs text-slate-400">
                {value.promotionName.length}/150
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Bundle deal name is not visible to buyers..
            </p>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-[210px_minmax(0,1fr)] md:items-start">
          <p className="pt-1 text-[14px] font-medium text-slate-700">Bundle Deal Period</p>
          <div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => onOpenPicker('startDateTime')}
                className={`flex min-h-11 flex-col items-start justify-center rounded-md border px-3 text-left transition ${
                  activePickerField === 'startDateTime'
                    ? 'border-[#2563EB] bg-[#eff6ff]'
                    : 'border-[#cbd5e1] bg-white hover:border-[#93c5fd]'
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Start
                </span>
                <span className="mt-0.5 text-[14px] text-slate-900">
                  {formatDateTimeLabel(value.startDateTime)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onOpenPicker('endDateTime')}
                className={`flex min-h-11 flex-col items-start justify-center rounded-md border px-3 text-left transition ${
                  activePickerField === 'endDateTime'
                    ? 'border-[#2563EB] bg-[#eff6ff]'
                    : 'border-[#cbd5e1] bg-white hover:border-[#93c5fd]'
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  End
                </span>
                <span className="mt-0.5 text-[14px] text-slate-900">
                  {formatDateTimeLabel(value.endDateTime)}
                </span>
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Bundle deal period must be less than 180 days..
            </p>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-[210px_minmax(0,1fr)] md:items-start">
          <p className="pt-1 text-[14px] font-medium text-slate-700">Bundle Price</p>
          <div className="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)]">
            <div className="flex h-11 items-center rounded-md border border-[#cbd5e1] bg-slate-100 px-3">
              <span className="text-xs font-semibold text-slate-500">Currency</span>
              <span className="ml-2 text-sm font-semibold text-slate-700">PHP</span>
            </div>
            <div className="flex h-11 items-center rounded-md border border-[#cbd5e1] bg-white px-3">
              <input
                type="text"
                inputMode="decimal"
                value={value.bundlePrice}
                onChange={(event) => setField('bundlePrice', event.target.value)}
                placeholder="0.00"
                className="w-full border-0 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Bundle price applies to the entire bundle..
          </p>
        </div>

        <div className="grid gap-2 md:grid-cols-[210px_minmax(0,1fr)] md:items-start">
          <p className="pt-1 text-[14px] font-medium text-slate-700">Purchase Limit</p>
          <div>
            <div className="flex h-11 items-center rounded-md border border-[#cbd5e1] bg-white px-3">
              <input
                type="text"
                inputMode="numeric"
                value={value.purchaseLimit}
                onChange={(event) => setField('purchaseLimit', event.target.value)}
                placeholder="Quantity (Default: No Limit)"
                className="w-full border-0 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export default BundleDealBasicInformationCard
