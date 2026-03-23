import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import ProductThumbnail from '../common/ProductThumbnail'
import type {
  DiscountToolType,
  DiscountCampaignRow,
  DiscountProductPreview,
  PromotionStatus,
} from './types'

type DiscountMobilePanelProps = {
  onBack: () => void
  promotions: DiscountCampaignRow[]
  onCreateTool?: (type: DiscountToolType) => void
  onEditPromotion?: (promotion: DiscountCampaignRow) => void
  onViewPromotion?: (promotion: DiscountCampaignRow) => void
  onDeletePromotion?: (promotion: DiscountCampaignRow) => Promise<void> | void
}

const mobileStatusTabs: PromotionStatus[] = ['Upcoming', 'Ongoing', 'Expired']
const createDiscountChoices: {
  type: DiscountToolType
  label: string
}[] = [
  { type: 'discount-promotions', label: 'Discount Promotions' },
  { type: 'bundle-deal', label: 'Bundle Deal' },
  { type: 'add-on-deal', label: 'Add-on Deal' },
] as const

const statusTextClasses: Record<PromotionStatus, string> = {
  Upcoming: 'text-slate-900',
  Ongoing: 'text-slate-900',
  Expired: 'text-slate-900',
}

function ProductThumbnailGroup({ products }: { products: DiscountProductPreview[] }) {
  if (products.length === 0) {
    return null
  }

  const visible = products.slice(0, 3)
  const overflow = Math.max(products.length - visible.length, 0)
  const single = products.length === 1

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">
        Products
      </span>
      <div className="flex items-center gap-1.5">
        {visible.map((product, index) => (
          <ProductThumbnail
            key={`${product.id}-${index}`}
            name={product.name}
            image={product.image}
            size={single ? 'md' : 'sm'}
            className="border-slate-200 bg-white shadow-none"
          />
        ))}
        {overflow > 0 ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-[11px] font-semibold text-slate-600">
            +{overflow}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function DiscountMobilePanel({
  onBack,
  promotions,
  onCreateTool,
  onEditPromotion,
  onViewPromotion,
  onDeletePromotion,
}: DiscountMobilePanelProps) {
  const [activeStatus, setActiveStatus] = useState<PromotionStatus>('Upcoming')
  const [isCreateChoiceOpen, setIsCreateChoiceOpen] = useState(false)

  const activePromotions = useMemo(
    () => promotions.filter((promotion) => promotion.status === activeStatus),
    [activeStatus, promotions],
  )

  const handleCreateChoiceSelect = (type: DiscountToolType) => {
    setIsCreateChoiceOpen(false)
    onCreateTool?.(type)
  }

  useEffect(() => {
    if (!isCreateChoiceOpen) {
      return
    }

    const originalOverflow = document.body.style.overflow
    const originalTouchAction = document.body.style.touchAction

    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.touchAction = originalTouchAction
    }
  }, [isCreateChoiceOpen])

  const createTypeModal =
    isCreateChoiceOpen && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-[80]">
            <button
              type="button"
              aria-label="Close create discount options"
              onClick={() => setIsCreateChoiceOpen(false)}
              className="absolute inset-0 bg-black/50"
            />

            <div className="absolute inset-x-3 bottom-16 z-[90] rounded-xl border border-slate-200 bg-white p-2 shadow-[0_20px_32px_-18px_rgba(15,23,42,0.35)]">
              <p className="px-1 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Create Discount Type
              </p>
              <div className="mt-1 space-y-1.5">
                {createDiscountChoices.map((choice) => (
                  <button
                    key={choice.type}
                    type="button"
                    onClick={() => handleCreateChoiceSelect(choice.type)}
                    className="inline-flex h-10 w-full items-center justify-start rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <div className="sm:hidden flex min-h-[calc(100vh-7.5rem)] flex-col">
      <article className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_30px_-24px_rgba(15,23,42,0.24)]">
        <header className="border-b border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-base font-semibold text-slate-700 transition hover:bg-slate-200"
              aria-label="Back to Marketing Centre"
            >
              &larr;
            </button>
            <h1 className="text-sm font-semibold text-slate-900">Discount Promotions</h1>
          </div>

          <div className="mt-2 grid grid-cols-3">
            {mobileStatusTabs.map((status) => {
              const isActive = status === activeStatus

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setActiveStatus(status)}
                  className={`relative h-8 text-[11px] font-semibold transition ${
                    isActive ? 'text-slate-900' : statusTextClasses[status]
                  }`}
                >
                  {status}
                  {isActive ? (
                    <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#3A56C5]" />
                  ) : null}
                </button>
              )
            })}
          </div>
        </header>

        <div className="flex-1 bg-slate-50 px-2.5 py-2">
          {activePromotions.length > 0 ? (
            <div className="space-y-2">
              {activePromotions.map((promotion) => (
                <article
                  key={`${promotion.status}-${promotion.id}`}
                  className="rounded-md border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{promotion.name}</p>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-700">
                      {promotion.status}
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] text-slate-500">
                    {promotion.period.start} – {promotion.period.end}
                  </p>

                  <div className="mt-2">
                    <ProductThumbnailGroup products={promotion.productPreviews} />
                  </div>

                  <div className="mt-3 grid grid-cols-[1fr,auto] items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        promotion.status === 'Expired'
                          ? onViewPromotion?.(promotion)
                          : onEditPromotion?.(promotion)
                      }
                      className="inline-flex h-9 items-center justify-center rounded-md bg-[#3A56C5] px-3 text-xs font-semibold text-white transition active:scale-[0.98]"
                    >
                      {promotion.status === 'Expired' ? 'View' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        promotion.status === 'Expired'
                          ? void onDeletePromotion?.(promotion)
                          : onViewPromotion?.(promotion)
                      }
                      className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition active:scale-[0.98]"
                    >
                      More
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[360px] items-center justify-center rounded-md border border-dashed border-slate-300 bg-white px-4 text-center text-xs text-slate-500">
              No promotions in this status yet.
            </div>
          )}
        </div>
      </article>

      {createTypeModal}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur">
        <button
          type="button"
          onClick={() => setIsCreateChoiceOpen((previous) => !previous)}
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#3A56C5] px-4 text-sm font-semibold text-white transition hover:bg-[#3347A8]"
        >
          Create New Discount
        </button>
      </div>
    </div>
  )
}

export default DiscountMobilePanel

