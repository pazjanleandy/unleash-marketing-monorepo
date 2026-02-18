import type { FlashDealsMetric } from './types'

type FlashDealsPerformanceSectionProps = {
  dateLabel: string
  metrics: FlashDealsMetric[]
}

const trendClasses: Record<FlashDealsMetric['trend'], string> = {
  up: 'bg-emerald-100 text-emerald-700',
  down: 'bg-rose-100 text-rose-700',
  neutral: 'bg-slate-100 text-slate-600',
}

const mobileTrendClasses: Record<FlashDealsMetric['trend'], string> = {
  up: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  down: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  neutral: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
}

function FlashDealsPerformanceSection({
  dateLabel,
  metrics,
}: FlashDealsPerformanceSectionProps) {
  return (
    <article className="rounded-none border-0 bg-transparent px-0 shadow-none sm:rounded-2xl sm:border sm:border-[#dbeafe] sm:bg-white sm:p-5 sm:shadow-[0_14px_30px_-28px_rgba(37,99,235,0.8)]">
      <div className="hidden items-start justify-between gap-3 sm:flex">
        <div>
          <h2 className="text-lg font-semibold text-[#1E40AF] sm:text-xl">
            Unleash Flash Deals Performance
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">{dateLabel}</p>
        </div>
        <button
          type="button"
          className="inline-flex h-11 min-w-11 items-center justify-center rounded-lg px-2 text-sm font-medium text-[#2563EB] transition hover:bg-[#eff6ff] hover:text-[#1d4ed8]"
        >
          More &gt;
        </button>
      </div>

      <div className="w-full overflow-hidden bg-transparent px-4 py-3 sm:hidden">
        <div className="mb-2.5 flex items-center justify-end px-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
            Swipe cards
          </span>
          <span className="ml-1 text-xs font-semibold text-[#2563EB]">&harr;</span>
        </div>
        <div className="relative">
          <div className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden pb-2 pr-3">
          {metrics.map((metric) => {
            const valueLength = metric.value.length
            const valueSizeClass =
              valueLength >= 12
                ? 'text-[1.2rem]'
                : valueLength >= 10
                  ? 'text-[1.35rem]'
                  : 'text-[1.55rem]'

            return (
              <article
                key={metric.label}
                className="flex h-[122px] min-w-[170px] max-w-[170px] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-[#dbeafe] bg-white p-3.5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748B]">
                    {metric.label}
                  </p>
                  <span
                    className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${mobileTrendClasses[metric.trend]}`}
                  >
                    {metric.comparisonValue}
                  </span>
                </div>
                <p
                  className={`mt-3 w-full whitespace-nowrap font-bold leading-none tracking-tight text-[#1E293B] ${valueSizeClass}`}
                >
                  {metric.value}
                </p>
                <p className="mt-auto text-[11px] text-slate-500">{metric.comparisonLabel}</p>
              </article>
            )
          })}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-[#F0F9FF] via-[#F0F9FF]/90 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#F0F9FF] via-[#F0F9FF]/90 to-transparent" />
        </div>
        <div className="mt-1 h-0.5 w-full rounded-full bg-slate-200/80" />
      </div>

      <div className="flash-metrics-grid mt-4 hidden grid-cols-2 gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-[#dbeafe] bg-[#f8fbff] p-4 lg:min-h-[118px]"
          >
            <p className="text-xs font-semibold text-slate-600">{metric.label}</p>
            <p className="mt-1.5 text-2xl font-semibold text-slate-900">{metric.value}</p>
            <p className="mt-2 text-[11px] text-slate-500">{metric.comparisonLabel}</p>
            <p className={`text-xs font-semibold ${trendClasses[metric.trend]}`}>
              {metric.comparisonValue}
            </p>
          </div>
        ))}
      </div>
    </article>
  )
}

export default FlashDealsPerformanceSection
