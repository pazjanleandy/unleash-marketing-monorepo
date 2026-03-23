import { useMemo } from 'react'
import ProductThumbnail from '../../common/ProductThumbnail'
import type { BundleDealRow } from '../types'

type ViewBundleDealPageProps = {
  onBack: () => void
  bundle: BundleDealRow
}

function ViewBundleDealPage({ onBack, bundle }: ViewBundleDealPageProps) {
  const metrics = useMemo(() => {
    return [
      { label: 'Status', value: bundle.status },
      { label: 'Items', value: `${bundle.bundleItems.length}` },
      {
        label: 'Purchase Limit',
        value: bundle.maxUses === null ? 'No limit' : `${bundle.maxUses}`,
      },
      {
        label: 'Bundle Price',
        value: `${bundle.currency} ${bundle.bundlePrice}`,
      },
    ]
  }, [bundle])

  return (
    <section
      className="motion-rise min-h-[calc(100vh-2.5rem)] bg-[#f1f5f9] pb-24 sm:rounded-3xl sm:border sm:border-slate-200/80 sm:bg-white/95 sm:p-6 sm:pb-6 sm:shadow-[0_24px_50px_-45px_rgba(15,23,42,0.65)]"
      style={{ animationDelay: '80ms' }}
    >
      <div className="sm:hidden">
        <div className="sticky top-0 z-10 border-b border-[#E6EBFF] bg-white px-4 py-3">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F4FF] text-base font-semibold text-[#33458F] transition active:scale-95"
              aria-label="Back to Discount"
            >
              &larr;
            </button>
            <div>
              <h1 className="text-[22px] font-semibold leading-none text-slate-900">
                View Bundle Deal
              </h1>
              <p className="mt-1 text-xs text-[#3347A8]">Details are read-only for this bundle..</p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden sm:block">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center rounded-full bg-[#F2F4FF] px-3 py-1.5 text-sm font-semibold text-[#3347A8] transition hover:bg-[#E6EBFF]"
        >
          &larr; Back to Discount
        </button>

        <header className="mt-3 rounded-2xl border border-[#E6EBFF] bg-gradient-to-r from-[#F2F4FF] via-[#E6EBFF] to-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3347A8]">
            Home &gt; Marketing Centre &gt; Discount &gt; View Bundle Deal
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[#33458F]">View Bundle Deal</h1>
        </header>
      </div>

      <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
        <article className="rounded-xl border border-[#E6EBFF] bg-white p-4 shadow-[0_10px_30px_-28px_rgba(15,23,42,0.8)] sm:p-5">
          <h2 className="text-lg font-semibold text-[#33458F] sm:text-xl">Basic Information</h2>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Bundle Name</p>
              <input
                type="text"
                readOnly
                disabled
                value={bundle.name}
                className="h-10 w-full rounded-md border border-[#cbd5e1] bg-slate-100 px-3 text-sm text-slate-700"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Bundle Type</p>
              <input
                type="text"
                readOnly
                disabled
                value={bundle.type}
                className="h-10 w-full rounded-md border border-[#cbd5e1] bg-slate-100 px-3 text-sm text-slate-700"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Start Time</p>
              <input
                type="text"
                readOnly
                disabled
                value={bundle.period.start}
                className="h-10 w-full rounded-md border border-[#cbd5e1] bg-slate-100 px-3 text-sm text-slate-700"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">End Time</p>
              <input
                type="text"
                readOnly
                disabled
                value={bundle.period.end}
                className="h-10 w-full rounded-md border border-[#cbd5e1] bg-slate-100 px-3 text-sm text-slate-700"
              />
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-[#E6EBFF] bg-white p-4 shadow-[0_10px_30px_-28px_rgba(15,23,42,0.8)] sm:p-5">
          <h2 className="text-lg font-semibold text-[#33458F] sm:text-xl">Bundle Data</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-lg border border-[#E6EBFF] bg-[#f8fbff] p-3"
              >
                <p className="text-xs text-slate-500">{metric.label}</p>
                <p className="mt-1 text-lg font-semibold text-[#3347A8]">{metric.value}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-[#E6EBFF] bg-white p-4 shadow-[0_10px_30px_-28px_rgba(15,23,42,0.8)] sm:p-5">
          <h2 className="text-lg font-semibold text-[#33458F] sm:text-xl">Bundle Items</h2>

          {bundle.bundleItems.length > 0 ? (
            <div className="mt-3 space-y-2.5">
              {bundle.bundleItems.map((item, index) => (
                <div
                  key={`${bundle.id}-${item.productId}-${index}`}
                  className="rounded-lg border border-[#E6EBFF] bg-[#f8fbff] p-3"
                >
                  <div className="flex items-start gap-2.5">
                    <ProductThumbnail name={item.name} image={item.image} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                        {item.name}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <p className="mb-1 text-[11px] font-medium text-slate-500">Product</p>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={item.name}
                        className="h-9 w-full rounded-md border border-[#cbd5e1] bg-slate-100 px-2.5 text-xs text-slate-700"
                      />
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-medium text-slate-500">Quantity</p>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={`${item.quantity}`}
                        className="h-9 w-full rounded-md border border-[#cbd5e1] bg-slate-100 px-2.5 text-xs text-slate-700"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-[#D0DBF7] bg-[#f8fbff] px-3 py-5 text-sm text-slate-500">
              No products in this bundle..
            </div>
          )}
        </article>
      </div>
    </section>
  )
}

export default ViewBundleDealPage

