import { useEffect, useMemo, useState } from 'react'
import {
  CaretDown,
  CaretLeft,
  CaretRight,
  CalendarBlank,
  Checks,
  ImageSquare,
  MagnifyingGlass,
  X,
} from 'phosphor-react'
import MobileDateTimePicker from '../../common/MobileDateTimePicker'
import CreateFlashDealBreadcrumb from './CreateFlashDealBreadcrumb'
import FlashDealProductsModal, {
  type FlashDealSelectableProduct,
} from './FlashDealProductsModal'
import {
  listShopCategories,
  listShopProducts,
  type ShopCategory,
} from '../../../services/market/products.repo'

type FlashDealCriteriaCategory = {
  id: string
  label: string
  rules: string[]
}

type CreateFlashDealPageProps = {
  onBack: () => void
  onConfirm?: (form: CreateFlashDealForm) => Promise<void> | void
}

type MobileFlashDealStep = 'setup' | 'products' | 'discount'

type FlashDealProductState = {
  discountedPrice: string
  discountPercent: string
  campaignStock: string
  purchaseLimit: string
}

export type CreateFlashDealForm = {
  startAt: string
  endAt: string
  products: Array<{
    productId: string
    originalPrice: number
    flashPrice: number
    flashQuantity: number
    purchaseLimit: number | null
    isActive: boolean
  }>
}

type FlashDealCatalogEntry = {
  id: string
  name: string
  category: string
  originalPrice: number
  stock: number
  variations: string[]
  image: string | null
}

const SLOT_DURATION_HOURS = 6
const SLOT_DURATION_OPTIONS = [4, 6, 8, 12, 24, 48]
const MOBILE_RULES_PREVIEW_COUNT = 4
const MOBILE_RULES_REGION_ID = 'flash-deal-mobile-rules'
const MOBILE_DAY_OPTION_COUNT = 5
const MOBILE_SLOT_START_HOURS = [0, 6, 12, 18]

const defaultRules = [
  'Promo Stock 10 - 10000',
  'Discount Limit: 10% - 99%',
  'Promo Price: lower than lowest price in last 7 days (exclude Shopee Flash Deals)',
  'Product Rating(0.0-5.0): >= 4',
  'Likes(s): No Limit',
  'Pre-Order(s): Must not be Pre-Order',
  'Orders in the last 30 day(s): No Limit',
  'Days to Ship: <= 3',
  'Repetition Control: No Limit',
]

const defaultCriteriaCategories: FlashDealCriteriaCategory[] = [
  { id: 'all', label: 'All', rules: defaultRules },
]

function mapCriteriaCategories(items: ShopCategory[]): FlashDealCriteriaCategory[] {
  const mapped = items.map((item) => ({
    id: item.id,
    label: item.name,
    rules: defaultRules,
  }))

  return [{ id: 'all', label: 'All', rules: defaultRules }, ...mapped]
}

function getCatalogEntry(
  productId: string,
  productsById: Map<string, FlashDealSelectableProduct>,
): FlashDealCatalogEntry {
  const product = productsById.get(productId)
  if (product) {
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      originalPrice: product.price,
      stock: product.stock,
      variations: [product.category || 'Default'],
      image: product.image ?? null,
    }
  }

  return {
    id: productId,
    name: 'Unknown product',
    category: 'Unknown',
    originalPrice: 0,
    stock: 0,
    variations: ['Default'],
    image: null,
  }
}

function ProductImage({ name, image }: { name: string; image: string | null }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className="h-10 w-10 flex-none rounded-lg object-cover"
      />
    )
  }

  return (
    <span className="relative inline-flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-lg border border-[#D0DBF7] bg-gradient-to-br from-[#F2F4FF] via-[#E6EBFF] to-[#D0DBF7] text-[#3347A8] shadow-[0_8px_14px_-12px_rgba(51,69,143,0.9)]">
      <ImageSquare size={16} weight="bold" className="opacity-75" />
      <span className="absolute bottom-0.5 right-1 text-[9px] font-semibold leading-none text-[#3347A8]">
        {name.slice(0, 1).toUpperCase()}
      </span>
    </span>
  )
}

function toPriceInput(value: number) {
  return `${Math.max(0, Math.round(value))}`
}

function toPriceLabel(value: number) {
  return `PHP ${Math.max(0, Math.round(value)).toLocaleString('en-US')}`
}

function sanitizeDecimal(value: string) {
  let sanitized = value.replace(/[^\d.]/g, '')
  const firstDot = sanitized.indexOf('.')

  if (firstDot !== -1) {
    sanitized =
      sanitized.slice(0, firstDot + 1) + sanitized.slice(firstDot + 1).replace(/\./g, '')
  }

  if (sanitized.startsWith('.')) {
    sanitized = `0${sanitized}`
  }

  return sanitized
}

function sanitizeWholeNumber(value: string) {
  return value.replace(/\D/g, '')
}

function calculateDiscountedPrice(originalPrice: number, discountPercent: string) {
  const parsed = Number(discountPercent)
  if (!Number.isFinite(parsed)) {
    return toPriceInput(originalPrice)
  }

  const normalized = Math.min(Math.max(parsed, 0), 99)
  const discountedPrice = originalPrice * (1 - normalized / 100)

  return toPriceInput(discountedPrice)
}

function deriveDiscountPercent(originalPrice: number, discountedPrice: string) {
  const parsed = Number(discountedPrice)
  if (!Number.isFinite(parsed) || originalPrice <= 0) {
    return ''
  }

  const rawPercent = ((originalPrice - parsed) / originalPrice) * 100
  const normalized = Math.min(Math.max(rawPercent, 0), 99)
  return `${Math.round(normalized)}`
}

function createProductState(catalogEntry: FlashDealCatalogEntry): FlashDealProductState {

  return {
    discountedPrice: toPriceInput(catalogEntry.originalPrice),
    discountPercent: '',
    campaignStock: `${catalogEntry.stock}`,
    purchaseLimit: '',
  }
}

function toLocalDateTimeInputValue(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function fromLocalDateTimeInputValue(value: string) {
  if (!value) {
    return null
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)

  if (!match) {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const hour = Number(match[4])
  const minute = Number(match[5])

  return new Date(year, month, day, hour, minute, 0, 0)
}

function formatDateTime(date: Date) {
  const month = date.toLocaleString('en-US', { month: 'short' })
  const day = `${date.getDate()}`.padStart(2, '0')
  const year = date.getFullYear()

  return `${month} ${day}, ${year} ${formatTime(date)}`
}

function formatTime(date: Date) {
  const hours24 = date.getHours()
  const hours = hours24 % 12 || 12
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  const meridiem = hours24 >= 12 ? 'PM' : 'AM'

  return `${hours}:${minutes} ${meridiem}`
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function getStartOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function toDayKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isSameDay(a: Date, b: Date) {
  return toDayKey(a) === toDayKey(b)
}

function formatDayChipDate(date: Date) {
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${month}-${day}`
}

function formatTime24(date: Date) {
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${hours}:${minutes}`
}

function getNearestSlotHour(hour: number) {
  return MOBILE_SLOT_START_HOURS.reduce((closest, current) =>
    Math.abs(current - hour) < Math.abs(closest - hour) ? current : closest,
  )
}

function getInitialSlotStartDate() {
  const date = new Date()
  // Default to "live as soon as possible" (current minute) so newly created deals
  // don't unnecessarily become "pending" just because we rounded to the next hour.
  date.setSeconds(0, 0)
  return date
}

function toSubmitErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error
  }

  if (typeof error === 'object' && error !== null) {
    try {
      const serialized = JSON.stringify(error)
      if (serialized && serialized !== '{}') {
        return serialized
      }
    } catch {
      return 'Unable to save flash deal.'
    }
  }

  return 'Unable to save flash deal.'
}

function CreateFlashDealPage({ onBack, onConfirm }: CreateFlashDealPageProps) {
  const [slotDurationHours, setSlotDurationHours] = useState(SLOT_DURATION_HOURS)
  const [slotStartDateTime, setSlotStartDateTime] = useState(() =>
    toLocalDateTimeInputValue(getInitialSlotStartDate()),
  )
  const [criteriaCategories, setCriteriaCategories] = useState<FlashDealCriteriaCategory[]>(
    defaultCriteriaCategories,
  )
  const [activeCriteriaId, setActiveCriteriaId] = useState('all')
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [availableProducts, setAvailableProducts] = useState<FlashDealSelectableProduct[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [productsError, setProductsError] = useState('')
  const [productsAuthRequired, setProductsAuthRequired] = useState(false)
  const [productsNoShop, setProductsNoShop] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [categoriesError, setCategoriesError] = useState('')
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false)
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false)
  const [productStateById, setProductStateById] = useState<
    Record<string, FlashDealProductState>
  >({})
  const [batchDiscountPercent, setBatchDiscountPercent] = useState('')
  const [batchCampaignStock, setBatchCampaignStock] = useState('')
  const [batchPurchaseLimit, setBatchPurchaseLimit] = useState('')
  const [mobileStep, setMobileStep] = useState<MobileFlashDealStep>('setup')
  const [mobileDayWindowStart, setMobileDayWindowStart] = useState(() =>
    getStartOfDay(new Date()),
  )
  const [isMobileCriteriaOpen, setIsMobileCriteriaOpen] = useState(false)
  const [showAllMobileRules, setShowAllMobileRules] = useState(false)
  const [mobileStepTwoSearch, setMobileStepTwoSearch] = useState('')
  const [mobileBulkDiscountPercent, setMobileBulkDiscountPercent] = useState('')
  const [mobileBulkDiscountedPrice, setMobileBulkDiscountedPrice] = useState('')
  const [mobileBulkCampaignStock, setMobileBulkCampaignStock] = useState('')
  const [mobileBulkPurchaseLimit, setMobileBulkPurchaseLimit] = useState('')
  const [mobileBulkNoLimit, setMobileBulkNoLimit] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const slotStartDate = useMemo(
    () => fromLocalDateTimeInputValue(slotStartDateTime),
    [slotStartDateTime],
  )
  const slotEndDate = useMemo(
    () => (slotStartDate ? addHours(slotStartDate, slotDurationHours) : null),
    [slotDurationHours, slotStartDate],
  )
  const productsById = useMemo(
    () => new Map(availableProducts.map((product) => [product.id, product])),
    [availableProducts],
  )

  const loadProducts = async () => {
    setIsLoadingProducts(true)
    setProductsError('')

    try {
      const result = await listShopProducts()
      setAvailableProducts(
        result.items.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          sales: item.sales ?? 0,
          price: item.price,
          stock: item.stock,
          status: item.status,
          image: item.image ?? null,
        })),
      )
      setProductsAuthRequired(result.authRequired)
      setProductsNoShop(result.noShop)
    } catch (error) {
      setAvailableProducts([])
      setProductsAuthRequired(false)
      setProductsNoShop(false)
      setProductsError(error instanceof Error ? error.message : 'Unable to load products.')
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const loadCategories = async () => {
    setIsLoadingCategories(true)
    setCategoriesError('')

    try {
      const result = await listShopCategories()
      setCriteriaCategories(mapCriteriaCategories(result.items))
      if (
        activeCriteriaId !== 'all' &&
        !result.items.some((category) => category.id === activeCriteriaId)
      ) {
        setActiveCriteriaId('all')
      }
    } catch (error) {
      setCriteriaCategories(defaultCriteriaCategories)
      setCategoriesError(error instanceof Error ? error.message : 'Unable to load categories.')
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const activeCategoryRules = useMemo(() => {
    const activeCategory = criteriaCategories.find((category) => category.id === activeCriteriaId)
    return activeCategory?.rules ?? defaultRules
  }, [activeCriteriaId, criteriaCategories])
  const activeCategoryLabel = useMemo(
    () =>
      criteriaCategories.find((category) => category.id === activeCriteriaId)?.label ?? 'All',
    [activeCriteriaId, criteriaCategories],
  )
  const selectedProductCount = selectedProductIds.length
  const slotSummaryLabel = useMemo(() => {
    if (!slotStartDate || !slotEndDate) {
      return 'Schedule not set'
    }

    const dayLabel = slotStartDate.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })

    return `${dayLabel} | ${formatTime(slotStartDate)} - ${formatTime(slotEndDate)}`
  }, [slotEndDate, slotStartDate])
  const slotDateLabel = useMemo(() => {
    if (!slotStartDate) {
      return 'No date selected'
    }

    return slotStartDate.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }, [slotStartDate])
  const slotTimeRangeLabel = useMemo(() => {
    if (!slotStartDate || !slotEndDate) {
      return 'Tap Change to pick a start time'
    }

    return `${formatTime(slotStartDate)} - ${formatTime(slotEndDate)}`
  }, [slotEndDate, slotStartDate])
  const mobileCurrentStepNumber =
    mobileStep === 'setup' ? 1 : mobileStep === 'products' ? 2 : 3
  const mobileDayOptions = useMemo(
    () =>
      Array.from({ length: MOBILE_DAY_OPTION_COUNT }, (_, index) =>
        addDays(mobileDayWindowStart, index),
      ),
    [mobileDayWindowStart],
  )
  const selectedMobileDay = useMemo(
    () => (slotStartDate ? getStartOfDay(slotStartDate) : mobileDayOptions[0]),
    [mobileDayOptions, slotStartDate],
  )
  const mobileDayWindowLabel = useMemo(() => {
    const firstDay = mobileDayOptions[0]
    const lastDay = mobileDayOptions[mobileDayOptions.length - 1]

    if (!firstDay || !lastDay) {
      return ''
    }

    return `${formatDayChipDate(firstDay)} to ${formatDayChipDate(lastDay)}`
  }, [mobileDayOptions])
  const mobileSelectedLabel = useMemo(() => {
    if (!slotStartDate || !slotEndDate) {
      return 'No period selected'
    }

    return `${formatDateTime(slotStartDate)} - ${formatTime(slotEndDate)}`
  }, [slotEndDate, slotStartDate])
  const mobileStepTwoProducts = useMemo(() => {
    return selectedProductIds.map((productId) => {
      const catalogEntry = getCatalogEntry(productId, productsById)

      return {
        id: productId,
        name: catalogEntry.name,
        originalPrice: catalogEntry.originalPrice,
        stock: catalogEntry.stock,
      }
    })
  }, [productsById, selectedProductIds])
  const filteredMobileStepTwoProducts = useMemo(() => {
    const query = mobileStepTwoSearch.trim().toLowerCase()

    if (!query) {
      return mobileStepTwoProducts
    }

    return mobileStepTwoProducts.filter((product) =>
      product.name.toLowerCase().includes(query),
    )
  }, [mobileStepTwoProducts, mobileStepTwoSearch])
  const productSummaryLabel =
    selectedProductIds.length === 0 ? '0 products' : `${selectedProductCount} selected`
  const canOpenDiscountStep = selectedProductIds.length > 0
  const isSetupComplete = Boolean(slotStartDate)
  const visibleCategoryRules = showAllMobileRules
    ? activeCategoryRules
    : activeCategoryRules.slice(0, MOBILE_RULES_PREVIEW_COUNT)
  const hasMoreCategoryRules = activeCategoryRules.length > MOBILE_RULES_PREVIEW_COUNT
  const isMobileBulkPercentDisabled = Boolean(mobileBulkDiscountedPrice)
  const isMobileBulkDiscountedPriceDisabled = Boolean(mobileBulkDiscountPercent)
  const hasMobileBulkInputs =
    Boolean(mobileBulkDiscountPercent) ||
    Boolean(mobileBulkDiscountedPrice) ||
    Boolean(mobileBulkCampaignStock) ||
    Boolean(mobileBulkPurchaseLimit) ||
    mobileBulkNoLimit
  const mobileBulkTargetProductIds = useMemo(() => selectedProductIds, [selectedProductIds])

  const isConfirmDisabled = selectedProductIds.length === 0 || !slotStartDate
  const isMobileBulkApplyDisabled =
    mobileBulkTargetProductIds.length === 0 || !hasMobileBulkInputs

  useEffect(() => {
    setProductStateById((previous) => {
      const next: Record<string, FlashDealProductState> = {}

      selectedProductIds.forEach((productId) => {
        next[productId] =
          previous[productId] ?? createProductState(getCatalogEntry(productId, productsById))
      })

      return next
    })
  }, [productsById, selectedProductIds])

  useEffect(() => {
    void loadProducts()
    void loadCategories()
  }, [])

  useEffect(() => {
    setShowAllMobileRules(false)
  }, [activeCriteriaId])

  useEffect(() => {
    if (mobileStep === 'discount' && !canOpenDiscountStep) {
      setMobileStep('products')
    }
  }, [canOpenDiscountStep, mobileStep])

  const hasAvailableMobileSlotForDay = (day: Date) => {
    const now = new Date()

    return MOBILE_SLOT_START_HOURS.some((slotHour) => {
      const candidate = new Date(day)
      candidate.setHours(slotHour, 0, 0, 0)
      return candidate >= now
    })
  }

  const handleShiftMobileDayWindow = (direction: -1 | 1) => {
    setMobileDayWindowStart((previous) =>
      addDays(previous, direction * MOBILE_DAY_OPTION_COUNT),
    )
  }

  const handleAddProducts = () => {
    setIsProductsModalOpen(true)
  }

  const handleProductsConfirm = (products: string[]) => {
    setSelectedProductIds(products)
    setMobileStep('products')
    setIsProductsModalOpen(false)
  }

  const handleRemoveSelectedProduct = (productId: string) => {
    setSelectedProductIds((previous) =>
      previous.filter((id) => id !== productId),
    )
  }

  const handleToggleMobileStepTwoProduct = (productId: string) => {
    setSelectedProductIds((previous) =>
      previous.includes(productId)
        ? previous.filter((id) => id !== productId)
        : [...previous, productId],
    )
  }

  const handleMobileBulkDiscountPercentChange = (nextValue: string) => {
    const sanitized = sanitizeWholeNumber(nextValue).slice(0, 2)
    setMobileBulkDiscountPercent(sanitized)

    if (sanitized) {
      setMobileBulkDiscountedPrice('')
    }
  }

  const handleMobileBulkDiscountedPriceChange = (nextValue: string) => {
    const sanitized = sanitizeDecimal(nextValue)
    setMobileBulkDiscountedPrice(sanitized)

    if (sanitized) {
      setMobileBulkDiscountPercent('')
    }
  }

  const handleApplyMobileBulkValues = () => {
    if (isMobileBulkApplyDisabled) {
      return
    }

    mobileBulkTargetProductIds.forEach((productId) => {
      if (mobileBulkDiscountPercent) {
        handleDiscountPercentChange(productId, mobileBulkDiscountPercent)
      } else if (mobileBulkDiscountedPrice) {
        handleDiscountedPriceChange(productId, mobileBulkDiscountedPrice)
      }

      if (mobileBulkCampaignStock) {
        handleCampaignStockChange(productId, mobileBulkCampaignStock)
      }

      if (mobileBulkNoLimit) {
        handlePurchaseLimitChange(productId, '')
      } else if (mobileBulkPurchaseLimit) {
        handlePurchaseLimitChange(productId, mobileBulkPurchaseLimit)
      }
    })
  }

  const updateProductState = (
    productId: string,
    updates: Partial<FlashDealProductState>,
  ) => {
    setProductStateById((previous) => ({
      ...previous,
      [productId]: {
        ...(previous[productId] ?? createProductState(getCatalogEntry(productId, productsById))),
        ...updates,
      },
    }))
  }

  const handleDiscountPercentChange = (productId: string, nextValue: string) => {
    const sanitized = sanitizeWholeNumber(nextValue)
    const catalogEntry = getCatalogEntry(productId, productsById)

    if (!sanitized) {
      updateProductState(productId, {
        discountPercent: '',
        discountedPrice: toPriceInput(catalogEntry.originalPrice),
      })
      return
    }

    const normalizedPercent = `${Math.min(Number(sanitized), 99)}`
    updateProductState(productId, {
      discountPercent: normalizedPercent,
      discountedPrice: calculateDiscountedPrice(catalogEntry.originalPrice, normalizedPercent),
    })
  }

  const handleDiscountedPriceChange = (productId: string, nextValue: string) => {
    const sanitized = sanitizeDecimal(nextValue)
    const catalogEntry = getCatalogEntry(productId, productsById)

    if (!sanitized) {
      updateProductState(productId, {
        discountedPrice: '',
        discountPercent: '',
      })
      return
    }

    const parsed = Number(sanitized)
    if (!Number.isFinite(parsed)) {
      return
    }

    const clampedPrice = Math.min(Math.max(parsed, 0), catalogEntry.originalPrice)
    const normalizedPrice = toPriceInput(clampedPrice)

    updateProductState(productId, {
      discountedPrice: normalizedPrice,
      discountPercent: deriveDiscountPercent(catalogEntry.originalPrice, normalizedPrice),
    })
  }

  const handleCampaignStockChange = (productId: string, nextValue: string) => {
    const sanitized = sanitizeWholeNumber(nextValue)
    const catalogEntry = getCatalogEntry(productId, productsById)

    if (!sanitized) {
      updateProductState(productId, { campaignStock: '' })
      return
    }

    const normalizedStock = Math.min(Number(sanitized), catalogEntry.stock)
    updateProductState(productId, { campaignStock: `${normalizedStock}` })
  }

  const handlePurchaseLimitChange = (productId: string, nextValue: string) => {
    updateProductState(productId, { purchaseLimit: sanitizeWholeNumber(nextValue) })
  }

  const handleBatchUpdateAll = () => {
    setProductStateById((previous) => {
      const next = { ...previous }

      selectedProductIds.forEach((productId) => {
        const catalogEntry = getCatalogEntry(productId, productsById)
        const current =
          next[productId] ?? createProductState(getCatalogEntry(productId, productsById))
        const updated = { ...current }

        if (batchDiscountPercent) {
          const normalizedPercent = `${Math.min(Number(batchDiscountPercent), 99)}`
          updated.discountPercent = normalizedPercent
          updated.discountedPrice = calculateDiscountedPrice(
            catalogEntry.originalPrice,
            normalizedPercent,
          )
        }

        if (batchCampaignStock) {
          const normalizedStock = Math.min(Number(batchCampaignStock), catalogEntry.stock)
          updated.campaignStock = `${normalizedStock}`
        }

        if (batchPurchaseLimit) {
          updated.purchaseLimit = batchPurchaseLimit
        }

        next[productId] = updated
      })

      return next
    })
  }

  const handleBatchClearInputs = () => {
    setBatchDiscountPercent('')
    setBatchCampaignStock('')
    setBatchPurchaseLimit('')
  }

  const handleBatchDelete = () => {
    setSelectedProductIds([])
  }

  const handleDateTimeConfirm = (date: Date | null) => {
    if (!date) {
      setSlotStartDateTime('')
      return
    }

    setMobileDayWindowStart(addDays(getStartOfDay(date), -2))
    setSlotStartDateTime(toLocalDateTimeInputValue(date))
  }

  const handleSelectMobileDay = (day: Date) => {
    if (!hasAvailableMobileSlotForDay(day)) {
      return
    }

    const now = new Date()
    const currentHour = slotStartDate
      ? getNearestSlotHour(slotStartDate.getHours())
      : MOBILE_SLOT_START_HOURS[0]
    const candidate = new Date(day)
    candidate.setHours(currentHour, 0, 0, 0)

    if (candidate >= now) {
      setSlotStartDateTime(toLocalDateTimeInputValue(candidate))
      return
    }

    const nextAvailableOnDay = MOBILE_SLOT_START_HOURS.map((slotHour) => {
      const slotCandidate = new Date(day)
      slotCandidate.setHours(slotHour, 0, 0, 0)
      return slotCandidate
    }).find((slotCandidate) => slotCandidate >= now)

    if (nextAvailableOnDay) {
      setSlotStartDateTime(toLocalDateTimeInputValue(nextAvailableOnDay))
    }
  }

  const handleSelectMobileSlot = (slotHour: number) => {
    const baseDay = selectedMobileDay ?? getStartOfDay(new Date())
    const candidate = new Date(baseDay)
    candidate.setHours(slotHour, 0, 0, 0)

    if (candidate < new Date()) {
      return
    }

    setSlotStartDateTime(toLocalDateTimeInputValue(candidate))
  }

  const handleConfirm = async () => {
    if (isConfirmDisabled || isSubmitting) {
      return
    }

    if (!slotStartDate || !slotEndDate) {
      setSubmitError('Select a valid flash deal schedule.')
      return
    }

    const products: CreateFlashDealForm['products'] = []

    for (const productId of selectedProductIds) {
      const catalogEntry = getCatalogEntry(productId, productsById)
      const state =
        productStateById[productId] ??
        createProductState(getCatalogEntry(productId, productsById))

      if (catalogEntry.name === 'Unknown product') {
        setSubmitError('One or more selected products are no longer available. Reload products and try again.')
        return
      }

      const flashPrice = Number(state.discountedPrice)
      if (!Number.isFinite(flashPrice) || flashPrice <= 0) {
        setSubmitError(`Enter a valid discounted price for ${catalogEntry.name}.`)
        return
      }
      if (flashPrice > catalogEntry.originalPrice) {
        setSubmitError(`Discounted price cannot exceed original price for ${catalogEntry.name}.`)
        return
      }

      const flashQuantity = Number(state.campaignStock)
      if (!Number.isInteger(flashQuantity) || flashQuantity <= 0) {
        setSubmitError(`Enter a valid campaign stock for ${catalogEntry.name}.`)
        return
      }
      if (flashQuantity > catalogEntry.stock) {
        setSubmitError(`Campaign stock cannot exceed available stock for ${catalogEntry.name}.`)
        return
      }

      const purchaseLimitRaw = state.purchaseLimit.trim()
      let purchaseLimit: number | null = null
      if (purchaseLimitRaw.length > 0) {
        const parsed = Number(purchaseLimitRaw)
        if (!Number.isInteger(parsed) || parsed < 1) {
          setSubmitError(`Enter a valid purchase limit for ${catalogEntry.name}.`)
          return
        }
        purchaseLimit = parsed
      }

      products.push({
        productId,
        originalPrice: catalogEntry.originalPrice,
        flashPrice,
        flashQuantity,
        purchaseLimit,
        isActive: true,
      })
    }

    const payload: CreateFlashDealForm = {
      startAt: slotStartDate.toISOString(),
      endAt: slotEndDate.toISOString(),
      products,
    }

    setSubmitError('')
    setIsSubmitting(true)

    try {
      if (onConfirm) {
        await onConfirm(payload)
      }
      onBack()
    } catch (error) {
      setSubmitError(toSubmitErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedMobileDayForSlots = selectedMobileDay ?? getStartOfDay(new Date())
  const selectedMobileDayHasAvailableSlots = hasAvailableMobileSlotForDay(
    selectedMobileDayForSlots,
  )

  return (
    <section
      className="motion-rise relative min-h-[calc(100vh-2.5rem)] overflow-hidden bg-[linear-gradient(165deg,_#f0f7ff_0%,_#f7fbff_40%,_#fdfefe_100%)] pb-32 sm:rounded-3xl sm:border sm:border-[#d6e7ff] sm:bg-white/95 sm:p-6 sm:pb-6 sm:shadow-[0_24px_52px_-45px_rgba(51,69,143,0.5)]"
      style={{ animationDelay: '80ms' }}
    >
      {submitError ? (
        <p className="mx-4 mt-3 rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c] sm:mx-0 sm:mt-0 sm:mb-4">
          {submitError}
        </p>
      ) : null}
      <div className="pointer-events-none absolute -left-24 top-20 hidden h-72 w-72 rounded-full bg-[#c7e2ff]/45 blur-3xl sm:block" />
      <div className="pointer-events-none absolute -bottom-24 right-[-60px] hidden h-80 w-80 rounded-full bg-[#bae6fd]/45 blur-3xl sm:block" />

      <div className="sm:hidden">
        <div className="sticky top-0 z-10 border-b border-[#E6EBFF] bg-white/95 px-4 pb-3 pt-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#e5e7eb] bg-white text-lg text-[#3A56C5] transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC]"
              aria-label="Back to Flash Deals"
            >
              &larr;
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-slate-900">
                Create My Shop&apos;s Flash Sale
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">{slotSummaryLabel}</p>
            </div>
          </div>

          <div className="mt-3 rounded-md border border-[#D0DBF7] bg-white p-3">
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setMobileStep('setup')}
                className="flex min-h-11 flex-col items-center justify-center rounded-sm px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC]"
              >
                <span
                  className={`inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-semibold ${
                    mobileCurrentStepNumber >= 1
                      ? 'border-[#3A56C5] bg-[#F2F4FF] text-[#3A56C5]'
                      : 'border-slate-300 text-slate-400'
                  }`}
                >
                  1
                </span>
                <span className="mt-1 text-[10px] text-slate-500">Select Period</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileStep('products')}
                className="flex min-h-11 flex-col items-center justify-center rounded-sm px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC]"
              >
                <span
                  className={`inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-semibold ${
                    mobileCurrentStepNumber >= 2
                      ? 'border-[#3A56C5] bg-[#F2F4FF] text-[#3A56C5]'
                      : 'border-slate-300 text-slate-400'
                  }`}
                >
                  2
                </span>
                <span className="mt-1 text-[10px] text-slate-500">Add Products</span>
              </button>

              <button
                type="button"
                onClick={() => setMobileStep('discount')}
                disabled={!canOpenDiscountStep}
                className="flex min-h-11 flex-col items-center justify-center rounded-sm px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span
                  className={`inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-semibold ${
                    mobileCurrentStepNumber >= 3
                      ? 'border-[#3A56C5] bg-[#F2F4FF] text-[#3A56C5]'
                      : 'border-slate-300 text-slate-400'
                  }`}
                >
                  3
                </span>
                <span className="mt-1 text-[10px] text-slate-500">Set Discount</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative hidden sm:block">
        <CreateFlashDealBreadcrumb onBack={onBack} />
        <header className="mt-3 rounded-3xl border border-[#cfe2ff] bg-[linear-gradient(135deg,_#f4f8ff_0%,_#e9f3ff_50%,_#E6EBFF_100%)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#3347A8]">
            Launch workflow
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-[#1E3A8A]">
            Create Flash Deal
          </h1>
          <p className="mt-1 text-sm text-[#3347A8]">
            Configure timing and filters, then attach products when your schedule is ready.
          </p>
        </header>
      </div>

      <div className="relative mt-3 grid gap-4 px-3 sm:mt-4 sm:px-0 lg:grid-cols-[minmax(0,1fr)_270px]">
        <div className="space-y-4">
          <article
            className={`rounded-2xl border border-[#cfe2ff] bg-white/95 p-4 shadow-[0_12px_26px_-20px_rgba(51,69,143,0.45)] sm:p-5 ${
              mobileStep === 'setup' ? 'block' : 'hidden'
            } sm:block`}
          >
            <div className="sm:hidden">
              <div className="rounded-md border border-[#D0DBF7] bg-white">
                <div className="border-b border-[#E6EBFF] px-2 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#3347A8]">
                        Select Period
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{mobileDayWindowLabel}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleShiftMobileDayWindow(-1)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[#E6EBFF] bg-white text-[#3A56C5] transition hover:bg-[#F2F4FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC]"
                        aria-label="Show previous dates"
                      >
                        <CaretLeft size={14} weight="bold" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShiftMobileDayWindow(1)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[#E6EBFF] bg-white text-[#3A56C5] transition hover:bg-[#F2F4FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC]"
                        aria-label="Show next dates"
                      >
                        <CaretRight size={14} weight="bold" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsTimePickerOpen(true)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-[#E6EBFF] bg-white text-[#3A56C5] transition hover:bg-[#F2F4FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC]"
                        aria-label="Open calendar"
                      >
                        <CalendarBlank size={15} weight="bold" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-5 gap-1">
                    {mobileDayOptions.map((day) => {
                      const selected = selectedMobileDay ? isSameDay(selectedMobileDay, day) : false
                      const isUnavailable = !hasAvailableMobileSlotForDay(day)

                      return (
                        <button
                          key={toDayKey(day)}
                          type="button"
                          onClick={() => handleSelectMobileDay(day)}
                          disabled={isUnavailable}
                          className={`min-h-12 rounded-sm border px-1 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC] ${
                            isUnavailable
                              ? 'cursor-not-allowed border-[#e2e8f0] bg-[#f8fafc]'
                              : ''
                          } ${
                            selected
                              ? 'border-[#3A56C5] bg-[#F2F4FF]'
                              : 'border-[#f3f4f6] bg-white hover:bg-slate-50'
                          }`}
                        >
                          <span
                            className={`block text-[10px] ${
                              isUnavailable ? 'text-slate-400' : 'text-slate-500'
                            }`}
                          >
                            {day.toLocaleString('en-US', { weekday: 'short' })}
                          </span>
                          <span
                            className={`mt-0.5 block text-[11px] font-semibold ${
                              isUnavailable
                                ? 'text-slate-400'
                                : selected
                                  ? 'text-[#3347A8]'
                                  : 'text-slate-700'
                            }`}
                          >
                            {formatDayChipDate(day)}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="px-2 py-2">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Time Slots
                  </p>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">Duration</span>
                    <select
                      value={slotDurationHours}
                      onChange={(event) => setSlotDurationHours(Number(event.target.value))}
                      className="h-8 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 focus:border-[#B1C2EC] focus:outline-none"
                    >
                      {SLOT_DURATION_OPTIONS.map((hours) => (
                        <option key={hours} value={hours}>
                          {hours} hrs
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    {MOBILE_SLOT_START_HOURS.map((slotHour) => {
                      const slotStart = new Date(selectedMobileDayForSlots)
                      slotStart.setHours(slotHour, 0, 0, 0)
                      const slotEnd = addHours(slotStart, slotDurationHours)
                      const isDisabled = slotStart < new Date()
                      const selected =
                        !isDisabled &&
                        slotStartDate !== null &&
                        isSameDay(slotStartDate, slotStart) &&
                        slotStartDate.getHours() === slotHour &&
                        slotStartDate.getMinutes() === 0

                      return (
                        <button
                          key={slotHour}
                          type="button"
                          onClick={() => handleSelectMobileSlot(slotHour)}
                          disabled={isDisabled}
                          className={`inline-flex min-h-11 w-full items-center justify-between rounded-sm border px-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC] ${
                            selected
                              ? 'border-[#3A56C5] bg-[#F2F4FF] font-semibold text-[#3347A8]'
                              : 'border-[#d1d5db] bg-white text-slate-700'
                          } ${
                            isDisabled
                              ? 'cursor-not-allowed border-[#cbd5e1] bg-[#e2e8f0] text-[#94a3b8]'
                              : 'hover:border-[#B1C2EC] hover:bg-[#f8fbff]'
                          }`}
                        >
                          <span>{formatTime24(slotStart)}-{formatTime24(slotEnd)}</span>
                          {isDisabled ? (
                            <span className="rounded-sm bg-[#cbd5e1] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#64748b]">
                              Unavailable
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>

                  {!selectedMobileDayHasAvailableSlots ? (
                    <p className="mt-2 text-xs text-slate-400">
                      No available slots on this date.
                    </p>
                  ) : null}
                </div>
              </div>

              <p className="mt-2 text-xs font-medium text-slate-600">Selected {mobileSelectedLabel}</p>

              <div className="mt-3 rounded-md border border-[#D0DBF7] bg-white">
                <button
                  type="button"
                  onClick={() => setIsMobileCriteriaOpen((previous) => !previous)}
                  aria-expanded={isMobileCriteriaOpen}
                  aria-controls={MOBILE_RULES_REGION_ID}
                  className="inline-flex min-h-11 w-full items-center justify-between px-3 text-left text-sm font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC]"
                >
                  <span>Criteria Profile: {activeCategoryLabel}</span>
                  <CaretDown
                    size={14}
                    weight="bold"
                    className={`text-[#3A56C5] transition ${isMobileCriteriaOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {isMobileCriteriaOpen ? (
                  <div className="border-t border-[#D0DBF7] px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      {criteriaCategories.map((category) => {
                        const active = category.id === activeCriteriaId

                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => setActiveCriteriaId(category.id)}
                            className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC] ${
                              active
                                ? 'border-[#3A56C5] bg-[#3A56C5] text-white'
                                : 'border-[#D0DBF7] bg-white text-slate-600'
                            }`}
                            aria-pressed={active}
                          >
                            {category.label}
                          </button>
                        )
                      })}
                    </div>

                    <div id={MOBILE_RULES_REGION_ID} className="mt-3 rounded-sm bg-[#f8fbff] p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-700">All criteria rules</p>
                        <span className="text-[11px] font-semibold text-[#3A56C5]">
                          {activeCategoryRules.length} checks
                        </span>
                      </div>

                      <ul className="mt-2 space-y-1.5">
                        {visibleCategoryRules.map((rule) => (
                          <li key={rule} className="flex items-start gap-1.5 text-xs text-slate-600">
                            <Checks size={12} weight="bold" className="mt-0.5 text-[#3A56C5]" />
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>

                      {hasMoreCategoryRules ? (
                        <button
                          type="button"
                          onClick={() => setShowAllMobileRules((previous) => !previous)}
                          aria-expanded={showAllMobileRules}
                          aria-controls={MOBILE_RULES_REGION_ID}
                          className="mt-2 inline-flex min-h-9 items-center rounded-sm border border-[#D0DBF7] bg-white px-3 text-xs font-semibold text-[#3A56C5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC]"
                        >
                          {showAllMobileRules ? 'Show fewer rules' : 'Show all rules'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="hidden sm:block">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#3A56C5]">
                    Step 1
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900 sm:text-lg">
                    Deal Setup
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Choose your schedule and criteria before adding products.
                  </p>
                </div>
                <span className="inline-flex min-h-9 items-center rounded-full border border-[#D0DBF7] bg-[#F2F4FF] px-3 text-xs font-semibold text-[#3347A8]">
                  Step 1 of 2
                </span>
              </header>

              <div className="mt-5 divide-y divide-[#e2e8f0]">
                <section className="pb-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-slate-800">Schedule</h3>
                    <div className="flex items-center gap-2">
                      <select
                        value={slotDurationHours}
                        onChange={(event) => setSlotDurationHours(Number(event.target.value))}
                        className="h-9 rounded-lg border border-[#D0DBF7] bg-white px-2 text-xs font-semibold text-[#3347A8] focus:border-[#B1C2EC] focus:outline-none"
                      >
                        {SLOT_DURATION_OPTIONS.map((hours) => (
                          <option key={hours} value={hours}>
                            {hours} hrs
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsTimePickerOpen(true)}
                    className="inline-flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border border-[#D0DBF7] bg-[#f8fbff] px-3 py-2 text-left transition hover:bg-[#F2F4FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC]"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#E6EBFF] text-[#3347A8]"
                        aria-hidden="true"
                      >
                        <CalendarBlank size={18} weight="bold" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-base font-semibold leading-6 text-slate-900">
                          {slotDateLabel}
                        </span>
                        <span className="mt-0.5 block text-sm leading-6 text-slate-600">
                          {slotTimeRangeLabel}
                        </span>
                      </span>
                    </span>
                    <span className="inline-flex min-h-9 flex-none items-center rounded-lg border border-[#D0DBF7] bg-white px-3 text-sm font-semibold text-[#3347A8]">
                      Change
                    </span>
                  </button>
                </section>

                <section className="pt-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-slate-800">Criteria Profile</h3>
                    <span className="text-sm font-medium text-[#3347A8]">{activeCategoryLabel}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {criteriaCategories.map((category) => {
                      const active = category.id === activeCriteriaId

                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setActiveCriteriaId(category.id)}
                          className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC] ${
                            active
                              ? 'border-[#3A56C5] bg-[#3A56C5] text-white'
                              : 'border-[#D0DBF7] bg-white text-slate-700 hover:bg-[#F2F4FF]'
                          }`}
                          aria-pressed={active}
                        >
                          {category.label}
                        </button>
                      )
                    })}
                  </div>
                  {isLoadingCategories ? (
                    <p className="mt-2 text-xs text-slate-500">Loading categories...</p>
                  ) : categoriesError ? (
                    <p className="mt-2 text-xs text-amber-700">
                      {categoriesError}. Showing default profile only.
                    </p>
                  ) : null}

                  <ul className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                    {activeCategoryRules.map((rule) => (
                      <li key={`desktop-${rule}`} className="flex items-start gap-2 rounded-lg bg-[#f8fbff] px-2 py-1.5">
                        <span
                          className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#E6EBFF] text-[10px] font-bold text-[#3A56C5]"
                          aria-hidden="true"
                        >
                          OK
                        </span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </article>

          <article
            className={`rounded-2xl border border-[#cfe2ff] bg-white/95 p-4 shadow-[0_12px_26px_-20px_rgba(51,69,143,0.45)] sm:p-5 ${
              mobileStep === 'products' || mobileStep === 'discount' ? 'block' : 'hidden'
            } sm:block`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-[#2F3F7E]">
                  Shop&apos;s Flash Deal Products
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {mobileStep === 'discount'
                    ? 'Set discount and stock values for each selected product.'
                    : 'Add products after reviewing your selected criteria profile.'}
                </p>
              </div>
              <span className="rounded-full border border-[#D0DBF7] bg-[#F2F4FF] px-2.5 py-1 text-[11px] font-semibold text-[#3347A8]">
                {productSummaryLabel}
              </span>
            </div>

            <button
              type="button"
              onClick={handleAddProducts}
              disabled={isLoadingProducts || productsAuthRequired || productsNoShop}
              className="mt-3 hidden h-9 items-center rounded-lg border border-[#3A56C5] bg-white px-3 text-sm font-medium text-[#3347A8] transition hover:bg-[#F2F4FF] sm:inline-flex"
            >
              + Add Products
            </button>
            {isLoadingProducts ? (
              <p className="mt-2 text-xs text-slate-500">Loading products...</p>
            ) : productsAuthRequired ? (
              <p className="mt-2 text-xs text-slate-500">Sign in to load shop products.</p>
            ) : productsNoShop ? (
              <p className="mt-2 text-xs text-slate-500">No shop found for this account.</p>
            ) : productsError ? (
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <span>{productsError}</span>
                <button
                  type="button"
                  onClick={() => void loadProducts()}
                  className="font-semibold text-[#3347A8] hover:underline"
                >
                  Retry
                </button>
              </div>
            ) : null}

            {mobileStep === 'products' ? (
              <>
                <div className="mt-3 space-y-2 sm:hidden">
                  <button
                    type="button"
                    onClick={handleAddProducts}
                    disabled={isLoadingProducts || productsAuthRequired || productsNoShop}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#3A56C5] bg-white px-3 text-sm font-semibold text-[#3347A8] transition hover:bg-[#F2F4FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC]"
                  >
                    + Add Products
                  </button>
                  {selectedProductIds.length > 0 ? (
                    <label className="flex min-h-11 items-center rounded-sm border border-[#E6EBFF] bg-white px-3">
                      <MagnifyingGlass size={16} className="mr-2 text-slate-400" />
                      <input
                        type="text"
                        value={mobileStepTwoSearch}
                        onChange={(event) => setMobileStepTwoSearch(event.target.value)}
                        placeholder="Search"
                        className="w-full border-0 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                      />
                    </label>
                  ) : null}
                </div>

                {selectedProductIds.length > 0 ? (
                  <div className="mt-2 sm:hidden">
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                      {filteredMobileStepTwoProducts.length > 0 ? (
                        <ul className="divide-y divide-slate-200">
                          {filteredMobileStepTwoProducts.map((product, index) => {
                            const selected = selectedProductIds.includes(product.id)
                            const checkboxId = `mobile-step-two-checkbox-${index}`

                            return (
                              <li key={`mobile-step-two-${product.id}`}>
                                <label
                                  htmlFor={checkboxId}
                                  className={`flex w-full items-center gap-3 px-3 py-3 transition focus-within:ring-2 focus-within:ring-inset focus-within:ring-[#B1C2EC] ${
                                    selected ? 'bg-[#F2F4FF]' : 'bg-white'
                                  }`}
                                >
                                  <span
                                    className={`inline-flex h-11 w-11 flex-none items-center justify-center rounded-lg border ${
                                      selected
                                        ? 'border-[#B1C2EC] bg-[#E6EBFF]'
                                        : 'border-slate-200 bg-slate-50'
                                    }`}
                                  >
                                    <input
                                      id={checkboxId}
                                      type="checkbox"
                                      checked={selected}
                                      onChange={() => handleToggleMobileStepTwoProduct(product.id)}
                                      aria-label={`Select ${product.name}`}
                                      className="h-5 w-5 rounded border-[#94a3b8] text-[#3A56C5] focus:ring-[#B1C2EC]"
                                    />
                                  </span>
                                  <span className="flex-none">
                                    <ProductImage name={product.name} image={product.image} />
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
                                      {product.name}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      {toPriceLabel(product.originalPrice)} - Stock: {product.stock}
                                    </p>
                                  </div>
                                </label>
                              </li>
                            )
                          })}
                        </ul>
                      ) : (
                        <div className="px-3 py-6 text-center text-sm text-slate-500">
                          No products found.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 rounded-xl border border-dashed border-[#D0DBF7] bg-[#f8fbff] px-3 py-4 text-sm text-slate-500 sm:hidden">
                    No products selected yet.
                  </div>
                )}
              </>
            ) : null}

            {mobileStep === 'discount' ? (
              <div className="mt-3 space-y-3 sm:hidden">
                {selectedProductIds.length > 0 ? (
                  <>
                    <article className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#E6EBFF]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-[#2F3F7E]">Bulk apply</h3>
                          <p
                            id="mobile-bulk-apply-helper"
                            className="mt-1 text-xs leading-5 text-slate-500"
                          >
                            Bulk apply overwrites existing values.
                          </p>
                        </div>
                        <span className="rounded-full border border-[#D0DBF7] bg-[#F2F4FF] px-2.5 py-1 text-[11px] font-semibold text-[#3347A8]">
                          {mobileBulkTargetProductIds.length} target
                        </span>
                      </div>

                      <form
                        className="mt-3 space-y-3"
                        onSubmit={(event) => {
                          event.preventDefault()
                          handleApplyMobileBulkValues()
                        }}
                      >
                        <div className="grid gap-3 min-[420px]:grid-cols-2">
                          <label className="block">
                            <span className="text-xs font-medium text-slate-700">Discount (%)</span>
                            <div className="mt-1 flex h-11 items-center rounded-lg border border-[#cbd5e1] bg-white px-3">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={mobileBulkDiscountPercent}
                                onChange={(event) =>
                                  handleMobileBulkDiscountPercentChange(event.target.value)
                                }
                                disabled={isMobileBulkPercentDisabled}
                                aria-disabled={isMobileBulkPercentDisabled}
                                aria-describedby="mobile-bulk-apply-helper"
                                placeholder="0-99"
                                className="w-full border-0 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:text-slate-400"
                              />
                              <span className="text-xs text-slate-400">%</span>
                            </div>
                          </label>

                          <label className="block">
                            <span className="text-xs font-medium text-slate-700">
                              Discounted Price (PHP)
                            </span>
                            <div className="mt-1 flex h-11 items-center rounded-lg border border-[#cbd5e1] bg-white px-3">
                              <span className="text-xs text-slate-400">PHP</span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={mobileBulkDiscountedPrice}
                                onChange={(event) =>
                                  handleMobileBulkDiscountedPriceChange(event.target.value)
                                }
                                disabled={isMobileBulkDiscountedPriceDisabled}
                                aria-disabled={isMobileBulkDiscountedPriceDisabled}
                                aria-describedby="mobile-bulk-apply-helper"
                                placeholder="0.00"
                                className="ml-2 w-full border-0 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:text-slate-400"
                              />
                            </div>
                          </label>
                        </div>

                        <div className="grid gap-3 min-[420px]:grid-cols-2">
                          <label className="block">
                            <span className="text-xs font-medium text-slate-700">Campaign Stock</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={mobileBulkCampaignStock}
                              onChange={(event) =>
                                setMobileBulkCampaignStock(
                                  sanitizeWholeNumber(event.target.value),
                                )
                              }
                              placeholder="Set stock"
                              aria-describedby="mobile-bulk-apply-helper"
                              className="mt-1 h-11 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#B1C2EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC]"
                            />
                          </label>

                          <label className="block">
                            <span className="text-xs font-medium text-slate-700">Purchase Limit</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={mobileBulkPurchaseLimit}
                              onChange={(event) =>
                                setMobileBulkPurchaseLimit(
                                  sanitizeWholeNumber(event.target.value),
                                )
                              }
                              disabled={mobileBulkNoLimit}
                              aria-disabled={mobileBulkNoLimit}
                              placeholder="No limit"
                              aria-describedby="mobile-bulk-apply-helper"
                              className="mt-1 h-11 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#B1C2EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC] disabled:bg-slate-100 disabled:text-slate-400"
                            />
                          </label>
                        </div>

                        <label className="flex min-h-11 items-center gap-2 rounded-lg border border-[#E6EBFF] bg-[#f8fbff] px-3 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={mobileBulkNoLimit}
                            onChange={(event) => {
                              const checked = event.target.checked
                              setMobileBulkNoLimit(checked)
                              if (checked) {
                                setMobileBulkPurchaseLimit('')
                              }
                            }}
                            className="h-4 w-4 rounded border-[#94a3b8] text-[#3A56C5] focus:ring-[#B1C2EC]"
                          />
                          No limit for purchase limit
                        </label>


                        <button
                          type="submit"
                          disabled={isMobileBulkApplyDisabled}
                          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#3A56C5] px-4 text-sm font-semibold text-white transition hover:bg-[#3347A8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC] disabled:cursor-not-allowed disabled:bg-[#B1C2EC]"
                        >
                          {`Apply to selected (${selectedProductIds.length})`}
                        </button>
                      </form>
                    </article>

                    <div className="space-y-3">
                      {selectedProductIds.map((productId) => {
                        const catalogEntry = getCatalogEntry(productId, productsById)
                        const productState =
                          productStateById[productId] ??
                          createProductState(getCatalogEntry(productId, productsById))

                        return (
                          <article
                            key={`mobile-discount-${productId}`}
                            className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-[#E6EBFF]"
                          >
                            <div className="flex items-start gap-3">
                              <ProductImage name={catalogEntry.name} image={catalogEntry.image} />

                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
                                  {catalogEntry.name}
                                </p>
                                <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                                  {catalogEntry.variations.join(' • ')}
                                </p>
                                <p className="mt-1 text-xs text-slate-600">
                                  <span className="font-medium">Original:</span>{' '}
                                  {toPriceLabel(catalogEntry.originalPrice)}
                                  <span className="mx-1.5 text-slate-300">•</span>
                                  <span className="font-medium">Stock:</span> {catalogEntry.stock}
                                </p>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSelectedProduct(productId)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#D0DBF7] text-[#3347A8] transition hover:bg-[#F2F4FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC]"
                                  aria-label={`Remove ${catalogEntry.name}`}
                                >
                                  <X size={14} weight="bold" />
                                </button>

                              </div>
                            </div>

                            <div className="mt-4 space-y-3 border-t border-slate-100 pt-3">
                              <div className="grid gap-3 min-[420px]:grid-cols-2">
                                <label className="block">
                                  <span className="text-xs font-medium text-slate-700">
                                    Discount (%)
                                  </span>
                                  <div className="mt-1 flex h-11 items-center rounded-lg border border-[#cbd5e1] bg-white px-3">
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={productState.discountPercent}
                                      onChange={(event) =>
                                        handleDiscountPercentChange(productId, event.target.value)
                                      }
                                      className="w-full border-0 bg-transparent text-sm text-slate-900 focus:outline-none"
                                    />
                                    <span className="text-xs text-slate-400">%OFF</span>
                                  </div>
                                </label>

                                <label className="block">
                                  <span className="text-xs font-medium text-slate-700">
                                    Discounted Price (PHP)
                                  </span>
                                  <div className="mt-1 flex h-11 items-center rounded-lg border border-[#cbd5e1] bg-white px-3">
                                    <span className="text-xs text-slate-400">PHP</span>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={productState.discountedPrice}
                                      onChange={(event) =>
                                        handleDiscountedPriceChange(productId, event.target.value)
                                      }
                                      className="ml-2 w-full border-0 bg-transparent text-sm text-slate-900 focus:outline-none"
                                    />
                                  </div>
                                </label>
                              </div>

                              <div className="grid gap-3 min-[420px]:grid-cols-2">
                                <label className="block">
                                  <span className="text-xs font-medium text-slate-700">
                                    Campaign Stock
                                  </span>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={productState.campaignStock}
                                    onChange={(event) =>
                                      handleCampaignStockChange(productId, event.target.value)
                                    }
                                    className="mt-1 h-11 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-sm text-slate-900 focus:border-[#B1C2EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC]"
                                  />
                                </label>

                                <label className="block">
                                  <span className="text-xs font-medium text-slate-700">
                                    Purchase Limit
                                  </span>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={productState.purchaseLimit}
                                    onChange={(event) =>
                                      handlePurchaseLimitChange(productId, event.target.value)
                                    }
                                    placeholder="No Limit"
                                    className="mt-1 h-11 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#B1C2EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC]"
                                  />
                                </label>
                              </div>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#D0DBF7] bg-[#f8fbff] px-3 py-4 text-sm text-slate-500">
                    Add at least one product in Step 2 to continue.
                  </div>
                )}
              </div>
            ) : null}

            <div className="hidden sm:block">
              {selectedProductIds.length > 0 ? (
              <div className="mt-3 space-y-3">
                <div className="rounded-xl border border-[#E6EBFF] bg-[#f8fbff] px-3 py-2 text-xs text-slate-600">
                  You have selected {selectedProductCount} out of 50 product(s) for this Flash Deals time slot.
                </div>

                <div className="rounded-xl border border-[#E6EBFF] bg-[#f8fbff] p-4">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <label className="text-xs text-slate-500">
                        Discount
                        <div className="mt-1 flex h-10 items-center rounded border border-[#cbd5e1] bg-white px-3">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={batchDiscountPercent}
                            onChange={(event) =>
                              setBatchDiscountPercent(
                                sanitizeWholeNumber(event.target.value).slice(0, 2),
                              )
                            }
                            placeholder="0"
                            className="w-full border-0 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                          />
                          <span className="text-[11px] text-slate-400">%OFF</span>
                        </div>
                      </label>

                      <label className="text-xs text-slate-500">
                        Campaign Stock
                        <input
                          type="text"
                          inputMode="numeric"
                          value={batchCampaignStock}
                          onChange={(event) =>
                            setBatchCampaignStock(sanitizeWholeNumber(event.target.value))
                          }
                          placeholder="0"
                          className="mt-1 h-10 w-full rounded border border-[#cbd5e1] bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#B1C2EC] focus:outline-none"
                        />
                      </label>

                      <label className="text-xs text-slate-500">
                        Purchase Limit
                        <input
                          type="text"
                          inputMode="numeric"
                          value={batchPurchaseLimit}
                          onChange={(event) =>
                            setBatchPurchaseLimit(sanitizeWholeNumber(event.target.value))
                          }
                          placeholder="No Limit"
                          className="mt-1 h-10 w-full rounded border border-[#cbd5e1] bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#B1C2EC] focus:outline-none"
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap items-end gap-2 lg:justify-end">
                      <button
                        type="button"
                        onClick={handleBatchUpdateAll}
                        className="inline-flex h-10 items-center justify-center rounded border border-[#3A56C5] bg-white px-4 text-xs font-semibold text-[#3347A8] transition hover:bg-[#F2F4FF]"
                      >
                        Update All
                      </button>
                      <button
                        type="button"
                        onClick={handleBatchClearInputs}
                        className="inline-flex h-10 items-center justify-center rounded border border-[#cbd5e1] bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex border-t border-[#E6EBFF] pt-3 lg:justify-end">
                    <button
                      type="button"
                      onClick={handleBatchDelete}
                      className="inline-flex h-9 items-center justify-center rounded border border-[#fecaca] bg-white px-4 text-xs font-semibold text-[#b91c1c] transition hover:bg-[#fef2f2]"
                    >
                      Delete All
                    </button>
                  </div>
                </div>

                <div className="hidden overflow-auto rounded-xl border border-[#E6EBFF] sm:block">
                  <table className="min-w-[980px] w-full border-separate border-spacing-0 bg-white">
                    <thead>
                      <tr className="bg-[#f8fbff] text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-3 py-2.5 font-semibold">Variation(s)</th>
                        <th className="px-3 py-2.5 font-semibold">Original Price</th>
                        <th className="px-3 py-2.5 font-semibold">Discounted Price</th>
                        <th className="px-3 py-2.5 font-semibold">Discount</th>
                        <th className="px-3 py-2.5 font-semibold">Campaign Stock</th>
                        <th className="px-3 py-2.5 font-semibold">Stock</th>
                        <th className="px-3 py-2.5 font-semibold">Purchase Limit</th>
                        <th className="px-3 py-2.5 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProductIds.map((productId) => {
                        const catalogEntry = getCatalogEntry(productId, productsById)
                        const productState =
                          productStateById[productId] ??
                          createProductState(getCatalogEntry(productId, productsById))

                        return (
                          <tr key={productId} className="border-t border-slate-100 text-sm text-slate-700">
                            <td className="px-3 py-3 align-top">
                              <div className="flex items-start gap-2.5">
                                <ProductImage name={catalogEntry.name} image={catalogEntry.image} />
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-900">{catalogEntry.name}</p>
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {catalogEntry.variations.join(' | ')}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 align-top">{toPriceLabel(catalogEntry.originalPrice)}</td>
                            <td className="px-3 py-3 align-top">
                              <div className="flex h-9 items-center rounded border border-[#cbd5e1] bg-white px-2">
                                <span className="text-xs text-slate-400">PHP</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={productState.discountedPrice}
                                  onChange={(event) =>
                                    handleDiscountedPriceChange(productId, event.target.value)
                                  }
                                  className="ml-1 w-20 border-0 bg-transparent text-sm text-slate-900 focus:outline-none"
                                />
                              </div>
                            </td>
                            <td className="px-3 py-3 align-top">
                              <div className="flex h-9 items-center rounded border border-[#cbd5e1] bg-white px-2">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={productState.discountPercent}
                                  onChange={(event) =>
                                    handleDiscountPercentChange(productId, event.target.value)
                                  }
                                  className="w-14 border-0 bg-transparent text-sm text-slate-900 focus:outline-none"
                                />
                                <span className="text-[11px] text-slate-400">%OFF</span>
                              </div>
                            </td>
                            <td className="px-3 py-3 align-top">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={productState.campaignStock}
                                onChange={(event) =>
                                  handleCampaignStockChange(productId, event.target.value)
                                }
                                className="h-9 w-20 rounded border border-[#cbd5e1] bg-white px-2 text-sm text-slate-900 focus:border-[#B1C2EC] focus:outline-none"
                              />
                            </td>
                            <td className="px-3 py-3 align-top">{catalogEntry.stock}</td>
                            <td className="px-3 py-3 align-top">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={productState.purchaseLimit}
                                onChange={(event) =>
                                  handlePurchaseLimitChange(productId, event.target.value)
                                }
                                placeholder="No Limit"
                                className="h-9 w-24 rounded border border-[#cbd5e1] bg-white px-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#B1C2EC] focus:outline-none"
                              />
                            </td>
                            <td className="px-3 py-3 align-top">
                              <button
                                type="button"
                                onClick={() => handleRemoveSelectedProduct(productId)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#D0DBF7] text-[#3347A8] transition hover:bg-[#F2F4FF]"
                                aria-label={`Remove ${catalogEntry.name}`}
                              >
                                <X size={14} weight="bold" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              ) : (
              <div className="mt-3 rounded-xl border border-dashed border-[#D0DBF7] bg-[#f8fbff] px-3 py-4 text-sm text-slate-500">
                No products selected yet.
              </div>
              )}
            </div>
          </article>
        </div>

        <aside className="hidden lg:block">
          <article className="sticky top-6 rounded-2xl border border-[#cfe2ff] bg-white/90 p-4 shadow-[0_12px_26px_-20px_rgba(51,69,143,0.45)]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#3A56C5]">
              Deal Snapshot
            </h3>

            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Start</dt>
                <dd className="mt-0.5 font-medium text-slate-700">
                  {slotStartDate ? formatDateTime(slotStartDate) : 'Not selected'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">End</dt>
                <dd className="mt-0.5 font-medium text-slate-700">
                  {slotEndDate ? formatDateTime(slotEndDate) : 'Not selected'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Profile</dt>
                <dd className="mt-0.5 font-medium text-slate-700">{activeCategoryLabel}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Products</dt>
                <dd className="mt-0.5 font-medium text-slate-700">{productSummaryLabel}</dd>
              </div>
            </dl>

            <div className="mt-4 rounded-xl border border-[#E6EBFF] bg-[#f0f9ff] p-3 text-xs text-slate-600">
              Tip: start by selecting time, then confirm products that match your criteria.
            </div>
          </article>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E6EBFF] bg-white/95 backdrop-blur sm:static sm:mt-4 sm:border-t-0 sm:bg-transparent sm:backdrop-blur-0">
        <div className="mx-auto max-w-6xl px-4 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-3 sm:hidden">
          {mobileStep === 'setup' ? (
            <div>
              <p className="mb-2 text-xs text-slate-500">Selected {mobileSelectedLabel}</p>
              <button
                type="button"
                onClick={() => setMobileStep('products')}
                disabled={!isSetupComplete}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-sm bg-[#3A56C5] px-5 text-base font-semibold text-white transition hover:bg-[#3347A8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC] disabled:cursor-not-allowed disabled:bg-[#B1C2EC]"
              >
                Next
              </button>
            </div>
          ) : mobileStep === 'products' ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMobileStep('setup')}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#d1d5db] bg-white px-5 text-base font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC]"
              >
                &lt;- Step 1
              </button>
              <button
                type="button"
                onClick={() => setMobileStep('discount')}
                disabled={!canOpenDiscountStep}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#3A56C5] px-5 text-base font-semibold text-white transition hover:bg-[#3347A8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC] disabled:cursor-not-allowed disabled:bg-[#B1C2EC]"
              >
                Next
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMobileStep('products')}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#d1d5db] bg-white px-5 text-base font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC]"
              >
                &lt;- Step 2
              </button>
              <button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={isConfirmDisabled || isSubmitting}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#3A56C5] px-5 text-base font-semibold text-white transition hover:bg-[#3347A8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B1C2EC] disabled:cursor-not-allowed disabled:bg-[#B1C2EC]"
              >
                {isSubmitting ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          )}
        </div>

        <div className="mx-auto hidden w-full max-w-6xl justify-end gap-2 sm:flex sm:px-0 sm:py-0">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="inline-flex h-9 items-center justify-center rounded border border-[#d1d5db] bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isConfirmDisabled || isSubmitting}
            className="inline-flex h-9 items-center justify-center rounded bg-[#3A56C5] px-5 text-sm font-semibold text-white transition hover:bg-[#3347A8] disabled:cursor-not-allowed disabled:bg-[#B1C2EC]"
          >
            {isSubmitting ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>

      <MobileDateTimePicker
        isOpen={isTimePickerOpen}
        value={slotStartDate}
        onClose={() => setIsTimePickerOpen(false)}
        onChange={handleDateTimeConfirm}
        mode="datetime"
        disablePast
        minuteStep={1}
        title="Select Flash Deal Start"
      />

      <FlashDealProductsModal
        isOpen={isProductsModalOpen}
        selectedProductIds={selectedProductIds}
        products={availableProducts}
        isLoadingProducts={isLoadingProducts}
        productsError={productsError}
        authRequired={productsAuthRequired}
        noShop={productsNoShop}
        onRetryLoadProducts={() => void loadProducts()}
        onClose={() => setIsProductsModalOpen(false)}
        onConfirm={handleProductsConfirm}
      />
    </section>
  )
}

export default CreateFlashDealPage







