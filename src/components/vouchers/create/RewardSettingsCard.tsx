import { useId, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { CreateVoucherForm, DiscountType, RewardType } from './types'
import MobileDateTimePicker from '../../common/MobileDateTimePicker'

type RewardSettingsCardProps = {
  value: CreateVoucherForm
  onChange: (value: CreateVoucherForm) => void
  fieldErrors?: Partial<Record<keyof CreateVoucherForm, string>>
  fieldIds?: Partial<Record<keyof CreateVoucherForm, string>>
}

type FieldRowProps = {
  label: string
  children: ReactNode
  hint?: string
  error?: string
}

function FieldRow({ label, children, hint, error }: FieldRowProps) {
  return (
    <div className="grid gap-2 md:grid-cols-[190px_minmax(0,1fr)] md:items-start">
      <div>
        <p className="pt-1 text-[14px] font-medium text-slate-700">{label}</p>
      </div>
      <div>
        {children}
        {error ? <p className="mt-1.5 text-[13px] text-[#b91c1c]">{error}</p> : null}
        {hint ? <p className="mt-1.5 text-[13px] text-slate-600">{hint}</p> : null}
      </div>
    </div>
  )
}

type SegmentedOptionProps = {
  checked: boolean
  label: string
  name: string
  onSelect: () => void
}

function SegmentedOption({ checked, label, name, onSelect }: SegmentedOptionProps) {
  return (
    <label className="block">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="peer sr-only"
      />
      <span className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#d1d9e6] bg-white px-3 text-[14px] font-medium text-slate-700 transition peer-checked:border-[#2563EB] peer-checked:bg-[#eff6ff] peer-checked:text-[#1d4ed8] peer-focus-visible:ring-2 peer-focus-visible:ring-[#93c5fd] peer-focus-visible:ring-offset-1">
        {label}
      </span>
    </label>
  )
}

type CurrencyInputProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  placeholder?: string
  invalid?: boolean
}

function CurrencyInput({
  id,
  value,
  onChange,
  ariaLabel,
  placeholder,
  invalid = false,
}: CurrencyInputProps) {
  return (
    <div
      className={`flex h-11 w-full items-center rounded-md border bg-white px-3 focus-within:border-[#64748b] ${
        invalid ? 'border-[#fca5a5]' : 'border-[#b8c2d3]'
      }`}
    >
      <span
        aria-hidden="true"
        className="mr-2 select-none text-[14px] font-medium text-slate-600"
      >
        ₱
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-invalid={invalid}
        className="w-full border-0 bg-transparent text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
      />
    </div>
  )
}

type VoucherDateTimeField = 'startDateTime' | 'endDateTime'

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

function toLocalDateTimeInputValue(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function formatDateTimeLabel(value: string) {
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

function RewardSettingsCard({
  value,
  onChange,
  fieldErrors,
  fieldIds,
}: RewardSettingsCardProps) {
  const rewardTypeGroupName = useId()
  const [activePickerField, setActivePickerField] =
    useState<VoucherDateTimeField | null>(null)

  const setField = <K extends keyof CreateVoucherForm>(
    field: K,
    nextValue: CreateVoucherForm[K],
  ) => {
    onChange({ ...value, [field]: nextValue })
  }

  const handleRewardTypeChange = (rewardType: RewardType) => {
    setField('rewardType', rewardType)
  }

  const handleDiscountTypeChange = (discountType: DiscountType) => {
    setField('discountType', discountType)
  }

  const activePickerValue = useMemo(() => {
    if (!activePickerField) {
      return null
    }

    return fromLocalDateTimeInputValue(value[activePickerField])
  }, [activePickerField, value])

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
      const currentEnd = fromLocalDateTimeInputValue(value.endDateTime)

      if (!currentEnd || currentEnd.getTime() < date.getTime()) {
        const oneHourAfterStart = new Date(date.getTime() + 60 * 60 * 1000)
        onChange({
          ...value,
          startDateTime: nextValue,
          endDateTime: toLocalDateTimeInputValue(oneHourAfterStart),
        })
        return
      }
    }

    if (activePickerField === 'endDateTime') {
      const currentStart = fromLocalDateTimeInputValue(value.startDateTime)

      if (!currentStart || currentStart.getTime() > date.getTime()) {
        const oneHourBeforeEnd = new Date(date.getTime() - 60 * 60 * 1000)
        onChange({
          ...value,
          startDateTime: toLocalDateTimeInputValue(oneHourBeforeEnd),
          endDateTime: nextValue,
        })
        return
      }
    }

    setField(activePickerField, nextValue)
  }

  return (
    <article className="rounded-xl border border-[#dfe3ea] bg-white shadow-[0_10px_30px_-28px_rgba(15,23,42,0.8)]">
      <header className="border-b border-[#eef2f7] px-4 py-3 sm:px-5">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Reward Settings</h2>
      </header>

      <div className="space-y-6 px-4 py-4 sm:px-5 sm:py-5">
        <fieldset className="space-y-3">
          <legend className="text-[14px] font-medium text-slate-700">Reward Type</legend>
          <div
            role="radiogroup"
            aria-label="Reward Type"
            className="grid grid-cols-1 gap-2 min-[481px]:grid-cols-2"
          >
            <SegmentedOption
              checked={value.rewardType === 'discount'}
              label="Discount"
              name={rewardTypeGroupName}
              onSelect={() => handleRewardTypeChange('discount')}
            />
            <SegmentedOption
              checked={value.rewardType === 'coins-cashback'}
              label="Coins Cashback"
              name={rewardTypeGroupName}
              onSelect={() => handleRewardTypeChange('coins-cashback')}
            />
          </div>
        </fieldset>

        <div className="space-y-4 rounded-lg bg-slate-50/90 p-3 sm:p-4">
          <FieldRow label="Discount">
            <div className="grid gap-3 md:grid-cols-[170px_minmax(0,1fr)]">
              <select
                id={fieldIds?.discountType}
                value={value.discountType}
                onChange={(event) =>
                  handleDiscountTypeChange(event.target.value as DiscountType)
                }
                aria-label="Discount type"
                className="h-11 w-full rounded-md border border-[#b8c2d3] bg-white px-3 text-[14px] text-slate-800 focus:border-[#64748b] focus:outline-none"
              >
                <option value="fixed-amount">Fix Amount</option>
                <option value="percentage">Percentage</option>
              </select>
              <CurrencyInput
                id={fieldIds?.discountAmount}
                value={value.discountAmount}
                onChange={(nextValue) => setField('discountAmount', nextValue)}
                ariaLabel="Discount amount"
                placeholder="20.00"
                invalid={Boolean(fieldErrors?.discountAmount)}
              />
            </div>
            {fieldErrors?.discountAmount ? (
              <p className="mt-1.5 text-[13px] text-[#b91c1c]">
                {fieldErrors.discountAmount}
              </p>
            ) : null}
          </FieldRow>

          <FieldRow
            label="Minimum Basket Price"
            error={fieldErrors?.minimumBasketPrice}
          >
            <CurrencyInput
              id={fieldIds?.minimumBasketPrice}
              value={value.minimumBasketPrice}
              onChange={(nextValue) => setField('minimumBasketPrice', nextValue)}
              ariaLabel="Minimum basket price"
              placeholder="10.00"
              invalid={Boolean(fieldErrors?.minimumBasketPrice)}
            />
          </FieldRow>

          <FieldRow
            label="Usage Quantity"
            hint="Total usable voucher for all buyers"
            error={fieldErrors?.usageQuantity}
          >
            <input
              id={fieldIds?.usageQuantity}
              type="text"
              inputMode="numeric"
              value={value.usageQuantity}
              onChange={(event) => setField('usageQuantity', event.target.value)}
              placeholder="10"
              aria-label="Usage quantity"
              aria-invalid={Boolean(fieldErrors?.usageQuantity)}
              className={`h-11 w-full rounded-md border bg-white px-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-[#64748b] focus:outline-none ${
                fieldErrors?.usageQuantity ? 'border-[#fca5a5]' : 'border-[#b8c2d3]'
              }`}
            />
          </FieldRow>

          <FieldRow
            label="Max Distribution per Buyer"
            error={fieldErrors?.maxDistributionPerBuyer}
          >
            <input
              id={fieldIds?.maxDistributionPerBuyer}
              type="text"
              inputMode="numeric"
              value={value.maxDistributionPerBuyer}
              onChange={(event) =>
                setField('maxDistributionPerBuyer', event.target.value)
              }
              placeholder="1"
              aria-label="Maximum distribution per buyer"
              aria-invalid={Boolean(fieldErrors?.maxDistributionPerBuyer)}
              className={`h-11 w-full rounded-md border bg-white px-3 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-[#64748b] focus:outline-none ${
                fieldErrors?.maxDistributionPerBuyer
                  ? 'border-[#fca5a5]'
                  : 'border-[#b8c2d3]'
              }`}
            />
          </FieldRow>
        </div>

        <FieldRow
          label="Voucher Promotion Period"
          error={fieldErrors?.startDateTime || fieldErrors?.endDateTime}
        >
          <div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                id={fieldIds?.startDateTime}
                type="button"
                onClick={() => setActivePickerField('startDateTime')}
                className={`flex min-h-11 flex-col items-start justify-center rounded-md border px-3 text-left transition ${
                  activePickerField === 'startDateTime'
                    ? 'border-[#2563EB] bg-[#eff6ff]'
                    : 'border-[#cbd5e1] bg-white hover:border-[#93c5fd]'
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Start
                </span>
                <span className="mt-0.5 text-[14px] text-slate-900">
                  {formatDateTimeLabel(value.startDateTime)}
                </span>
              </button>

              <button
                id={fieldIds?.endDateTime}
                type="button"
                onClick={() => setActivePickerField('endDateTime')}
                className={`flex min-h-11 flex-col items-start justify-center rounded-md border px-3 text-left transition ${
                  activePickerField === 'endDateTime'
                    ? 'border-[#2563EB] bg-[#eff6ff]'
                    : 'border-[#cbd5e1] bg-white hover:border-[#93c5fd]'
                }`}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  End
                </span>
                <span className="mt-0.5 text-[14px] text-slate-900">
                  {formatDateTimeLabel(value.endDateTime)}
                </span>
              </button>
            </div>
            <p className="mt-1.5 text-[13px] text-slate-600">
              Voucher period must be less than 180 days.
            </p>
          </div>
        </FieldRow>
      </div>

      <MobileDateTimePicker
        isOpen={activePickerField !== null}
        value={activePickerValue}
        onClose={() => setActivePickerField(null)}
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
    </article>
  )
}

export default RewardSettingsCard
