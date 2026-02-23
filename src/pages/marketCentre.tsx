import { useEffect, useMemo, useRef, useState } from 'react'
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
  | 'dashboard'
  | 'marketing'
  | 'orders-all'
  | 'orders-pending'
  | 'orders-completed'
  | 'inventory'
  | 'add-product'
  | 'categories'
  | 'discount'
  | 'flash-deals'
  | 'create-flash-deal'
  | 'create-discount-promotion'
  | 'view-discount-promotion'
  | 'vouchers'
  | 'create-voucher'

const navPlaceholders: Record<
  'orders-all' | 'orders-pending' | 'orders-completed' | 'inventory' | 'add-product' | 'categories',
  { title: string; description: string }
> = {
  'orders-all': {
    title: 'All Orders',
    description: 'Track, search, and manage every order from a centralized list.',
  },
  'orders-pending': {
    title: 'Pending Orders',
    description: 'Review new orders that still need confirmation and fulfillment.',
  },
  'orders-completed': {
    title: 'Completed Orders',
    description: 'Audit fulfilled orders and monitor final delivery outcomes.',
  },
  inventory: {
    title: 'Inventory',
    description: 'Check stock levels, product health, and low-stock alerts.',
  },
  'add-product': {
    title: 'Add Product',
    description: 'Create new product listings with pricing, inventory, and details.',
  },
  categories: {
    title: 'Categories',
    description: 'Organize catalog sections and manage storefront taxonomy.',
  },
}

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

function PlaceholderView({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <section className="motion-rise rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_28px_62px_-44px_rgba(15,23,42,0.55)]">
      <h2 className="text-2xl font-semibold text-slate-800">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm text-slate-500 sm:text-base">{description}</p>
    </section>
  )
}

function getIsMobileViewport() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(max-width: 768px)').matches
}

function MarketCentrePage() {
  const [activeView, setActiveView] = useState<MarketCentreView>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(getIsMobileViewport)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const wasSidebarOpenRef = useRef(false)
  const [now, setNow] = useState(() => new Date())
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

  const handleSidebarSelectView = (view: MarketCentreView) => {
    setActiveView(view)

    if (isMobileViewport) {
      setIsSidebarOpen(false)
    }
  }

  const isMarketingOverview = activeView === 'dashboard' || activeView === 'marketing'
  const placeholderConfig =
    activeView in navPlaceholders
      ? navPlaceholders[
          activeView as
            | 'orders-all'
            | 'orders-pending'
            | 'orders-completed'
            | 'inventory'
            | 'add-product'
            | 'categories'
        ]
      : null
  const sidebarWidthClass = sidebarCollapsed ? 'w-[80px]' : 'w-[280px]'
  const contentMarginClass = sidebarCollapsed ? 'md:ml-[88px]' : 'md:ml-[288px]'
  const datePart = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(now)
  const timePart = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(now)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 30_000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileViewport(event.matches)
    }

    setIsMobileViewport(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  useEffect(() => {
    if (!isMobileViewport) {
      setIsSidebarOpen(false)
    }
  }, [isMobileViewport])

  useEffect(() => {
    if (!isMobileViewport || !isSidebarOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isMobileViewport, isSidebarOpen])

  useEffect(() => {
    if (!isMobileViewport || !isSidebarOpen) {
      return
    }

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [isMobileViewport, isSidebarOpen])

  useEffect(() => {
    if (!isMobileViewport) {
      wasSidebarOpenRef.current = isSidebarOpen
      return
    }

    if (wasSidebarOpenRef.current && !isSidebarOpen) {
      mobileMenuButtonRef.current?.focus()
    }

    wasSidebarOpenRef.current = isSidebarOpen
  }, [isMobileViewport, isSidebarOpen])

  return (
    <div className="h-screen w-full overflow-hidden bg-[#F4F7FE] text-slate-900">
      <aside
        className={`fixed bottom-3 left-3 top-3 z-40 hidden transition-[width] duration-300 md:block ${sidebarWidthClass}`}
      >
        <Sidebar
          activeView={activeView}
          onSelectView={handleSidebarSelectView}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((prev) => !prev)}
        />
      </aside>

      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden ${
          isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden={!isSidebarOpen}
      />

      <aside
        id="mobile-sidebar"
        className={`fixed left-0 top-0 z-50 h-screen w-[82vw] max-w-[320px] bg-white shadow-xl transition-transform duration-300 ease-out md:hidden ${
          isSidebarOpen
            ? 'translate-x-0 pointer-events-auto'
            : '-translate-x-full pointer-events-none'
        }`}
        aria-hidden={!isSidebarOpen}
      >
        <Sidebar
          activeView={activeView}
          onSelectView={handleSidebarSelectView}
          collapsed={false}
          mobileMode
          mobileOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />
      </aside>

      <div
        className={`h-screen overflow-y-auto transition-[margin-left] duration-300 ${contentMarginClass}`}
      >
        <header className="bg-[#F4F7FE] px-4 pb-3 pt-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <button
                ref={mobileMenuButtonRef}
                type="button"
                aria-label="Open sidebar navigation"
                aria-expanded={isSidebarOpen}
                aria-controls="mobile-sidebar"
                onClick={() => setIsSidebarOpen(true)}
                className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm md:hidden"
              >
                <svg
                  width="18"
                  height="14"
                  viewBox="0 0 18 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 1H17M1 7H17M1 13H17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <div>
                <h1 className="font-['Inter'] text-[2.2rem] font-normal leading-none tracking-tight text-slate-800 sm:text-[2.5rem]">
                  Admin Portal
                </h1>
                <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#1d4ed8]">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7 2V5M17 2V5M3 9H21M5 4H19C20.1 4 21 4.9 21 6V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V6C3 4.9 3.9 4 5 4Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{`${datePart} | ${timePart}`}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Theme mode"
                className="relative inline-flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm"
              >
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 4V2M12 22V20M4 12H2M22 12H20M18.36 5.64L16.95 7.05M7.05 16.95L5.64 18.36M18.36 18.36L16.95 16.95M7.05 7.05L5.64 5.64"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span className="absolute -right-1 -top-1 rounded-full bg-[#1d4ed8] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Beta
                </span>
              </button>
              <div className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-2 pr-4 shadow-sm md:flex">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#dbeafe] text-sm font-semibold text-[#1e40af]">
                  A
                </span>
                <p className="text-sm font-medium text-slate-700">Welcome Back, Admin</p>
              </div>
            </div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1600px] px-4 pb-12 pt-3 sm:px-6 lg:px-8">
          <main className="min-w-0">
            {isMarketingOverview ? (
              <>
                <MarketingHero />
                <MarketingToolsPanel
                  sections={toolSections}
                  onToolSelect={handleToolSelect}
                />
              </>
            ) : placeholderConfig ? (
              <PlaceholderView
                title={placeholderConfig.title}
                description={placeholderConfig.description}
              />
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
