import { useMemo, useState } from 'react'
import MobileDateTimePicker from '../../common/MobileDateTimePicker'
import type { CreateBundleDealForm, DiscountDateTimeField } from './types'
import BundleDealItemsCard from './BundleDealItemsCard'
import BundleDealBasicInformationCard from './BundleDealBasicInformationCard'
import CreateDiscountPromotionBreadcrumb from './CreateDiscountPromotionBreadcrumb'

type CreateBundleDealPageProps = {
  onBack: () => void
  onConfirm?: (form: CreateBundleDealForm) => Promise<void> | void
  mode?: 'create' | 'edit'
  initialForm?: CreateBundleDealForm
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
      return 'Unable to save bundle deal.'
    }
  }

  return 'Unable to save bundle deal.'
}

const now = new Date()
const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)

const createBundleDefaults: CreateBundleDealForm = {
  promotionName: '',
  startDateTime: toLocalDateTimeInputValue(now),
  endDateTime: toLocalDateTimeInputValue(oneHourLater),
  purchaseLimit: '',
  bundlePrice: '',
  currency: 'PHP',
  items: [],
}

function getInitialForm(initialForm?: CreateBundleDealForm): CreateBundleDealForm {
  if (!initialForm) {
    return createBundleDefaults
  }

  const items = Array.isArray(initialForm.items) ? initialForm.items : []

  return {
    ...createBundleDefaults,
    ...initialForm,
    items,
    currency: 'PHP',
  }
}

function CreateBundleDealPage({
  onBack,
  onConfirm,
  mode = 'create',
  initialForm,
}: CreateBundleDealPageProps) {
  const [form, setForm] = useState<CreateBundleDealForm>(() => getInitialForm(initialForm))
  const [activePickerField, setActivePickerField] = useState<DiscountDateTimeField | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const hasSelectedProducts = form.items.length > 0
  const isEditMode = mode === 'edit'
  const mobileTitle = isEditMode ? 'Edit Bundle Deal' : 'Create Bundle Deal'
  const desktopTitle = isEditMode ? 'Edit Bundle Deal' : 'Create Bundle Deal'
  const subtitle = isEditMode
    ? 'Update your selected bundle items on Unleash.'
    : 'Set bundled products to increase average basket size.'

  const setField = <K extends keyof CreateBundleDealForm>(
    field: K,
    nextValue: CreateBundleDealForm[K],
  ) => {
    setForm((previous) => ({ ...previous, [field]: nextValue }))
  }

  const isConfirmDisabled = useMemo(() => {
    const trimmedName = form.promotionName.trim()
    if (!trimmedName) {
      return true
    }

    if (form.items.length === 0) {
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

    const bundlePrice = Number(form.bundlePrice.trim())
    if (!form.bundlePrice.trim() || Number.isNaN(bundlePrice) || bundlePrice <= 0) {
      return true
    }

    if (!form.currency.trim()) {
      return true
    }

    return form.items.some((item) => !item.productId || item.quantity < 1)
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
        <div className="sticky top-0 z-10 border-b border-[#dbeafe] bg-white px-4 py-3">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eff6ff] text-base font-semibold text-[#1E40AF] transition active:scale-95"
              aria-label="Back to Discount"
            >
              &larr;
            </button>
            <div>
              <h1 className="text-[22px] font-semibold leading-none text-slate-900">
                {mobileTitle}
              </h1>
              <p className="mt-1 text-xs text-[#1d4ed8]">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="mt-2 border-y border-slate-200 bg-white">
          <BundleDealItemsCard value={form} onChange={setForm} mobileVariant />
        </div>

        {hasSelectedProducts ? (
          <div className="mt-3 border-y border-slate-200 bg-white">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium text-slate-700">Bundle Deal Name</p>
                <span className="text-xs text-slate-400">{form.promotionName.length}/150</span>
              </div>
              <input
                type="text"
                maxLength={150}
                value={form.promotionName}
                onChange={(event) => setField('promotionName', event.target.value)}
                placeholder="Enter your bundle deal name here"
                className="mt-2 h-10 w-full border-0 border-b border-[#e2e8f0] px-0 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#93c5fd] focus:outline-none"
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
                      ? 'font-semibold text-[#2563EB]'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <span>{formatMobileDateTime(form.startDateTime)}</span>
                  <span
                    className={`text-sm ${
                      activePickerField === 'startDateTime'
                        ? 'text-[#2563EB]'
                        : 'text-slate-400'
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
                      ? 'font-semibold text-[#2563EB]'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <span>{formatMobileDateTime(form.endDateTime)}</span>
                  <span
                    className={`text-sm ${
                      activePickerField === 'endDateTime'
                        ? 'text-[#2563EB]'
                        : 'text-slate-400'
                    }`}
                  >
                    &rsaquo;
                  </span>
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-medium text-slate-700">Bundle Price</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">PHP</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.bundlePrice}
                    onChange={(event) => setField('bundlePrice', event.target.value)}
                    placeholder="0.00"
                    className="h-9 w-24 border-0 bg-transparent text-right text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
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
        ) : (
          <div className="mx-4 mt-3 rounded-lg border border-dashed border-[#bfdbfe] bg-white px-4 py-3 text-xs text-slate-500">
            Select at least 1 product first. Bundle deal details and date range will appear after
            product selection.
          </div>
        )}
      </div>

      <div className="hidden sm:block">
        <CreateDiscountPromotionBreadcrumb
          onBack={onBack}
          mode={mode}
          sectionLabel="Bundle Deal"
          createTitle="Create Bundle Deal"
          editTitle="Edit Bundle Deal"
        />
        <header className="mt-2 rounded-2xl border border-[#dbeafe] bg-gradient-to-r from-[#eff6ff] via-[#dbeafe] to-white p-4">
          <h1 className="text-3xl font-semibold text-[#1E40AF]">{desktopTitle}</h1>
          <p className="mt-1 text-sm text-[#1d4ed8]">{subtitle}</p>
        </header>
      </div>

      <div className="mt-4 hidden space-y-4 sm:block">
        <BundleDealItemsCard value={form} onChange={setForm} />
        {hasSelectedProducts ? (
          <BundleDealBasicInformationCard
            value={form}
            onChange={setForm}
            onOpenPicker={handleOpenPicker}
            activePickerField={activePickerField}
          />
        ) : (
          <article className="rounded-xl border border-dashed border-[#bfdbfe] bg-[#f8fbff] p-5 text-sm text-slate-600">
            Select at least 1 product first. Bundle deal details and date range will appear here
            after product selection.
          </article>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#dbeafe] bg-white/95 backdrop-blur sm:static sm:mt-4 sm:border-t-0 sm:bg-transparent sm:backdrop-blur-0">
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
            className="inline-flex h-11 items-center justify-center rounded-md bg-[#2563EB] px-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-45 sm:h-10"
          >
            {isSubmitting ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>

      <MobileDateTimePicker
        isOpen={activePickerField !== null}
        value={activePickerValue}
        onClose={handleClosePicker}
        onChange={handleDateTimeConfirm}
        mode="datetime"
        disablePast
        minuteStep={5}
        title={
          activePickerField === 'endDateTime'
            ? 'Select end date & time'
            : 'Select start date & time'
        }
      />
    </section>
  )
}

export default CreateBundleDealPage
