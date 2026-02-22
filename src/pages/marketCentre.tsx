import { useMemo, useState } from 'react'
import MarketingHero from '../components/marketing/MarketingHero'
import MarketingToolsPanel from '../components/marketing/MarketingToolsPanel'
import { toolSections } from '../components/marketing/data'
import type { ToolCard } from '../components/marketing/types'
import DiscountPage from '../components/discount/DiscountPage'
import CreateDiscountPromotionPage from '../components/discount/create/CreateDiscountPromotionPage'
import type { DiscountToolType, PromotionRow } from '../components/discount/types'
import ViewDiscountPromotionPage from '../components/discount/view/ViewDiscountPromotionPage'
import FlashDealsPage from '../components/flash-deals/FlashDealsPage'
import CreateFlashDealPage from '../components/flash-deals/create/CreateFlashDealPage'
import VouchersPage from '../components/vouchers/VouchersPage'
import CreateVoucherPage from '../components/vouchers/create/CreateVoucherPage'
import type { VoucherItem } from '../components/vouchers/types'
import type { CreateVoucherForm } from '../components/vouchers/create/types'
import type { CreateDiscountPromotionForm } from '../components/discount/create/types'
import Sidebar from '../sidebar/sidebar'

export type MarketCentreView =
  | 'marketing'
  | 'discount'
  | 'flash-deals'
  | 'create-flash-deal'
  | 'create-discount-promotion'
  | 'view-discount-promotion'
  | 'vouchers'
  | 'create-voucher'

const createVoucherDefaults: CreateVoucherForm = {
  rewardType: 'discount',
  discountType: 'fixed-amount',
  discountAmount: '1.00',
  minimumBasketPrice: '10.00',
  usageQuantity: '100',
  maxDistributionPerBuyer: '1',
  displaySetting: 'all-pages',
  productScope: 'all-products',
}

function toLocalDateTimeInputValue(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function parsePromotionDateTime(rawValue: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/.exec(rawValue)

  if (!match) {
    return null
  }

  const day = Number(match[1])
  const month = Number(match[2]) - 1
  const year = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])

  return new Date(year, month, day, hour, minute, 0, 0)
}

function toDecimalInputValue(value: string, fallback: string) {
  const cleaned = value.replace(/[^0-9.]/g, '').trim()
  return cleaned.length > 0 ? cleaned : fallback
}

function toWholeNumberInputValue(value: number | string, fallback: string) {
  const cleaned =
    typeof value === 'number'
      ? `${Math.max(Math.floor(value), 0)}`
      : value.replace(/\D/g, '').trim()

  return cleaned.length > 0 ? cleaned : fallback
}

function mapVoucherToCreateForm(voucher: VoucherItem): CreateVoucherForm {
  return {
    rewardType: 'discount',
    discountType: voucher.icon === 'percent' ? 'percentage' : 'fixed-amount',
    discountAmount: toDecimalInputValue(
      voucher.discountAmount,
      createVoucherDefaults.discountAmount,
    ),
    minimumBasketPrice: createVoucherDefaults.minimumBasketPrice,
    usageQuantity: toWholeNumberInputValue(
      voucher.quantity,
      createVoucherDefaults.usageQuantity,
    ),
    maxDistributionPerBuyer: toWholeNumberInputValue(
      voucher.usageLimit,
      createVoucherDefaults.maxDistributionPerBuyer,
    ),
    displaySetting: createVoucherDefaults.displaySetting,
    productScope: voucher.type.toLowerCase().includes('specific')
      ? 'specific-products'
      : 'all-products',
  }
}

function mapPromotionToCreateForm(promotion: PromotionRow): CreateDiscountPromotionForm {
  const now = new Date()
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
  const parsedStart = parsePromotionDateTime(promotion.period.start)
  const parsedEnd = parsePromotionDateTime(promotion.period.end)

  const startDateTime = toLocalDateTimeInputValue(parsedStart ?? now)
  const endDateTime = toLocalDateTimeInputValue(
    parsedEnd ?? (parsedStart ? new Date(parsedStart.getTime() + 60 * 60 * 1000) : oneHourLater),
  )

  const productDiscounts = promotion.products.reduce<Record<string, string>>(
    (accumulator, productName) => {
      accumulator[productName] = ''
      return accumulator
    },
    {},
  )

  return {
    promotionName: promotion.name,
    startDateTime,
    endDateTime,
    discountRate: '',
    purchaseLimit: '',
    products: promotion.products,
    productDiscounts,
  }
}

function MarketCentrePage() {
  const [activeView, setActiveView] = useState<MarketCentreView>('marketing')
  const [editingVoucher, setEditingVoucher] = useState<VoucherItem | null>(null)
  const [editingPromotion, setEditingPromotion] = useState<PromotionRow | null>(null)
  const [viewingPromotion, setViewingPromotion] = useState<PromotionRow | null>(null)
  const editInitialForm = useMemo(
    () => (editingVoucher ? mapVoucherToCreateForm(editingVoucher) : undefined),
    [editingVoucher],
  )
  const editDiscountInitialForm = useMemo(
    () => (editingPromotion ? mapPromotionToCreateForm(editingPromotion) : undefined),
    [editingPromotion],
  )
  const voucherFormKey = editingVoucher ? `edit-${editingVoucher.code}` : 'create'
  const discountFormKey = editingPromotion ? `edit-${editingPromotion.name}` : 'create'
  const appBackground =
    activeView === 'discount' ||
    activeView === 'flash-deals' ||
    activeView === 'create-flash-deal' ||
    activeView === 'create-discount-promotion' ||
    activeView === 'view-discount-promotion' ||
    activeView === 'vouchers' ||
    activeView === 'create-voucher'
      ? 'bg-[linear-gradient(180deg,_#F0F9FF_0%,_#FFFFFF_70%)]'
      : 'bg-[radial-gradient(circle_at_top,_#dbeafe_0%,_#f8fbff_42%,_#edf4ff_100%)]'

  const handleToolSelect = (tool: ToolCard) => {
    if (tool.id === 'vouchers') {
      setActiveView('vouchers')
      return
    }

    if (tool.id === 'discount') {
      setActiveView('discount')
      return
    }

    if (tool.id === 'flash-deals') {
      setActiveView('flash-deals')
    }
  }

  const handleCreateVoucher = () => {
    setEditingVoucher(null)
    setActiveView('create-voucher')
  }

  const handleEditVoucher = (voucher: VoucherItem) => {
    setEditingVoucher(voucher)
    setActiveView('create-voucher')
  }

  const handleVoucherFormBack = () => {
    setEditingVoucher(null)
    setActiveView('vouchers')
  }

  const handleCreateDiscountTool = (type: DiscountToolType) => {
    setEditingPromotion(null)
    setViewingPromotion(null)

    if (type === 'discount-promotions') {
      setActiveView('create-discount-promotion')
    }
  }

  const handleEditDiscountPromotion = (promotion: PromotionRow) => {
    if (promotion.type !== 'Discount Promotions') {
      return
    }

    setEditingPromotion(promotion)
    setViewingPromotion(null)
    setActiveView('create-discount-promotion')
  }

  const handleViewDiscountPromotion = (promotion: PromotionRow) => {
    setViewingPromotion(promotion)
    setActiveView('view-discount-promotion')
  }

  const handleDiscountFormBack = () => {
    setEditingPromotion(null)
    setActiveView('discount')
  }

  const handleViewDiscountBack = () => {
    setViewingPromotion(null)
    setActiveView('discount')
  }

  const handleCreateFlashDeal = () => {
    setActiveView('create-flash-deal')
  }

  const handleCreateFlashDealBack = () => {
    setActiveView('flash-deals')
  }

  return (
    <div className={`min-h-screen ${appBackground} pb-16 pt-10 text-slate-900`}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex justify-center lg:justify-start">
            <Sidebar activeView={activeView} onSelectView={setActiveView} />
          </div>
          <main className="min-w-0 flex-1">
            {activeView === 'marketing' ? (
              <>
                <MarketingHero />
                <MarketingToolsPanel
                  sections={toolSections}
                  onToolSelect={handleToolSelect}
                />
              </>
            ) : activeView === 'discount' ? (
              <DiscountPage
                onBack={() => setActiveView('marketing')}
                onCreateTool={handleCreateDiscountTool}
                onEditPromotion={handleEditDiscountPromotion}
                onViewPromotion={handleViewDiscountPromotion}
              />
            ) : activeView === 'flash-deals' ? (
              <FlashDealsPage
                onBack={() => setActiveView('marketing')}
                onCreate={handleCreateFlashDeal}
              />
            ) : activeView === 'create-flash-deal' ? (
              <CreateFlashDealPage onBack={handleCreateFlashDealBack} />
            ) : activeView === 'create-discount-promotion' ? (
              <CreateDiscountPromotionPage
                key={discountFormKey}
                onBack={handleDiscountFormBack}
                mode={editingPromotion ? 'edit' : 'create'}
                initialForm={editDiscountInitialForm}
              />
            ) : activeView === 'view-discount-promotion' && viewingPromotion ? (
              <ViewDiscountPromotionPage
                promotion={viewingPromotion}
                onBack={handleViewDiscountBack}
              />
            ) : (
              <>
                {activeView === 'vouchers' ? (
                  <VouchersPage
                    onBack={() => setActiveView('marketing')}
                    onCreate={handleCreateVoucher}
                    onEdit={handleEditVoucher}
                  />
                ) : (
                  <CreateVoucherPage
                    key={voucherFormKey}
                    onBack={handleVoucherFormBack}
                    mode={editingVoucher ? 'edit' : 'create'}
                    initialForm={editInitialForm}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default MarketCentrePage
