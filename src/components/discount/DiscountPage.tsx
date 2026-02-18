import { useMemo, useState } from 'react'
import DiscountCreateSection from './DiscountCreateSection'
import DiscountMobilePanel from './DiscountMobilePanel'
import DiscountPerformanceSection from './DiscountPerformanceSection'
import DiscountPromotionListSection from './DiscountPromotionListSection'
import {
  discountCreationTools,
  promotionPerformanceDateLabel,
  promotionPerformanceMetrics,
  promotionRows,
  promotionTabs,
} from './data'
import type { DiscountPromotionTab, DiscountToolType, PromotionRow } from './types'

type DiscountPageProps = {
  onBack: () => void
  onCreateTool?: (type: DiscountToolType) => void
  onEditPromotion?: (promotion: PromotionRow) => void
  onViewPromotion?: (promotion: PromotionRow) => void
}

function DiscountPage({
  onBack,
  onCreateTool,
  onEditPromotion,
  onViewPromotion,
}: DiscountPageProps) {
  const [activeTab, setActiveTab] = useState<DiscountPromotionTab>('All')

  const tabPromotions = useMemo(
    () =>
      activeTab === 'All'
        ? promotionRows
        : promotionRows.filter((promotion) => promotion.type === activeTab),
    [activeTab],
  )

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
