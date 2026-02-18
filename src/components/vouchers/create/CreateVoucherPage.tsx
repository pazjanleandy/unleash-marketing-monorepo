import { useState } from 'react'
import CreateVoucherBreadcrumb from './CreateVoucherBreadcrumb'
import RewardSettingsCard from './RewardSettingsCard'
import VoucherDisplayCard from './VoucherDisplayCard'
import VoucherPreviewPanel from './VoucherPreviewPanel'
import type { CreateVoucherForm } from './types'

type VoucherFormMode = 'create' | 'edit'

type CreateVoucherPageProps = {
  onBack: () => void
  onConfirm?: () => void
  mode?: VoucherFormMode
  initialForm?: CreateVoucherForm
}

const stepTitles = [
  'Reward Settings',
  'Voucher Display & Applicable Products',
  'Preview',
] as const

type FormErrorMap = Partial<Record<keyof CreateVoucherForm, string>>

const fieldElementIds: Partial<Record<keyof CreateVoucherForm, string>> = {
  discountType: 'create-voucher-discount-type',
  discountAmount: 'create-voucher-discount-amount',
  minimumBasketPrice: 'create-voucher-minimum-basket-price',
  usageQuantity: 'create-voucher-usage-quantity',
  maxDistributionPerBuyer: 'create-voucher-max-distribution-per-buyer',
  displaySetting: 'create-voucher-display-all-pages',
}

const defaultForm: CreateVoucherForm = {
  rewardType: 'discount',
  discountType: 'fixed-amount',
  discountAmount: '',
  minimumBasketPrice: '',
  usageQuantity: '',
  maxDistributionPerBuyer: '',
  displaySetting: 'all-pages',
  productScope: 'all-products',
}

function CreateVoucherPage({
  onBack,
  onConfirm,
  mode = 'create',
  initialForm,
}: CreateVoucherPageProps) {
  const isEditMode = mode === 'edit'
  const pageLabel = isEditMode ? 'Edit Voucher' : 'Create New Voucher'
  const desktopConfirmLabel = isEditMode ? 'Save Changes' : 'Confirm'
  const mobileStepActionLabel = isEditMode ? 'Save Changes' : 'Create Voucher'
  const startingForm = initialForm ?? defaultForm
  const [form, setForm] = useState<CreateVoucherForm>(() => ({ ...startingForm }))
  const [currentStep, setCurrentStep] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<FormErrorMap>({})
  const lastStepIndex = stepTitles.length - 1

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
      return
    }

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
    }

    if (step === 1) {
      stepFields.push('displaySetting')

      if (!form.displaySetting) {
        nextErrors.displaySetting = 'Choose a voucher display setting.'
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
      handleConfirm()
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

      <div className="mt-4 rounded-xl border border-[#dbe1ea] bg-white px-4 py-3 sm:hidden">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1d4ed8]">
              Step {currentStep + 1} of {stepTitles.length}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {stepTitles[currentStep]}
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
            value={form}
            onChange={setForm}
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
            value={form}
            onChange={setForm}
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
              className="inline-flex h-10 items-center rounded-md border border-[#d6dbe3] bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex h-10 items-center rounded-md bg-[#2563EB] px-5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
            >
              {desktopConfirmLabel}
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
            disabled={currentStep === 0}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#cfd7e3] bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNextStep}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[#2563EB] px-4 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
          >
            {currentStep === lastStepIndex ? mobileStepActionLabel : 'Next'}
          </button>
        </div>
      </div>
    </section>
  )
}

export default CreateVoucherPage
