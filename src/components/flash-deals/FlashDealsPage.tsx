import FlashDealsPerformanceSection from './FlashDealsPerformanceSection'
import FlashDealsPromotionListSection from './FlashDealsPromotionListSection'
import {
  flashDealRows,
  flashDealsPerformanceDateLabel,
  flashDealsPerformanceMetrics,
} from './data'

type FlashDealsPageProps = {
  onBack: () => void
}

function FlashDealsPage({ onBack }: FlashDealsPageProps) {
  return (
    <section
      className="motion-rise min-h-[calc(100vh-2.5rem)] rounded-3xl border border-slate-200/80 bg-white/95 p-3 pb-24 shadow-[0_24px_50px_-45px_rgba(15,23,42,0.65)] sm:min-h-0 sm:p-8 sm:pb-8"
      style={{ animationDelay: '80ms' }}
    >
      <div className="sm:hidden">
        <div className="rounded-2xl border border-[#dbeafe] bg-gradient-to-r from-[#eff6ff] via-[#dbeafe] to-white p-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-base font-semibold text-[#1E40AF] transition active:scale-95"
              aria-label="Back to Marketing Centre"
            >
              &larr;
            </button>
            <h1 className="text-[22px] font-semibold leading-none text-[#1E40AF]">
              Flash Deals
            </h1>
          </div>
          <p className="mt-1.5 text-xs text-[#1d4ed8]">
            Manage limited-time offers for Unleash shoppers.
          </p>
        </div>
      </div>

      <div className="hidden sm:block">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center rounded-full bg-[#eff6ff] px-3 py-1.5 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe]"
        >
          &larr; Back to Marketing Centre
        </button>

        <header className="mt-4 rounded-2xl border border-[#dbeafe] bg-gradient-to-r from-[#eff6ff] via-[#dbeafe] to-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
            Home &gt; Marketing Centre &gt; Flash Deals
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[#1E40AF]">Flash Deals</h1>
          <p className="mt-1.5 text-sm text-[#1d4ed8]">
            Run and optimize short-window promotions on Unleash.
          </p>
        </header>
      </div>

      <div className="mt-4 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2.5 text-xs text-[#1d4ed8] sm:mt-4 sm:text-sm">
        Expired promotions that ended before 01 May 2020 can&apos;t be edited.
      </div>

      <div className="mt-4 space-y-4">
        <FlashDealsPerformanceSection
          dateLabel={flashDealsPerformanceDateLabel}
          metrics={flashDealsPerformanceMetrics}
        />
        <FlashDealsPromotionListSection rows={flashDealRows} />
      </div>
    </section>
  )
}

export default FlashDealsPage
