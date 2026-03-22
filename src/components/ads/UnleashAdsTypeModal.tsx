import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AdsCreationType } from './types'

type UnleashAdsTypeModalProps = {
  open: boolean
  onClose: () => void
  onSelect: (type: AdsCreationType) => void
}

const adTypeOptions: Array<{
  type: AdsCreationType
  label: string
  eyebrow: string
  description: string
}> = [
  {
    type: 'search',
    label: 'Search Ads',
    eyebrow: 'Most Direct',
    description: 'Place products where buyers are already searching with strong intent.',
  },
  {
    type: 'discovery',
    label: 'Discovery Ads',
    eyebrow: 'Broader Reach',
    description: 'Appear in exploratory placements to widen visibility across the marketplace.',
  },
]

function PlacementIcon({ type }: { type: AdsCreationType }) {
  if (type === 'search') {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4.75" y="6.75" width="18.5" height="13.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 11.25H16.5M8 15.25H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="19.25" cy="18.25" r="3.75" stroke="currentColor" strokeWidth="1.5" />
        <path d="M21.9 20.9L24.5 23.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4.75" y="5.75" width="8.5" height="6.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4.75" y="15.75" width="8.5" height="6.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="15.25" y="8.75" width="8" height="4.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="15.25" y="16.75" width="8" height="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13.25 9.75H15.25M13.25 18.75H15.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function UnleashAdsTypeModal({
  open,
  onClose,
  onSelect,
}: UnleashAdsTypeModalProps) {
  const [selectedType, setSelectedType] = useState<AdsCreationType>('search')

  useEffect(() => {
    if (!open) {
      return
    }

    setSelectedType('search')

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    window.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [onClose, open])

  if (!open) {
    return null
  }

  if (typeof document === 'undefined') {
    return null
  }

  const selectedOption = adTypeOptions.find((option) => option.type === selectedType) ?? adTypeOptions[0]

  return createPortal(
    <>
      <div className="fixed inset-0 z-[80] bg-slate-950/50 backdrop-blur-[2px]" aria-hidden="true" onClick={onClose} />

      <div className="fixed inset-0 z-[81] flex items-end md:hidden">
        <div className="relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-22px_60px_-28px_rgba(15,23,42,0.5)]">
          <div className="px-4 pt-3">
            <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-200" />
          </div>

          <div className="border-b border-slate-200 px-4 pb-4 pt-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2A4DBD]">
                  Launch New Campaign
                </p>
                <h2 id="unleash-ads-create-title-mobile" className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-[#0C1732]">
                  Create New Ads
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Pick the traffic path you want to launch first.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close create ads sheet"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center text-slate-500 transition hover:text-slate-800"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {adTypeOptions.map((option) => {
                const isSelected = selectedType === option.type

                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => setSelectedType(option.type)}
                    className={`w-full px-0 py-4 text-left transition ${
                      isSelected ? 'bg-[#F8FAFF] shadow-[inset_3px_0_0_0_#2A4DBD]' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-4 px-4">
                      <span
                        className={`mt-0.5 inline-flex h-11 w-11 flex-none items-center justify-center border ${
                          isSelected
                            ? 'border-[#D6E3FB] bg-white text-[#2A4DBD]'
                            : 'border-slate-200 bg-slate-50 text-slate-500'
                        }`}
                        aria-hidden="true"
                      >
                        <PlacementIcon type={option.type} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2A4DBD]">
                          {option.eyebrow}
                        </span>
                        <span className="mt-2 block text-[22px] font-semibold tracking-[-0.03em] text-[#0C1732]">
                          {option.label}
                        </span>
                        <span className="mt-2 block text-sm leading-6 text-slate-500">
                          {option.description}
                        </span>
                      </span>

                      <span
                        className={`mt-1 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full border ${
                          isSelected ? 'border-[#2A4DBD]' : 'border-slate-300'
                        }`}
                        aria-hidden="true"
                      >
                        {isSelected ? <span className="h-2 w-2 rounded-full bg-[#2A4DBD]" /> : null}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white/95 p-4 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => onSelect(selectedType)}
              className="inline-flex h-12 w-full items-center justify-center border border-[#2A4DBD] bg-[#2A4DBD] px-5 text-sm font-semibold text-white shadow-[0_16px_28px_-20px_rgba(42,77,189,0.78)] transition hover:bg-[#203f9c]"
            >
              Continue With {selectedOption.label}
            </button>
          </div>
        </div>
      </div>

      <div className="fixed inset-0 z-[81] hidden items-center justify-center px-4 py-8 md:flex">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="unleash-ads-create-title"
          className="relative z-10 w-full max-w-[720px] overflow-hidden border border-slate-200 bg-white shadow-[0_38px_80px_-46px_rgba(15,23,42,0.85)]"
        >
          <div className="border-b border-slate-200 bg-[linear-gradient(135deg,rgba(247,250,255,0.98),rgba(255,255,255,0.98)_68%,rgba(243,246,252,0.95))] px-5 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2A4DBD]">
                  Launch New Campaign
                </p>
                <h2
                  id="unleash-ads-create-title"
                  className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-[#0C1732]"
                >
                  Create New Ads
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choose the ad type that matches how you want buyers to discover Unleash.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close create ads modal"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6 sm:py-6">
            {adTypeOptions.map((option, index) => (
              <button
                key={option.type}
                type="button"
                onClick={() => onSelect(option.type)}
                className={`group relative flex min-h-[240px] flex-col items-start justify-between border px-5 py-5 text-left transition ${
                  index === 0
                    ? 'border-[#BFD3F8] bg-[linear-gradient(180deg,#F9FBFF_0%,#FFFFFF_100%)] hover:border-[#2A4DBD]'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex w-full items-start justify-between gap-4">
                  <span
                    className={`inline-flex items-center border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                      index === 0
                        ? 'border-[#D6E3FB] bg-[#EEF4FF] text-[#2A4DBD]'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}
                  >
                    {option.eyebrow}
                  </span>

                  <span
                    className={`inline-flex h-12 w-12 items-center justify-center border ${
                      index === 0
                        ? 'border-[#D6E3FB] bg-white text-[#2A4DBD]'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}
                    aria-hidden="true"
                  >
                    <PlacementIcon type={option.type} />
                  </span>
                </div>

                <div className="mt-8">
                  <p className="text-[24px] font-semibold tracking-[-0.03em] text-[#0C1732]">
                    {option.label}
                  </p>
                  <p className="mt-3 max-w-[28ch] text-sm leading-6 text-slate-500">
                    {option.description}
                  </p>
                </div>

                <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#2A4DBD]">
                  Continue
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="transition group-hover:translate-x-1"
                  >
                    <path d="M4 10H16M11 5L16 10L11 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}

export default UnleashAdsTypeModal
