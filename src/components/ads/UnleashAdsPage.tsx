import { useState } from 'react'
import UnleashAdsTypeModal from './UnleashAdsTypeModal'
import type { AdsCreationType } from './types'

type AdsTab = 'all' | 'search' | 'discovery'
type MetricTone = 'neutral' | 'brand' | 'accent'

type AdsMetric = {
  label: string
  value: string
  tone?: MetricTone
}

type AdsCampaign = {
  name: string
  placement: string
  budget: string
  spend: string
  sales: string
  status: 'Running' | 'Scheduled' | 'Paused'
}

type AdsTabData = {
  statisticsLabel: string
  metrics: AdsMetric[]
  impressionsSeries: number[]
  spendSeries: number[]
  campaigns: AdsCampaign[]
}

const tabs: Array<{ id: AdsTab; label: string }> = [
  { id: 'all', label: 'All Ads' },
  { id: 'search', label: 'Search Ads' },
  { id: 'discovery', label: 'Discovery Ads' },
]

const timeLabels = ['01:00', '07:00', '13:00', '19:00', '01:00', '07:00', '13:00', '19:00']

const adsDashboard: Record<AdsTab, AdsTabData> = {
  all: {
    statisticsLabel: 'All Ads Statistics',
    metrics: [
      { label: 'Impressions', value: '184,260', tone: 'brand' },
      { label: 'Clicks', value: '12,480' },
      { label: 'CTR', value: '6.78%' },
      { label: 'Conversions', value: '1,140' },
      { label: 'Items Sold', value: '1,382' },
      { label: 'GMV', value: formatPeso(428960.4) },
      { label: 'Expense', value: formatPeso(82460.15), tone: 'accent' },
    ],
    impressionsSeries: [84, 118, 104, 142, 126, 164, 158, 188],
    spendSeries: [38, 46, 44, 63, 58, 78, 72, 86],
    campaigns: [
      {
        name: 'March Payday Push',
        placement: 'Search + Discovery',
        budget: formatPeso(65000),
        spend: formatPeso(48210.45),
        sales: formatPeso(258340.8),
        status: 'Running',
      },
      {
        name: 'Fresh Catalog Launch',
        placement: 'Discovery Feed',
        budget: formatPeso(40000),
        spend: formatPeso(23120.15),
        sales: formatPeso(106280.55),
        status: 'Running',
      },
      {
        name: 'Weekend Retargeting',
        placement: 'Search Results',
        budget: formatPeso(18000),
        spend: formatPeso(11129.55),
        sales: formatPeso(64339.05),
        status: 'Scheduled',
      },
    ],
  },
  search: {
    statisticsLabel: 'Search Ads Statistics',
    metrics: [
      { label: 'Impressions', value: '96,420', tone: 'brand' },
      { label: 'Clicks', value: '7,940' },
      { label: 'CTR', value: '8.23%' },
      { label: 'Conversions', value: '792' },
      { label: 'Items Sold', value: '902' },
      { label: 'GMV', value: formatPeso(286140.85) },
      { label: 'Expense', value: formatPeso(52110.4), tone: 'accent' },
    ],
    impressionsSeries: [44, 72, 68, 96, 88, 112, 118, 136],
    spendSeries: [24, 34, 31, 44, 43, 56, 54, 61],
    campaigns: [
      {
        name: 'Keyword Booster',
        placement: 'Search Results',
        budget: formatPeso(30000),
        spend: formatPeso(24310.2),
        sales: formatPeso(152440.6),
        status: 'Running',
      },
      {
        name: 'High Intent Products',
        placement: 'Search Results',
        budget: formatPeso(22000),
        spend: formatPeso(17800.2),
        sales: formatPeso(101620.25),
        status: 'Running',
      },
      {
        name: 'Long Tail Capture',
        placement: 'Search Results',
        budget: formatPeso(12000),
        spend: formatPeso(10000),
        sales: formatPeso(32080),
        status: 'Paused',
      },
    ],
  },
  discovery: {
    statisticsLabel: 'Discovery Ads Statistics',
    metrics: [
      { label: 'Impressions', value: '87,840', tone: 'brand' },
      { label: 'Clicks', value: '4,540' },
      { label: 'CTR', value: '5.17%' },
      { label: 'Conversions', value: '348' },
      { label: 'Items Sold', value: '480' },
      { label: 'GMV', value: formatPeso(142819.55) },
      { label: 'Expense', value: formatPeso(30349.75), tone: 'accent' },
    ],
    impressionsSeries: [40, 46, 36, 51, 44, 60, 49, 72],
    spendSeries: [17, 19, 15, 22, 20, 26, 24, 31],
    campaigns: [
      {
        name: 'New In Spotlight',
        placement: 'Discovery Feed',
        budget: formatPeso(24000),
        spend: formatPeso(15140.4),
        sales: formatPeso(72180.75),
        status: 'Running',
      },
      {
        name: 'Cross-Sell Carousel',
        placement: 'Discovery Feed',
        budget: formatPeso(14000),
        spend: formatPeso(9189.35),
        sales: formatPeso(44568.2),
        status: 'Running',
      },
      {
        name: 'Dormant Buyer Recall',
        placement: 'Discovery Feed',
        budget: formatPeso(10000),
        spend: formatPeso(6020),
        sales: formatPeso(26070.6),
        status: 'Scheduled',
      },
    ],
  },
}

function formatPeso(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function getLinePath(values: number[], width: number, height: number, paddingX: number, paddingY: number) {
  const maxValue = Math.max(...values)
  const minValue = Math.min(...values)
  const usableHeight = height - paddingY * 2
  const usableWidth = width - paddingX * 2
  const stepX = usableWidth / Math.max(values.length - 1, 1)

  return values
    .map((value, index) => {
      const x = paddingX + stepX * index
      const ratio = maxValue === minValue ? 0.5 : (value - minValue) / (maxValue - minValue)
      const y = height - paddingY - ratio * usableHeight
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')
}

function getAreaPath(values: number[], width: number, height: number, paddingX: number, paddingY: number) {
  const linePath = getLinePath(values, width, height, paddingX, paddingY)
  const usableWidth = width - paddingX * 2
  const stepX = usableWidth / Math.max(values.length - 1, 1)
  const lastX = paddingX + stepX * (values.length - 1)

  return `${linePath} L ${lastX} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`
}

function getPoints(values: number[], width: number, height: number, paddingX: number, paddingY: number) {
  const maxValue = Math.max(...values)
  const minValue = Math.min(...values)
  const usableHeight = height - paddingY * 2
  const usableWidth = width - paddingX * 2
  const stepX = usableWidth / Math.max(values.length - 1, 1)

  return values.map((value, index) => {
    const x = paddingX + stepX * index
    const ratio = maxValue === minValue ? 0.5 : (value - minValue) / (maxValue - minValue)
    const y = height - paddingY - ratio * usableHeight

    return { x, y, value }
  })
}

function MetricCell({ label, value, tone = 'neutral' }: AdsMetric) {
  const toneClassName =
    tone === 'brand'
      ? 'border-t-[#2A4DBD]'
      : tone === 'accent'
        ? 'border-t-[#F07A2A]'
        : 'border-t-transparent'

  return (
    <div className={`border-t-[3px] bg-white px-4 py-4 sm:px-5 ${toneClassName}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-3 text-[26px] font-semibold tracking-[-0.02em] text-[#0C1732]">{value}</p>
    </div>
  )
}

function CampaignStatus({ status }: { status: AdsCampaign['status'] }) {
  const className =
    status === 'Running'
      ? 'text-[#1C5D99]'
      : status === 'Scheduled'
        ? 'text-[#B45309]'
        : 'text-slate-500'

  return (
    <span className={`inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] ${className}`}>
      <span className={`h-1.5 w-1.5 ${status === 'Running' ? 'bg-[#1C5D99]' : status === 'Scheduled' ? 'bg-[#F07A2A]' : 'bg-slate-400'}`} />
      {status}
    </span>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function getMetric(metrics: AdsMetric[], label: string) {
  return metrics.find((metric) => metric.label === label)?.value ?? '0'
}

function MobileOverviewMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="px-4 py-4">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-[#0C1732]">{value}</p>
    </div>
  )
}

function MobileAdsOverview({
  activeTab,
  onTabChange,
  activeDashboard,
  onOpenCreate,
  chartWidth,
  chartHeight,
  areaPath,
  impressionsLinePath,
  spendLinePath,
  impressionPoints,
  spendPoints,
}: {
  activeTab: AdsTab
  onTabChange: (tab: AdsTab) => void
  activeDashboard: AdsTabData
  onOpenCreate: () => void
  chartWidth: number
  chartHeight: number
  areaPath: string
  impressionsLinePath: string
  spendLinePath: string
  impressionPoints: Array<{ x: number; y: number; value: number }>
  spendPoints: Array<{ x: number; y: number; value: number }>
}) {
  const impressions = getMetric(activeDashboard.metrics, 'Impressions')
  const clicks = getMetric(activeDashboard.metrics, 'Clicks')
  const ctr = getMetric(activeDashboard.metrics, 'CTR')
  const conversions = getMetric(activeDashboard.metrics, 'Conversions')
  const gmv = getMetric(activeDashboard.metrics, 'GMV')
  const expense = getMetric(activeDashboard.metrics, 'Expense')
  const itemsSold = getMetric(activeDashboard.metrics, 'Items Sold')

  return (
    <div className="space-y-7 pb-6 md:hidden">
      <section className="border-b border-slate-200 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2A4DBD]">Growth Tools</p>
        <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.04em] text-[#0C1732]">Unleash Ads</h1>
        <p className="mt-2 max-w-[34ch] text-sm leading-6 text-slate-500">
          Review delivery, budget, and sales movement quickly before making your next campaign decision.
        </p>

        <div className="mt-5 space-y-4">
          <button
            type="button"
            onClick={onOpenCreate}
            className="inline-flex h-12 w-full items-center justify-center border border-[#2A4DBD] bg-[#2A4DBD] px-5 text-sm font-semibold text-white shadow-[0_16px_28px_-20px_rgba(42,77,189,0.72)] transition hover:bg-[#203f9c]"
          >
            Create New Ads
          </button>

          <div className="border-y border-slate-200 bg-white/90 py-4">
            <div className="flex items-start justify-between gap-4 px-1">
              <div>
                <p className="text-xs font-medium text-slate-500">Ads Credit</p>
                <p className="mt-1 text-[24px] font-semibold tracking-[-0.03em] text-[#0C1732]">
                  {formatPeso(100000)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 pt-1">
                <button type="button" className="text-sm font-semibold text-[#2A4DBD]">
                  Top Up
                </button>
                <button type="button" className="text-xs font-medium text-slate-500">
                  Transaction History
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-6 border-b border-slate-200">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`border-b-2 pb-3 text-sm font-semibold transition ${
                    isActive
                      ? 'border-[#2A4DBD] text-[#2A4DBD]'
                      : 'border-transparent text-slate-500'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-[#0C1732]">Performance Snapshot</p>
            <p className="mt-1 text-sm text-slate-500">{activeDashboard.statisticsLabel}</p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-between border border-slate-200 bg-white px-3 text-sm text-slate-700"
          >
            <span>08/06 - 09/06</span>
            <span className="ml-2 text-slate-400">
              <ChevronDownIcon />
            </span>
          </button>
        </div>

        <div className="overflow-hidden border-y border-slate-200 bg-white">
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-200">
            <MobileOverviewMetric label="Impressions" value={impressions} />
            <MobileOverviewMetric label="Clicks" value={clicks} />
            <MobileOverviewMetric label="CTR" value={ctr} />
            <MobileOverviewMetric label="Conversions" value={conversions} />
            <MobileOverviewMetric label="GMV" value={gmv} />
            <MobileOverviewMetric label="Expense" value={expense} />
          </div>
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-[11px] font-medium text-slate-500">Items Sold</p>
              <p className="mt-1 text-base font-semibold text-[#0C1732]">{itemsSold}</p>
            </div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
              Currency: PHP
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-[#0C1732]">Trend Chart</p>
            <p className="mt-1 text-sm text-slate-500">Pacing across visibility and spend.</p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-between border border-slate-200 bg-white px-3 text-sm text-slate-700"
          >
            <span>Export</span>
            <span className="ml-2 text-slate-400">
              <ChevronDownIcon />
            </span>
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-[#2A4DBD]" />
            Impressions
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-[#F07A2A]" />
            Expense
          </span>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="min-w-[560px] border-y border-slate-200 bg-white py-3">
            <div
              className="relative h-[220px] overflow-hidden"
              style={{
                backgroundImage:
                  'linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px)',
                backgroundSize: '100% 25%, 12.5% 100%',
              }}
            >
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="h-full w-full"
                fill="none"
                preserveAspectRatio="none"
                aria-label="Ads performance trend chart"
              >
                <defs>
                  <linearGradient id="ads-area-fill-mobile" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2A4DBD" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#2A4DBD" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                <path d={areaPath} fill="url(#ads-area-fill-mobile)" />
                <path d={impressionsLinePath} stroke="#2A4DBD" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                <path
                  d={spendLinePath}
                  stroke="#F07A2A"
                  strokeWidth="2.5"
                  strokeDasharray="6 7"
                  vectorEffect="non-scaling-stroke"
                />

                {impressionPoints.map((point, index) => (
                  <circle
                    key={`mobile-impressions-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill="#2A4DBD"
                    stroke="#ffffff"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {spendPoints.map((point, index) => (
                  <circle
                    key={`mobile-spend-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r="3.5"
                    fill="#F07A2A"
                    stroke="#ffffff"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>
            </div>

            <div className="mt-3 grid grid-cols-8 gap-2 px-2 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
              {timeLabels.map((label, index) => (
                <span key={`mobile-${label}-${index}`}>{label}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-[#0C1732]">Campaigns</p>
            <p className="mt-1 text-sm text-slate-500">Review budget flow and status without opening each campaign.</p>
          </div>
          <p className="text-xs font-medium text-slate-400">{activeDashboard.campaigns.length} shown</p>
        </div>

        <div className="divide-y divide-slate-200 border-y border-slate-200 bg-white">
          {activeDashboard.campaigns.map((campaign) => (
            <div key={campaign.name} className="px-1 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[17px] font-semibold tracking-[-0.02em] text-[#0C1732]">{campaign.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{campaign.placement}</p>
                </div>
                <CampaignStatus status={campaign.status} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[11px] font-medium text-slate-500">Budget</p>
                  <p className="mt-1 text-sm font-semibold text-[#0C1732]">{campaign.budget}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500">Spend</p>
                  <p className="mt-1 text-sm font-semibold text-[#0C1732]">{campaign.spend}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-500">GMV</p>
                  <p className="mt-1 text-sm font-semibold text-[#0C1732]">{campaign.sales}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function UnleashAdsPage({
  onCreateAds,
}: {
  onCreateAds?: (type: AdsCreationType) => void
}) {
  const [activeTab, setActiveTab] = useState<AdsTab>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const activeDashboard = adsDashboard[activeTab]
  const chartWidth = 920
  const chartHeight = 250
  const paddingX = 24
  const paddingY = 24
  const impressionsLinePath = getLinePath(
    activeDashboard.impressionsSeries,
    chartWidth,
    chartHeight,
    paddingX,
    paddingY,
  )
  const spendLinePath = getLinePath(
    activeDashboard.spendSeries,
    chartWidth,
    chartHeight,
    paddingX,
    paddingY,
  )
  const areaPath = getAreaPath(
    activeDashboard.impressionsSeries,
    chartWidth,
    chartHeight,
    paddingX,
    paddingY,
  )
  const impressionPoints = getPoints(
    activeDashboard.impressionsSeries,
    chartWidth,
    chartHeight,
    paddingX,
    paddingY,
  )
  const spendPoints = getPoints(
    activeDashboard.spendSeries,
    chartWidth,
    chartHeight,
    paddingX,
    paddingY,
  )

  return (
    <section
      className="motion-rise overflow-hidden md:rounded-2xl md:border md:border-slate-200/80 md:bg-white md:shadow-[0_20px_46px_-34px_rgba(15,23,42,0.45)]"
      style={{ animationDelay: '80ms' }}
    >
      <MobileAdsOverview
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeDashboard={activeDashboard}
        onOpenCreate={() => setIsCreateModalOpen(true)}
        chartWidth={chartWidth}
        chartHeight={chartHeight}
        areaPath={areaPath}
        impressionsLinePath={impressionsLinePath}
        spendLinePath={spendLinePath}
        impressionPoints={impressionPoints}
        spendPoints={spendPoints}
      />

      <div className="hidden md:block">
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,rgba(247,250,255,0.96),rgba(255,255,255,0.98)_58%,rgba(245,248,255,0.9))] px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2A4DBD]">
              Growth Tools
            </p>
            <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.03em] text-[#0C1732] sm:text-[36px]">
              Unleash Ads
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
              Monitor campaign delivery, budget movement, and sales impact from one clean workspace.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex min-h-[48px] items-center justify-center rounded-md border border-[#2A4DBD] bg-[#2A4DBD] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_-18px_rgba(42,77,189,0.72)] transition hover:bg-[#203f9c]"
            >
              + Create New Ads
            </button>

            <div className="grid min-w-0 border border-slate-200 bg-white sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="border-b border-slate-200 px-4 py-3 sm:border-b-0 sm:border-r">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Ads Credit
                </p>
                <p className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[#0C1732]">
                  {formatPeso(100000)}
                </p>
              </div>
              <div className="grid border-slate-200 sm:w-[168px] sm:grid-rows-2">
                <button
                  type="button"
                  className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-[#2A4DBD] transition hover:bg-slate-50"
                >
                  Top Up
                </button>
                <button
                  type="button"
                  className="px-4 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-[#0C1732]"
                >
                  Transaction History
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 py-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`border-b-2 pb-3 text-sm font-semibold transition ${
                    isActive
                      ? 'border-[#2A4DBD] text-[#2A4DBD]'
                      : 'border-transparent text-slate-500 hover:text-[#0C1732]'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="inline-flex h-11 items-center justify-between border border-slate-200 bg-white px-4 text-sm text-slate-700 transition hover:bg-slate-50 sm:min-w-[172px]"
            >
              <span>08/06 - 09/06</span>
              <span className="text-slate-400">
                <ChevronDownIcon />
              </span>
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-between border border-slate-200 bg-white px-4 text-sm text-slate-700 transition hover:bg-slate-50 sm:min-w-[148px]"
            >
              <span>Export Data</span>
              <span className="text-slate-400">
                <ChevronDownIcon />
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-lg font-semibold tracking-[-0.02em] text-[#0C1732]">
              {activeDashboard.statisticsLabel}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Performance summary across active and scheduled placements.
            </p>
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            Currency: Philippine Peso
          </p>
        </div>

        <div className="mt-5 grid overflow-hidden border border-slate-200 bg-white md:grid-cols-2 xl:grid-cols-7">
          {activeDashboard.metrics.map((metric) => (
            <MetricCell key={metric.label} {...metric} />
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold tracking-[-0.02em] text-[#0C1732]">Trend Chart Of Each Metric</p>
            <p className="mt-1 text-sm text-slate-500">Read pacing at a glance before adjusting bids or top-up levels.</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 bg-[#2A4DBD]" />
              Impressions
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 bg-[#F07A2A]" />
              Expense
            </span>
          </div>
        </div>

        <div className="mt-5 border border-slate-200 bg-[linear-gradient(180deg,#fbfdff_0%,#f6f9fe_100%)] p-3 sm:p-5">
          <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="min-w-[720px]">
              <div
                className="relative h-[250px] overflow-hidden border border-slate-200 bg-white"
                style={{
                  backgroundImage:
                    'linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px)',
                  backgroundSize: '100% 25%, 12.5% 100%',
                }}
              >
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="h-full w-full"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-label="Ads performance trend chart"
                >
                  <defs>
                    <linearGradient id="ads-area-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2A4DBD" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#2A4DBD" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  <path d={areaPath} fill="url(#ads-area-fill)" />
                  <path d={impressionsLinePath} stroke="#2A4DBD" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                  <path
                    d={spendLinePath}
                    stroke="#F07A2A"
                    strokeWidth="2.5"
                    strokeDasharray="6 7"
                    vectorEffect="non-scaling-stroke"
                  />

                  {impressionPoints.map((point, index) => (
                    <circle
                      key={`impressions-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#2A4DBD"
                      stroke="#ffffff"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                  {spendPoints.map((point, index) => (
                    <circle
                      key={`spend-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r="3.5"
                      fill="#F07A2A"
                      stroke="#ffffff"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </svg>
              </div>

              <div className="mt-3 grid grid-cols-8 gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                {timeLabels.map((label, index) => (
                  <span key={`${label}-${index}`}>{label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-lg font-semibold tracking-[-0.02em] text-[#0C1732]">All Ads List</p>
            <p className="mt-1 text-sm text-slate-500">Campaigns currently drawing traffic and budget from your credit wallet.</p>
          </div>
          <p className="text-sm text-slate-500">{activeDashboard.campaigns.length} campaigns shown</p>
        </div>

        <div className="mt-5 overflow-hidden border border-slate-200 bg-white">
          <div className="hidden grid-cols-[2fr_1.2fr_1fr_1fr_1fr_0.9fr] border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 md:grid">
            <div className="px-4 py-3">Campaign</div>
            <div className="px-4 py-3">Placement</div>
            <div className="px-4 py-3">Budget</div>
            <div className="px-4 py-3">Spend</div>
            <div className="px-4 py-3">GMV</div>
            <div className="px-4 py-3">Status</div>
          </div>

          <div>
            {activeDashboard.campaigns.map((campaign) => (
              <div
                key={campaign.name}
                className="grid border-b border-slate-200 last:border-b-0 md:grid-cols-[2fr_1.2fr_1fr_1fr_1fr_0.9fr]"
              >
                <div className="px-4 py-4">
                  <p className="text-sm font-semibold text-[#0C1732]">{campaign.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">Unleash Ads Campaign</p>
                </div>
                <div className="px-4 py-4 text-sm text-slate-600">{campaign.placement}</div>
                <div className="px-4 py-4 text-sm text-slate-600">{campaign.budget}</div>
                <div className="px-4 py-4 text-sm text-slate-600">{campaign.spend}</div>
                <div className="px-4 py-4 text-sm font-semibold text-[#0C1732]">{campaign.sales}</div>
                <div className="px-4 py-4">
                  <CampaignStatus status={campaign.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>

      <UnleashAdsTypeModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSelect={(type) => {
          setIsCreateModalOpen(false)
          onCreateAds?.(type)
        }}
      />
    </section>
  )
}

export default UnleashAdsPage
