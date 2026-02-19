import { useState } from 'react'
import type { TouchEventHandler } from 'react'
import FlashDealsPerformanceSection from './FlashDealsPerformanceSection'
import FlashDealsPromotionListSection from './FlashDealsPromotionListSection'
import {
  flashDealRows,
  flashDealsPerformanceDateLabel,
  flashDealsPerformanceMetrics,
} from './data'

type FlashDealsPageProps = {
  onBack: () => void
  onCreate?: () => void
}

function FlashDealsPage({ onBack, onCreate }: FlashDealsPageProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [startY, setStartY] = useState<number | null>(null)
  const [refreshNonce, setRefreshNonce] = useState(0)

  const onTouchStart: TouchEventHandler<HTMLElement> = (event) => {
    if (window.scrollY > 0 || refreshing) {
      setStartY(null)
      return
    }

    setStartY(event.touches[0]?.clientY ?? null)
  }

  const onTouchMove: TouchEventHandler<HTMLElement> = (event) => {
    if (startY === null || refreshing || window.scrollY > 0) {
      return
    }

    const deltaY = event.touches[0].clientY - startY
    if (deltaY > 0) {
      setPullDistance(Math.min(deltaY * 0.45, 84))
    }
  }

  const onTouchEnd = () => {
    if (refreshing) {
      return
    }

    if (pullDistance >= 52) {
      setRefreshing(true)
      setPullDistance(0)

      window.setTimeout(() => {
        setRefreshing(false)
        setRefreshNonce((value) => value + 1)
      }, 900)
    } else {
      setPullDistance(0)
    }

    setStartY(null)
  }

  return (
    <>
      <section
        className="motion-rise min-h-[calc(100vh-2.5rem)] rounded-3xl border border-slate-200/80 bg-gradient-to-b from-[#F0F9FF] to-white pb-10 shadow-[0_24px_50px_-45px_rgba(15,23,42,0.65)] sm:min-h-0 sm:bg-white/95 sm:p-8 sm:pb-8"
        style={{ animationDelay: '80ms' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="sm:hidden">
          <div
            className="pointer-events-none fixed left-1/2 z-40 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1d4ed8] shadow-sm transition"
            style={{
              top: `${6 + pullDistance}px`,
              opacity: pullDistance > 6 || refreshing ? 1 : 0,
            }}
          >
            {refreshing ? 'Refreshing...' : 'Pull to refresh'}
          </div>

          <header className="rounded-2xl bg-gradient-to-r from-[#eff6ff] via-[#dbeafe] to-white p-4 shadow-[0_14px_30px_-26px_rgba(37,99,235,0.9)]">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-base font-semibold text-[#1E40AF] shadow-sm transition active:scale-95"
                aria-label="Back to Marketing Centre"
              >
                &larr;
              </button>
              <h1 className="text-[34px] font-bold leading-none text-[#1E40AF]">Flash Deals</h1>
            </div>
            <p className="mt-2 text-[12px] text-[#1d4ed8]">
              Pull to refresh, tap cards, or swipe for quick actions.
            </p>
          </header>

          <div className="space-y-5 pt-5">
            <FlashDealsPerformanceSection
              dateLabel={flashDealsPerformanceDateLabel}
              metrics={flashDealsPerformanceMetrics}
            />
            <FlashDealsPromotionListSection
              rows={flashDealRows}
              refreshNonce={refreshNonce}
              onCreate={onCreate}
            />
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

          <div className="mt-4 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2.5 text-sm text-[#1d4ed8]">
            Expired promotions that ended before 01 May 2020 can&apos;t be edited.
          </div>

          <div className="mt-4 space-y-4">
            <FlashDealsPerformanceSection
              dateLabel={flashDealsPerformanceDateLabel}
              metrics={flashDealsPerformanceMetrics}
            />
            <FlashDealsPromotionListSection
              rows={flashDealRows}
              refreshNonce={refreshNonce}
              onCreate={onCreate}
            />
          </div>
        </div>
      </section>

      {onCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-4 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#2563EB] text-3xl font-semibold leading-none text-white shadow-[0_16px_32px_-14px_rgba(37,99,235,0.9)] transition hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#93c5fd] sm:hidden"
          aria-label="Create Flash Deal"
        >
          +
        </button>
      ) : null}
    </>
  )
}

export default FlashDealsPage
