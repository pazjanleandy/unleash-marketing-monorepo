import { useMemo } from 'react'
import type { PromotionRow } from '../types'

type ViewDiscountPromotionPageProps = {
  onBack: () => void
  promotion: PromotionRow
}

type ProductMeta = {
  category: string
  price: number
}

function toCurrency(value: number) {
  return `₱${value.toFixed(2)}`
}

function getProductMeta(name: string): ProductMeta {
  return { category: 'Product', price: Math.max(name.length, 1) }
}

function ProductPreviewShape({ label }: { label: string }) {
  return (
    <div className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-md border border-[#bfdbfe] bg-gradient-to-br from-[#eff6ff] to-[#bfdbfe] text-xs font-bold text-[#1d4ed8] shadow-[0_8px_14px_-12px_rgba(30,64,175,0.9)]">
      {label.slice(0, 1).toUpperCase()}
    </div>
  )
}

function ViewDiscountPromotionPage({
  onBack,
  promotion,
}: ViewDiscountPromotionPageProps) {
  const metrics = useMemo(() => {
    const base = Math.max(promotion.products.length, 1)
    const availed = promotion.status === 'Expired' ? base * 21 : base * 9
    const buyers = Math.max(Math.floor(availed * 0.68), 1)
    const orders = Math.max(Math.floor(availed * 0.81), 1)
    const sales = orders * 17.5

    return [
      { label: 'Availed', value: `${availed}` },
      { label: 'Buyers', value: `${buyers}` },
      { label: 'Orders', value: `${orders}` },
      { label: 'Sales', value: toCurrency(sales) },
    ]
  }, [promotion])

  const productRows = useMemo(
    () =>
      promotion.products.map((name, index) => {
        const meta = getProductMeta(name)
        const discountPercent = `${Math.min(10 + index * 5, 45)}`
        const discountedPrice =
          meta.price * (1 - Number(discountPercent) / 100)

        return {
          id: `${promotion.name}-${name}-${index}`,
          name,
          category: meta.category,
          price: meta.price,
          discountPercent,
          discountedPrice,
        }
      }),
    [promotion],
  )

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
              <h1 className="text-[22px] font-semibold leading-none text-slate-900">
                View Discount
              </h1>
              <p className="mt-1 text-xs text-[#1d4ed8]">
                Details are read-only for this promotion.
              </p>
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
            Home &gt; Marketing Centre &gt; Discount &gt; View Discount
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[#1E40AF]">View Discount</h1>
        </header>
      </div>

      <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
        <article className="rounded-xl border border-[#dbeafe] bg-white p-4 shadow-[0_10px_30px_-28px_rgba(15,23,42,0.8)] sm:p-5">
          <h2 className="text-lg font-semibold text-[#1E40AF] sm:text-xl">
            Basic Information
          </h2>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Promotion Name</p>
              <input
                type="text"
                readOnly
                disabled
                value={promotion.name}
                className="h-10 w-full rounded-md border border-[#cbd5e1] bg-slate-100 px-3 text-sm text-slate-700"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Promotion Type</p>
              <input
                type="text"
                readOnly
                disabled
                value={promotion.type}
                className="h-10 w-full rounded-md border border-[#cbd5e1] bg-slate-100 px-3 text-sm text-slate-700"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Start Time</p>
              <input
                type="text"
                readOnly
                disabled
                value={promotion.period.start}
                className="h-10 w-full rounded-md border border-[#cbd5e1] bg-slate-100 px-3 text-sm text-slate-700"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">End Time</p>
              <input
                type="text"
                readOnly
                disabled
                value={promotion.period.end}
                className="h-10 w-full rounded-md border border-[#cbd5e1] bg-slate-100 px-3 text-sm text-slate-700"
              />
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-[#dbeafe] bg-white p-4 shadow-[0_10px_30px_-28px_rgba(15,23,42,0.8)] sm:p-5">
          <h2 className="text-lg font-semibold text-[#1E40AF] sm:text-xl">
            Promotion Data
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-lg border border-[#dbeafe] bg-[#f8fbff] p-3"
              >
                <p className="text-xs text-slate-500">{metric.label}</p>
                <p className="mt-1 text-lg font-semibold text-[#1d4ed8]">{metric.value}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-[#dbeafe] bg-white p-4 shadow-[0_10px_30px_-28px_rgba(15,23,42,0.8)] sm:p-5">
          <h2 className="text-lg font-semibold text-[#1E40AF] sm:text-xl">Products</h2>

          {productRows.length > 0 ? (
            <div className="mt-3 space-y-2.5">
              {productRows.map((product) => (
                <div
                  key={product.id}
                  className="rounded-lg border border-[#dbeafe] bg-[#f8fbff] p-3"
                >
                  <div className="flex items-start gap-2.5">
                    <ProductPreviewShape label={product.name} />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                        {product.name}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{product.category}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div>
                      <p className="mb-1 text-[11px] font-medium text-slate-500">Original</p>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={toCurrency(product.price)}
                        className="h-9 w-full rounded-md border border-[#cbd5e1] bg-slate-100 px-2.5 text-xs text-slate-700"
                      />
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-medium text-slate-500">Discount</p>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={`${product.discountPercent}% OFF`}
                        className="h-9 w-full rounded-md border border-[#cbd5e1] bg-slate-100 px-2.5 text-xs text-slate-700"
                      />
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-medium text-slate-500">Discounted</p>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={toCurrency(product.discountedPrice)}
                        className="h-9 w-full rounded-md border border-[#cbd5e1] bg-slate-100 px-2.5 text-xs font-semibold text-[#1d4ed8]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-dashed border-[#bfdbfe] bg-[#f8fbff] px-3 py-5 text-sm text-slate-500">
              No products in this promotion.
            </div>
          )}
        </article>
      </div>
    </section>
  )
}

export default ViewDiscountPromotionPage

