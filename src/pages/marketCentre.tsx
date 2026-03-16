import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MarketingHero from '../components/marketing/MarketingHero'
import MarketingToolsPanel from '../components/marketing/MarketingToolsPanel'
import { toolSections } from '../components/marketing/data'
import type { ToolCard } from '../components/marketing/types'
import DiscountPage from '../components/discount/DiscountPage'
import CreateDiscountPromotionPage from '../components/discount/create/CreateDiscountPromotionPage'
import CreateBundleDealPage from '../components/discount/create/CreateBundleDealPage'
import CreateAddOnDealPage from '../components/discount/create/CreateAddOnDealPage'
import type {
  DiscountCampaignRow,
  DiscountToolType,
  PromotionRow,
  BundleDealRow,
  AddOnDealRow,
} from '../components/discount/types'
import ViewDiscountPromotionPage from '../components/discount/view/ViewDiscountPromotionPage'
import ViewBundleDealPage from '../components/discount/view/ViewBundleDealPage'
import ViewAddOnDealPage from '../components/discount/view/ViewAddOnDealPage'
import FlashDealsPage from '../components/flash-deals/FlashDealsPage'
import CreateFlashDealPage from '../components/flash-deals/create/CreateFlashDealPage'
import type { CreateFlashDealForm } from '../components/flash-deals/create/CreateFlashDealPage'
import VouchersPage from '../components/vouchers/VouchersPage'
import CreateVoucherPage from '../components/vouchers/create/CreateVoucherPage'
import type { VoucherItem } from '../components/vouchers/types'
import type { CreateVoucherForm, VoucherType } from '../components/vouchers/create/types'
import type {
  CreateAddOnDealForm,
  CreateBundleDealForm,
  CreateDiscountPromotionForm,
} from '../components/discount/create/types'
import Sidebar from '../sidebar/sidebar'
import {
  createVoucher,
  deleteVoucher,
  listVouchers,
  updateVoucher,
} from '../services/market/vouchers.repo'
import {
  createDiscountPromotion,
  deleteDiscountPromotion,
  updateDiscountPromotion,
} from '../services/market/discounts.repo'
import {
  createBundleDeal,
  deleteBundleDeal,
  updateBundleDeal,
} from '../services/market/bundles.repo'
import {
  createAddOnDeal,
  deleteAddOnDeal,
  updateAddOnDeal,
} from '../services/market/addons.repo'
import { createFlashDeals } from '../services/market/flashDeals.repo'
import { supabase } from '../supabase'

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
  | 'create-bundle-deal'
  | 'create-add-on-deal'
  | 'view-discount-promotion'
  | 'view-bundle-deal'
  | 'view-add-on-deal'
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

const marketingViews: Set<MarketCentreView> = new Set([
  'marketing',
  'discount',
  'flash-deals',
  'create-flash-deal',
  'create-discount-promotion',
  'create-bundle-deal',
  'create-add-on-deal',
  'view-discount-promotion',
  'view-bundle-deal',
  'view-add-on-deal',
  'vouchers',
  'create-voucher',
])

const orderViews: Set<MarketCentreView> = new Set([
  'orders-all',
  'orders-pending',
  'orders-completed',
])

const productViews: Set<MarketCentreView> = new Set([
  'inventory',
  'add-product',
  'categories',
])

const createVoucherDefaults: CreateVoucherForm = {
  voucherType: 'shop',
  rewardType: 'discount',
  discountType: 'fixed-amount',
  discountAmount: '1.00',
  minimumBasketPrice: '10.00',
  usageQuantity: '100',
  maxDistributionPerBuyer: '1',
  displaySetting: 'all-pages',
  productScope: 'all-products',
  startDateTime: toLocalDateTimeInputValue(new Date()),
  endDateTime: toLocalDateTimeInputValue(new Date(Date.now() + 60 * 60 * 1000)),
  selectedProductIds: [],
  livestreamUrl: '',
  videoUrl: '',
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
  const now = new Date()
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
  const claimStart = voucher.claimStartAtIso ?? voucher.startAtIso
  const claimEnd = voucher.claimEndAtIso ?? voucher.endAtIso
  const claimStartDate = claimStart ? new Date(claimStart) : null
  const claimEndDate = claimEnd ? new Date(claimEnd) : null
  const hasValidClaimStart = claimStartDate && !Number.isNaN(claimStartDate.getTime())
  const hasValidClaimEnd = claimEndDate && !Number.isNaN(claimEndDate.getTime())

  return {
    voucherType: voucher.voucherType ?? 'shop',
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
    displaySetting: voucher.voucherType === 'private' ? 'voucher-code' : 'all-pages',
    productScope: voucher.voucherType === 'product' ? 'specific-products' : 'all-products',
    startDateTime: hasValidClaimStart
      ? toLocalDateTimeInputValue(claimStartDate)
      : createVoucherDefaults.startDateTime || toLocalDateTimeInputValue(now),
    endDateTime: hasValidClaimEnd
      ? toLocalDateTimeInputValue(claimEndDate)
      : createVoucherDefaults.endDateTime || toLocalDateTimeInputValue(oneHourLater),
    selectedProductIds: [],
    livestreamUrl: '',
    videoUrl: '',
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

  const selectedProductIds = Object.keys(promotion.productDiscounts)
  const productDiscounts = selectedProductIds.reduce<Record<string, string>>(
    (accumulator, productId) => {
      accumulator[productId] = promotion.productDiscounts[productId] ?? ''
      return accumulator
    },
    {},
  )

  return {
    promotionName: promotion.name,
    startDateTime,
    endDateTime,
    purchaseLimit: promotion.maxUses === null ? '' : `${promotion.maxUses}`,
    products: selectedProductIds,
    productDiscounts,
  }
}

function mapBundleToCreateForm(bundle: BundleDealRow): CreateBundleDealForm {
  const now = new Date()
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
  const parsedStart = parsePromotionDateTime(bundle.period.start)
  const parsedEnd = parsePromotionDateTime(bundle.period.end)

  const startDateTime = toLocalDateTimeInputValue(parsedStart ?? now)
  const endDateTime = toLocalDateTimeInputValue(
    parsedEnd ?? (parsedStart ? new Date(parsedStart.getTime() + 60 * 60 * 1000) : oneHourLater),
  )

  return {
    promotionName: bundle.name,
    startDateTime,
    endDateTime,
    purchaseLimit: bundle.maxUses === null ? '' : `${bundle.maxUses}`,
    bundlePrice: bundle.bundlePrice ?? '',
    currency: 'PHP',
    items: bundle.bundleItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
  }
}

function mapAddOnToCreateForm(addon: AddOnDealRow): CreateAddOnDealForm {
  const now = new Date()
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
  const parsedStart = parsePromotionDateTime(addon.period.start)
  const parsedEnd = parsePromotionDateTime(addon.period.end)

  const startDateTime = toLocalDateTimeInputValue(parsedStart ?? now)
  const endDateTime = toLocalDateTimeInputValue(
    parsedEnd ?? (parsedStart ? new Date(parsedStart.getTime() + 60 * 60 * 1000) : oneHourLater),
  )

  return {
    promotionName: addon.name,
    startDateTime,
    endDateTime,
    purchaseLimit: addon.maxUses === null ? '' : `${addon.maxUses}`,
    triggerProductId: addon.triggerProductId,
    addonProductId: addon.addonProductId,
    discountValue: addon.discountValue ?? '',
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
  const navigate = useNavigate()
  const [activeView, setActiveView] = useState<MarketCentreView>('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(getIsMobileViewport)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const wasSidebarOpenRef = useRef(false)
  const [editingVoucher, setEditingVoucher] = useState<VoucherItem | null>(null)
  const [selectedVoucherType, setSelectedVoucherType] = useState<VoucherType>('shop')
  const [voucherItems, setVoucherItems] = useState<VoucherItem[]>([])
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [voucherError, setVoucherError] = useState<string | null>(null)
  const [voucherAuthRequired, setVoucherAuthRequired] = useState(false)
  const [voucherNoShop, setVoucherNoShop] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<PromotionRow | null>(null)
  const [viewingPromotion, setViewingPromotion] = useState<PromotionRow | null>(null)
  const [editingBundle, setEditingBundle] = useState<BundleDealRow | null>(null)
  const [viewingBundle, setViewingBundle] = useState<BundleDealRow | null>(null)
  const [editingAddOn, setEditingAddOn] = useState<AddOnDealRow | null>(null)
  const [viewingAddOn, setViewingAddOn] = useState<AddOnDealRow | null>(null)
  const editInitialForm = useMemo(
    () => (editingVoucher ? mapVoucherToCreateForm(editingVoucher) : undefined),
    [editingVoucher],
  )
  const editDiscountInitialForm = useMemo(
    () => (editingPromotion ? mapPromotionToCreateForm(editingPromotion) : undefined),
    [editingPromotion],
  )
  const editBundleInitialForm = useMemo(
    () => (editingBundle ? mapBundleToCreateForm(editingBundle) : undefined),
    [editingBundle],
  )
  const editAddOnInitialForm = useMemo(
    () => (editingAddOn ? mapAddOnToCreateForm(editingAddOn) : undefined),
    [editingAddOn],
  )
  const voucherFormKey = editingVoucher ? `edit-${editingVoucher.code}` : 'create'
  const discountFormKey = editingPromotion ? `edit-${editingPromotion.name}` : 'create'
  const bundleFormKey = editingBundle ? `edit-${editingBundle.name}` : 'create'
  const addOnFormKey = editingAddOn ? `edit-${editingAddOn.name}` : 'create'

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

  const handleCreateVoucher = (voucherType: VoucherType) => {
    setEditingVoucher(null)
    setSelectedVoucherType(voucherType)
    setActiveView('create-voucher')
  }

  const handleEditVoucher = (voucher: VoucherItem) => {
    setEditingVoucher(voucher)
    setSelectedVoucherType(voucher.voucherType ?? 'shop')
    setActiveView('create-voucher')
  }

  const handleVoucherFormBack = () => {
    setEditingVoucher(null)
    setActiveView('vouchers')
  }

  const loadVouchers = useCallback(async () => {
    setVoucherLoading(true)
    setVoucherError(null)

    try {
      const result = await listVouchers()
      setVoucherItems(result.items)
      setVoucherAuthRequired(result.authRequired)
      setVoucherNoShop(result.noShop)
    } catch (error) {
      setVoucherItems([])
      setVoucherAuthRequired(false)
      setVoucherNoShop(false)
      setVoucherError(error instanceof Error ? error.message : 'Unable to load vouchers.')
    } finally {
      setVoucherLoading(false)
    }
  }, [])

  const handleVoucherConfirm = async (form: CreateVoucherForm) => {
    if (editingVoucher?.id) {
      await updateVoucher(editingVoucher.id, form)
    } else {
      await createVoucher(form)
    }

    await loadVouchers()
  }

  const handleDeleteVoucher = async (voucher: VoucherItem) => {
    const shouldDelete = window.confirm(`Delete voucher ${voucher.code}?`)
    if (!shouldDelete) {
      return
    }

    try {
      await deleteVoucher(voucher.id)
      await loadVouchers()
    } catch (error) {
      setVoucherError(error instanceof Error ? error.message : 'Unable to delete voucher.')
    }
  }

  const handleCreateDiscountTool = (type: DiscountToolType) => {
    setEditingPromotion(null)
    setViewingPromotion(null)
    setEditingBundle(null)
    setViewingBundle(null)
    setEditingAddOn(null)
    setViewingAddOn(null)

    if (type === 'discount-promotions') {
      setActiveView('create-discount-promotion')
      return
    }

    if (type === 'bundle-deal') {
      setActiveView('create-bundle-deal')
      return
    }

    setActiveView('create-add-on-deal')
  }

  const handleEditDiscountPromotion = (promotion: PromotionRow) => {
    if (promotion.type !== 'Discount Promotions') {
      return
    }

    setEditingPromotion(promotion)
    setEditingBundle(null)
    setEditingAddOn(null)
    setViewingPromotion(null)
    setViewingBundle(null)
    setViewingAddOn(null)
    setActiveView('create-discount-promotion')
  }

  const handleViewDiscountPromotion = (promotion: PromotionRow) => {
    setViewingPromotion(promotion)
    setViewingBundle(null)
    setViewingAddOn(null)
    setActiveView('view-discount-promotion')
  }

  const handleEditDiscountCampaign = (campaign: DiscountCampaignRow) => {
    if (campaign.campaignType === 'promotion') {
      handleEditDiscountPromotion(campaign)
      return
    }

    if (campaign.campaignType === 'bundle') {
      setEditingBundle(campaign)
      setEditingPromotion(null)
      setViewingPromotion(null)
      setViewingBundle(null)
      setEditingAddOn(null)
      setViewingAddOn(null)
      setActiveView('create-bundle-deal')
      return
    }

    if (campaign.campaignType === 'add-on') {
      setEditingAddOn(campaign)
      setEditingPromotion(null)
      setEditingBundle(null)
      setViewingPromotion(null)
      setViewingBundle(null)
      setViewingAddOn(null)
      setActiveView('create-add-on-deal')
    }
  }

  const handleViewDiscountCampaign = (campaign: DiscountCampaignRow) => {
    if (campaign.campaignType === 'bundle') {
      setViewingBundle(campaign)
      setViewingPromotion(null)
      setViewingAddOn(null)
      setActiveView('view-bundle-deal')
      return
    }

    if (campaign.campaignType === 'add-on') {
      setViewingAddOn(campaign)
      setViewingBundle(null)
      setViewingPromotion(null)
      setActiveView('view-add-on-deal')
      return
    }

    setViewingPromotion(campaign)
    setActiveView('view-discount-promotion')
  }

  const handleDiscountFormBack = () => {
    setEditingPromotion(null)
    setEditingBundle(null)
    setEditingAddOn(null)
    setActiveView('discount')
  }

  const handleDiscountConfirm = async (form: CreateDiscountPromotionForm) => {
    if (editingPromotion?.id) {
      await updateDiscountPromotion(editingPromotion.id, form)
    } else {
      await createDiscountPromotion(form)
    }
    setEditingPromotion(null)
  }

  const handleBundleConfirm = async (form: CreateBundleDealForm) => {
    if (editingBundle?.id) {
      await updateBundleDeal(editingBundle.id, form)
    } else {
      await createBundleDeal(form)
    }
    setEditingBundle(null)
  }

  const handleAddOnConfirm = async (form: CreateAddOnDealForm) => {
    if (editingAddOn?.id) {
      await updateAddOnDeal(editingAddOn.id, form)
    } else {
      await createAddOnDeal(form)
    }
    setEditingAddOn(null)
  }

  const handleDeleteDiscountPromotion = async (promotion: DiscountCampaignRow) => {
    if (promotion.campaignType === 'bundle') {
      await deleteBundleDeal(promotion.id)
      return
    }
    if (promotion.campaignType === 'add-on') {
      await deleteAddOnDeal(promotion.id)
      return
    }
    await deleteDiscountPromotion(promotion.id)
  }

  const handleViewDiscountBack = () => {
    setViewingPromotion(null)
    setViewingBundle(null)
    setViewingAddOn(null)
    setActiveView('discount')
  }

  const handleCreateFlashDeal = () => {
    setActiveView('create-flash-deal')
  }

  const handleCreateFlashDealBack = () => {
    setActiveView('flash-deals')
  }

  const handleFlashDealConfirm = async (form: CreateFlashDealForm) => {
    await createFlashDeals(form)
  }

  const handleSidebarSelectView = (view: MarketCentreView) => {
    setActiveView(view)

    if (isMobileViewport) {
      setIsSidebarOpen(false)
    }
  }

  const handleLogout = async () => {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)

    try {
      await supabase.auth.signOut()
    } finally {
      navigate('/', { replace: true })
    }
  }

  const isMarketingOverview = activeView === 'dashboard' || activeView === 'marketing'
  const isOrderActive = orderViews.has(activeView)
  const isProductActive = productViews.has(activeView)
  const isMarketingActive = marketingViews.has(activeView)
  const marketingModules: Array<{
    label: string
    view: MarketCentreView
    active: boolean
  }> = [
      { label: 'Marketing Home', view: 'marketing', active: activeView === 'marketing' },
      {
        label: 'Discount',
        view: 'discount',
        active:
          activeView === 'discount' ||
          activeView === 'create-discount-promotion' ||
          activeView === 'create-bundle-deal' ||
          activeView === 'create-add-on-deal' ||
          activeView === 'view-discount-promotion' ||
          activeView === 'view-bundle-deal' ||
          activeView === 'view-add-on-deal',
      },
      {
        label: 'Flash Deals',
        view: 'flash-deals',
        active: activeView === 'flash-deals' || activeView === 'create-flash-deal',
      },
      {
        label: 'Vouchers',
        view: 'vouchers',
        active: activeView === 'vouchers' || activeView === 'create-voucher',
      },
    ]
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

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileViewport(event.matches)

      if (!event.matches) {
        setIsSidebarOpen(false)
      }
    }

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
    if (activeView === 'vouchers') {
      void loadVouchers()
    }
  }, [activeView, loadVouchers])

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

  const topNavButtonClass = (active: boolean) =>
    `relative inline-flex h-full shrink-0 items-center gap-2 px-4 text-[13px] font-medium transition ${active
      ? 'bg-white text-[#2d46ba] after:absolute after:bottom-0 after:left-4 after:right-4 after:h-[2px] after:rounded-full after:bg-[#2d46ba]'
      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
    }`

  return (
    <div className="h-screen w-full overflow-hidden bg-white text-slate-900">
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden={!isSidebarOpen}
      />

      <aside
        id="mobile-sidebar"
        className={`fixed left-0 top-0 z-50 h-screen w-[82vw] max-w-[320px] bg-white shadow-xl transition-transform duration-300 ease-out md:hidden ${isSidebarOpen
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

      <div className="h-screen overflow-y-auto">
        <header className="bg-white px-4 pb-3 pt-4 sm:px-6 md:px-0 md:pt-0 lg:px-0">
          <div className="hidden h-[66px] w-full items-stretch border-y border-slate-200 bg-white md:grid md:grid-cols-[1fr_auto_1fr]">
            <div className="flex min-w-0 items-center gap-3 bg-white px-4">
              <img
                src="/Asset/unleash_logo.png"
                alt="Unleash logo"
                className="h-8 w-8 object-contain"
              />
              <p className="text-[13px] font-semibold leading-[1.08] text-slate-900">
                <span className="block">Inventory Management</span>
                <span className="block">System</span>
              </p>
            </div>

            <nav
              aria-label="Desktop navigation"
              className="flex items-stretch justify-center gap-1"
            >
              <button
                type="button"
                onClick={() => setActiveView('dashboard')}
                className={topNavButtonClass(activeView === 'dashboard')}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 3H9V9H3V3ZM11 3H17V9H11V3ZM3 11H9V17H3V11ZM11 11H17V17H11V11Z"
                    fill={activeView === 'dashboard' ? '#2647c7' : '#94a3b8'}
                  />
                </svg>
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('orders-all')}
                className={topNavButtonClass(isOrderActive)}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7 17C5.343 17 4 18.343 4 20C4 21.657 5.343 23 7 23C8.657 23 10 21.657 10 20C10 18.343 8.657 17 7 17ZM17 17C15.343 17 14 18.343 14 20C14 21.657 15.343 23 17 23C18.657 23 20 21.657 20 20C20 18.343 18.657 17 17 17Z"
                    fill={isOrderActive ? '#2647c7' : '#94a3b8'}
                  />
                  <path
                    d="M6 6H22L20 14H8L6 6Z"
                    stroke={isOrderActive ? '#2647c7' : '#94a3b8'}
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 6L4 2H1"
                    stroke={isOrderActive ? '#2647c7' : '#94a3b8'}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Order Management</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('inventory')}
                className={topNavButtonClass(isProductActive)}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 20H20V4H4V20Z"
                    stroke={isProductActive ? '#2647c7' : '#94a3b8'}
                    strokeWidth="1.8"
                  />
                  <path
                    d="M8 4V20M16 4V20M4 8H20M4 16H20"
                    stroke={isProductActive ? '#2647c7' : '#94a3b8'}
                    strokeWidth="1.2"
                  />
                </svg>
                <span>Product Management</span>
              </button>

              <div className="group relative h-full">
                <button
                  type="button"
                  onClick={() => setActiveView('marketing')}
                  className={topNavButtonClass(isMarketingActive)}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 10L12 5L20 10V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V10Z"
                      stroke={isMarketingActive ? '#2647c7' : '#94a3b8'}
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 13H15M9 16H14"
                      stroke={isMarketingActive ? '#2647c7' : '#94a3b8'}
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>Marketing Centre</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-slate-400 transition group-hover:rotate-180 group-focus-within:rotate-180"
                  >
                    <path
                      d="M4 7L10 13L16 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div className="pointer-events-none absolute left-0 top-full z-50 mt-1 w-56 rounded-xl border border-slate-200 bg-white p-1 opacity-0 shadow-[0_26px_48px_-30px_rgba(15,23,42,0.6)] transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                  {marketingModules.map((module) => (
                    <button
                      key={module.view}
                      type="button"
                      onClick={() => setActiveView(module.view)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${module.active
                          ? 'bg-[#e9efff] font-semibold text-[#2747c7]'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                        }`}
                    >
                      {module.label}
                    </button>
                  ))}
                </div>
              </div>
            </nav>

            <div className="flex items-stretch justify-end gap-1 px-3">
              <button
                type="button"
                aria-label="Notifications"
                className="inline-flex h-full w-11 items-center justify-center rounded-md bg-white text-slate-600 transition hover:bg-slate-50"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 10C6 6.68629 8.68629 4 12 4C15.3137 4 18 6.68629 18 10V13.5L20 16V17H4V16L6 13.5V10Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 19C10.4 20.2 11.2 21 12 21C12.8 21 13.6 20.2 14 19"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Settings"
                className="inline-flex h-full w-11 items-center justify-center rounded-md bg-white text-slate-600 transition hover:bg-slate-50"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19.4 15C19.535 15.302 19.605 15.629 19.605 15.96C19.605 16.291 19.535 16.618 19.4 16.92L19.34 17.06L20.11 17.83C20.89 18.61 20.89 19.87 20.11 20.65C19.33 21.43 18.07 21.43 17.29 20.65L16.52 19.88L16.38 19.94C16.078 20.075 15.751 20.145 15.42 20.145C15.089 20.145 14.762 20.075 14.46 19.94L14.32 19.88V20.97C14.32 22.09 13.41 23 12.29 23H11.71C10.59 23 9.68 22.09 9.68 20.97V19.88L9.54 19.94C9.238 20.075 8.911 20.145 8.58 20.145C8.249 20.145 7.922 20.075 7.62 19.94L7.48 19.88L6.71 20.65C5.93 21.43 4.67 21.43 3.89 20.65C3.11 19.87 3.11 18.61 3.89 17.83L4.66 17.06L4.6 16.92C4.465 16.618 4.395 16.291 4.395 15.96C4.395 15.629 4.465 15.302 4.6 15L4.66 14.86H3.57C2.45 14.86 1.54 13.95 1.54 12.83V11.25C1.54 10.13 2.45 9.22 3.57 9.22H4.66L4.6 9.08C4.465 8.778 4.395 8.451 4.395 8.12C4.395 7.789 4.465 7.462 4.6 7.16L4.66 7.02L3.89 6.25C3.11 5.47 3.11 4.21 3.89 3.43C4.67 2.65 5.93 2.65 6.71 3.43L7.48 4.2L7.62 4.14C7.922 4.005 8.249 3.935 8.58 3.935C8.911 3.935 9.238 4.005 9.54 4.14L9.68 4.2V3.11C9.68 1.99 10.59 1.08 11.71 1.08H12.29C13.41 1.08 14.32 1.99 14.32 3.11V4.2L14.46 4.14C14.762 4.005 15.089 3.935 15.42 3.935C15.751 3.935 16.078 4.005 16.38 4.14L16.52 4.2L17.29 3.43C18.07 2.65 19.33 2.65 20.11 3.43C20.89 4.21 20.89 5.47 20.11 6.25L19.34 7.02L19.4 7.16C19.535 7.462 19.605 7.789 19.605 8.12C19.605 8.451 19.535 8.778 19.4 9.08L19.34 9.22H20.43C21.55 9.22 22.46 10.13 22.46 11.25V12.83C22.46 13.95 21.55 14.86 20.43 14.86H19.34L19.4 15Z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12.04" r="3.1" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </button>
              <div className="group relative flex h-full items-center">
                <button
                  type="button"
                  aria-label="User profile"
                  className="inline-flex h-full w-11 items-center justify-center rounded-md bg-white text-slate-600 transition hover:bg-slate-50"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                      fill="currentColor"
                    />
                    <path
                      d="M4 22C4 18.6863 7.58172 16 12 16C16.4183 16 20 18.6863 20 22"
                      fill="currentColor"
                    />
                  </svg>
                </button>
                <div className="pointer-events-none absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1 opacity-0 shadow-[0_26px_48px_-30px_rgba(15,23,42,0.6)] transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14 7L9 12L14 17"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9 12H20"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M4 4H10V20H4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          <div className="mx-auto mt-3 w-full max-w-[1600px] md:hidden md:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <button
                ref={mobileMenuButtonRef}
                type="button"
                aria-label="Open navigation menu"
                aria-expanded={isSidebarOpen}
                aria-controls="mobile-sidebar"
                onClick={() => setIsSidebarOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm"
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

              <button
                type="button"
                aria-label="Theme mode"
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm"
              >
                <svg
                  width="24"
                  height="24"
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
                onEditPromotion={handleEditDiscountCampaign}
                onViewPromotion={handleViewDiscountCampaign}
                onDeletePromotion={handleDeleteDiscountPromotion}
              />
            ) : activeView === 'flash-deals' ? (
              <FlashDealsPage
                onBack={() => setActiveView('marketing')}
                onCreate={handleCreateFlashDeal}
              />
            ) : activeView === 'create-flash-deal' ? (
              <CreateFlashDealPage
                onBack={handleCreateFlashDealBack}
                onConfirm={handleFlashDealConfirm}
              />
            ) : activeView === 'create-discount-promotion' ? (
              <CreateDiscountPromotionPage
                key={discountFormKey}
                onBack={handleDiscountFormBack}
                onConfirm={handleDiscountConfirm}
                mode={editingPromotion ? 'edit' : 'create'}
                initialForm={editDiscountInitialForm}
              />
            ) : activeView === 'create-bundle-deal' ? (
              <CreateBundleDealPage
                key={bundleFormKey}
                onBack={handleDiscountFormBack}
                onConfirm={handleBundleConfirm}
                mode={editingBundle ? 'edit' : 'create'}
                initialForm={editBundleInitialForm}
              />
            ) : activeView === 'create-add-on-deal' ? (
              <CreateAddOnDealPage
                key={addOnFormKey}
                onBack={handleDiscountFormBack}
                onConfirm={handleAddOnConfirm}
                mode={editingAddOn ? 'edit' : 'create'}
                initialForm={editAddOnInitialForm}
              />
            ) : activeView === 'view-discount-promotion' && viewingPromotion ? (
              <ViewDiscountPromotionPage
                promotion={viewingPromotion}
                onBack={handleViewDiscountBack}
              />
            ) : activeView === 'view-bundle-deal' && viewingBundle ? (
              <ViewBundleDealPage bundle={viewingBundle} onBack={handleViewDiscountBack} />
            ) : activeView === 'view-add-on-deal' && viewingAddOn ? (
              <ViewAddOnDealPage addon={viewingAddOn} onBack={handleViewDiscountBack} />
            ) : (
              <>
                {activeView === 'vouchers' ? (
                  <VouchersPage
                    onBack={() => setActiveView('marketing')}
                    onCreate={handleCreateVoucher}
                    onEdit={handleEditVoucher}
                    onDelete={handleDeleteVoucher}
                    vouchers={voucherItems}
                    isLoading={voucherLoading}
                    error={voucherError}
                    isAuthRequired={voucherAuthRequired}
                    hasNoShop={voucherNoShop}
                    onRetry={() => void loadVouchers()}
                    canManage={!voucherAuthRequired && !voucherNoShop}
                  />
                ) : (
                  <CreateVoucherPage
                    key={voucherFormKey}
                    onBack={handleVoucherFormBack}
                    onConfirm={handleVoucherConfirm}
                    mode={editingVoucher ? 'edit' : 'create'}
                    initialForm={editInitialForm}
                    voucherType={selectedVoucherType}
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
