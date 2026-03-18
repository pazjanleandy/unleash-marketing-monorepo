import { useEffect, useMemo, useState } from 'react'
import type { TouchEventHandler } from 'react'
import MobileDateTimePicker from '../common/MobileDateTimePicker'
import type { FlashDealRow, FlashDealStatus, FlashDealsTab } from './types'
import type { UpdateFlashDealInput } from '../../services/market/flashDeals.repo'

type FlashDealsPromotionListSectionProps = {
  rows: FlashDealRow[]
  refreshNonce?: number
  onCreate?: () => void
  onDelete?: (row: FlashDealRow) => Promise<void> | void
  onEdit?: (row: FlashDealRow, input: UpdateFlashDealInput) => Promise<void> | void
  onToggle?: (row: FlashDealRow, isActive: boolean) => Promise<void> | void
}

const tabs: FlashDealsTab[] = ['All', 'Ongoing', 'Upcoming', 'Expired']

type DatePreset = 'all' | 'today' | 'tomorrow' | 'next7' | 'custom'

const monthLabels = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

const statusClasses: Record<FlashDealStatus, string> = {
  Upcoming: 'bg-amber-100 text-amber-700',
  Ongoing: 'bg-[#DCFCE7] text-[#15803D]',
  Expired: 'bg-slate-200 text-slate-700',
}

const toggleClasses: Record<FlashDealStatus, string> = {
  Upcoming: 'bg-amber-500',
  Ongoing: 'bg-[#22C55E]',
  Expired: 'bg-slate-300',
}

function parseDateParts(timeSlot: string) {
  const [datePart = '', ...timeParts] = timeSlot.trim().split(/\s+/)
  const timePart = timeParts.join(' ')
  const [day, month, year] = datePart.split('-')

  if (!day || !month || !year) {
    return { datePart: '-', timePart: '-', dateISO: '' }
  }

  return {
    datePart,
    timePart,
    dateISO: `${year}-${month}-${day}`,
  }
}

function toDateISO(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

function fromDateISO(value: string) {
  if (!value) {
    return null
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])

  return new Date(year, month, day, 12, 0, 0, 0)
}

function formatDateHeader(rawDatePart: string) {
  const [dayToken, monthToken, yearToken] = rawDatePart.split('-')
  const day = Number.parseInt(dayToken, 10)
  const month = Number.parseInt(monthToken, 10)
  const year = Number.parseInt(yearToken, 10)

  if (!day || !month || !year || month < 1 || month > 12) {
    return rawDatePart || 'Unknown Date'
  }

  return `${monthLabels[month - 1]} ${day}, ${year}`
}

function toStatusLabel(status: FlashDealStatus) {
  return status === 'Expired' ? 'Ended' : status
}

function formatMoney(value: number) {
  return `PHP ${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function toLocalDateTimeInputValue(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:${minute}`
}

function fromLocalDateTimeInputValue(value: string) {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function toDiscountPercent(originalPrice: number, flashPrice: number) {
  if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
    return 0
  }

  const raw = ((originalPrice - flashPrice) / originalPrice) * 100
  return Math.max(0, Math.min(99, Number(raw.toFixed(2))))
}

function getPrimaryActionLabel(row: FlashDealRow) {
  const preferred = row.status === 'Expired' ? 'view' : 'edit'
  const match = row.actions.find((action) => action.trim().toLowerCase() === preferred)

  return match ?? (row.status === 'Expired' ? 'View' : 'Edit')
}

function isDateMatch(dateISO: string, preset: DatePreset, customDate: string) {
  if (!dateISO || preset === 'all') {
    return true
  }

  const now = new Date()
  const current = new Date(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`)
  const rowDate = new Date(dateISO)

  if (preset === 'today') {
    return rowDate.getTime() === current.getTime()
  }

  if (preset === 'tomorrow') {
    const tomorrow = new Date(current)
    tomorrow.setDate(current.getDate() + 1)
    return rowDate.getTime() === tomorrow.getTime()
  }

  if (preset === 'next7') {
    const next7 = new Date(current)
    next7.setDate(current.getDate() + 7)
    return rowDate >= current && rowDate <= next7
  }

  if (preset === 'custom') {
    return Boolean(customDate) && dateISO === customDate
  }

  return true
}

function Toggle({
  enabled,
  status,
  onToggle,
  disabled = false,
}: {
  enabled: boolean
  status: FlashDealStatus
  onToggle: () => void
  disabled?: boolean
}) {
  const isDisabled = disabled || status === 'Expired'

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isDisabled}
      className={`relative inline-flex h-11 w-[68px] items-center rounded-full transition ${
        enabled ? toggleClasses[status] : 'bg-slate-300'
      } ${isDisabled ? 'cursor-not-allowed opacity-70' : ''}`}
      aria-pressed={enabled}
      aria-disabled={isDisabled}
      aria-label={enabled ? 'Disable promotion' : 'Enable promotion'}
    >
      <span
        className={`inline-flex h-8 w-8 rounded-full bg-white shadow transition ${
          enabled ? 'translate-x-7' : 'translate-x-1.5'
        }`}
      />
    </button>
  )
}

function SwipeablePromotionCard({
  row,
  enabled,
  onToggle,
  isToggling,
  onPrimaryAction,
  onDelete,
  showDateInCard = false,
}: {
  row: FlashDealRow
  enabled: boolean
  onToggle: () => void
  isToggling: boolean
  onPrimaryAction: (row: FlashDealRow) => void
  onDelete: (row: FlashDealRow) => void
  showDateInCard?: boolean
}) {
  const [offsetX, setOffsetX] = useState(0)
  const [startX, setStartX] = useState<number | null>(null)

  const { datePart, timePart } = parseDateParts(row.timeSlot)
  const primaryActionLabel = getPrimaryActionLabel(row)
  const secondaryActionLabel = row.status === 'Expired' ? 'Delete' : enabled ? 'Disable' : 'Enable'
  const secondaryDanger = row.status === 'Expired'
  const previewCount = Math.min(Math.max(row.enabledProducts, 1), 3)
  const extraProducts = Math.max(row.enabledProducts - previewCount, 0)

  const onTouchStart: TouchEventHandler<HTMLDivElement> = (event) => {
    setStartX(event.touches[0]?.clientX ?? null)
  }

  const onTouchMove: TouchEventHandler<HTMLDivElement> = (event) => {
    if (startX === null) {
      return
    }

    const delta = event.touches[0].clientX - startX
    setOffsetX(Math.max(-112, Math.min(76, delta)))
  }

  const onTouchEnd = () => {
    if (offsetX < -56) {
      setOffsetX(-96)
    } else if (offsetX > 44) {
      setOffsetX(64)
    } else {
      setOffsetX(0)
    }

    setStartX(null)
  }

  const handlePrimaryAction = () => {
    onPrimaryAction(row)
  }

  const handleSecondaryAction = () => {
    if (secondaryDanger) {
      onDelete(row)
      return
    }

    onToggle()
  }

  return (
    <article className="relative mx-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex w-16 items-center justify-center bg-slate-100 text-xs font-semibold text-slate-600">
        Duplicate
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex w-24 items-center justify-evenly bg-slate-100">
        <span className="rounded-lg bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
          {primaryActionLabel}
        </span>
        <span
          className={`rounded-lg px-2 py-1 text-xs font-semibold ${
            secondaryDanger
              ? 'bg-[#FEE2E2] text-[#B91C1C]'
              : 'bg-slate-200 text-slate-700'
          }`}
        >
          {secondaryActionLabel}
        </span>
      </div>

      <div
        className="relative rounded-2xl bg-white p-5 transition-transform duration-200"
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
            {showDateInCard ? datePart : 'Time Slot'}
          </p>
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[row.status]}`}
          >
            {toStatusLabel(row.status)}
          </span>
        </div>

        <div className="mt-3">
          <p className="text-3xl font-bold leading-none tracking-tight text-[#0f172a]">
            {timePart || '--:--'}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="flex items-center -space-x-2">
            {Array.from({ length: previewCount }).map((_, index) => (
              <span
                key={`${row.id}-preview-${index}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border-2 border-white bg-gradient-to-br from-slate-200 to-slate-300 text-[10px] font-semibold text-slate-700"
              >
                P{index + 1}
              </span>
            ))}
            {extraProducts > 0 ? (
              <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border-2 border-white bg-slate-200 px-1.5 text-[10px] font-semibold text-slate-600">
                +{extraProducts}
              </span>
            ) : null}
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
            <div className="rounded-lg bg-white px-2.5 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-slate-500">
                Enabled
              </p>
              <p className="mt-1 text-xl font-bold leading-none text-[#1E293B]">{row.enabledProducts}</p>
            </div>
            <div className="rounded-lg bg-white px-2.5 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-slate-500">
                Available
              </p>
              <p className="mt-1 text-xl font-bold leading-none text-[#1E293B]">{row.totalAvailable}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#3347A8] bg-[#3A56C5] px-3 text-sm font-semibold text-white transition active:scale-[0.98]"
          >
            {primaryActionLabel}
          </button>
          {secondaryDanger ? (
            <button
              type="button"
              onClick={handleSecondaryAction}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[#fca5a5] bg-white px-3 text-sm font-semibold text-[#b91c1c] transition active:scale-[0.98]"
            >
              {secondaryActionLabel}
            </button>
          ) : (
            <div className="flex h-11 items-center justify-between rounded-lg border border-slate-300 bg-white px-3">
              <p className="text-sm font-semibold text-slate-700">
                {enabled ? 'Enabled' : 'Disabled'}
              </p>
              <div className="scale-90">
                <Toggle
                  enabled={enabled}
                  status={row.status}
                  onToggle={onToggle}
                  disabled={isToggling}
                />
              </div>
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">Swipe for more actions</p>
          <p className="text-[11px] font-medium text-slate-500">
            {enabled ? 'Active' : 'Paused'}
          </p>
        </div>
      </div>
    </article>
  )
}

function FlashDealDetailsPopover({
  row,
  onClose,
}: {
  row: FlashDealRow
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close flash deal details"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <article className="relative z-10 w-full max-w-lg rounded-2xl border border-[#E6EBFF] bg-white p-5 shadow-[0_24px_50px_-25px_rgba(15,23,42,0.45)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#3347A8]">
              Flash Deal Details
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">{row.productName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
            aria-label="Close"
          >
            x
          </button>
        </div>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Status</dt>
            <dd className="mt-1 font-medium text-slate-700">{row.status}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Product ID</dt>
            <dd className="mt-1 font-medium text-slate-700">{row.productId}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Start</dt>
            <dd className="mt-1 font-medium text-slate-700">{formatDateTime(row.startAt)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">End</dt>
            <dd className="mt-1 font-medium text-slate-700">{formatDateTime(row.endAt)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Original Price</dt>
            <dd className="mt-1 font-medium text-slate-700">{formatMoney(row.originalPrice)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Flash Price</dt>
            <dd className="mt-1 font-medium text-slate-700">{formatMoney(row.flashPrice)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Flash Quantity</dt>
            <dd className="mt-1 font-medium text-slate-700">{row.flashQuantity}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Sold Quantity</dt>
            <dd className="mt-1 font-medium text-slate-700">{row.soldQuantity}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Purchase Limit</dt>
            <dd className="mt-1 font-medium text-slate-700">
              {row.purchaseLimit === null ? 'No limit' : row.purchaseLimit}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Time Slot</dt>
            <dd className="mt-1 font-medium text-slate-700">{row.timeSlot}</dd>
          </div>
        </dl>
      </article>
    </div>
  )
}

function FlashDealEditPopover({
  row,
  isSaving,
  onClose,
  onSave,
}: {
  row: FlashDealRow
  isSaving: boolean
  onClose: () => void
  onSave: (input: UpdateFlashDealInput) => Promise<void> | void
}) {
  const [startAt, setStartAt] = useState(() => toLocalDateTimeInputValue(row.startAt))
  const [endAt, setEndAt] = useState(() => toLocalDateTimeInputValue(row.endAt))
  const [discountPercent, setDiscountPercent] = useState(
    () => `${toDiscountPercent(row.originalPrice, row.flashPrice)}`,
  )
  const [flashQuantity, setFlashQuantity] = useState(() => `${row.flashQuantity}`)
  const [purchaseLimit, setPurchaseLimit] = useState(
    () => (row.purchaseLimit === null ? '' : `${row.purchaseLimit}`),
  )
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    const parsedStart = fromLocalDateTimeInputValue(startAt)
    const parsedEnd = fromLocalDateTimeInputValue(endAt)
    if (!parsedStart || !parsedEnd || parsedEnd.getTime() <= parsedStart.getTime()) {
      setError('End time must be later than start time.')
      return
    }

    const parsedPercent = Number(discountPercent)
    if (!Number.isFinite(parsedPercent) || parsedPercent <= 0 || parsedPercent >= 100) {
      setError('Discount must be between 0 and 100.')
      return
    }

    const parsedQuantity = Number(flashQuantity)
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      setError('Campaign stock must be a whole number greater than 0.')
      return
    }

    let parsedLimit: number | null = null
    const trimmedLimit = purchaseLimit.trim()
    if (trimmedLimit.length > 0) {
      parsedLimit = Number(trimmedLimit)
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
        setError('Purchase limit must be empty or a whole number greater than 0.')
        return
      }
    }

    setError('')
    await onSave({
      startAt: parsedStart.toISOString(),
      endAt: parsedEnd.toISOString(),
      discountPercent: parsedPercent,
      flashQuantity: parsedQuantity,
      purchaseLimit: parsedLimit,
      originalPrice: row.originalPrice,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close flash deal editor"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <article className="relative z-10 w-full max-w-lg rounded-2xl border border-[#E6EBFF] bg-white p-5 shadow-[0_24px_50px_-25px_rgba(15,23,42,0.45)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#3347A8]">
              Edit Flash Deal
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">{row.productName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
            aria-label="Close"
            disabled={isSaving}
          >
            x
          </button>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
            {error}
          </p>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-600">
            Start Time
            <input
              type="datetime-local"
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-[#cbd5e1] px-3 text-sm text-slate-900 focus:border-[#B1C2EC] focus:outline-none"
            />
          </label>
          <label className="text-sm text-slate-600">
            End Time
            <input
              type="datetime-local"
              value={endAt}
              onChange={(event) => setEndAt(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-[#cbd5e1] px-3 text-sm text-slate-900 focus:border-[#B1C2EC] focus:outline-none"
            />
          </label>
          <label className="text-sm text-slate-600">
            Discount (%)
            <input
              type="number"
              min={1}
              max={99}
              step={0.01}
              value={discountPercent}
              onChange={(event) => setDiscountPercent(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-[#cbd5e1] px-3 text-sm text-slate-900 focus:border-[#B1C2EC] focus:outline-none"
            />
          </label>
          <label className="text-sm text-slate-600">
            Campaign Stock
            <input
              type="number"
              min={1}
              step={1}
              value={flashQuantity}
              onChange={(event) => setFlashQuantity(event.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-[#cbd5e1] px-3 text-sm text-slate-900 focus:border-[#B1C2EC] focus:outline-none"
            />
          </label>
          <label className="text-sm text-slate-600 sm:col-span-2">
            Purchase Limit (optional)
            <input
              type="number"
              min={1}
              step={1}
              value={purchaseLimit}
              onChange={(event) => setPurchaseLimit(event.target.value)}
              placeholder="No limit"
              className="mt-1 h-10 w-full rounded-md border border-[#cbd5e1] px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#B1C2EC] focus:outline-none"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex h-9 items-center justify-center rounded-md border border-[#cbd5e1] bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSaving}
            className="inline-flex h-9 items-center justify-center rounded-md bg-[#3A56C5] px-4 text-sm font-semibold text-white transition hover:bg-[#3347A8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </article>
    </div>
  )
}

function FlashDealsPromotionListSection({
  rows,
  refreshNonce = 0,
  onCreate,
  onDelete,
  onEdit,
  onToggle,
}: FlashDealsPromotionListSectionProps) {
  const [activeTab, setActiveTab] = useState<FlashDealsTab>('All')
  const [enabledById, setEnabledById] = useState<Record<string, boolean>>(() =>
    rows.reduce<Record<string, boolean>>((accumulator, row) => {
      accumulator[row.id] = row.enabled
      return accumulator
    }, {}),
  )
  const [dateOpen, setDateOpen] = useState(false)
  const [datePreset, setDatePreset] = useState<DatePreset>('all')
  const [customDate, setCustomDate] = useState('')
  const [customDatePickerOpen, setCustomDatePickerOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [viewingRow, setViewingRow] = useState<FlashDealRow | null>(null)
  const [editingRow, setEditingRow] = useState<FlashDealRow | null>(null)
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  const customPickerValue = useMemo(() => fromDateISO(customDate), [customDate])

  useEffect(() => {
    setLoading(true)
    const timer = window.setTimeout(() => setLoading(false), 700)
    return () => window.clearTimeout(timer)
  }, [refreshNonce])

  useEffect(() => {
    setEnabledById(
      rows.reduce<Record<string, boolean>>((accumulator, row) => {
        accumulator[row.id] = row.enabled
        return accumulator
      }, {}),
    )
  }, [rows])

  const filteredRows = useMemo(() => {
    const byStatus = rows.filter((row) => activeTab === 'All' || row.status === activeTab)

    return byStatus.filter((row) => {
      const { dateISO } = parseDateParts(row.timeSlot)
      return isDateMatch(dateISO, datePreset, customDate)
    })
  }, [activeTab, customDate, datePreset, rows])

  const groupedMobileRows = useMemo(() => {
    const groups: Array<{ key: string; dateLabel: string; rows: FlashDealRow[] }> = []
    const byKey = new Map<string, { key: string; dateLabel: string; rows: FlashDealRow[] }>()

    filteredRows.forEach((row) => {
      const { datePart, dateISO } = parseDateParts(row.timeSlot)
      const key = dateISO || datePart || row.id

      if (!byKey.has(key)) {
        const group = {
          key,
          dateLabel: formatDateHeader(datePart),
          rows: [row],
        }
        byKey.set(key, group)
        groups.push(group)
        return
      }

      byKey.get(key)?.rows.push(row)
    })

    return groups
  }, [filteredRows])

  const handleToggle = async (row: FlashDealRow) => {
    if (!onToggle || row.status === 'Expired') {
      return
    }

    // Prevent double-toggles while an update is already in-flight for this row.
    if (togglingId === row.id) {
      return
    }

    const nextEnabled = !enabledById[row.id]
    setActionError('')
    setTogglingId(row.id)
    setEnabledById((previous) => ({
      ...previous,
      [row.id]: nextEnabled,
    }))

    try {
      await onToggle(row, nextEnabled)
    } catch (error) {
      setEnabledById((previous) => ({
        ...previous,
        [row.id]: !nextEnabled,
      }))
      setActionError(
        error instanceof Error ? error.message : 'Unable to update flash deal status.',
      )
    } finally {
      setTogglingId(null)
    }
  }

  const handleView = (row: FlashDealRow) => {
    setViewingRow(row)
  }

  const handleEdit = (row: FlashDealRow) => {
    if (row.status === 'Expired') {
      return
    }

    setEditingRow(row)
  }

  const handleDelete = async (row: FlashDealRow) => {
    if (!onDelete) {
      return
    }

    const shouldDelete = window.confirm(`Delete flash deal for "${row.productName}"?`)
    if (!shouldDelete) {
      return
    }

    setActionError('')
    setDeletingRowId(row.id)
    try {
      await onDelete(row)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to delete flash deal.')
    } finally {
      setDeletingRowId(null)
    }
  }

  const handleActionClick = (row: FlashDealRow, action: string) => {
    const normalized = action.trim().toLowerCase()
    if (normalized === 'delete') {
      void handleDelete(row)
      return
    }

    if (normalized === 'edit') {
      handleEdit(row)
      return
    }

    if (normalized === 'view') {
      handleView(row)
    }
  }

  const handleMobilePrimaryAction = (row: FlashDealRow) => {
    if (row.status === 'Expired') {
      handleView(row)
      return
    }

    handleEdit(row)
  }

  const handleEditSave = async (input: UpdateFlashDealInput) => {
    if (!editingRow || !onEdit) {
      return
    }

    setActionError('')
    setSavingEdit(true)
    try {
      await onEdit(editingRow, input)
      setEditingRow(null)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to update flash deal.')
    } finally {
      setSavingEdit(false)
    }
  }

  const getActionClassName = (action: string) => {
    const normalized = action.trim().toLowerCase()

    return normalized === 'delete' || normalized === 'end'
      ? 'text-[#dc4f1f] hover:text-[#c2410c]'
      : 'text-[#3A56C5] hover:text-[#3347A8]'
  }

  return (
    <article className="bg-transparent pb-28 sm:rounded-2xl sm:border sm:border-[#E6EBFF] sm:bg-white sm:p-5 sm:shadow-[0_14px_30px_-28px_rgba(58,86,197,0.8)]">
      {actionError ? (
        <p className="mb-3 rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">
          {actionError}
        </p>
      ) : null}
      <div className="hidden sm:block">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#33458F] sm:text-xl">Promotion List</h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Run your own Flash Deals in your shop&apos;s page to boost sales.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onCreate?.()}
              className="inline-flex h-9 items-center rounded-md bg-[#3A56C5] px-3.5 text-xs font-semibold text-white transition hover:bg-[#3347A8]"
            >
              + Create
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[1080px] w-full border-separate border-spacing-0 rounded-xl border border-[#E6EBFF] bg-white">
            <thead>
              <tr className="bg-[#f8fbff] text-left text-xs uppercase tracking-wide text-[#3347A8]">
                <th className="px-3 py-3 font-semibold">Time Slot</th>
                <th className="px-3 py-3 font-semibold">Products</th>
                <th className="px-3 py-3 font-semibold">No. of Reminders Set</th>
                <th className="px-3 py-3 font-semibold">No. of Product Clicks</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Enable/Disable</th>
                <th className="px-3 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className="align-top text-sm text-slate-700">
                  <td className="px-3 py-3.5">{row.timeSlot}</td>
                  <td className="px-3 py-3.5">
                    <p className="font-medium text-slate-900">
                      Enabled for Flash Deals: {row.enabledProducts}
                    </p>
                    <p className="text-xs text-slate-500">Total available {row.totalAvailable}</p>
                  </td>
                  <td className="px-3 py-3.5">{row.remindersSet ?? '-'}</td>
                  <td className="px-3 py-3.5">{row.productClicks ?? '-'}</td>
                  <td className="px-3 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses[row.status]}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-3.5">
                    <Toggle
                      enabled={enabledById[row.id]}
                      status={row.status}
                      disabled={togglingId === row.id}
                      onToggle={() => void handleToggle(row)}
                    />
                    {togglingId === row.id ? (
                      <p className="mt-2 text-[11px] font-medium text-slate-500">Updating...</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3.5">
                    <ul className="min-w-[110px] space-y-1.5">
                      {row.actions.map((action) => (
                        <li key={`${row.id}-${action}`}>
                          <button
                            type="button"
                            onClick={() => handleActionClick(row, action)}
                            disabled={deletingRowId === row.id}
                            className={`text-sm font-medium transition ${getActionClassName(action)}`}
                          >
                            {deletingRowId === row.id && action.trim().toLowerCase() === 'delete'
                              ? 'Deleting...'
                              : action}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 ? (
                <tr>
                  <td className="px-3 py-8 text-center text-sm text-slate-500" colSpan={7}>
                    No flash deals match your selected filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sm:hidden">
        <div className="bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] px-4 pb-3 pt-2">
          <div className="grid grid-cols-4 rounded-full bg-slate-200 p-1 shadow-inner">
            {tabs.map((tab) => {
              const active = tab === activeTab
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`inline-flex h-10 items-center justify-center rounded-full px-2 text-[15px] font-semibold transition-colors ${
                    active
                      ? 'bg-[#3A56C5] text-white shadow-[0_8px_18px_-12px_rgba(51,69,143,0.9)]'
                      : 'text-slate-600'
                  }`}
                >
                  {tab}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-4 px-4">
          <button
            type="button"
            onClick={() => setDateOpen((value) => !value)}
            className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-medium text-[#1E293B] shadow-[0_1px_0_rgba(15,23,42,0.02)]"
          >
            <span className="truncate">
              Date:{' '}
              {datePreset === 'all'
                ? 'All Dates'
                : datePreset === 'today'
                  ? 'Today'
                  : datePreset === 'tomorrow'
                    ? 'Tomorrow'
                    : datePreset === 'next7'
                      ? 'Next 7 Days'
                      : customDate || 'Custom Range'}
            </span>
            <span
              aria-hidden="true"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-black"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`h-3 w-3 transition-transform ${dateOpen ? 'rotate-180' : ''}`}
              >
                <path
                  d="M5 7.5L10 12.5L15 7.5"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>

          {dateOpen ? (
            <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              {[
                { id: 'all', label: 'All Dates' },
                { id: 'today', label: 'Today' },
                { id: 'tomorrow', label: 'Tomorrow' },
                { id: 'next7', label: 'Next 7 Days' },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setDatePreset(option.id as DatePreset)}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                    datePreset === option.id
                      ? 'bg-[#F2F4FF] font-semibold text-[#3347A8]'
                      : 'text-slate-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}

              <label className="block text-xs font-medium text-slate-500" htmlFor="custom-date">
                Custom Range
              </label>
              <button
                id="custom-date"
                type="button"
                onClick={() => setCustomDatePickerOpen(true)}
                className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
              >
                <span className="truncate">{customDate || 'Select custom date'}</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-[#3347A8]">
                  Pick
                </span>
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-5">
          {loading ? (
            <div className="space-y-5 px-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`flash-skeleton-${index}`}
                  className="h-44 animate-pulse rounded-2xl bg-slate-200"
                />
              ))}
            </div>
          ) : groupedMobileRows.length > 0 ? (
            <div className="space-y-5">
              {groupedMobileRows.map((group) => (
                <section key={group.key}>
                  <h3 className="px-4 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                    {group.dateLabel}
                  </h3>
                  <div className="mt-2.5 space-y-3">
                    {group.rows.map((row) => (
                      <SwipeablePromotionCard
                        key={row.id}
                        row={row}
                        enabled={enabledById[row.id]}
                        onToggle={() => void handleToggle(row)}
                        isToggling={togglingId === row.id}
                        onPrimaryAction={handleMobilePrimaryAction}
                        onDelete={(item) => void handleDelete(item)}
                        showDateInCard={false}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="px-4 pt-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-4xl text-slate-300">
                📭
              </div>
              <p className="mt-3 text-base font-medium text-slate-500">No promotions yet</p>
              <p className="mx-auto mt-1 max-w-[220px] text-sm text-slate-400">
                Create your first flash deal to get started
              </p>
              <button
                type="button"
                onClick={() => onCreate?.()}
                className="mx-12 mt-4 inline-flex h-11 w-[calc(100%-6rem)] items-center justify-center rounded-xl bg-[#3A56C5] text-sm font-semibold text-white"
              >
                + Create Flash Deal
              </button>
            </div>
          )}
        </div>

      </div>

      <MobileDateTimePicker
        isOpen={customDatePickerOpen}
        value={customPickerValue}
        onClose={() => setCustomDatePickerOpen(false)}
        onChange={(date) => {
          if (!date) {
            setCustomDate('')
            return
          }

          setCustomDate(toDateISO(date))
          setDatePreset('custom')
        }}
        mode="datetime"
        title="Select custom date"
        minuteStep={30}
      />
      {viewingRow ? (
        <FlashDealDetailsPopover row={viewingRow} onClose={() => setViewingRow(null)} />
      ) : null}
      {editingRow ? (
        <FlashDealEditPopover
          row={editingRow}
          isSaving={savingEdit}
          onClose={() => setEditingRow(null)}
          onSave={handleEditSave}
        />
      ) : null}
    </article>
  )
}

export default FlashDealsPromotionListSection

