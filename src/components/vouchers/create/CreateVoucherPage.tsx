import { useState } from 'react'
import CreateVoucherBreadcrumb from './CreateVoucherBreadcrumb'
import RewardSettingsCard from './RewardSettingsCard'
import VoucherDisplayCard from './VoucherDisplayCard'
import VoucherPreviewPanel from './VoucherPreviewPanel'
import type { CreateVoucherForm, VoucherType } from './types'

type VoucherFormMode = 'create' | 'edit'

type CreateVoucherPageProps = {
  onBack: () => void
  onConfirm?: (form: CreateVoucherForm) => Promise<void> | void
  mode?: VoucherFormMode
  initialForm?: CreateVoucherForm
  voucherType?: VoucherType
}

const VOUCHER_TYPE_LABELS: Record<VoucherType, string> = {
  shop: 'Shop Voucher',
  product: 'Product Voucher',
  private: 'Private Voucher',
  live: 'Live Voucher',
  video: 'Video Voucher',
}

const stepTitles = [
  'Reward Settings',
  'Voucher Display & Applicable Products',
  'Preview',
] as const

function toLocalDateTimeInputValue(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

type FormErrorMap = Partial<Record<keyof CreateVoucherForm, string>>

const fieldElementIds: Partial<Record<keyof CreateVoucherForm, string>> = {
  discountType: 'create-voucher-discount-type',
  discountAmount: 'create-voucher-discount-amount',
  minimumBasketPrice: 'create-voucher-minimum-basket-price',
  usageQuantity: 'create-voucher-usage-quantity',
  maxDistributionPerBuyer: 'create-voucher-max-distribution-per-buyer',
  displaySetting: 'create-voucher-display-all-pages',
  startDateTime: 'create-voucher-start-time',
  endDateTime: 'create-voucher-end-time',
}

function getDefaultForm(voucherType: VoucherType): CreateVoucherForm {
  return {
    voucherType,
    rewardType: 'discount',
    discountType: 'fixed-amount',
    discountAmount: '',
    minimumBasketPrice: '',
    usageQuantity: '',
    maxDistributionPerBuyer: '',
    displaySetting: voucherType === 'private' ? 'voucher-code' : 'all-pages',
    productScope: voucherType === 'product' ? 'specific-products' : 'all-products',
    startDateTime: toLocalDateTimeInputValue(new Date()),
    endDateTime: toLocalDateTimeInputValue(new Date(Date.now() + 60 * 60 * 1000)),
    selectedProductIds: [],
    livestreamUrl: '',
    videoUrl: '',
  }
}

function parseDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function getStepTitle(step: number, voucherType: VoucherType) {
  if (step === 1) {
    const titles: Record<VoucherType, string> = {
      shop: 'Voucher Display & Applicable Products',
      product: 'Product Selection',
      private: 'Private Distribution',
      live: 'Livestream Settings',
      video: 'Video Settings',
    }
    return titles[voucherType]
  }
  return stepTitles[step]
}

function CreateVoucherPage({
  onBack,
  onConfirm,
  mode = 'create',
  initialForm,
  voucherType = 'shop',
}: CreateVoucherPageProps) {
  const isEditMode = mode === 'edit'
  const typeLabel = VOUCHER_TYPE_LABELS[voucherType]
  const pageLabel = isEditMode ? `Edit ${typeLabel}` : `Create ${typeLabel}`
  const desktopConfirmLabel = isEditMode ? 'Save Changes' : 'Confirm'
  const mobileStepActionLabel = isEditMode ? 'Save Changes' : `Create ${typeLabel}`
  const startingForm = initialForm ?? getDefaultForm(voucherType)
  const [form, setForm] = useState<CreateVoucherForm>(() => ({ ...startingForm }))
  const [currentStep, setCurrentStep] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<FormErrorMap>({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const lastStepIndex = stepTitles.length - 1

  const handleConfirm = async () => {
    if (isSubmitting) {
      return
    }

    setSubmitError('')
    setIsSubmitting(true)

    if (onConfirm) {
      try {
        await onConfirm(form)
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'Unable to save voucher.')
        setIsSubmitting(false)
        return
      }
    }

    setIsSubmitting(false)
    onBack()
  }

  const scrollToField = (field: keyof CreateVoucherForm) => {
    const elementId = fieldElementIds[field]
    if (!elementId) {
      return
    }

    window.requestAnimationFrame(() => {
      const element = document.getElementById(elementId)
      if (!element) {
        return
      }

      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement
      ) {
        element.focus({ preventScroll: true })
      }
    })
  }

  const validateStep = (step: number) => {
    const nextErrors: FormErrorMap = {}
    const stepFields: (keyof CreateVoucherForm)[] = []

    if (step === 0) {
      stepFields.push(
        'discountAmount',
        'minimumBasketPrice',
        'usageQuantity',
        'maxDistributionPerBuyer',
        'startDateTime',
        'endDateTime',
      )

      if (!form.discountAmount.trim()) {
        nextErrors.discountAmount = 'Discount amount is required.'
      }

      if (!form.minimumBasketPrice.trim()) {
        nextErrors.minimumBasketPrice = 'Minimum basket price is required.'
      }

      if (!form.usageQuantity.trim()) {
        nextErrors.usageQuantity = 'Usage quantity is required.'
      }

      if (!form.maxDistributionPerBuyer.trim()) {
        nextErrors.maxDistributionPerBuyer =
          'Max distribution per buyer is required.'
      }

      const start = parseDateTime(form.startDateTime)
      const end = parseDateTime(form.endDateTime)

      if (!start) {
        nextErrors.startDateTime = 'Start time is required.'
      }

      if (!end) {
        nextErrors.endDateTime = 'End time is required.'
      }

      if (start && end && end.getTime() <= start.getTime()) {
        nextErrors.endDateTime = 'End time must be later than start time.'
      }
    }

    if (step === 1) {
      if (voucherType === 'shop') {
        stepFields.push('displaySetting')
        if (!form.displaySetting) {
          nextErrors.displaySetting = 'Choose a voucher display setting.'
        }
      }

      if (voucherType === 'product') {
        stepFields.push('selectedProductIds')
        if (form.selectedProductIds.length === 0) {
          nextErrors.selectedProductIds = 'Select at least one product.'
        }
      }
    }

    setFieldErrors((previous) => {
      const cleaned = { ...previous }
      stepFields.forEach((field) => {
        delete cleaned[field]
      })

      return {
        ...cleaned,
        ...nextErrors,
      }
    })

    const firstInvalidField = stepFields.find((field) => nextErrors[field])
    if (firstInvalidField) {
      scrollToField(firstInvalidField)
      return false
    }

    return true
  }

  const handleNextStep = () => {
    if (currentStep === lastStepIndex) {
      void handleConfirm()
      return
    }

    if (!validateStep(currentStep)) {
      return
    }

    setCurrentStep((previous) => Math.min(previous + 1, lastStepIndex))
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  const handlePreviousStep = () => {
    setCurrentStep((previous) => Math.max(previous - 1, 0))
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  return (
    <section
      className="motion-rise rounded-3xl border border-slate-200/80 bg-[#f5f6f8] p-3 pb-28 shadow-[0_24px_50px_-45px_rgba(15,23,42,0.65)] sm:p-6 sm:pb-6"
      style={{ animationDelay: '80ms' }}
    >
      <CreateVoucherBreadcrumb onBack={onBack} currentLabel={pageLabel} />
      <header className="mt-1.5">
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
          {pageLabel}
        </h1>
      </header>
      {submitError ? (
        <p className="mt-4 rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
          {submitError}
        </p>
      ) : null}

      <div className="mt-4 rounded-xl border border-[#dbe1ea] bg-white px-4 py-3 sm:hidden">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1d4ed8]">
              Step {currentStep + 1} of {stepTitles.length}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {getStepTitle(currentStep, voucherType)}
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-[#1d4ed8] transition hover:text-[#1e3a8a]"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-5 sm:hidden">
        <div className={`${currentStep === 0 ? 'block' : 'hidden'}`}>
          <RewardSettingsCard
            value={form}
            onChange={setForm}
            fieldErrors={fieldErrors}
            fieldIds={fieldElementIds}
          />
        </div>

        <div className={`${currentStep === 1 ? 'block' : 'hidden'}`}>
          <VoucherDisplayCard
            voucherType={voucherType}
            value={form}
            onChange={setForm}
            onProductScopeChange={(productScope) => setForm((previous) => ({ ...previous, productScope }))}
            displaySettingError={fieldErrors.displaySetting}
            displaySettingInputIds={{
              allPages: fieldElementIds.displaySetting ?? '',
              voucherCode: 'create-voucher-display-voucher-code',
            }}
          />
        </div>

        <div className={`${currentStep === 2 ? 'block' : 'hidden'}`}>
          <VoucherPreviewPanel value={form} />
        </div>
      </div>

      <div className="mt-4 hidden gap-5 lg:grid-cols-[minmax(0,1fr)_260px] sm:grid">
        <div className="space-y-5">
          <RewardSettingsCard
            value={form}
            onChange={setForm}
            fieldErrors={fieldErrors}
            fieldIds={fieldElementIds}
          />
          <VoucherDisplayCard
            voucherType={voucherType}
            value={form}
            onChange={setForm}
            onProductScopeChange={(productScope) => setForm((previous) => ({ ...previous, productScope }))}
            displaySettingError={fieldErrors.displaySetting}
            displaySettingInputIds={{
              allPages: fieldElementIds.displaySetting ?? '',
              voucherCode: 'create-voucher-display-voucher-code',
            }}
          />

          <div className="hidden justify-end gap-3 border-t border-[#dbe1ea] pt-4 sm:flex">
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="inline-flex h-10 items-center rounded-md border border-[#d6dbe3] bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={isSubmitting}
              className="inline-flex h-10 items-center rounded-md bg-[#2563EB] px-5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isSubmitting ? 'Saving...' : desktopConfirmLabel}
            </button>
          </div>
        </div>

        <div>
          <VoucherPreviewPanel value={form} />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#dbe1ea] bg-white/95 backdrop-blur sm:hidden">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-2 px-4 py-3">
          <button
            type="button"
            onClick={handlePreviousStep}
            disabled={currentStep === 0 || isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#cfd7e3] bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNextStep}
            disabled={isSubmitting}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[#2563EB] px-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {currentStep === lastStepIndex
              ? isSubmitting
                ? 'Saving...'
                : mobileStepActionLabel
              : 'Next'}
          </button>
        </div>
      </div>
    </section>
  )
}

export default CreateVoucherPage
