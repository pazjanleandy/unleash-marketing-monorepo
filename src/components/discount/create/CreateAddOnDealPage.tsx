import { useEffect, useMemo, useState } from 'react'
import MobileDateTimePicker from '../../common/MobileDateTimePicker'
import type { CreateAddOnDealForm, DiscountDateTimeField } from './types'
import ProductPickerModal from './ProductPickerModal'
import { listShopProducts, type ShopProduct } from '../../../services/market/products.repo'

type CreateAddOnDealPageProps = {
  onBack: () => void
  onConfirm?: (form: CreateAddOnDealForm) => Promise<void> | void
  mode?: 'create' | 'edit'
  initialForm?: CreateAddOnDealForm
}

type DisplayProduct = ShopProduct

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

function formatMobileDateTime(value: string) {
  const date = fromLocalDateTimeInputValue(value)

  if (!date) {
    return 'Select date & time'
  }

  const day = `${date.getDate()}`.padStart(2, '0')
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const year = date.getFullYear()
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}`
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
      return 'Unable to save add-on deal.'
    }
  }

  return 'Unable to save add-on deal.'
}

function toCurrency(value: number) {
  return value.toFixed(2)
}

function ProductImagePlaceholder({
  name,
  compact = false,
}: {
  name: string
  compact?: boolean
}) {
  return (
    <div
      className={`inline-flex flex-none items-center justify-center border border-[#D0DBF7] bg-gradient-to-br from-[#F2F4FF] via-[#E6EBFF] to-[#D0DBF7] font-bold text-[#3347A8] shadow-[0_8px_14px_-12px_rgba(51,69,143,0.9)] ${
        compact ? 'h-9 w-9 rounded-md text-xs' : 'h-12 w-12 rounded-lg text-sm'
      }`}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  )
}

const now = new Date()
const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)

const createAddOnDefaults: CreateAddOnDealForm = {
  promotionName: '',
  startDateTime: toLocalDateTimeInputValue(now),
  endDateTime: toLocalDateTimeInputValue(oneHourLater),
  purchaseLimit: '',
  triggerProductId: '',
  addonProductId: '',
  discountValue: '',
}

function getInitialForm(initialForm?: CreateAddOnDealForm): CreateAddOnDealForm {
  if (!initialForm) {
    return createAddOnDefaults
  }

  return {
    ...createAddOnDefaults,
    ...initialForm,
  }
}

function CreateAddOnDealPage({
  onBack,
  onConfirm,
  mode = 'create',
  initialForm,
}: CreateAddOnDealPageProps) {
  const [form, setForm] = useState<CreateAddOnDealForm>(() => getInitialForm(initialForm))
  const [activePickerField, setActivePickerField] = useState<DiscountDateTimeField | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTriggerPickerOpen, setIsTriggerPickerOpen] = useState(false)
  const [isAddonPickerOpen, setIsAddonPickerOpen] = useState(false)
  const [catalogItems, setCatalogItems] = useState<DisplayProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [isAuthRequired, setIsAuthRequired] = useState(false)
  const [hasNoShop, setHasNoShop] = useState(false)
  const isEditMode = mode === 'edit'
  const mobileTitle = isEditMode ? 'Edit Add-on Deal' : 'Create Add-on Deal'
  const desktopTitle = isEditMode ? 'Edit Add-on Deal' : 'Create Add-on Deal'
  const subtitle = isEditMode
    ? 'Update your selected add-on products on Unleash.'
    : 'Set discounted add-on combinations for complementary products.'

  const setField = <K extends keyof CreateAddOnDealForm>(
    field: K,
    nextValue: CreateAddOnDealForm[K],
  ) => {
    setForm((previous) => ({ ...previous, [field]: nextValue }))
  }

  const loadProducts = async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const result = await listShopProducts()
      setCatalogItems(result.items)
      setIsAuthRequired(result.authRequired)
      setHasNoShop(result.noShop)
    } catch (error) {
      setCatalogItems([])
      setIsAuthRequired(false)
      setHasNoShop(false)
      setLoadError(error instanceof Error ? error.message : 'Unable to load products.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadProducts()
  }, [])

  const resolveProduct = (productId: string, fallbackLabel: string): DisplayProduct | null => {
    if (!productId) {
      return null
    }

    const found = catalogItems.find((product) => product.id === productId)
    if (found) {
      return found
    }

    return {
      id: productId,
      name: fallbackLabel,
      category: 'Legacy Product',
      price: 0,
      stock: 0,
      sales: 0,
      status: 'avail',
      image: null,
    }
  }

  const selectedTriggerProduct = useMemo(
    () => resolveProduct(form.triggerProductId, 'Legacy Trigger'),
    [catalogItems, form.triggerProductId],
  )
  const selectedAddonProduct = useMemo(
    () => resolveProduct(form.addonProductId, 'Legacy Add-on'),
    [catalogItems, form.addonProductId],
  )

  const isConfirmDisabled = useMemo(() => {
    const trimmedName = form.promotionName.trim()
    if (!trimmedName) {
      return true
    }

    if (!form.triggerProductId || !form.addonProductId) {
      return true
    }

    if (form.triggerProductId === form.addonProductId) {
      return true
    }

    const start = fromLocalDateTimeInputValue(form.startDateTime)
    const end = fromLocalDateTimeInputValue(form.endDateTime)

    if (!start || !end || end.getTime() <= start.getTime()) {
      return true
    }

    const maxDurationMs = 180 * 24 * 60 * 60 * 1000
    if (end.getTime() - start.getTime() > maxDurationMs) {
      return true
    }

    if (form.purchaseLimit.trim().length > 0 && !/^\d+$/.test(form.purchaseLimit.trim())) {
      return true
    }

    const parsedDiscount = Number(form.discountValue.trim())
    if (!form.discountValue.trim() || Number.isNaN(parsedDiscount) || parsedDiscount <= 0 || parsedDiscount > 100) {
      return true
    }

    return false
  }, [form])

  const activePickerValue = useMemo(() => {
    if (!activePickerField) {
      return null
    }

    return fromLocalDateTimeInputValue(form[activePickerField])
  }, [activePickerField, form])

  const handleOpenPicker = (field: DiscountDateTimeField) => {
    setActivePickerField(field)
  }

  const handleClosePicker = () => {
    setActivePickerField(null)
  }

  const handleDateTimeConfirm = (date: Date | null) => {
    if (!activePickerField) {
      return
    }

    if (!date) {
      setField(activePickerField, '')
      return
    }

    const nextValue = toLocalDateTimeInputValue(date)

    if (activePickerField === 'startDateTime') {
      const currentEnd = fromLocalDateTimeInputValue(form.endDateTime)

      if (!currentEnd || currentEnd.getTime() < date.getTime()) {
        const oneHourAfterStart = new Date(date.getTime() + 60 * 60 * 1000)
        setForm((previous) => ({
          ...previous,
          startDateTime: nextValue,
          endDateTime: toLocalDateTimeInputValue(oneHourAfterStart),
        }))
        return
      }
    }

    if (activePickerField === 'endDateTime') {
      const currentStart = fromLocalDateTimeInputValue(form.startDateTime)

      if (!currentStart || currentStart.getTime() > date.getTime()) {
        const oneHourBeforeEnd = new Date(date.getTime() - 60 * 60 * 1000)
        setForm((previous) => ({
          ...previous,
          startDateTime: toLocalDateTimeInputValue(oneHourBeforeEnd),
          endDateTime: nextValue,
        }))
        return
      }
    }

    setField(activePickerField, nextValue)
  }

  const handleConfirm = async () => {
    if (isConfirmDisabled || isSubmitting) {
      return
    }

    setSubmitError('')
    setIsSubmitting(true)

    try {
      if (onConfirm) {
        await onConfirm(form)
      }
      onBack()
    } catch (error) {
      setSubmitError(toSubmitErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const sanitizeDiscountRate = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '')
    if (!cleaned) {
      return ''
    }

    const parsed = Number(cleaned)
    if (Number.isNaN(parsed)) {
      return ''
    }

    const clamped = Math.min(Math.max(parsed, 0), 100)
    return clamped.toString()
  }

  const handleTriggerSelection = (nextSelection: string[]) => {
    const nextId = nextSelection[0] ?? ''
    setForm((previous) => ({
      ...previous,
      triggerProductId: nextId,
      addonProductId: nextId && nextId === previous.addonProductId ? '' : previous.addonProductId,
    }))
    setIsTriggerPickerOpen(false)
  }

  const handleAddonSelection = (nextSelection: string[]) => {
    const nextId = nextSelection[0] ?? ''
    setForm((previous) => ({
      ...previous,
      addonProductId: nextId,
      triggerProductId: nextId && nextId === previous.triggerProductId ? '' : previous.triggerProductId,
    }))
    setIsAddonPickerOpen(false)
  }

  const canManageProducts = !isAuthRequired && !hasNoShop

  return (
    <section
      className="motion-rise min-h-[calc(100vh-2.5rem)] bg-[#f1f5f9] pb-24 sm:rounded-3xl sm:border sm:border-slate-200/80 sm:bg-white/95 sm:p-6 sm:pb-6 sm:shadow-[0_24px_50px_-45px_rgba(15,23,42,0.65)]"
      style={{ animationDelay: '80ms' }}
    >
      {submitError ? (
        <p className="mx-4 mt-3 rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c] sm:mx-0 sm:mt-4">
          {submitError}
        </p>
      ) : null}
      <div className="sm:hidden">
        <div className="sticky top-0 z-10 border-b border-[#E6EBFF] bg-white px-4 py-3">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F4FF] text-base font-semibold text-[#33458F] transition active:scale-95"
              aria-label="Back to Discount"
            >
              &larr;
            </button>
            <div>
              <h1 className="text-[22px] font-semibold leading-none text-slate-900">{mobileTitle}</h1>
              <p className="mt-1 text-xs text-[#3347A8]">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="mt-2 border-y border-slate-200 bg-white">
          <div className="space-y-3 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-slate-700">Trigger Product</p>
              <button
                type="button"
                onClick={() => setIsTriggerPickerOpen(true)}
                disabled={!canManageProducts || isLoading}
                className="inline-flex h-8 items-center justify-center rounded-md border border-[#D0DBF7] bg-white px-3 text-xs font-semibold text-[#3347A8] transition hover:bg-[#f8fbff] active:bg-[#F2F4FF] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {selectedTriggerProduct ? 'Change' : 'Select'}
              </button>
            </div>
            {selectedTriggerProduct ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-[#E6EBFF] bg-[#f8fbff] p-2.5">
                <ProductImagePlaceholder name={selectedTriggerProduct.name} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                    {selectedTriggerProduct.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    ID: {selectedTriggerProduct.id} | {selectedTriggerProduct.category}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#D0DBF7] bg-white px-3 py-3 text-xs text-slate-500">
                Select the main product that triggers the add-on suggestion.
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 border-y border-slate-200 bg-white">
          <div className="space-y-3 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-slate-700">Suggested Add-on</p>
              <button
                type="button"
                onClick={() => setIsAddonPickerOpen(true)}
                disabled={!canManageProducts || isLoading}
                className="inline-flex h-8 items-center justify-center rounded-md border border-[#D0DBF7] bg-white px-3 text-xs font-semibold text-[#3347A8] transition hover:bg-[#f8fbff] active:bg-[#F2F4FF] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {selectedAddonProduct ? 'Change' : 'Select'}
              </button>
            </div>
            {selectedAddonProduct ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-[#E6EBFF] bg-[#f8fbff] p-2.5">
                <ProductImagePlaceholder name={selectedAddonProduct.name} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                    {selectedAddonProduct.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    ID: {selectedAddonProduct.id} | {selectedAddonProduct.category}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#D0DBF7] bg-white px-3 py-3 text-xs text-slate-500">
                Select the product you want to recommend as an add-on.
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 border-y border-slate-200 bg-white">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-slate-700">Add-on Deal Name</p>
              <span className="text-xs text-slate-400">{form.promotionName.length}/150</span>
            </div>
            <input
              type="text"
              maxLength={150}
              value={form.promotionName}
              onChange={(event) => setField('promotionName', event.target.value)}
              placeholder="Enter your add-on deal name here"
              className="mt-2 h-10 w-full border-0 border-b border-[#e2e8f0] px-0 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#B1C2EC] focus:outline-none"
            />
          </div>

          <div className="border-t border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-medium text-slate-700">Start Time</p>
              <button
                type="button"
                onClick={() => handleOpenPicker('startDateTime')}
                className={`inline-flex h-9 min-w-[205px] items-center justify-end gap-1 border-0 bg-transparent text-right text-xs transition ${
                  activePickerField === 'startDateTime'
                    ? 'font-semibold text-[#3A56C5]'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <span>{formatMobileDateTime(form.startDateTime)}</span>
                <span
                  className={`text-sm ${
                    activePickerField === 'startDateTime' ? 'text-[#3A56C5]' : 'text-slate-400'
                  }`}
                >
                  &rsaquo;
                </span>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-medium text-slate-700">End Time</p>
              <button
                type="button"
                onClick={() => handleOpenPicker('endDateTime')}
                className={`inline-flex h-9 min-w-[205px] items-center justify-end gap-1 border-0 bg-transparent text-right text-xs transition ${
                  activePickerField === 'endDateTime'
                    ? 'font-semibold text-[#3A56C5]'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <span>{formatMobileDateTime(form.endDateTime)}</span>
                <span
                  className={`text-sm ${
                    activePickerField === 'endDateTime' ? 'text-[#3A56C5]' : 'text-slate-400'
                  }`}
                >
                  &rsaquo;
                </span>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-medium text-slate-700">Add-on Discount</p>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.discountValue}
                  onChange={(event) => setField('discountValue', sanitizeDiscountRate(event.target.value))}
                  placeholder="0"
                  className="h-9 w-16 border-0 bg-transparent text-right text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                <span className="text-xs font-semibold text-slate-400">% OFF</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-medium text-slate-700">Purchase Limit</p>
              <input
                type="text"
                inputMode="numeric"
                value={form.purchaseLimit}
                onChange={(event) => setField('purchaseLimit', event.target.value)}
                placeholder="Quantity (Default: No Limit)"
                className="h-9 w-[210px] border-0 bg-transparent text-right text-xs text-slate-500 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="hidden sm:block">
        <header className="mt-2 rounded-2xl border border-[#E6EBFF] bg-gradient-to-r from-[#F2F4FF] via-[#E6EBFF] to-white p-4">
          <h1 className="text-3xl font-semibold text-[#33458F]">{desktopTitle}</h1>
          <p className="mt-1 text-sm text-[#3347A8]">{subtitle}</p>
        </header>
      </div>

      <div className="mt-4 hidden space-y-4 sm:block">
        <article className="rounded-xl border border-[#E6EBFF] bg-white p-4 shadow-[0_10px_30px_-28px_rgba(15,23,42,0.8)] sm:p-5">
          <h2 className="text-xl font-semibold text-[#33458F]">Add-on Products</h2>
          <p className="mt-1 text-sm text-slate-600">
            Choose the trigger product and the suggested add-on to show at checkout.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[#E6EBFF] bg-[#f8fbff] p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">Trigger Product</p>
                <button
                  type="button"
                  onClick={() => setIsTriggerPickerOpen(true)}
                  disabled={!canManageProducts || isLoading}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-[#B1C2EC] bg-white px-3 text-xs font-semibold text-[#3347A8] transition hover:bg-[#F2F4FF] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {selectedTriggerProduct ? 'Change' : 'Select'}
                </button>
              </div>

              {selectedTriggerProduct ? (
                <div className="mt-3 flex items-start gap-2.5">
                  <ProductImagePlaceholder name={selectedTriggerProduct.name} compact />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{selectedTriggerProduct.name}</p>
                    <p className="text-xs text-slate-500">
                      ID: {selectedTriggerProduct.id} | {selectedTriggerProduct.category}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">PHP {toCurrency(selectedTriggerProduct.price)}</p>
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-md border border-dashed border-[#D0DBF7] bg-white px-3 py-4 text-xs text-slate-500">
                  Select the main product that unlocks the add-on.
                </div>
              )}
            </div>

            <div className="rounded-lg border border-[#E6EBFF] bg-[#f8fbff] p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">Suggested Add-on</p>
                <button
                  type="button"
                  onClick={() => setIsAddonPickerOpen(true)}
                  disabled={!canManageProducts || isLoading}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-[#B1C2EC] bg-white px-3 text-xs font-semibold text-[#3347A8] transition hover:bg-[#F2F4FF] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {selectedAddonProduct ? 'Change' : 'Select'}
                </button>
              </div>

              {selectedAddonProduct ? (
                <div className="mt-3 flex items-start gap-2.5">
                  <ProductImagePlaceholder name={selectedAddonProduct.name} compact />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{selectedAddonProduct.name}</p>
                    <p className="text-xs text-slate-500">
                      ID: {selectedAddonProduct.id} | {selectedAddonProduct.category}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">PHP {toCurrency(selectedAddonProduct.price)}</p>
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-md border border-dashed border-[#D0DBF7] bg-white px-3 py-4 text-xs text-slate-500">
                  Select the add-on product to suggest.
                </div>
              )}
            </div>
          </div>

          {isLoading ? (
            <p className="mt-3 text-xs text-slate-500">Loading products...</p>
          ) : isAuthRequired ? (
            <p className="mt-3 text-xs text-slate-500">Sign in to manage products.</p>
          ) : hasNoShop ? (
            <p className="mt-3 text-xs text-slate-500">No shop found for this account.</p>
          ) : loadError ? (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span>{loadError}</span>
              <button type="button" onClick={() => void loadProducts()} className="font-semibold text-[#3347A8] hover:underline">
                Retry
              </button>
            </div>
          ) : null}
        </article>

        <article className="rounded-xl border border-[#E6EBFF] bg-white p-4 shadow-[0_10px_30px_-28px_rgba(15,23,42,0.8)] sm:p-5">
          <h2 className="text-xl font-semibold text-[#33458F]">Add-on Deal Details</h2>
          <p className="mt-1 text-sm text-slate-600">Define the discount and availability window.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Add-on Deal Name</p>
              <input
                type="text"
                maxLength={150}
                value={form.promotionName}
                onChange={(event) => setField('promotionName', event.target.value)}
                placeholder="Enter your add-on deal name here"
                className="h-10 w-full rounded-md border border-[#cbd5e1] bg-white px-3 text-sm text-slate-900 focus:border-[#B1C2EC] focus:outline-none"
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Add-on Discount</p>
              <div className="flex h-10 items-center rounded-md border border-[#cbd5e1] bg-white px-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.discountValue}
                  onChange={(event) => setField('discountValue', sanitizeDiscountRate(event.target.value))}
                  placeholder="0"
                  className="w-20 border-0 bg-transparent text-right text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
                <span className="ml-1 text-xs font-semibold text-slate-400">% OFF</span>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Start Time</p>
              <button
                type="button"
                onClick={() => handleOpenPicker('startDateTime')}
                className={`flex h-10 w-full items-center justify-between rounded-md border border-[#cbd5e1] bg-white px-3 text-sm ${
                  activePickerField === 'startDateTime' ? 'font-semibold text-[#3A56C5]' : 'text-slate-700'
                }`}
              >
                <span>{formatMobileDateTime(form.startDateTime)}</span>
                <span className="text-slate-400">&rsaquo;</span>
              </button>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">End Time</p>
              <button
                type="button"
                onClick={() => handleOpenPicker('endDateTime')}
                className={`flex h-10 w-full items-center justify-between rounded-md border border-[#cbd5e1] bg-white px-3 text-sm ${
                  activePickerField === 'endDateTime' ? 'font-semibold text-[#3A56C5]' : 'text-slate-700'
                }`}
              >
                <span>{formatMobileDateTime(form.endDateTime)}</span>
                <span className="text-slate-400">&rsaquo;</span>
              </button>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Purchase Limit</p>
              <input
                type="text"
                inputMode="numeric"
                value={form.purchaseLimit}
                onChange={(event) => setField('purchaseLimit', event.target.value)}
                placeholder="Quantity (Default: No Limit)"
                className="h-10 w-full rounded-md border border-[#cbd5e1] bg-white px-3 text-sm text-slate-600 focus:border-[#B1C2EC] focus:outline-none"
              />
            </div>
          </div>
        </article>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E6EBFF] bg-white/95 backdrop-blur sm:static sm:mt-4 sm:border-t-0 sm:bg-transparent sm:backdrop-blur-0">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-2 px-4 py-3 min-[420px]:grid-cols-2 sm:flex sm:justify-end sm:px-0 sm:py-0">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-md border border-[#cbd5e1] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:h-10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isConfirmDisabled || isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-md bg-[#3A56C5] px-4 text-sm font-semibold text-white transition hover:bg-[#3347A8] disabled:cursor-not-allowed disabled:opacity-45 sm:h-10"
          >
            {isSubmitting ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>

      <ProductPickerModal
        isOpen={isTriggerPickerOpen}
        onClose={() => setIsTriggerPickerOpen(false)}
        catalogItems={catalogItems}
        isLoading={isLoading}
        loadError={loadError}
        isAuthRequired={isAuthRequired}
        hasNoShop={hasNoShop}
        onRetry={() => void loadProducts()}
        selectedProductIds={form.triggerProductId ? [form.triggerProductId] : []}
        onConfirmSelection={handleTriggerSelection}
        subtitle="Choose the product that triggers the add-on."
        selectionMode="single"
      />

      <ProductPickerModal
        isOpen={isAddonPickerOpen}
        onClose={() => setIsAddonPickerOpen(false)}
        catalogItems={catalogItems}
        isLoading={isLoading}
        loadError={loadError}
        isAuthRequired={isAuthRequired}
        hasNoShop={hasNoShop}
        onRetry={() => void loadProducts()}
        selectedProductIds={form.addonProductId ? [form.addonProductId] : []}
        onConfirmSelection={handleAddonSelection}
        subtitle="Choose the product to offer as an add-on."
        selectionMode="single"
      />

      <MobileDateTimePicker
        isOpen={activePickerField !== null}
        value={activePickerValue}
        onClose={handleClosePicker}
        onChange={handleDateTimeConfirm}
        mode="datetime"
        disablePast
        minuteStep={5}
        title={
          activePickerField === 'endDateTime' ? 'Select end date & time' : 'Select start date & time'
        }
      />
    </section>
  )
}

export default CreateAddOnDealPage

