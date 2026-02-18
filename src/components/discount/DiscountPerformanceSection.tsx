import type { PromotionMetric } from './types'

type DiscountPerformanceSectionProps = {
  dateLabel: string
  metrics: PromotionMetric[]
}

function DiscountPerformanceSection({
  dateLabel,
  metrics,
}: DiscountPerformanceSectionProps) {
  return (
    <article className="rounded-2xl border border-[#dbeafe] bg-white p-4 shadow-[0_14px_30px_-28px_rgba(37,99,235,0.8)] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold text-[#1E40AF]">Promotion Performance</h2>
          <p className="mt-1 text-xs text-slate-500">{dateLabel}</p>
        </div>
        <a
          href="#"
          onClick={(event) => event.preventDefault()}
          className="text-sm font-medium text-[#2563EB] transition hover:text-[#1d4ed8]"
        >
          More -&gt;
        </a>
      </div>

      <div className="mt-4 grid gap-2 rounded-xl border border-[#dbeafe] bg-[#f8fbff] p-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5"
          >
            <p className="text-xs font-medium text-slate-600">{metric.label}</p>
            <p className="mt-1 text-2xl font-semibold leading-tight text-slate-900">
              {metric.value}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              {metric.comparisonLabel}{' '}
              <span className="font-semibold text-[#1d4ed8]">{metric.comparisonValue}</span>
            </p>
          </div>
        ))}
      </div>
    </article>
  )
}

export default DiscountPerformanceSection
