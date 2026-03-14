import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DiscountToolType, DiscountCampaignRow, PromotionStatus } from './types'

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
  Upcoming: 'text-amber-700',
  Ongoing: 'text-emerald-700',
  Expired: 'text-slate-500',
}

const thumbClasses = [
  'bg-gradient-to-br from-[#e2e8f0] to-[#cbd5e1] text-[#334155]',
  'bg-gradient-to-br from-[#e6f7ee] to-[#c9ead8] text-[#166534]',
  'bg-gradient-to-br from-[#fef3c7] to-[#fde68a] text-[#92400e]',
] as const

function ProductThumbStrip({ products }: { products: string[] }) {
  const visibleProducts = products.slice(0, 3)

  return (
    <div className="flex items-center gap-1">
      {visibleProducts.map((product, index) => (
        <span
          key={`${product}-${index}`}
          className={`inline-flex h-5 w-5 items-center justify-center rounded border border-white text-[9px] font-semibold shadow ${thumbClasses[index % thumbClasses.length]}`}
          title={product}
        >
          {product.slice(0, 1).toUpperCase()}
        </span>
      ))}
    </div>
  )
}

function StatusActions({
  promotion,
  onEditPromotion,
  onViewPromotion,
  onDeletePromotion,
}: {
  promotion: DiscountCampaignRow
  onEditPromotion?: (promotion: DiscountCampaignRow) => void
  onViewPromotion?: (promotion: DiscountCampaignRow) => void
  onDeletePromotion?: (promotion: DiscountCampaignRow) => Promise<void> | void
}) {
  const { status } = promotion

  if (status === 'Expired') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onViewPromotion?.(promotion)}
          className="inline-flex h-8 items-center justify-center rounded border border-[#cbd5e1] bg-white text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          View
        </button>
        <button
          type="button"
          onClick={() => void onDeletePromotion?.(promotion)}
          className="inline-flex h-8 items-center justify-center rounded border border-[#fdc4ac] bg-white text-xs font-semibold text-[#dc4f1f] transition hover:bg-[#fff4ef]"
        >
          Delete
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      <button
        type="button"
        onClick={() => onEditPromotion?.(promotion)}
        className="inline-flex h-8 items-center justify-center rounded border border-[#cbd5e1] bg-white text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => onViewPromotion?.(promotion)}
        className="inline-flex h-8 items-center justify-center rounded border border-[#cbd5e1] bg-white text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        View
      </button>
      <button
        type="button"
        className="inline-flex h-8 items-center justify-center rounded border border-[#cbd5e1] bg-white text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
      >
        Duplicate
      </button>
      <button
        type="button"
        onClick={() => void onDeletePromotion?.(promotion)}
        className="inline-flex h-8 items-center justify-center rounded border border-[#fdc4ac] bg-white text-xs font-semibold text-[#dc4f1f] transition hover:bg-[#fff4ef]"
      >
        Delete
      </button>
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
                    <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#2563EB]" />
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
                  className="rounded-md border border-slate-200 bg-white p-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm font-semibold ${statusTextClasses[promotion.status]}`}>
                        {promotion.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {promotion.period.start} - {promotion.period.end}
                      </p>
                    </div>
                    <ProductThumbStrip products={promotion.products} />
                  </div>

                  <div className="mt-2">
                    <StatusActions
                      promotion={promotion}
                      onEditPromotion={onEditPromotion}
                      onViewPromotion={onViewPromotion}
                      onDeletePromotion={onDeletePromotion}
                    />
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
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#2563EB] px-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
        >
          Create New Discount
        </button>
      </div>
    </div>
  )
}

export default DiscountMobilePanel
