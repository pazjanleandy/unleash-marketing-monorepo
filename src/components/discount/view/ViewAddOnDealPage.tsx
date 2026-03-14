import { useMemo } from 'react'
import type { AddOnDealRow } from '../types'

type ViewAddOnDealPageProps = {
  onBack: () => void
  addon: AddOnDealRow
}

function ProductPreviewShape({ label }: { label: string }) {
  return (
    <div className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-md border border-[#bfdbfe] bg-gradient-to-br from-[#eff6ff] to-[#bfdbfe] text-xs font-bold text-[#1d4ed8] shadow-[0_8px_14px_-12px_rgba(30,64,175,0.9)]">
      {label.slice(0, 1).toUpperCase()}
    </div>
  )
}

function ViewAddOnDealPage({ onBack, addon }: ViewAddOnDealPageProps) {
  const metrics = useMemo(() => {
    return [
      { label: 'Status', value: addon.status },
      { label: 'Trigger Product', value: addon.triggerProductName },
      { label: 'Add-on Product', value: addon.addonProductName },
      { label: 'Purchase Limit', value: addon.maxUses === null ? 'No limit' : `${addon.maxUses}` },
    ]
  }, [addon])

  return (
    <section
      className="motion-rise min-h-[calc(100vh-2.5rem)] bg-[#f1f5f9] pb-24 sm:rounded-3xl sm:border sm:border-slate-200/80 sm:bg-white/95 sm:p-6 sm:pb-6 sm:shadow-[0_24px_50px_-45px_rgba(15,23,42,0.65)]"
      style={{ animationDelay: '80ms' }}
    >
      <div className="sm:hidden">
        <div className="sticky top-0 z-10 border-b border-[#dbeafe] bg-white px-4 py-3">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eff6ff] text-base font-semibold text-[#1E40AF] transition active:scale-95"
              aria-label="Back to Discount"
            >
              &larr;
            </button>
            <div>
              <h1 className="text-[22px] font-semibold leading-none text-slate-900">View Add-on Deal</h1>
              <p className="mt-1 text-xs text-[#1d4ed8]">Details are read-only for this add-on..</p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden sm:block">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center rounded-full bg-[#eff6ff] px-3 py-1.5 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe]"
        >
          &larr; Back to Discount
        </button>

        <header className="mt-3 rounded-2xl border border-[#dbeafe] bg-gradient-to-r from-[#eff6ff] via-[#dbeafe] to-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
            Home &gt; Marketing Centre &gt; Discount &gt; View Add-on Deal
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[#1E40AF]">View Add-on Deal</h1>
        </header>
      </div>

      <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
        <article className="rounded-xl border border-[#dbeafe] bg-white p-4 shadow-[0_10px_30px_-28px_rgba(15,23,42,0.8)] sm:p-5">
          <h2 className="text-lg font-semibold text-[#1E40AF] sm:text-xl">Basic Information</h2>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Add-on Deal Name</p>
              <input
                type="text"
                readOnly
                disabled
                value={addon.name}
                className="h-10 w-full rounded-md border border-[#cbd5e1] bg-slate-100 px-3 text-sm text-slate-700"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Add-on Deal Type</p>
              <input
                type="text"
                readOnly
                disabled
                value={addon.type}
                className="h-10 w-full rounded-md border border-[#cbd5e1] bg-slate-100 px-3 text-sm text-slate-700"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Start Time</p>
              <input
                type="text"
                readOnly
                disabled
                value={addon.period.start}
                className="h-10 w-full rounded-md border border-[#cbd5e1] bg-slate-100 px-3 text-sm text-slate-700"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">End Time</p>
              <input
                type="text"
                readOnly
                disabled
                value={addon.period.end}
                className="h-10 w-full rounded-md border border-[#cbd5e1] bg-slate-100 px-3 text-sm text-slate-700"
              />
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-[#dbeafe] bg-white p-4 shadow-[0_10px_30px_-28px_rgba(15,23,42,0.8)] sm:p-5">
          <h2 className="text-lg font-semibold text-[#1E40AF] sm:text-xl">Add-on Data</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-lg border border-[#dbeafe] bg-[#f8fbff] p-3">
                <p className="text-xs text-slate-500">{metric.label}</p>
                <p className="mt-1 text-lg font-semibold text-[#1d4ed8]">{metric.value}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-[#dbeafe] bg-white p-4 shadow-[0_10px_30px_-28px_rgba(15,23,42,0.8)] sm:p-5">
          <h2 className="text-lg font-semibold text-[#1E40AF] sm:text-xl">Products</h2>

          <div className="mt-3 space-y-2.5">
            <div className="rounded-lg border border-[#dbeafe] bg-[#f8fbff] p-3">
              <div className="flex items-start gap-2.5">
                <ProductPreviewShape label={addon.triggerProductName} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                    {addon.triggerProductName}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <p className="mb-1 text-[11px] font-medium text-slate-500">Trigger Product</p>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={addon.triggerProductName}
                    className="h-9 w-full rounded-md border border-[#cbd5e1] bg-slate-100 px-2.5 text-xs text-slate-700"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-medium text-slate-500">Discount</p>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={addon.discountValue ? `${addon.discountValue}% OFF` : '-'}
                    className="h-9 w-full rounded-md border border-[#cbd5e1] bg-slate-100 px-2.5 text-xs text-slate-700"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#dbeafe] bg-[#f8fbff] p-3">
              <div className="flex items-start gap-2.5">
                <ProductPreviewShape label={addon.addonProductName} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                    {addon.addonProductName}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <p className="mb-1 text-[11px] font-medium text-slate-500">Add-on Product</p>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={addon.addonProductName}
                    className="h-9 w-full rounded-md border border-[#cbd5e1] bg-slate-100 px-2.5 text-xs text-slate-700"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-medium text-slate-500">Type</p>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={addon.type}
                    className="h-9 w-full rounded-md border border-[#cbd5e1] bg-slate-100 px-2.5 text-xs font-semibold text-[#1d4ed8]"
                  />
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

export default ViewAddOnDealPage
