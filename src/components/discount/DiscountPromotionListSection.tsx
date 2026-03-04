import { useMemo, useState } from 'react'
import type { PromotionRow, PromotionStatus } from './types'

type DiscountPromotionListSectionProps = {
  promotions: PromotionRow[]
  onEditPromotion?: (promotion: PromotionRow) => void
  onViewPromotion?: (promotion: PromotionRow) => void
  onDeletePromotion?: (promotion: PromotionRow) => Promise<void> | void
}

type SearchField = 'Promotion Name' | 'Promotion Type'

const statusClasses: Record<PromotionStatus, string> = {
  Ongoing: 'bg-[#dcfce7] text-[#15803d]',
  Upcoming: 'bg-[#dbeafe] text-[#1d4ed8]',
  Expired: 'bg-slate-200 text-slate-700',
}

const productThumbClasses = [
  'bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe] text-[#1e3a8a]',
  'bg-gradient-to-br from-[#e0f2fe] to-[#bfdbfe] text-[#0c4a6e]',
  'bg-gradient-to-br from-[#dcfce7] to-[#bbf7d0] text-[#14532d]',
  'bg-gradient-to-br from-[#ede9fe] to-[#ddd6fe] text-[#4c1d95]',
]

function ProductThumbnails({ products }: { products: string[] }) {
  const visibleProducts = products.slice(0, 4)
  const hiddenCount = Math.max(products.length - visibleProducts.length, 0)

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleProducts.map((product, index) => (
        <span
          key={`${product}-${index}`}
          className={`inline-flex h-7 min-w-7 items-center justify-center rounded border border-white px-1.5 text-[10px] font-semibold shadow ${productThumbClasses[index % productThumbClasses.length]}`}
          title={product}
        >
          {product.slice(0, 2).toUpperCase()}
        </span>
      ))}
      {hiddenCount > 0 ? (
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded border border-white bg-slate-200 px-1.5 text-[10px] font-semibold text-slate-700 shadow">
          +{hiddenCount}
        </span>
      ) : null}
    </div>
  )
}

function DiscountPromotionListSection({
  promotions,
  onEditPromotion,
  onViewPromotion,
  onDeletePromotion,
}: DiscountPromotionListSectionProps) {
  const [searchField, setSearchField] = useState<SearchField>('Promotion Name')
  const [query, setQuery] = useState('')
  const [dateRange, setDateRange] = useState('')

  const filteredPromotions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (normalizedQuery.length === 0) {
      return promotions
    }

    return promotions.filter((promotion) => {
      const haystack =
        searchField === 'Promotion Type'
          ? promotion.type.toLowerCase()
          : promotion.name.toLowerCase()

      return haystack.includes(normalizedQuery)
    })
  }, [promotions, query, searchField])

  const handleReset = () => {
    setSearchField('Promotion Name')
    setQuery('')
    setDateRange('')
  }

  const handleActionClick = (promotion: PromotionRow, action: string) => {
    if (action === 'Edit' && promotion.type === 'Discount Promotions') {
      onEditPromotion?.(promotion)
      return
    }

    if (action === 'View') {
      onViewPromotion?.(promotion)
      return
    }

    if (action === 'Delete') {
      void onDeletePromotion?.(promotion)
    }
  }

  const getActionClassName = (action: string) => {
    const isDelete = action.trim().toLowerCase() === 'delete'

    return isDelete
      ? 'text-[#dc4f1f] hover:text-[#c2410c]'
      : 'text-[#2563EB] hover:text-[#1d4ed8]'
  }

  return (
    <article className="rounded-2xl border border-[#dbeafe] bg-white p-4 shadow-[0_14px_30px_-28px_rgba(37,99,235,0.8)] sm:p-5">
      <h2 className="text-xl font-semibold text-[#1E40AF]">Promotion List</h2>

      <div className="mt-4 grid gap-2.5 rounded-xl border border-[#dbeafe] bg-[#f8fbff] p-3 lg:grid-cols-[minmax(0,1fr)_240px_auto]">
        <div className="grid gap-2 sm:grid-cols-[170px_minmax(0,1fr)]">
          <select
            value={searchField}
            onChange={(event) => setSearchField(event.target.value as SearchField)}
            className="h-10 rounded-md border border-[#cbd5e1] bg-white px-3 text-sm text-slate-700 focus:border-[#64748b] focus:outline-none"
          >
            <option>Promotion Name</option>
            <option>Promotion Type</option>
          </select>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Input"
            className="h-10 rounded-md border border-[#cbd5e1] bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#64748b] focus:outline-none"
          />
        </div>

        <input
          type="text"
          value={dateRange}
          onChange={(event) => setDateRange(event.target.value)}
          placeholder="Start time to End Time"
          className="h-10 rounded-md border border-[#cbd5e1] bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#64748b] focus:outline-none"
        />

        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex h-10 items-center rounded-md bg-[#2563EB] px-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-10 items-center rounded-md border border-[#cbd5e1] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-4 sm:hidden">
        <div className="space-y-3">
          {filteredPromotions.map((promotion) => (
            <article
              key={promotion.id}
              className="rounded-xl border border-[#dbeafe] bg-[#f8fbff] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClasses[promotion.status]}`}
                  >
                    {promotion.status}
                  </span>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{promotion.name}</p>
                  <p className="text-xs text-slate-600">{promotion.type}</p>
                </div>
                <ProductThumbnails products={promotion.products} />
              </div>

              <div className="mt-2 text-xs text-slate-600">
                <p>{promotion.period.start}</p>
                <p>{promotion.period.end}</p>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {promotion.actions.map((action) => (
                  <button
                    key={`${promotion.id}-${action}`}
                    type="button"
                    onClick={() => handleActionClick(promotion, action)}
                    className={`text-xs font-medium transition ${getActionClassName(action)}`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-4 hidden overflow-x-auto sm:block">
        <table className="min-w-[940px] w-full border-separate border-spacing-0 rounded-xl border border-[#dbeafe] bg-white">
          <thead>
            <tr className="bg-[#f8fbff] text-left text-xs uppercase tracking-wide text-[#1d4ed8]">
              <th className="px-3 py-3 font-semibold">Promotion Name</th>
              <th className="px-3 py-3 font-semibold">Promotion Type</th>
              <th className="px-3 py-3 font-semibold">Products</th>
              <th className="px-3 py-3 font-semibold">Period</th>
              <th className="px-3 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPromotions.length > 0 ? (
              filteredPromotions.map((promotion) => (
                <tr key={promotion.id} className="align-top text-sm text-slate-700">
                  <td className="px-3 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClasses[promotion.status]}`}
                    >
                      {promotion.status}
                    </span>
                    <p className="mt-1 font-semibold text-slate-900">{promotion.name}</p>
                  </td>
                  <td className="px-3 py-3.5">{promotion.type}</td>
                  <td className="px-3 py-3.5">
                    <ProductThumbnails products={promotion.products} />
                  </td>
                  <td className="px-3 py-3.5 text-xs text-slate-600">
                    <p>{promotion.period.start}</p>
                    <p className="mt-1">{promotion.period.end}</p>
                  </td>
                  <td className="px-3 py-3.5">
                    <ul className="space-y-1.5">
                      {promotion.actions.map((action) => (
                        <li key={`${promotion.id}-${action}`}>
                          <button
                            type="button"
                            onClick={() => handleActionClick(promotion, action)}
                            className={`text-sm font-medium transition ${getActionClassName(action)}`}
                          >
                            {action}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-10 text-center text-sm text-slate-500" colSpan={5}>
                  No promotions found for your current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  )
}

export default DiscountPromotionListSection
