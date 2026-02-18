import { useEffect, useMemo, useState } from 'react'
import type { TouchEventHandler } from 'react'
import type { FlashDealRow, FlashDealStatus, FlashDealsTab } from './types'

type FlashDealsPromotionListSectionProps = {
  rows: FlashDealRow[]
  refreshNonce?: number
}

const tabs: FlashDealsTab[] = ['All', 'Ongoing', 'Upcoming', 'Expired']

type DatePreset = 'all' | 'today' | 'tomorrow' | 'next7' | 'custom'

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
  const [datePart = '', timePart = ''] = timeSlot.split(' ', 2)
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
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
        enabled ? toggleClasses[status] : 'bg-slate-300'
      } ${disabled ? 'cursor-not-allowed opacity-70' : ''}`}
      aria-pressed={enabled}
      aria-label={enabled ? 'Disable promotion' : 'Enable promotion'}
    >
      <span
        className={`inline-flex h-6 w-6 rounded-full bg-white shadow transition ${
          enabled ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function SwipeablePromotionCard({
  row,
  enabled,
  onToggle,
}: {
  row: FlashDealRow
  enabled: boolean
  onToggle: () => void
}) {
  const [offsetX, setOffsetX] = useState(0)
  const [startX, setStartX] = useState<number | null>(null)

  const { datePart, timePart } = parseDateParts(row.timeSlot)

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

  return (
    <article className="relative mx-4 mb-3 overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex w-16 items-center justify-center bg-slate-100 text-xs font-semibold text-slate-600">
        Duplicate
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex w-24 items-center justify-evenly bg-[#eff6ff]">
        <span className="rounded-lg bg-[#DBEAFE] px-2 py-1 text-xs font-semibold text-[#1D4ED8]">Edit</span>
        <span className="rounded-lg bg-[#FEE2E2] px-2 py-1 text-xs font-semibold text-[#B91C1C]">Delete</span>
      </div>

      <div
        className="relative rounded-2xl bg-white p-4 transition-transform duration-200"
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <p className="text-sm text-[#64748B]">{datePart}</p>
        <p className="mt-0.5 text-base font-medium text-[#1E293B]">{timePart}</p>

        <div className="mt-3 space-y-1">
          <p className="text-sm text-[#475569]">Enabled for Flash Deals: {row.enabledProducts}</p>
          <p className="text-sm text-[#475569]">Total available: {row.totalAvailable}</p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[row.status]}`}
          >
            {row.status}
          </span>
          <Toggle enabled={enabled} status={row.status} onToggle={onToggle} />
        </div>
      </div>
    </article>
  )
}

function FlashDealsPromotionListSection({
  rows,
  refreshNonce = 0,
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
  const [fabOpen, setFabOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const timer = window.setTimeout(() => setLoading(false), 700)
    return () => window.clearTimeout(timer)
  }, [refreshNonce])

  const counts = useMemo(
    () => ({
      All: rows.length,
      Ongoing: rows.filter((row) => row.status === 'Ongoing').length,
      Upcoming: rows.filter((row) => row.status === 'Upcoming').length,
      Expired: rows.filter((row) => row.status === 'Expired').length,
    }),
    [rows],
  )

  const filteredRows = useMemo(() => {
    const byStatus = rows.filter((row) => activeTab === 'All' || row.status === activeTab)

    return byStatus.filter((row) => {
      const { dateISO } = parseDateParts(row.timeSlot)
      return isDateMatch(dateISO, datePreset, customDate)
    })
  }, [activeTab, customDate, datePreset, rows])

  const handleToggle = (rowId: string) => {
    setEnabledById((previous) => ({
      ...previous,
      [rowId]: !previous[rowId],
    }))
  }

  return (
    <article className="bg-transparent pb-24 sm:rounded-2xl sm:border sm:border-[#dbeafe] sm:bg-white sm:p-5 sm:shadow-[0_14px_30px_-28px_rgba(37,99,235,0.8)]">
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
                  <td className="px-3 py-3.5">{row.actions.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sm:hidden">
        <div className="sticky top-14 z-20 bg-gradient-to-b from-[#F0F9FF] to-[#F0F9FF]/90 pb-2 pt-1 backdrop-blur">
          <div className="flex gap-2 overflow-x-auto px-4">
            {tabs.map((tab) => {
              const active = tab === activeTab
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition ${
                    active
                      ? 'border-[#2563EB] bg-[#2563EB] text-white'
                      : 'border-slate-300 bg-white text-[#2563EB]'
                  }`}
                >
                  {tab}
                  <span
                    className={`ml-1.5 text-xs font-semibold opacity-90 ${
                      active ? 'text-white' : 'text-[#1d4ed8]'
                    }`}
                  >
                    {counts[tab as keyof typeof counts]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-2 px-4">
          <button
            type="button"
            onClick={() => setDateOpen((value) => !value)}
            className="flex h-11 w-full items-center justify-between rounded-xl border border-[#cfe0f3] bg-white px-3 text-sm font-medium text-[#1E293B] shadow-[0_1px_0_rgba(15,23,42,0.02)]"
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
            <div className="mt-2 space-y-2 rounded-xl border border-[#dbeafe] bg-white p-3">
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
              <input
                id="custom-date"
                type="date"
                value={customDate}
                onChange={(event) => {
                  setCustomDate(event.target.value)
                  setDatePreset('custom')
                }}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </div>
          ) : null}
        </div>

        <div className="mt-3">
          {loading ? (
            <div className="space-y-3 px-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`flash-skeleton-${index}`}
                  className="h-40 animate-pulse rounded-2xl bg-slate-200"
                />
              ))}
            </div>
          ) : filteredRows.length > 0 ? (
            filteredRows.map((row) => (
              <SwipeablePromotionCard
                key={row.id}
                row={row}
                enabled={enabledById[row.id]}
                onToggle={() => handleToggle(row.id)}
              />
            ))
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
                className="mx-12 mt-4 inline-flex h-11 w-[calc(100%-6rem)] items-center justify-center rounded-xl bg-[#2563EB] text-sm font-semibold text-white"
              >
                + Create Flash Deal
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setFabOpen(true)}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] right-4 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#2563EB] text-3xl font-semibold text-white shadow-lg"
          aria-label="Open flash deal actions"
        >
          +
        </button>

        {fabOpen ? (
          <div className="fixed inset-0 z-40 bg-slate-900/40" onClick={() => setFabOpen(false)}>
            <div
              className="absolute inset-x-4 bottom-4 rounded-2xl bg-white p-3 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              {['Create Flash Deal', 'Bulk Add', 'Bulk Manage'].map((action) => (
                <button
                  key={action}
                  type="button"
                  className="flex h-11 w-full items-center rounded-lg px-3 text-sm font-medium text-[#1E293B] hover:bg-[#eff6ff]"
                >
                  {action}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFabOpen(false)}
                className="mt-1 flex h-11 w-full items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  )
}

export default FlashDealsPromotionListSection
