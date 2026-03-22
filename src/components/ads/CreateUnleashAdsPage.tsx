import { useMemo, useState, type ReactNode } from 'react'
import type { AdsCreationType } from './types'

type PromotionTarget = 'products' | 'shop'
type BudgetMode = 'unlimited' | 'set-budget'
type ScheduleMode = 'none' | 'scheduled'

type CreateUnleashAdsPageProps = {
  adType: AdsCreationType
  onBack: () => void
}

const currentDate = new Date()
const nextDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)

function toInputDateTime(value: Date) {
  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, '0')
  const day = `${value.getDate()}`.padStart(2, '0')
  const hours = `${value.getHours()}`.padStart(2, '0')
  const minutes = `${value.getMinutes()}`.padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function SurfaceIcon({ target }: { target: PromotionTarget }) {
  if (target === 'products') {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6.5H16V15.5H4V6.5Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 4.5H13L14 6.5H6L7 4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7 10H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 8L10 4L15 8V15H5V8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8 11.5H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ChoiceRow({
  label,
  description,
  checked,
  onChange,
  children,
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
  children?: ReactNode
}) {
  return (
    <label className={`block border px-4 py-3 transition ${checked ? 'border-[#BFD3F8] bg-[#F7F9FF]' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
      <span className="flex items-start gap-3">
        <span className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border ${checked ? 'border-[#2A4DBD]' : 'border-slate-300'}`}>
          {checked ? <span className="h-2 w-2 rounded-full bg-[#2A4DBD]" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-[#0C1732]">{label}</span>
          <span className="mt-1 block text-sm text-slate-500">{description}</span>
          {children ? <span className="mt-3 block">{children}</span> : null}
        </span>
      </span>
      <input type="radio" checked={checked} onChange={onChange} className="sr-only" />
    </label>
  )
}

function MobileFormSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-[20px] font-semibold tracking-[-0.03em] text-[#0C1732]">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

function MobileField({
  label,
  helper,
  children,
}: {
  label: string
  helper?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-[#0C1732]">{label}</label>
      </div>
      {children}
      {helper ? <p className="text-sm text-slate-500">{helper}</p> : null}
    </div>
  )
}

function MobileSelectionRow({
  label,
  description,
  checked,
  onChange,
  children,
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
  children?: ReactNode
}) {
  return (
    <label className={`block px-4 py-4 transition ${checked ? 'bg-[#F8FAFF] shadow-[inset_3px_0_0_0_#2A4DBD]' : 'bg-white'}`}>
      <span className="flex items-start gap-3">
        <span className={`mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full border ${checked ? 'border-[#2A4DBD]' : 'border-slate-300'}`}>
          {checked ? <span className="h-2.5 w-2.5 rounded-full bg-[#2A4DBD]" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-[#0C1732]">{label}</span>
          <span className="mt-1 block text-sm leading-6 text-slate-500">{description}</span>
          {children ? <span className="mt-3 block border-t border-slate-200 pt-3">{children}</span> : null}
        </span>
      </span>
      <input type="radio" checked={checked} onChange={onChange} className="sr-only" />
    </label>
  )
}

function MobileSummaryMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#0C1732]">{value}</p>
    </div>
  )
}

function CreateUnleashAdsPage({
  adType,
  onBack,
}: CreateUnleashAdsPageProps) {
  const [promotionTarget, setPromotionTarget] = useState<PromotionTarget>('products')
  const [adName, setAdName] = useState('')
  const [budgetMode, setBudgetMode] = useState<BudgetMode>('unlimited')
  const [budget, setBudget] = useState('1500')
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('none')
  const [startAt, setStartAt] = useState(toInputDateTime(currentDate))
  const [endAt, setEndAt] = useState(toInputDateTime(nextDate))
  const [headline, setHeadline] = useState('')
  const [creativeNote, setCreativeNote] = useState('')

  const config = useMemo(() => {
    if (adType === 'search') {
      return {
        title: 'Create Search Ads',
        eyebrow: 'Buyer Intent Placement',
        description: 'Reach shoppers who are already searching for products related to Unleash.',
        creativeLabel: 'Search hook',
        creativePlaceholder: 'Example: Everyday essentials delivered faster with Unleash.',
      }
    }

    return {
      title: 'Create Discovery Ads',
      eyebrow: 'Exploration Placement',
      description: 'Showcase products and shop collections in recommendation-led surfaces.',
      creativeLabel: 'Discovery hook',
      creativePlaceholder: 'Example: Fresh arrivals and standout picks now live on Unleash.',
    }
  }, [adType])

  const inputClassName =
    'h-12 w-full border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#BFD3F8] focus:bg-[#FBFCFF]'

  return (
    <section
      className="motion-rise overflow-hidden md:rounded-2xl md:border md:border-slate-200/80 md:bg-white md:shadow-[0_20px_46px_-34px_rgba(15,23,42,0.45)]"
      style={{ animationDelay: '80ms' }}
    >
      <div className="space-y-8 pb-[calc(env(safe-area-inset-bottom)+7.5rem)] md:hidden">
        <header className="border-b border-slate-200 pb-5">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"
              aria-label="Back to Unleash Ads"
            >
              &larr;
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2A4DBD]">
                {config.eyebrow}
              </p>
              <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] text-[#0C1732]">
                {config.title}
              </h1>
              <p className="mt-2 max-w-[34ch] text-sm leading-6 text-slate-500">
                {config.description}
              </p>
            </div>
          </div>
        </header>

        <MobileFormSection
          title="Basic Settings"
          description="Set the campaign structure first, then reveal extra fields only when they matter."
        >
          <div className="space-y-5">
            <MobileField
              label="Promotion Type"
              helper="Choose where the campaign should drive attention inside Unleash."
            >
              <div className="divide-y divide-slate-200 border-y border-slate-200 bg-white">
                {([
                  {
                    value: 'products',
                    title: 'Products',
                    description: 'Promote individual listings with focused search visibility.',
                  },
                  {
                    value: 'shop',
                    title: 'Shop',
                    description: 'Push the full storefront with a quieter operational treatment.',
                  },
                ] as const).map((option) => {
                  const isActive = promotionTarget === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPromotionTarget(option.value)}
                      className={`flex w-full items-start gap-4 px-4 py-4 text-left transition ${
                        isActive ? 'bg-[#F8FAFF] shadow-[inset_3px_0_0_0_#2A4DBD]' : 'bg-white'
                      }`}
                    >
                      <span
                        className={`inline-flex h-11 w-11 flex-none items-center justify-center border ${
                          isActive
                            ? 'border-[#D6E3FB] bg-white text-[#2A4DBD]'
                            : 'border-slate-200 bg-slate-50 text-slate-500'
                        }`}
                        aria-hidden="true"
                      >
                        <SurfaceIcon target={option.value} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#0C1732]">{option.title}</span>
                        <span className="mt-1 block text-sm leading-6 text-slate-500">{option.description}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </MobileField>

            <MobileField
              label="Ad Name"
              helper="Use an internal name that the team can recognize instantly."
            >
              <div className="relative">
                <input
                  type="text"
                  value={adName}
                  onChange={(event) => setAdName(event.target.value.slice(0, 50))}
                  placeholder="Name this campaign"
                  className={`${inputClassName} pr-16`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                  {adName.length}/50
                </span>
              </div>
            </MobileField>

            <MobileField label="Budget" helper="Only reveal the peso field when a cap is required.">
              <div className="divide-y divide-slate-200 border-y border-slate-200 bg-white">
                <MobileSelectionRow
                  label="No Limit"
                  description="Let delivery use available ads credit without setting a hard cap."
                  checked={budgetMode === 'unlimited'}
                  onChange={() => setBudgetMode('unlimited')}
                />
                <MobileSelectionRow
                  label="Set Budget"
                  description="Apply a fixed peso cap to keep spending predictable."
                  checked={budgetMode === 'set-budget'}
                  onChange={() => setBudgetMode('set-budget')}
                >
                  {budgetMode === 'set-budget' ? (
                    <div className="grid gap-3 grid-cols-[96px_minmax(0,1fr)]">
                      <div className="flex h-12 items-center justify-center border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600">
                        PHP
                      </div>
                      <input
                        type="number"
                        min="100"
                        step="50"
                        value={budget}
                        onChange={(event) => setBudget(event.target.value)}
                        className={inputClassName}
                      />
                    </div>
                  ) : null}
                </MobileSelectionRow>
              </div>
            </MobileField>

            <MobileField label="Time Length" helper="Schedule only when this campaign needs a defined launch window.">
              <div className="divide-y divide-slate-200 border-y border-slate-200 bg-white">
                <MobileSelectionRow
                  label="No Time Limit"
                  description="Keep the campaign active until you pause it yourself."
                  checked={scheduleMode === 'none'}
                  onChange={() => setScheduleMode('none')}
                />
                <MobileSelectionRow
                  label="Set Start/End Date"
                  description="Reveal start and end inputs only for scheduled launches."
                  checked={scheduleMode === 'scheduled'}
                  onChange={() => setScheduleMode('scheduled')}
                >
                  {scheduleMode === 'scheduled' ? (
                    <div className="grid gap-3">
                      <label className="block">
                        <span className="mb-2 block text-xs font-medium text-slate-500">Start</span>
                        <input
                          type="datetime-local"
                          value={startAt}
                          onChange={(event) => setStartAt(event.target.value)}
                          className={inputClassName}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-medium text-slate-500">End</span>
                        <input
                          type="datetime-local"
                          value={endAt}
                          onChange={(event) => setEndAt(event.target.value)}
                          className={inputClassName}
                        />
                      </label>
                    </div>
                  ) : null}
                </MobileSelectionRow>
              </div>
            </MobileField>
          </div>
        </MobileFormSection>

        <MobileFormSection
          title="Ad Creative"
          description="Keep the main hook clear and let supporting notes stay secondary."
        >
          <div className="space-y-5">
            <MobileField
              label={config.creativeLabel}
              helper="One focused reason to click is stronger than a long promotional sentence."
            >
              <input
                type="text"
                value={headline}
                onChange={(event) => setHeadline(event.target.value.slice(0, 70))}
                placeholder={config.creativePlaceholder}
                className={inputClassName}
              />
            </MobileField>

            <MobileField
              label="Creative Notes"
              helper="Internal guidance for the team, offer notes, or launch context."
            >
              <textarea
                value={creativeNote}
                onChange={(event) => setCreativeNote(event.target.value.slice(0, 220))}
                placeholder="Add notes for messaging, key offers, or campaign reminders."
                className="min-h-[132px] w-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#BFD3F8] focus:bg-[#FBFCFF]"
              />
            </MobileField>

            <p className="text-xs font-medium text-slate-500">
              Brand voice note: keep messaging useful, concise, and operationally clear.
            </p>
          </div>
        </MobileFormSection>

        <MobileFormSection title="Launch Summary" description="Quick review before you save or launch.">
          <div className="grid grid-cols-2 gap-4 border-y border-slate-200 bg-slate-50/70 px-4 py-4">
            <MobileSummaryMetric label="Ad Type" value={adType === 'search' ? 'Search Ads' : 'Discovery Ads'} />
            <MobileSummaryMetric label="Target" value={promotionTarget === 'products' ? 'Products' : 'Shop'} />
            <MobileSummaryMetric label="Budget" value={budgetMode === 'unlimited' ? 'No Limit' : `PHP ${budget || '0'}`} />
            <MobileSummaryMetric label="Schedule" value={scheduleMode === 'none' ? 'No Time Limit' : 'Custom schedule'} />
          </div>
        </MobileFormSection>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.85rem)] pt-3 backdrop-blur-sm md:hidden">
          <div className="flex gap-3">
            <button
              type="button"
              className="inline-flex h-12 flex-1 items-center justify-center border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
            >
              Save Draft
            </button>
            <button
              type="button"
              className="inline-flex h-12 flex-[1.2] items-center justify-center border border-[#2A4DBD] bg-[#2A4DBD] px-5 text-sm font-semibold text-white shadow-[0_16px_26px_-20px_rgba(42,77,189,0.78)]"
            >
              Launch Campaign
            </button>
          </div>
        </div>
      </div>

      <div className="hidden md:block">
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,rgba(247,250,255,0.96),rgba(255,255,255,0.98)_58%,rgba(245,248,255,0.9))] px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2A4DBD]">
              {config.eyebrow}
            </p>
            <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.03em] text-[#0C1732] sm:text-[36px]">
              {config.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
              {config.description}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-11 items-center justify-center border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to Unleash Ads
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center border border-[#2A4DBD] bg-[#2A4DBD] px-4 text-sm font-semibold text-white shadow-[0_16px_26px_-18px_rgba(42,77,189,0.78)] transition hover:bg-[#203f9c]"
            >
              Save Draft
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="overflow-hidden border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
            <p className="text-[22px] font-semibold tracking-[-0.03em] text-[#0C1732]">Basic Settings</p>
            <p className="mt-1 text-sm text-slate-500">
              Set up the campaign structure before you launch traffic into the Unleash marketplace.
            </p>
          </div>

          <div className="divide-y divide-slate-200">
            <div className="grid gap-3 px-4 py-5 sm:px-5 lg:grid-cols-[180px_minmax(0,1fr)]">
              <div>
                <p className="text-sm font-semibold text-[#0C1732]">Promotion Type</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {([
                  {
                    value: 'products',
                    title: 'Products',
                    description: 'Promote individual listings with focused search visibility.',
                  },
                  {
                    value: 'shop',
                    title: 'Shop',
                    description: 'Push the full Unleash storefront with a cleaner, quieter treatment.',
                  },
                ] as const).map((option) => {
                  const isActive = promotionTarget === option.value

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPromotionTarget(option.value)}
                      className={`flex min-h-[108px] items-start gap-4 border px-4 py-4 text-left transition ${
                        isActive
                          ? 'border-[#2A4DBD] bg-[#F8FAFF]'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`inline-flex h-11 w-11 flex-none items-center justify-center border ${
                          isActive
                            ? 'border-[#D6E3FB] bg-white text-[#2A4DBD]'
                            : 'border-slate-200 bg-slate-50 text-slate-500'
                        }`}
                        aria-hidden="true"
                      >
                        <SurfaceIcon target={option.value} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#0C1732]">{option.title}</span>
                        <span className="mt-1 block text-sm leading-6 text-slate-500">{option.description}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-3 px-4 py-5 sm:px-5 lg:grid-cols-[180px_minmax(0,1fr)]">
              <div>
                <p className="text-sm font-semibold text-[#0C1732]">Ad Name</p>
              </div>
              <div>
                <div className="relative">
                  <input
                    type="text"
                    value={adName}
                    onChange={(event) => setAdName(event.target.value.slice(0, 50))}
                    placeholder="Name this campaign"
                    className={`${inputClassName} pr-16`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    {adName.length}/50
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Keep the label internal and descriptive so your team can identify it quickly.
                </p>
              </div>
            </div>

            <div className="grid gap-3 px-4 py-5 sm:px-5 lg:grid-cols-[180px_minmax(0,1fr)]">
              <div>
                <p className="text-sm font-semibold text-[#0C1732]">Budget</p>
              </div>
              <div className="space-y-3">
                <ChoiceRow
                  label="No Limit"
                  description="Let the campaign spend according to delivery opportunities and available ads credit."
                  checked={budgetMode === 'unlimited'}
                  onChange={() => setBudgetMode('unlimited')}
                />
                <ChoiceRow
                  label="Set Budget"
                  description="Cap campaign spend with a fixed peso amount."
                  checked={budgetMode === 'set-budget'}
                  onChange={() => setBudgetMode('set-budget')}
                >
                  {budgetMode === 'set-budget' ? (
                    <div className="grid gap-3 md:grid-cols-[120px_minmax(0,1fr)]">
                      <div className="flex h-12 items-center justify-center border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600">
                        PHP
                      </div>
                      <input
                        type="number"
                        min="100"
                        step="50"
                        value={budget}
                        onChange={(event) => setBudget(event.target.value)}
                        className={inputClassName}
                      />
                    </div>
                  ) : null}
                </ChoiceRow>
              </div>
            </div>

            <div className="grid gap-3 px-4 py-5 sm:px-5 lg:grid-cols-[180px_minmax(0,1fr)]">
              <div>
                <p className="text-sm font-semibold text-[#0C1732]">Time Length</p>
              </div>
              <div className="space-y-3">
                <ChoiceRow
                  label="No Time Limit"
                  description="Keep the campaign active until you pause it manually."
                  checked={scheduleMode === 'none'}
                  onChange={() => setScheduleMode('none')}
                />
                <ChoiceRow
                  label="Set Start/End Date"
                  description="Schedule the launch window with a clear opening and closing time."
                  checked={scheduleMode === 'scheduled'}
                  onChange={() => setScheduleMode('scheduled')}
                >
                  {scheduleMode === 'scheduled' ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Start
                        </span>
                        <input
                          type="datetime-local"
                          value={startAt}
                          onChange={(event) => setStartAt(event.target.value)}
                          className={inputClassName}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          End
                        </span>
                        <input
                          type="datetime-local"
                          value={endAt}
                          onChange={(event) => setEndAt(event.target.value)}
                          className={inputClassName}
                        />
                      </label>
                    </div>
                  ) : null}
                </ChoiceRow>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[22px] font-semibold tracking-[-0.03em] text-[#0C1732]">Ad Creative</p>
                <p className="mt-1 text-sm text-slate-500">
                  Keep messaging tight and useful so the campaign feels native to the Unleash experience.
                </p>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2A4DBD]">
                Unleash Brand Voice
              </span>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="divide-y divide-slate-200">
              <div className="grid gap-3 px-4 py-5 sm:px-5 lg:grid-cols-[180px_minmax(0,1fr)]">
                <div>
                  <p className="text-sm font-semibold text-[#0C1732]">{config.creativeLabel}</p>
                </div>
                <div>
                  <input
                    type="text"
                    value={headline}
                    onChange={(event) => setHeadline(event.target.value.slice(0, 70))}
                    placeholder={config.creativePlaceholder}
                    className={inputClassName}
                  />
                  <p className="mt-2 text-sm text-slate-500">
                    Give buyers one clear reason to click without sounding like a banner ad.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 px-4 py-5 sm:px-5 lg:grid-cols-[180px_minmax(0,1fr)]">
                <div>
                  <p className="text-sm font-semibold text-[#0C1732]">Creative Notes</p>
                </div>
                <div>
                  <textarea
                    value={creativeNote}
                    onChange={(event) => setCreativeNote(event.target.value.slice(0, 220))}
                    placeholder="Add internal notes for the team, callouts for seasonal messaging, or the main offer buyers should see."
                    className="min-h-[132px] w-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#BFD3F8] focus:bg-[#FBFCFF]"
                  />
                </div>
              </div>
            </div>

            <aside className="border-t border-slate-200 bg-[linear-gradient(180deg,#fbfdff_0%,#f5f8fe_100%)] px-4 py-5 sm:px-5 lg:border-l lg:border-t-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2A4DBD]">
                Launch Summary
              </p>
              <div className="mt-4 space-y-4">
                <div className="border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ad Type</p>
                  <p className="mt-2 text-sm font-semibold text-[#0C1732]">
                    {adType === 'search' ? 'Search Ads' : 'Discovery Ads'}
                  </p>
                </div>
                <div className="border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Promotion Target</p>
                  <p className="mt-2 text-sm font-semibold text-[#0C1732]">
                    {promotionTarget === 'products' ? 'Products' : 'Shop'}
                  </p>
                </div>
                <div className="border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Budget Rule</p>
                  <p className="mt-2 text-sm font-semibold text-[#0C1732]">
                    {budgetMode === 'unlimited' ? 'No Limit' : `PHP ${budget || '0'}`}
                  </p>
                </div>
                <div className="border border-slate-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Schedule</p>
                  <p className="mt-2 text-sm font-semibold text-[#0C1732]">
                    {scheduleMode === 'none' ? 'No Time Limit' : 'Custom schedule set'}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm text-slate-500">
            Review naming, budget, and timing before you submit the campaign for delivery.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-11 items-center justify-center border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center border border-[#2A4DBD] bg-[#2A4DBD] px-5 text-sm font-semibold text-white shadow-[0_16px_26px_-18px_rgba(42,77,189,0.78)] transition hover:bg-[#203f9c]"
            >
              Launch Campaign
            </button>
          </div>
        </div>
      </div>
      </div>
    </section>
  )
}

export default CreateUnleashAdsPage
