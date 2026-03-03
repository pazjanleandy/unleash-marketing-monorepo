import { useEffect, useMemo, useState } from 'react'
import DiscountCreateSection from './DiscountCreateSection'
import DiscountMobilePanel from './DiscountMobilePanel'
import DiscountPerformanceSection from './DiscountPerformanceSection'
import DiscountPromotionListSection from './DiscountPromotionListSection'
import type { DiscountCreateTool, DiscountPromotionTab, DiscountToolType, PromotionMetric, PromotionRow } from './types'
import { listDiscountPromotions } from '../../services/market/discounts.repo'

type DiscountPageProps = {
  onBack: () => void
  onCreateTool?: (type: DiscountToolType) => void
  onEditPromotion?: (promotion: PromotionRow) => void
  onViewPromotion?: (promotion: PromotionRow) => void
}

const discountCreationTools: DiscountCreateTool[] = [
  {
    type: 'discount-promotions',
    title: 'Discount Promotions',
    description: 'Set a discount for a single product.',
  },
  {
    type: 'bundle-deal',
    title: 'Bundle Deal',
    description: 'Set discounts for your products as bundles to increase average basket size.',
  },
  {
    type: 'add-on-deal',
    title: 'Add-on Deal',
    description: 'Set a discount for products to be sold together.',
  },
]

const promotionTabs: DiscountPromotionTab[] = [
  'All',
  'Discount Promotions',
  'Bundle Deal',
  'Add-on Deal',
]

function DiscountPage({
  onBack,
  onCreateTool,
  onEditPromotion,
  onViewPromotion,
}: DiscountPageProps) {
  const [activeTab, setActiveTab] = useState<DiscountPromotionTab>('All')
  const [promotionRows, setPromotionRows] = useState<PromotionRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authRequired, setAuthRequired] = useState(false)
  const [noShop, setNoShop] = useState(false)

  useEffect(() => {
    let alive = true

    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await listDiscountPromotions()
        if (!alive) {
          return
        }
        setPromotionRows(result.items)
        setAuthRequired(result.authRequired)
        setNoShop(result.noShop)
      } catch (loadError) {
        if (!alive) {
          return
        }
        setPromotionRows([])
        setAuthRequired(false)
        setNoShop(false)
        setError(loadError instanceof Error ? loadError.message : 'Unable to load discount data.')
      } finally {
        if (alive) {
          setIsLoading(false)
        }
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  const tabPromotions = useMemo(
    () =>
      activeTab === 'All'
        ? promotionRows
        : promotionRows.filter((promotion) => promotion.type === activeTab),
    [activeTab, promotionRows],
  )

  const promotionPerformanceDateLabel = useMemo(() => {
    const now = new Date()
    const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const format = (value: Date) => {
      const day = `${value.getDate()}`.padStart(2, '0')
      const month = `${value.getMonth() + 1}`.padStart(2, '0')
      const year = value.getFullYear()
      return `${day}-${month}-${year}`
    }
    return `Data from ${format(past)} to ${format(now)} GMT+8`
  }, [])

  const promotionPerformanceMetrics = useMemo<PromotionMetric[]>(() => {
    const rows = promotionRows.length
    const ongoing = promotionRows.filter((item) => item.status === 'Ongoing').length
    const upcoming = promotionRows.filter((item) => item.status === 'Upcoming').length
    const expired = promotionRows.filter((item) => item.status === 'Expired').length

    return [
      {
        label: 'Promotions',
        value: `${rows}`,
        comparisonLabel: 'Current total',
        comparisonValue: 'Live',
      },
      {
        label: 'Ongoing',
        value: `${ongoing}`,
        comparisonLabel: 'Current total',
        comparisonValue: 'Live',
      },
      {
        label: 'Upcoming',
        value: `${upcoming}`,
        comparisonLabel: 'Current total',
        comparisonValue: 'Live',
      },
      {
        label: 'Expired',
        value: `${expired}`,
        comparisonLabel: 'Current total',
        comparisonValue: 'Live',
      },
    ]
  }, [promotionRows])

  const showDataState = isLoading || Boolean(error) || authRequired || noShop

  return (
    <section
      className="motion-rise min-h-[calc(100vh-2.5rem)] rounded-3xl border border-slate-200/80 bg-white/95 p-3 pb-24 shadow-[0_24px_50px_-45px_rgba(15,23,42,0.65)] sm:min-h-0 sm:p-8 sm:pb-8"
      style={{ animationDelay: '80ms' }}
    >
      <DiscountMobilePanel
        onBack={onBack}
        promotions={promotionRows}
        onCreateTool={onCreateTool}
        onEditPromotion={onEditPromotion}
        onViewPromotion={onViewPromotion}
      />
      {showDataState ? (
        <div className="mb-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:hidden">
          {isLoading ? (
            <p>Loading promotions...</p>
          ) : error ? (
            <p>{error}</p>
          ) : authRequired ? (
            <p>Sign in to view discount promotions.</p>
          ) : noShop ? (
            <p>No shop found for this account.</p>
          ) : null}
        </div>
      ) : null}

      <div className="hidden sm:block">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center rounded-full bg-[#eff6ff] px-3 py-1.5 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe]"
        >
          &larr; Back to Marketing Centre
        </button>

        <div className="mt-4 rounded-2xl border border-[#dbeafe] bg-gradient-to-r from-[#eff6ff] via-[#dbeafe] to-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
            Home &gt; Marketing Centre &gt; Discount
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[#1E40AF]">Discount</h1>
          <p className="mt-1.5 text-sm text-[#1d4ed8]">
            Manage discount promotions and performance insights for Unleash.
          </p>
        </div>

        <div className="mt-4 space-y-4">
          {showDataState ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              {isLoading ? (
                <p>Loading promotions...</p>
              ) : error ? (
                <p>{error}</p>
              ) : authRequired ? (
                <p>Sign in to view discount promotions.</p>
              ) : noShop ? (
                <p>No shop found for this account.</p>
              ) : null}
            </div>
          ) : null}

          <DiscountCreateSection
            tools={discountCreationTools}
            onCreateTool={onCreateTool}
          />

          <article className="rounded-2xl border border-[#dbeafe] bg-white p-2 shadow-[0_14px_30px_-28px_rgba(37,99,235,0.8)] sm:p-3">
            <div className="flex gap-1 overflow-x-auto">
              {promotionTabs.map((tab) => {
                const isActive = tab === activeTab

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`inline-flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-[#2563EB] text-white shadow-[0_8px_18px_-12px_rgba(30,64,175,0.9)]'
                        : 'text-[#1d4ed8] hover:bg-[#eff6ff]'
                    }`}
                  >
                    {tab}
                  </button>
                )
              })}
            </div>
          </article>

          <DiscountPerformanceSection
            dateLabel={promotionPerformanceDateLabel}
            metrics={promotionPerformanceMetrics}
          />

          <DiscountPromotionListSection
            promotions={tabPromotions}
            onEditPromotion={onEditPromotion}
            onViewPromotion={onViewPromotion}
          />
        </div>
      </div>
    </section>
  )
}

export default DiscountPage
