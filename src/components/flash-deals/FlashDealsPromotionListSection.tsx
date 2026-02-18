import { useMemo, useState } from 'react'
import type { FlashDealRow, FlashDealStatus, FlashDealsTab } from './types'

type FlashDealsPromotionListSectionProps = {
  rows: FlashDealRow[]
}

const tabs: FlashDealsTab[] = ['All', 'Ongoing', 'Upcoming', 'Expired']

const statusClasses: Record<FlashDealStatus, string> = {
  Upcoming: 'bg-[#dbeafe] text-[#1d4ed8]',
  Ongoing: 'bg-[#dcfce7] text-[#15803d]',
  Expired: 'bg-slate-200 text-slate-700',
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
        enabled ? 'bg-[#22c55e]' : 'bg-slate-300'
      }`}
      aria-pressed={enabled}
    >
      <span
        className={`inline-flex h-5 w-5 rounded-full bg-white shadow transition ${
          enabled ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

function FlashDealsPromotionListSection({ rows }: FlashDealsPromotionListSectionProps) {
  const [activeTab, setActiveTab] = useState<FlashDealsTab>('All')
  const [dateRange, setDateRange] = useState('')
  const [enabledById, setEnabledById] = useState<Record<string, boolean>>(() =>
    rows.reduce<Record<string, boolean>>((accumulator, row) => {
      accumulator[row.id] = row.enabled
      return accumulator
    }, {}),
  )

  const filteredRows = useMemo(() => {
    const normalizedDateQuery = dateRange.trim().toLowerCase()
    const byTab = rows.filter(
      (row) => activeTab === 'All' || row.status === activeTab,
    )

    if (!normalizedDateQuery) {
      return byTab
    }

    return byTab.filter((row) => row.timeSlot.toLowerCase().includes(normalizedDateQuery))
  }, [activeTab, dateRange, rows])

  const handleToggle = (rowId: string) => {
    setEnabledById((previous) => ({
      ...previous,
      [rowId]: !previous[rowId],
    }))
  }

  return (
    <article className="rounded-2xl border border-[#dbeafe] bg-white p-4 shadow-[0_14px_30px_-28px_rgba(37,99,235,0.8)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#1E40AF] sm:text-xl">Promotion List</h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Run your own Flash Deals in your shop&apos;s page to boost sales.
            <button
              type="button"
              className="ml-1 text-[#2563EB] transition hover:text-[#1d4ed8]"
            >
              Learn More
            </button>
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

      <div className="mt-4 flex gap-1 overflow-x-auto rounded-xl border border-[#dbeafe] bg-[#f8fbff] p-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`inline-flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-[0_8px_18px_-12px_rgba(30,64,175,0.9)]'
                  : 'text-[#1d4ed8] hover:bg-[#eff6ff]'
              }`}
            >
              {tab}
            </button>
          )
        })}
      </div>

      <div className="mt-3 rounded-xl border border-[#dbeafe] bg-[#f8fbff] p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Time Slot
        </p>
        <input
          type="text"
          value={dateRange}
          onChange={(event) => setDateRange(event.target.value)}
          placeholder="Select date range to search"
          className="h-10 w-full rounded-md border border-[#cbd5e1] bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#64748b] focus:outline-none"
        />
      </div>

      <div className="mt-4 sm:hidden">
        <div className="space-y-2">
          {filteredRows.map((row) => (
            <article
              key={row.id}
              className="rounded-lg border border-[#dbeafe] bg-[#f8fbff] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{row.timeSlot}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Enabled for Flash Deals: {row.enabledProducts}
                  </p>
                  <p className="text-xs text-slate-500">Total available {row.totalAvailable}</p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClasses[row.status]}`}
                >
                  {row.status}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <Toggle enabled={enabledById[row.id]} onToggle={() => handleToggle(row.id)} />
                <div className="flex gap-2">
                  {row.actions.slice(0, 2).map((action) => (
                    <button
                      key={`${row.id}-${action}`}
                      type="button"
                      className={`text-xs font-medium transition ${
                        action === 'Delete'
                          ? 'text-[#dc4f1f] hover:text-[#c2410c]'
                          : 'text-[#2563EB] hover:text-[#1d4ed8]'
                      }`}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-4 hidden overflow-x-auto sm:block">
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
            {filteredRows.length > 0 ? (
              filteredRows.map((row) => (
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
                    <Toggle enabled={enabledById[row.id]} onToggle={() => handleToggle(row.id)} />
                  </td>
                  <td className="px-3 py-3.5">
                    <ul className="space-y-1.5">
                      {row.actions.map((action) => (
                        <li key={`${row.id}-${action}`}>
                          <button
                            type="button"
                            className={`text-sm font-medium transition ${
                              action === 'Delete'
                                ? 'text-[#dc4f1f] hover:text-[#c2410c]'
                                : 'text-[#2563EB] hover:text-[#1d4ed8]'
                            }`}
                          >
                            {action}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-10 text-center text-sm text-slate-500" colSpan={7}>
                  No flash deals found for your selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  )
}

export default FlashDealsPromotionListSection
