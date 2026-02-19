import { useEffect, useMemo, useState } from 'react'
import type { TouchEventHandler } from 'react'
import MobileDateTimePicker from '../common/MobileDateTimePicker'
import type { FlashDealRow, FlashDealStatus, FlashDealsTab } from './types'

type FlashDealsPromotionListSectionProps = {
  rows: FlashDealRow[]
  refreshNonce?: number
  onCreate?: () => void
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
  Upcoming: 'bg-[#DBEAFE] text-[#1D4ED8]',
  Ongoing: 'bg-[#DCFCE7] text-[#15803D]',
  Expired: 'bg-slate-200 text-slate-700',
}

const toggleClasses: Record<FlashDealStatus, string> = {
  Upcoming: 'bg-[#3B82F6]',
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
}: {
  enabled: boolean
  status: FlashDealStatus
  onToggle: () => void
}) {
  const disabled = status === 'Expired'

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-11 w-[68px] items-center rounded-full transition ${
        enabled ? toggleClasses[status] : 'bg-slate-300'
      } ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
      aria-pressed={enabled}
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
  showDateInCard = false,
}: {
  row: FlashDealRow
  enabled: boolean
  onToggle: () => void
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
    if (primaryActionLabel.toLowerCase() === 'edit') {
      return
    }
  }

  const handleSecondaryAction = () => {
    if (row.status !== 'Expired') {
      onToggle()
    }
  }

  return (
    <article className="relative mx-4 overflow-hidden rounded-2xl border border-[#dbeafe]/80 bg-white shadow-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex w-16 items-center justify-center bg-slate-100 text-xs font-semibold text-slate-600">
        Duplicate
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex w-24 items-center justify-evenly bg-[#eff6ff]">
        <span className="rounded-lg bg-[#DBEAFE] px-2 py-1 text-xs font-semibold text-[#1D4ED8]">
          {primaryActionLabel}
        </span>
        <span
          className={`rounded-lg px-2 py-1 text-xs font-semibold ${
            secondaryDanger
              ? 'bg-[#FEE2E2] text-[#B91C1C]'
              : 'bg-[#dbeafe] text-[#1d4ed8]'
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

        <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-[#f8fbff] px-3 py-2.5">
          <div className="flex items-center -space-x-2">
            {Array.from({ length: previewCount }).map((_, index) => (
              <span
                key={`${row.id}-preview-${index}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border-2 border-white bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe] text-[10px] font-semibold text-[#1d4ed8]"
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
            className="inline-flex h-11 items-center justify-center rounded-lg border border-[#bfdbfe] bg-white px-3 text-sm font-semibold text-[#1d4ed8] transition active:scale-[0.98]"
          >
            {primaryActionLabel}
          </button>
          <button
            type="button"
            onClick={handleSecondaryAction}
            className={`inline-flex h-11 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition active:scale-[0.98] ${
              secondaryDanger
                ? 'border-[#fca5a5] bg-white text-[#b91c1c]'
                : 'border-[#bfdbfe] bg-white text-[#1d4ed8]'
            }`}
          >
            {secondaryActionLabel}
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">Swipe for more actions</p>
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-medium text-slate-500">
              {enabled ? 'Active' : 'Paused'}
            </p>
            <div className="scale-90">
              <Toggle enabled={enabled} status={row.status} onToggle={onToggle} />
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function FlashDealsPromotionListSection({
  rows,
  refreshNonce = 0,
  onCreate,
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

  const customPickerValue = useMemo(() => fromDateISO(customDate), [customDate])

  useEffect(() => {
    setLoading(true)
    const timer = window.setTimeout(() => setLoading(false), 700)
    return () => window.clearTimeout(timer)
  }, [refreshNonce])

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

  const handleToggle = (rowId: string) => {
    setEnabledById((previous) => ({
      ...previous,
      [rowId]: !previous[rowId],
    }))
  }

  const getActionClassName = (action: string) => {
    const normalized = action.trim().toLowerCase()

    return normalized === 'delete' || normalized === 'end'
      ? 'text-[#dc4f1f] hover:text-[#c2410c]'
      : 'text-[#2563EB] hover:text-[#1d4ed8]'
  }

  return (
    <article className="bg-transparent pb-28 sm:rounded-2xl sm:border sm:border-[#dbeafe] sm:bg-white sm:p-5 sm:shadow-[0_14px_30px_-28px_rgba(37,99,235,0.8)]">
      <div className="hidden sm:block">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#1E40AF] sm:text-xl">Promotion List</h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Run your own Flash Deals in your shop&apos;s page to boost sales.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center rounded-md border border-[#bfdbfe] bg-white px-3 text-xs font-semibold text-[#1d4ed8] transition hover:bg-[#eff6ff]"
            >
              Bulk Add
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center rounded-md border border-[#bfdbfe] bg-white px-3 text-xs font-semibold text-[#1d4ed8] transition hover:bg-[#eff6ff]"
            >
              Bulk Manage
            </button>
            <button
              type="button"
              onClick={() => onCreate?.()}
              className="inline-flex h-9 items-center rounded-md bg-[#2563EB] px-3.5 text-xs font-semibold text-white transition hover:bg-[#1d4ed8]"
            >
              + Create
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[1080px] w-full border-separate border-spacing-0 rounded-xl border border-[#dbeafe] bg-white">
            <thead>
              <tr className="bg-[#f8fbff] text-left text-xs uppercase tracking-wide text-[#1d4ed8]">
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
              {rows.map((row) => (
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
                      onToggle={() => handleToggle(row.id)}
                    />
                  </td>
                  <td className="px-3 py-3.5">
                    <ul className="min-w-[110px] space-y-1.5">
                      {row.actions.map((action) => (
                        <li key={`${row.id}-${action}`}>
                          <button
                            type="button"
                            className={`text-sm font-medium transition ${getActionClassName(action)}`}
                          >
                            {action}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sm:hidden">
        <div className="bg-gradient-to-b from-[#F0F9FF] to-[#F0F9FF]/90 px-4 pb-3 pt-2">
          <div className="grid grid-cols-4 rounded-full bg-[#dbeafe] p-1 shadow-inner">
            {tabs.map((tab) => {
              const active = tab === activeTab
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`inline-flex h-10 items-center justify-center rounded-full px-2 text-[15px] font-semibold transition-colors ${
                    active
                      ? 'bg-[#2563EB] text-white shadow-[0_8px_18px_-12px_rgba(30,64,175,0.9)]'
                      : 'text-[#1d4ed8]'
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
            className="flex h-12 w-full items-center justify-between rounded-xl border border-[#cfe0f3] bg-white px-3.5 text-sm font-medium text-[#1E293B] shadow-[0_1px_0_rgba(15,23,42,0.02)]"
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
            <div className="mt-3 space-y-3 rounded-xl border border-[#dbeafe] bg-white p-4">
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
                      ? 'bg-[#eff6ff] font-semibold text-[#1d4ed8]'
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
                <span className="text-xs font-semibold uppercase tracking-wide text-[#1d4ed8]">
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
                        onToggle={() => handleToggle(row.id)}
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
                className="mx-12 mt-4 inline-flex h-11 w-[calc(100%-6rem)] items-center justify-center rounded-xl bg-[#2563EB] text-sm font-semibold text-white"
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
    </article>
  )
}

export default FlashDealsPromotionListSection
