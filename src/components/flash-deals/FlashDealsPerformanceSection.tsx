import type { FlashDealsMetric } from './types'

type FlashDealsPerformanceSectionProps = {
  dateLabel: string
  metrics: FlashDealsMetric[]
}

const trendClasses: Record<FlashDealsMetric['trend'], string> = {
  up: 'text-[#16a34a]',
  down: 'text-[#dc2626]',
  neutral: 'text-slate-500',
}

function FlashDealsPerformanceSection({
  dateLabel,
  metrics,
}: FlashDealsPerformanceSectionProps) {
  return (
    <article className="rounded-2xl border border-[#dbeafe] bg-white p-4 shadow-[0_14px_30px_-28px_rgba(37,99,235,0.8)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#1E40AF] sm:text-xl">
            Unleash Flash Deals Performance
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">{dateLabel}</p>
        </div>
        <button
          type="button"
          className="text-sm font-medium text-[#2563EB] transition hover:text-[#1d4ed8]"
        >
          More &gt;
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-[#dbeafe] bg-[#f8fbff] p-3 lg:min-h-[118px]"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              {metric.label}
            </p>
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
