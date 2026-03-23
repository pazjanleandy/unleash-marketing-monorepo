import { useCallback, useEffect, useMemo, useState } from 'react'
import DiscountCreateSection from './DiscountCreateSection'
import DiscountMobilePanel from './DiscountMobilePanel'
import DiscountPerformanceSection from './DiscountPerformanceSection'
import DiscountPromotionListSection from './DiscountPromotionListSection'
import type {
  DiscountCreateTool,
  DiscountPromotionTab,
  DiscountToolType,
  PromotionMetric,
  DiscountCampaignRow,
} from './types'
import { listDiscountCampaigns } from '../../services/market/discounts.repo'

type DiscountPageProps = {
  onBack: () => void
  onCreateTool?: (type: DiscountToolType) => void
  onEditPromotion?: (promotion: DiscountCampaignRow) => void
  onViewPromotion?: (promotion: DiscountCampaignRow) => void
  onDeletePromotion?: (promotion: DiscountCampaignRow) => Promise<void> | void
}

const discountCreationTools: DiscountCreateTool[] = [
  {
    type: 'discount-promotions',
    title: 'Discount Promotions',
    description: 'Set a discount for a single product.',
    metaTag: 'Single Product',
  },
  {
    type: 'bundle-deal',
    title: 'Bundle Deal',
    description: 'Set discounts for your products as bundles to increase average basket size.',
    metaTag: 'Bundle',
  },
  {
    type: 'add-on-deal',
    title: 'Add-on Deal',
    description: 'Set a discount for products to be sold together.',
    metaTag: 'Cross-sell',
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
  onDeletePromotion,
}: DiscountPageProps) {
  const [activeTab, setActiveTab] = useState<DiscountPromotionTab>('All')
  const [promotionRows, setPromotionRows] = useState<DiscountCampaignRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authRequired, setAuthRequired] = useState(false)
  const [noShop, setNoShop] = useState(false)

  const loadPromotions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await listDiscountCampaigns()
      setPromotionRows(result.items)
      setAuthRequired(result.authRequired)
      setNoShop(result.noShop)
    } catch (loadError) {
      setPromotionRows([])
      setAuthRequired(false)
      setNoShop(false)
      setError(loadError instanceof Error ? loadError.message : 'Unable to load discount data.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPromotions()
  }, [loadPromotions])

  const handleDeletePromotion = async (promotion: DiscountCampaignRow) => {
    const shouldDelete = window.confirm(`Delete promotion "${promotion.name}"?`)
    if (!shouldDelete) {
      return
    }

    try {
      if (onDeletePromotion) {
        await onDeletePromotion(promotion)
      }
      await loadPromotions()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete promotion.')
    }
  }

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
        comparisonValue: 'Live campaigns',
        tone: 'neutral',
      },
      {
        label: 'Ongoing',
        value: `${ongoing}`,
        comparisonLabel: 'Current total',
        comparisonValue: 'Running now',
        tone: 'ongoing',
      },
      {
        label: 'Upcoming',
        value: `${upcoming}`,
        comparisonLabel: 'Current total',
        comparisonValue: 'Scheduled',
        tone: 'upcoming',
      },
      {
        label: 'Expired',
        value: `${expired}`,
        comparisonLabel: 'Current total',
        comparisonValue: 'Ended',
        tone: 'expired',
      },
    ]
  }, [promotionRows])

  const promotionSummary = useMemo(() => {
    const ongoing = promotionRows.filter((item) => item.status === 'Ongoing').length
    const expired = promotionRows.filter((item) => item.status === 'Expired').length

    return {
      total: promotionRows.length,
      ongoing,
      expired,
    }
  }, [promotionRows])

  const showDataState = isLoading || Boolean(error) || authRequired || noShop

  return (
    <section
      className="motion-rise min-h-[calc(100vh-2.5rem)] rounded-2xl border border-slate-200/80 bg-white p-3 pb-24 shadow-[0_18px_38px_-34px_rgba(15,23,42,0.45)] sm:min-h-0 sm:p-6 sm:pb-6"
      style={{ animationDelay: '80ms' }}
    >
      <DiscountMobilePanel
        onBack={onBack}
        promotions={promotionRows}
        onCreateTool={onCreateTool}
        onEditPromotion={onEditPromotion}
        onViewPromotion={onViewPromotion}
        onDeletePromotion={handleDeletePromotion}
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
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#3347A8]">
                Home &gt; Marketing Centre &gt; Discount
              </p>
              <h1 className="mt-1.5 text-[30px] font-semibold leading-tight text-[#33458F]">Discount</h1>
              <p className="mt-1 text-sm text-slate-600">
                Manage discount promotions and performance insights for your shop.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  Promotions: {promotionSummary.total}
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  Ongoing: {promotionSummary.ongoing}
                </span>
                <span className="rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  Expired: {promotionSummary.expired}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onCreateTool?.('discount-promotions')}
              className="inline-flex h-10 items-center rounded-lg bg-[#3A56C5] px-4 text-sm font-semibold text-white shadow-[0_10px_22px_-14px_rgba(58,86,197,0.75)] transition hover:bg-[#3347A8]"
            >
              Create Promotion
            </button>
          </div>
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

          <article className="rounded-xl border border-slate-200 bg-white p-1.5">
            <div className="scrollbar-hide overflow-x-auto">
              <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100/80 p-1">
                {promotionTabs.map((tab) => {
                  const isActive = tab === activeTab

                  return (
                    <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`inline-flex h-9 shrink-0 items-center rounded-md px-3.5 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-white text-[#3347A8] shadow-[0_8px_16px_-12px_rgba(15,23,42,0.75)]'
                        : 'text-slate-600 hover:bg-white hover:text-slate-800'
                    }`}
                    >
                      {tab}
                    </button>
                  )
                })}
              </div>
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
            onDeletePromotion={handleDeletePromotion}
          />
        </div>
      </div>
    </section>
  )
}

export default DiscountPage

