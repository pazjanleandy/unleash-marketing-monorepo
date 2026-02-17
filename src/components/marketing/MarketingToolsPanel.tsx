import { useMemo } from 'react'
import IconMark from './IconMark'
import ToolSectionBlock from './ToolSectionBlock'
import type { IconName, ToolCard, ToolSection } from './types'

type MarketingToolsPanelProps = {
  sections: ToolSection[]
  onToolSelect?: (tool: ToolCard) => void
}

type ToolEntry = {
  label: string
  sourceTitle: string
  fallbackIcon: IconName
}

type ToolItem = {
  label: string
  tool: ToolCard
}

type ToolTileProps = {
  item: ToolItem
  onToolSelect?: (tool: ToolCard) => void
}

function ToolTile({ item, onToolSelect }: ToolTileProps) {
  const isClickable = item.tool.id === 'vouchers' && typeof onToolSelect === 'function'

  const handleClick = () => {
    if (!isClickable) {
      return
    }

    onToolSelect?.(item.tool)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex min-h-11 w-full flex-col items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-3 text-center shadow-sm transition duration-150 hover:bg-slate-50 active:scale-[0.98] active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      aria-label={item.label}
    >
      <span className="inline-flex h-12 w-12 flex-none items-center justify-center rounded-full border border-[#dbeafe] bg-[#eff6ff] text-[#2563EB]">
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <IconMark name={item.tool.icon} />
        </svg>
      </span>

      <span className="min-h-[2.5rem] w-full text-[13px] font-medium leading-snug text-slate-800 line-clamp-2">
        {item.label}
      </span>
    </button>
  )
}

function MarketingToolsPanel({ sections, onToolSelect }: MarketingToolsPanelProps) {
  const allKnownTools = useMemo(() => sections.flatMap((section) => section.tools), [sections])

  const toolByTitle = useMemo(
    () => new Map(allKnownTools.map((tool) => [tool.title, tool])),
    [allKnownTools],
  )

  const buildItems = (entries: ToolEntry[]): ToolItem[] =>
    entries.map((entry) => {
      const matched = toolByTitle.get(entry.sourceTitle)

      return {
        label: entry.label,
        tool:
          matched ?? {
            title: entry.label,
            description: '',
            icon: entry.fallbackIcon,
            tone: 'blue',
          },
      }
    })

  const recommendedTools = useMemo<ToolItem[]>(
    () =>
      buildItems([
        {
          label: 'Vouchers',
          sourceTitle: 'Vouchers',
          fallbackIcon: 'voucher',
        },
        {
          label: 'Discount Promotions',
          sourceTitle: 'Discount Promotions',
          fallbackIcon: 'discount',
        },
        {
          label: 'Unleash Ads',
          sourceTitle: 'Unleash Ads',
          fallbackIcon: 'ads',
        },
      ]),
    [toolByTitle],
  )

  const tools = useMemo<ToolItem[]>(
    () =>
      buildItems([
        {
          label: 'Follow Prize',
          sourceTitle: 'Follow Prize',
          fallbackIcon: 'follow',
        },
        {
          label: 'Bundle Deal',
          sourceTitle: 'Bundle Deal',
          fallbackIcon: 'bundle',
        },
        {
          label: 'Shop Game',
          sourceTitle: 'Shop Game',
          fallbackIcon: 'game',
        },
        {
          label: 'Live Streaming',
          sourceTitle: 'Live Streaming',
          fallbackIcon: 'live',
        },
        {
          label: 'Top Picks',
          sourceTitle: 'Top Picks',
          fallbackIcon: 'top',
        },
        {
          label: 'Campaigns',
          sourceTitle: 'Discount Promotions',
          fallbackIcon: 'discount',
        },
        {
          label: 'Shipping Fee Promotion',
          sourceTitle: 'Shipping Fee Promotion',
          fallbackIcon: 'shipping',
        },
        {
          label: 'Add-on Deal',
          sourceTitle: 'Add-on Deal',
          fallbackIcon: 'addon',
        },
      ]),
    [toolByTitle],
  )

  return (
    <section
      className="motion-rise mt-6 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_24px_50px_-45px_rgba(15,23,42,0.65)] sm:p-8"
      style={{ animationDelay: '120ms' }}
    >
      <div className="sm:hidden">
        <header className="px-1">
          <h2 className="text-2xl font-semibold text-slate-900">Marketing Tools</h2>
          <p className="mt-1.5 text-sm leading-snug text-slate-600">
            Create and manage promotions to boost sales.
          </p>
          <a
            href="#"
            className="mt-2 inline-flex items-center text-sm font-medium text-[#2f70db] transition hover:text-[#1f57b7]"
          >
            View Products under Promotion
            <span aria-hidden="true" className="ml-1">
              -&gt;
            </span>
          </a>
        </header>

        <div className="mt-6 space-y-4">
          <section className="rounded-2xl border border-slate-200/70 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Recommended for Unleash
              </p>
              <button
                type="button"
                className="text-xs font-medium text-[#2f70db] transition hover:text-[#1f57b7]"
              >
                See all
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              {recommendedTools.map((item) => (
                <ToolTile
                  key={`recommended-${item.label}`}
                  item={item}
                  onToolSelect={onToolSelect}
                />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/70 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              All Marketing Tools
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 min-[380px]:grid-cols-3">
              {tools.map((item) => (
                <ToolTile key={`tool-${item.label}`} item={item} onToolSelect={onToolSelect} />
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="hidden sm:block">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-slate-900">Marketing Tools</h2>
          <a
            href="#"
            className="group inline-flex items-center gap-2 text-sm font-medium text-[#2f70db] transition hover:text-[#1f57b7]"
          >
            View Products under Promotion
            <span
              aria-hidden="true"
              className="inline-block transition group-hover:translate-x-0.5"
            >
              -&gt;
            </span>
          </a>
        </div>

        <div className="mt-8 space-y-9">
          {sections.map((section, sectionIndex) => (
            <ToolSectionBlock
              key={section.title}
              section={section}
              sectionIndex={sectionIndex}
              onToolSelect={onToolSelect}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default MarketingToolsPanel
