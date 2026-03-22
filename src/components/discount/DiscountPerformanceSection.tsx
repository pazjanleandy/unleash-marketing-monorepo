import type { PromotionMetric } from './types'

type DiscountPerformanceSectionProps = {
  dateLabel: string
  metrics: PromotionMetric[]
}

function DiscountPerformanceSection({
  dateLabel,
  metrics,
}: DiscountPerformanceSectionProps) {
  const toneClasses: Record<NonNullable<PromotionMetric['tone']>, string> = {
    neutral: 'text-[#33458F]',
    ongoing: 'text-emerald-700',
    upcoming: 'text-[#3A56C5]',
    expired: 'text-slate-600',
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <div>
          <h2 className="text-lg font-semibold text-[#33458F]">Promotion Performance</h2>
          <p className="mt-1 text-xs text-slate-500">{dateLabel}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
            <p className={`mt-1 text-2xl font-semibold leading-tight ${toneClasses[metric.tone ?? 'neutral']}`}>
              {metric.value}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              <span className="font-medium">{metric.comparisonValue}</span>
            </p>
          </div>
        ))}
      </div>
    </article>
  )
}

export default DiscountPerformanceSection

