import { useMemo, useState } from 'react'
import type { DiscountCampaignRow, PromotionStatus } from './types'

type DiscountPromotionListSectionProps = {
  promotions: DiscountCampaignRow[]
  onEditPromotion?: (promotion: DiscountCampaignRow) => void
  onViewPromotion?: (promotion: DiscountCampaignRow) => void
  onDeletePromotion?: (promotion: DiscountCampaignRow) => Promise<void> | void
}

type SearchField = 'Promotion Name' | 'Promotion Type'
type SortField = 'Latest End Date' | 'Status'

const statusClasses: Record<PromotionStatus, string> = {
  Ongoing: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Upcoming: 'border-[#D0DBF7] bg-[#F2F4FF] text-[#3347A8]',
  Expired: 'border-slate-300 bg-slate-100 text-slate-600',
}

const statusPriority: Record<PromotionStatus, number> = {
  Ongoing: 0,
  Upcoming: 1,
  Expired: 2,
}

const productThumbClasses = [
  'bg-gradient-to-br from-[#E6EBFF] to-[#D0DBF7] text-[#2F3F7E]',
  'bg-gradient-to-br from-[#e0f2fe] to-[#D0DBF7] text-[#0c4a6e]',
  'bg-gradient-to-br from-[#dcfce7] to-[#bbf7d0] text-[#14532d]',
  'bg-gradient-to-br from-[#ede9fe] to-[#ddd6fe] text-[#4c1d95]',
]

function parsePeriodDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/.exec(value)
  if (!match) return 0

  const day = Number(match[1])
  const month = Number(match[2]) - 1
  const year = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])

  return new Date(year, month, day, hour, minute, 0, 0).getTime()
}

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

function ProductTagList({ products }: { products: string[] }) {
  const visibleProducts = products.slice(0, 2)
  const hiddenCount = Math.max(products.length - visibleProducts.length, 0)

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleProducts.map((product, index) => (
        <span
          key={`${product}-${index}`}
          className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600"
          title={product}
        >
          {product}
        </span>
      ))}
      {hiddenCount > 0 ? (
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">
          +{hiddenCount} more
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
  const [sortField, setSortField] = useState<SortField>('Latest End Date')

  const filteredPromotions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const normalizedDateRange = dateRange.trim().toLowerCase()

    const results = promotions.filter((promotion) => {
      const searchHaystack =
        searchField === 'Promotion Type'
          ? promotion.type.toLowerCase()
          : promotion.name.toLowerCase()

      if (normalizedQuery.length > 0 && !searchHaystack.includes(normalizedQuery)) {
        return false
      }

      if (normalizedDateRange.length > 0) {
        const dateHaystack = `${promotion.period.start} ${promotion.period.end}`.toLowerCase()
        if (!dateHaystack.includes(normalizedDateRange)) {
          return false
        }
      }

      return true
    })

    if (sortField === 'Status') {
      return [...results].sort((left, right) => statusPriority[left.status] - statusPriority[right.status])
    }

    return [...results].sort(
      (left, right) => parsePeriodDate(right.period.end) - parsePeriodDate(left.period.end),
    )
  }, [dateRange, promotions, query, searchField, sortField])

  const handleReset = () => {
    setSearchField('Promotion Name')
    setQuery('')
    setDateRange('')
    setSortField('Latest End Date')
  }

  const handleActionClick = (promotion: DiscountCampaignRow, action: string) => {
    if (action === 'Edit') {
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
    return isDelete ? 'text-[#dc4f1f] hover:text-[#c2410c]' : 'text-[#3A56C5] hover:text-[#3347A8]'
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#33458F]">Promotion List</h2>
          <p className="mt-1 text-sm text-slate-500">Monitor and manage discount campaigns in one table.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
            Total {filteredPromotions.length}
          </span>
          <label htmlFor="discount-sort" className="font-medium">
            Sort:
          </label>
          <select
            id="discount-sort"
            value={sortField}
            onChange={(event) => setSortField(event.target.value as SortField)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none transition focus:border-[#93a4d8]"
          >
            <option>Latest End Date</option>
            <option>Status</option>
          </select>
        </div>
      </div>

      <div className="mt-4 grid gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 lg:grid-cols-[220px_minmax(0,1fr)_280px_auto]">
        <select
          value={searchField}
          onChange={(event) => setSearchField(event.target.value as SearchField)}
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#93a4d8]"
        >
          <option>Promotion Name</option>
          <option>Promotion Type</option>
        </select>

        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search promotion..."
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#93a4d8]"
        />

        <input
          type="text"
          value={dateRange}
          onChange={(event) => setDateRange(event.target.value)}
          placeholder="Start time to End Time"
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#93a4d8]"
        />

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md bg-[#3A56C5] px-3.5 text-sm font-semibold text-white transition hover:bg-[#3347A8]"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
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
              className="rounded-xl border border-[#E6EBFF] bg-[#f8fbff] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClasses[promotion.status]}`}
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
        <table className="min-w-[980px] w-full border-separate border-spacing-0 rounded-xl border border-slate-200 bg-white">
          <thead>
            <tr className="bg-slate-50 text-left text-[11px] uppercase tracking-[0.08em] text-slate-500">
              <th className="px-4 py-3 font-semibold">Promotion Name</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Products</th>
              <th className="px-4 py-3 font-semibold">Period</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPromotions.length > 0 ? (
              filteredPromotions.map((promotion) => (
                <tr
                  key={promotion.id}
                  className="align-top text-sm text-slate-700 transition hover:bg-slate-50/70"
                >
                  <td className="border-t border-slate-100 px-4 py-3.5">
                    <div className="space-y-1">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClasses[promotion.status]}`}
                      >
                        {promotion.status}
                      </span>
                      <p className="font-semibold text-slate-900">{promotion.name}</p>
                    </div>
                  </td>
                  <td className="border-t border-slate-100 px-4 py-3.5">
                    <span className="inline-flex rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">
                      {promotion.type}
                    </span>
                  </td>
                  <td className="border-t border-slate-100 px-4 py-3.5">
                    <ProductTagList products={promotion.products} />
                  </td>
                  <td className="border-t border-slate-100 px-4 py-3.5 text-xs text-slate-600">
                    <p className="font-medium text-slate-700">{promotion.period.start}</p>
                    <p className="mt-1">{promotion.period.end}</p>
                  </td>
                  <td className="border-t border-slate-100 px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5 text-sm">
                      {promotion.actions.map((action, index) => (
                        <span key={`${promotion.id}-${action}`} className="inline-flex items-center gap-1.5">
                          {index > 0 ? <span className="text-slate-300">-</span> : null}
                          <button
                            type="button"
                            onClick={() => handleActionClick(promotion, action)}
                            className={`font-medium transition ${getActionClassName(action)}`}
                          >
                            {action}
                          </button>
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-12 text-center text-sm text-slate-500" colSpan={5}>
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
