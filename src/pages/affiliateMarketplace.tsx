import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DesktopBreadcrumbBar from '../components/navigation/DesktopBreadcrumbBar'
import Sidebar from '../sidebar/sidebar'
import type { MarketCentreView } from './marketCentre'

type AudienceGender = 'Male' | 'Female' | 'Mixed'
type PricingModel = 'Pay per post' | 'Negotiable' | 'Fixed package'
type PriceBand = 'All' | 'Under PHP 4k' | 'PHP 4k - 6k' | 'PHP 6k+'
type EngagementBand = 'All' | '2%+' | '4%+' | '6%+'
type SortOption = 'recommended' | 'engagement' | 'followers' | 'price-low' | 'price-high'
type ViewMode = 'comfortable' | 'compact'

interface CreatorProfile {
  id: string
  name: string
  handle: string
  avatar: string
  verified: boolean
  recommended: boolean
  category: string
  summary: string
  audienceAge: string
  audienceGender: AudienceGender
  followerBand: string
  followers: number
  engagementRate: number
  avgViews: number
  platforms: string[]
  pricingModel: PricingModel
  startingPrice: number
  responseRate: number
  completedCollaborations: number
  performanceScore: number
  tags: string[]
}

interface MarketplaceFiltersState {
  keyword: string
  category: string
  audienceAge: string
  audienceGender: 'All' | AudienceGender
  followerSize: string
  priceBand: PriceBand
  engagementBand: EngagementBand
  platform: string
  recommendedOnly: boolean
}

const creators: CreatorProfile[] = [
  {
    id: 'savannah-tech',
    name: 'Savannah Lim',
    handle: '@savannahw123',
    avatar:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=240&q=80',
    verified: true,
    recommended: true,
    category: 'Technology & Electronics',
    summary: 'Short-form tech reviews and conversion-focused unboxings for ecommerce launches.',
    audienceAge: '20-35',
    audienceGender: 'Male',
    followerBand: '200k - 1M',
    followers: 335000,
    engagementRate: 6.4,
    avgViews: 92000,
    platforms: ['TikTok', 'Instagram'],
    pricingModel: 'Pay per post',
    startingPrice: 3500,
    responseRate: 97,
    completedCollaborations: 58,
    performanceScore: 92,
    tags: ['Video reviews', 'TikTok Shop', 'Launch campaigns'],
  },
  {
    id: 'alina-style',
    name: 'Alina Cruz',
    handle: '@alinacurates',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=240&q=80',
    verified: true,
    recommended: true,
    category: 'Lifestyle',
    summary: 'Lifestyle creator with reliable affiliate conversion for fashion and beauty bundles.',
    audienceAge: '20-35',
    audienceGender: 'Female',
    followerBand: '50k - 200k',
    followers: 120000,
    engagementRate: 5.8,
    avgViews: 41000,
    platforms: ['Instagram', 'TikTok'],
    pricingModel: 'Fixed package',
    startingPrice: 3200,
    responseRate: 93,
    completedCollaborations: 41,
    performanceScore: 88,
    tags: ['High engagement', 'Story content', 'Fashion'],
  },
  {
    id: 'nina-home',
    name: 'Nina Hart',
    handle: '@homebynina',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
    verified: true,
    recommended: true,
    category: 'Home & Living',
    summary: 'Trusted home creator for decor, seasonal campaigns, and premium household products.',
    audienceAge: '28-45',
    audienceGender: 'Female',
    followerBand: '1M+',
    followers: 1200000,
    engagementRate: 4.7,
    avgViews: 210000,
    platforms: ['Instagram', 'YouTube'],
    pricingModel: 'Negotiable',
    startingPrice: 8000,
    responseRate: 95,
    completedCollaborations: 96,
    performanceScore: 94,
    tags: ['Seasonal', 'DIY', 'Premium households'],
  },
  {
    id: 'marco-gaming',
    name: 'Marco Valez',
    handle: '@marcoplayslive',
    avatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80',
    verified: true,
    recommended: false,
    category: 'Gaming',
    summary: 'Gaming creator with strong live-session momentum and product callout retention.',
    audienceAge: '16-26',
    audienceGender: 'Male',
    followerBand: '200k - 1M',
    followers: 340000,
    engagementRate: 5.3,
    avgViews: 76000,
    platforms: ['TikTok', 'YouTube'],
    pricingModel: 'Fixed package',
    startingPrice: 4200,
    responseRate: 91,
    completedCollaborations: 34,
    performanceScore: 86,
    tags: ['Streaming', 'Live commerce', 'Gaming gear'],
  },
  {
    id: 'maya-beauty',
    name: 'Maya Torres',
    handle: '@mayaedit',
    avatar:
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=240&q=80',
    verified: true,
    recommended: true,
    category: 'Beauty',
    summary: 'Beauty and skincare creator with polished branded content and high profile saves.',
    audienceAge: '25-40',
    audienceGender: 'Female',
    followerBand: '200k - 1M',
    followers: 210000,
    engagementRate: 6.1,
    avgViews: 68000,
    platforms: ['Instagram', 'TikTok'],
    pricingModel: 'Pay per post',
    startingPrice: 5000,
    responseRate: 96,
    completedCollaborations: 62,
    performanceScore: 91,
    tags: ['Beauty launches', 'Premium edits', 'UGC ready'],
  },
]

const initialFilters: MarketplaceFiltersState = {
  keyword: '',
  category: 'All',
  audienceAge: 'All',
  audienceGender: 'All',
  followerSize: 'All',
  priceBand: 'All',
  engagementBand: 'All',
  platform: 'All',
  recommendedOnly: false,
}

const categories = ['All', ...new Set(creators.map((creator) => creator.category))]
const audienceAges = ['All', '16-24', '20-35', '25-40', '28-45']
const audienceGenders: Array<MarketplaceFiltersState['audienceGender']> = ['All', 'Male', 'Female', 'Mixed']
const followerSizes = ['All', '50k - 200k', '200k - 1M', '1M+']
const priceBands: PriceBand[] = ['All', 'Under PHP 4k', 'PHP 4k - 6k', 'PHP 6k+']
const engagementBands: EngagementBand[] = ['All', '2%+', '4%+', '6%+']
const platforms = ['All', ...new Set(creators.flatMap((creator) => creator.platforms))]

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function formatPrice(value: number) {
  return `PHP ${value.toLocaleString('en-US')}`
}

function matchesPriceBand(price: number, priceBand: PriceBand) {
  if (priceBand === 'Under PHP 4k') return price < 4000
  if (priceBand === 'PHP 4k - 6k') return price >= 4000 && price <= 6000
  if (priceBand === 'PHP 6k+') return price > 6000
  return true
}

function matchesEngagementBand(engagementRate: number, engagementBand: EngagementBand) {
  if (engagementBand === '2%+') return engagementRate >= 2
  if (engagementBand === '4%+') return engagementRate >= 4
  if (engagementBand === '6%+') return engagementRate >= 6
  return true
}

function getIsMobileViewport() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(max-width: 767px)').matches
}

function HeaderBadge({
  children,
  tone = 'neutral',
}: {
  children: string
  tone?: 'neutral' | 'accent'
}) {
  return (
    <span
      className={`rounded-md px-2 py-1 text-[11px] font-semibold leading-none ${
        tone === 'accent' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {children}
    </span>
  )
}

function SoftTag({
  children,
}: {
  children: string
}) {
  return (
    <span className="rounded-md bg-slate-100/80 px-2.5 py-1 text-[11px] font-medium text-slate-600">
      {children}
    </span>
  )
}

function MarketplaceFilters({
  filters,
  onChange,
  onApply,
  onReset,
}: {
  filters: MarketplaceFiltersState
  onChange: (next: Partial<MarketplaceFiltersState>) => void
  onApply: () => void
  onReset: () => void
}) {
  const selectClassName =
    'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50'

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-[0_24px_60px_-46px_rgba(15,23,42,0.38)] sm:px-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Marketplace filters</p>
            <p className="mt-1 text-sm text-slate-500">
              Narrow discovery by niche, audience fit, engagement, price, and platform.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ recommendedOnly: !filters.recommendedOnly })}
            className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
              filters.recommendedOnly
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800'
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${filters.recommendedOnly ? 'bg-blue-600' : 'bg-slate-300'}`} />
            Recommended only
          </button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.3fr)_auto]">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Search creators
            </span>
            <input
              type="text"
              value={filters.keyword}
              onChange={(event) => onChange({ keyword: event.target.value })}
              placeholder="Search by creator name or handle"
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            />
          </label>
          <div className="flex items-end gap-3">
            <button
              type="button"
              onClick={onApply}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-[#1e40af] px-5 text-sm font-semibold text-white shadow-[0_18px_34px_-18px_rgba(37,99,235,0.6)] transition hover:bg-[#193a9c]"
            >
              Search marketplace
            </button>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Category</span>
            <select value={filters.category} onChange={(event) => onChange({ category: event.target.value })} className={selectClassName}>
              {categories.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Audience age</span>
            <select value={filters.audienceAge} onChange={(event) => onChange({ audienceAge: event.target.value })} className={selectClassName}>
              {audienceAges.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Audience gender</span>
            <select value={filters.audienceGender} onChange={(event) => onChange({ audienceGender: event.target.value as MarketplaceFiltersState['audienceGender'] })} className={selectClassName}>
              {audienceGenders.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Follower size</span>
            <select value={filters.followerSize} onChange={(event) => onChange({ followerSize: event.target.value })} className={selectClassName}>
              {followerSizes.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Price range</span>
            <select value={filters.priceBand} onChange={(event) => onChange({ priceBand: event.target.value as PriceBand })} className={selectClassName}>
              {priceBands.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Engagement</span>
            <select value={filters.engagementBand} onChange={(event) => onChange({ engagementBand: event.target.value as EngagementBand })} className={selectClassName}>
              {engagementBands.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Platform</span>
            <select value={filters.platform} onChange={(event) => onChange({ platform: event.target.value })} className={selectClassName}>
              {platforms.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        </div>
      </div>
    </section>
  )
}

function ActiveFilterChip({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
    >
      <span>{label}</span>
      <span className="text-slate-400">x</span>
    </button>
  )
}

function MarketplaceToolbar({
  resultCount,
  activeFilters,
  onRemoveFilter,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
}: {
  resultCount: number
  activeFilters: string[]
  onRemoveFilter: (label: string) => void
  sortBy: SortOption
  onSortChange: (value: SortOption) => void
  viewMode: ViewMode
  onViewModeChange: (value: ViewMode) => void
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.28)] xl:flex-row xl:items-center xl:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-base font-semibold text-slate-900">
            {resultCount} creator{resultCount === 1 ? '' : 's'} available
          </p>
          {activeFilters.length === 0 ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
              Browsing all creators
            </span>
          ) : null}
        </div>
        {activeFilters.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <ActiveFilterChip key={filter} label={filter} onRemove={() => onRemoveFilter(filter)} />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            Use filters to refine by audience fit, pricing, or platform performance.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <span>Sort by</span>
          <select
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value as SortOption)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          >
            <option value="recommended">Recommended</option>
            <option value="engagement">Engagement rate</option>
            <option value="followers">Follower count</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
        </label>

        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => onViewModeChange('comfortable')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              viewMode === 'comfortable'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Comfortable
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('compact')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              viewMode === 'compact'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Compact
          </button>
        </div>
      </div>
    </section>
  )
}

function TrustMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  )
}

function CardStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function MobileQuickFilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
        active ? 'bg-[#1e40af] text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200'
      }`}
    >
      {label}
    </button>
  )
}

function MobileMarketplaceHeader() {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 shadow-[0_14px_36px_-28px_rgba(15,23,42,0.25)]">
      <p className="text-lg font-semibold tracking-tight text-slate-950">Affiliate Marketplace</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        Discover creators that match your audience and campaign goals.
      </p>
    </section>
  )
}

function MobileSearchBar({
  value,
  onChange,
  onSubmit,
  onOpenFilters,
  activeFilterCount,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onOpenFilters: () => void
  activeFilterCount: number
}) {
  return (
    <div className="sticky top-0 z-20 -mx-4 bg-[#f8faff] px-4 pb-3 pt-1">
      <div className="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-3 py-3 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.22)]">
        <label className="flex min-w-0 flex-1 items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-slate-400">
            <path
              d="M11 4C14.3137 4 17 6.68629 17 10C17 13.3137 14.3137 16 11 16C7.68629 16 5 13.3137 5 10C5 6.68629 7.68629 4 11 4Z"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path d="M20 20L16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                onSubmit()
              }
            }}
            placeholder="Search creators"
            className="min-w-0 flex-1 border-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>
        <button
          type="button"
          onClick={onOpenFilters}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Filters
          {activeFilterCount > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1e40af] px-1 text-[11px] text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>
    </div>
  )
}

function MobileCreatorCard({
  creator,
}: {
  creator: CreatorProfile
}) {
  const topTags = creator.tags.slice(0, 2)
  const hiddenTagCount = Math.max(creator.tags.length - topTags.length, 0)

  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.28)]">
      <div className="flex items-start gap-3">
        <img
          src={creator.avatar}
          alt={creator.name}
          className="h-16 w-16 rounded-[18px] object-cover shadow-[0_10px_24px_-18px_rgba(15,23,42,0.4)]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight text-slate-950">{creator.name}</h3>
            {creator.verified ? <HeaderBadge tone="accent">Verified</HeaderBadge> : null}
            {creator.recommended ? <HeaderBadge>Recommended</HeaderBadge> : null}
          </div>
          <p className="mt-1 truncate text-sm text-slate-500">{creator.handle}</p>
          <p className="mt-2 text-sm font-medium text-slate-600">{creator.category}</p>
        </div>
      </div>

      <p
        className="mt-4 text-sm leading-6 text-slate-600"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {creator.summary}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <CardStat label="Followers" value={formatCompactNumber(creator.followers)} />
        <CardStat label="Engagement" value={formatPercent(creator.engagementRate)} />
        <CardStat label="Price" value={formatPrice(creator.startingPrice)} />
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {creator.audienceGender} • {creator.audienceAge} • {creator.followerBand} reach
      </p>
      <p className="mt-2 text-[13px] text-slate-500">{creator.platforms.join(' • ')}</p>

      {topTags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {topTags.map((tag) => (
            <SoftTag key={tag}>{tag}</SoftTag>
          ))}
          {hiddenTagCount > 0 ? <SoftTag>{`+${hiddenTagCount}`}</SoftTag> : null}
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#1e40af] px-4 text-sm font-semibold text-white"
        >
          Collaborate
        </button>
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center rounded-xl px-3 text-sm font-semibold text-slate-600"
        >
          View profile
        </button>
      </div>
    </article>
  )
}

function MobileFilterDrawer({
  open,
  filters,
  onChange,
  onClose,
  onApply,
  onReset,
}: {
  open: boolean
  filters: MarketplaceFiltersState
  onChange: (next: Partial<MarketplaceFiltersState>) => void
  onClose: () => void
  onApply: () => void
  onReset: () => void
}) {
  const selectClassName =
    'h-11 w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50'

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/45 transition-opacity md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 overflow-hidden rounded-t-[32px] border-t border-slate-200 bg-[#f8faff] shadow-[0_-24px_60px_-26px_rgba(15,23,42,0.42)] transition-transform duration-300 md:hidden ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-hidden={!open}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300" />

        <div className="border-b border-slate-200 bg-white px-4 pb-4 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-slate-950">Refine creators</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Adjust audience fit, budget, and performance before applying filters.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {filters.recommendedOnly ? (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Recommended only
              </span>
            ) : null}
            {filters.category !== 'All' ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {filters.category}
              </span>
            ) : null}
            {filters.priceBand !== 'All' ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {filters.priceBand}
              </span>
            ) : null}
            {filters.engagementBand !== 'All' ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {filters.engagementBand} engagement
              </span>
            ) : null}
          </div>
        </div>

        <div className="max-h-[68vh] overflow-y-auto px-4 pb-28 pt-4">
          <div className="grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Category</span>
              <select
                value={filters.category}
                onChange={(event) => onChange({ category: event.target.value })}
                className={selectClassName}
              >
                {categories.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Audience age</span>
                <select
                  value={filters.audienceAge}
                  onChange={(event) => onChange({ audienceAge: event.target.value })}
                  className={selectClassName}
                >
                  {audienceAges.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Gender</span>
                <select
                  value={filters.audienceGender}
                  onChange={(event) =>
                    onChange({
                      audienceGender: event.target.value as MarketplaceFiltersState['audienceGender'],
                    })
                  }
                  className={selectClassName}
                >
                  {audienceGenders.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Follower size</span>
                <select
                  value={filters.followerSize}
                  onChange={(event) => onChange({ followerSize: event.target.value })}
                  className={selectClassName}
                >
                  {followerSizes.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Price range</span>
                <select
                  value={filters.priceBand}
                  onChange={(event) => onChange({ priceBand: event.target.value as PriceBand })}
                  className={selectClassName}
                >
                  {priceBands.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Engagement</span>
              <select
                value={filters.engagementBand}
                onChange={(event) => onChange({ engagementBand: event.target.value as EngagementBand })}
                className={selectClassName}
              >
                {engagementBands.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div>
                <p className="text-sm font-medium text-slate-900">Recommended creators only</p>
                <p className="mt-1 text-xs text-slate-500">Prioritize strong-fit profiles for campaigns.</p>
              </div>
              <button
                type="button"
                aria-pressed={filters.recommendedOnly}
                onClick={() => onChange({ recommendedOnly: !filters.recommendedOnly })}
                className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
                  filters.recommendedOnly ? 'bg-[#1e40af]' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                    filters.recommendedOnly ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </label>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 border-t border-slate-200 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onApply}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-[#1e40af] text-sm font-semibold text-white shadow-[0_18px_28px_-18px_rgba(37,99,235,0.7)] transition hover:bg-[#193a9c]"
            >
              Apply filters
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
function CreatorCard({
  creator,
}: {
  creator: CreatorProfile
}) {
  const highlightedTags = creator.tags.slice(0, 2)
  const hiddenTagCount = Math.max(creator.tags.length - highlightedTags.length, 0)
  const audienceSummary = `${creator.audienceGender} • ${creator.audienceAge} • ${creator.followerBand} reach`
  const platformSummary = creator.platforms.join(' • ')

  return (
    <article className="group flex h-full flex-col rounded-[22px] border border-slate-200/90 bg-white px-5 py-5 shadow-[0_22px_48px_-40px_rgba(15,23,42,0.28)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_58px_-38px_rgba(15,23,42,0.32)]">
      <div className="flex h-full flex-col">
        <div className="min-h-[106px]">
          <div className="flex items-start gap-4">
            <img
              src={creator.avatar}
              alt={creator.name}
              className="h-16 w-16 rounded-[18px] object-cover shadow-[0_12px_26px_-18px_rgba(15,23,42,0.35)]"
            />
            <div className="min-w-0 flex-1 pt-4">
              <div className="min-h-[54px]">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="min-w-0 break-words text-lg font-semibold tracking-tight text-slate-950">
                    {creator.name}
                  </h3>
                  {creator.verified ? <HeaderBadge tone="accent">Verified</HeaderBadge> : null}
                  {creator.recommended ? <HeaderBadge>Recommended</HeaderBadge> : null}
                </div>
              </div>
              <p className="mt-1 break-all text-sm text-slate-500">{creator.handle}</p>
            </div>
          </div>
        </div>

        <div className="min-h-[34px]">
          <p className="text-sm font-medium text-slate-500">{creator.category}</p>
        </div>

        <div className="min-h-[60px]">
          <p
            className="text-sm leading-6 text-slate-600"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {creator.summary}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
          <CardStat label="Followers" value={formatCompactNumber(creator.followers)} />
          <CardStat label="Engagement" value={formatPercent(creator.engagementRate)} />
          <CardStat label="Avg views" value={formatCompactNumber(creator.avgViews)} />
        </div>

        <div className="mt-5 min-h-[20px]">
          <p className="text-sm text-slate-500">{audienceSummary}</p>
        </div>

        <dl className="mt-5 grid min-h-[42px] grid-cols-3 gap-4">
          <TrustMetric label="Response" value={`${creator.responseRate}%`} />
          <TrustMetric label="Deals" value={`${creator.completedCollaborations}`} />
          <TrustMetric label="Score" value={`${creator.performanceScore}/100`} />
        </dl>

        <div className="mt-5 min-h-[44px]">
          <p className="text-[13px] text-slate-500">{platformSummary}</p>
          {highlightedTags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {highlightedTags.map((tag) => (
                <SoftTag key={tag}>{tag}</SoftTag>
              ))}
              {hiddenTagCount > 0 ? <SoftTag>{`+${hiddenTagCount} more`}</SoftTag> : null}
            </div>
          ) : null}
        </div>

        <div className="mt-auto border-t border-slate-200 pt-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-xl font-semibold tracking-tight text-slate-950">
                {formatPrice(creator.startingPrice)}
              </p>
              <p className="mt-1 text-sm text-slate-500">{creator.pricingModel}</p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 sm:min-w-[118px]"
              >
                View profile
              </button>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-[#1e40af] px-4 text-sm font-semibold text-white shadow-[0_14px_24px_-16px_rgba(37,99,235,0.55)] transition hover:bg-[#193a9c] sm:min-w-[118px]"
              >
                Collaborate
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

function EmptyState() {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-[0_20px_50px_-40px_rgba(15,23,42,0.35)]">
      <h3 className="text-xl font-semibold text-slate-900">No creators match these filters</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
        Try widening your audience, pricing, or platform filters to discover more creator
        options for this campaign.
      </p>
    </div>
  )
}

function AffiliateMarketplacePage() {
  const navigate = useNavigate()
  const [draftFilters, setDraftFilters] = useState<MarketplaceFiltersState>(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState<MarketplaceFiltersState>(initialFilters)
  const [sortBy, setSortBy] = useState<SortOption>('recommended')
  const [viewMode, setViewMode] = useState<ViewMode>('comfortable')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(getIsMobileViewport)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const wasSidebarOpenRef = useRef(false)

  const filteredCreators = useMemo(() => {
    const nextCreators = creators.filter((creator) => {
      const keyword = appliedFilters.keyword.trim().toLowerCase()

      if (keyword.length > 0 && !`${creator.name} ${creator.handle}`.toLowerCase().includes(keyword)) {
        return false
      }
      if (appliedFilters.category !== 'All' && creator.category !== appliedFilters.category) return false
      if (appliedFilters.audienceAge !== 'All' && creator.audienceAge !== appliedFilters.audienceAge) return false
      if (appliedFilters.audienceGender !== 'All' && creator.audienceGender !== appliedFilters.audienceGender) return false
      if (appliedFilters.followerSize !== 'All' && creator.followerBand !== appliedFilters.followerSize) return false
      if (!matchesPriceBand(creator.startingPrice, appliedFilters.priceBand)) return false
      if (!matchesEngagementBand(creator.engagementRate, appliedFilters.engagementBand)) return false
      if (appliedFilters.platform !== 'All' && !creator.platforms.includes(appliedFilters.platform)) return false
      if (appliedFilters.recommendedOnly && !creator.recommended) return false

      return true
    })

    const sortedCreators = [...nextCreators]

    if (sortBy === 'engagement') sortedCreators.sort((left, right) => right.engagementRate - left.engagementRate)
    else if (sortBy === 'followers') sortedCreators.sort((left, right) => right.followers - left.followers)
    else if (sortBy === 'price-low') sortedCreators.sort((left, right) => left.startingPrice - right.startingPrice)
    else if (sortBy === 'price-high') sortedCreators.sort((left, right) => right.startingPrice - left.startingPrice)
    else {
      sortedCreators.sort((left, right) => {
        if (left.recommended !== right.recommended) return left.recommended ? -1 : 1
        return right.performanceScore - left.performanceScore
      })
    }

    return sortedCreators
  }, [appliedFilters, sortBy])

  const activeFilters = useMemo(() => {
    const filters: string[] = []

    if (appliedFilters.keyword) filters.push(`Search: ${appliedFilters.keyword}`)
    if (appliedFilters.category !== 'All') filters.push(appliedFilters.category)
    if (appliedFilters.audienceAge !== 'All') filters.push(`Age ${appliedFilters.audienceAge}`)
    if (appliedFilters.audienceGender !== 'All') filters.push(appliedFilters.audienceGender)
    if (appliedFilters.followerSize !== 'All') filters.push(appliedFilters.followerSize)
    if (appliedFilters.priceBand !== 'All') filters.push(appliedFilters.priceBand)
    if (appliedFilters.engagementBand !== 'All') filters.push(`Engagement ${appliedFilters.engagementBand}`)
    if (appliedFilters.platform !== 'All') filters.push(appliedFilters.platform)
    if (appliedFilters.recommendedOnly) filters.push('Recommended only')

    return filters
  }, [appliedFilters])

  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters)
  }

  const handleResetFilters = () => {
    setDraftFilters(initialFilters)
    setAppliedFilters(initialFilters)
  }

  const handleRemoveFilter = (label: string) => {
    let nextFilters = appliedFilters

    if (label.startsWith('Search: ')) nextFilters = { ...appliedFilters, keyword: '' }
    else if (label.startsWith('Age ')) nextFilters = { ...appliedFilters, audienceAge: 'All' }
    else if (label.startsWith('Engagement ')) nextFilters = { ...appliedFilters, engagementBand: 'All' }
    else if (label === 'Recommended only') nextFilters = { ...appliedFilters, recommendedOnly: false }
    else if (audienceGenders.includes(label as MarketplaceFiltersState['audienceGender'])) nextFilters = { ...appliedFilters, audienceGender: 'All' }
    else if (followerSizes.includes(label)) nextFilters = { ...appliedFilters, followerSize: 'All' }
    else if (priceBands.includes(label as PriceBand)) nextFilters = { ...appliedFilters, priceBand: 'All' }
    else if (platforms.includes(label)) nextFilters = { ...appliedFilters, platform: 'All' }
    else if (categories.includes(label)) nextFilters = { ...appliedFilters, category: 'All' }

    setAppliedFilters(nextFilters)
    setDraftFilters(nextFilters)
  }

  const applyQuickFilter = (key: 'recommended' | 'home' | 'beauty' | 'tech' | 'budget' | 'engagement') => {
    let nextFilters = initialFilters

    if (key === 'recommended') {
      nextFilters = { ...initialFilters, recommendedOnly: true }
    } else if (key === 'home') {
      nextFilters = { ...initialFilters, category: 'Home & Living' }
    } else if (key === 'beauty') {
      nextFilters = { ...initialFilters, category: 'Beauty' }
    } else if (key === 'tech') {
      nextFilters = { ...initialFilters, category: 'Technology & Electronics' }
    } else if (key === 'budget') {
      nextFilters = { ...initialFilters, priceBand: 'Under PHP 4k' }
    } else if (key === 'engagement') {
      nextFilters = { ...initialFilters, engagementBand: '6%+' }
    }

    const isAlreadyActive =
      JSON.stringify(appliedFilters) === JSON.stringify(nextFilters)

    const resolvedFilters = isAlreadyActive ? initialFilters : nextFilters
    setDraftFilters(resolvedFilters)
    setAppliedFilters(resolvedFilters)
  }

  const handleSidebarSelectView = (view: MarketCentreView) => {
    setIsSidebarOpen(false)

    if (
      view === 'marketing' ||
      view === 'discount' ||
      view === 'flash-deals' ||
      view === 'vouchers' ||
      view === 'create-voucher' ||
      view === 'create-flash-deal' ||
      view === 'create-discount-promotion' ||
      view === 'create-bundle-deal' ||
      view === 'create-add-on-deal' ||
      view === 'view-discount-promotion' ||
      view === 'view-bundle-deal' ||
      view === 'view-add-on-deal'
    ) {
      navigate('/marketing-centre')
      return
    }

    navigate('/market-centre')
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileViewport(event.matches)

      if (!event.matches) {
        setIsSidebarOpen(false)
        setIsFilterDrawerOpen(false)
      }
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  useEffect(() => {
    if (!isMobileViewport || !isSidebarOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isMobileViewport, isSidebarOpen])

  useEffect(() => {
    if (!isMobileViewport || (!isSidebarOpen && !isFilterDrawerOpen)) {
      return
    }

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [isFilterDrawerOpen, isMobileViewport, isSidebarOpen])

  useEffect(() => {
    if (!isMobileViewport) {
      wasSidebarOpenRef.current = isSidebarOpen
      return
    }

    if (wasSidebarOpenRef.current && !isSidebarOpen) {
      mobileMenuButtonRef.current?.focus()
    }

    wasSidebarOpenRef.current = isSidebarOpen
  }, [isMobileViewport, isSidebarOpen])

  const topNavButtonClass = (active: boolean) =>
    `relative inline-flex h-full shrink-0 items-center gap-2 px-4 text-[13px] font-medium transition ${
      active
        ? 'bg-white text-[#2A4DBD] after:absolute after:bottom-0 after:left-4 after:right-4 after:h-[2px] after:rounded-full after:bg-[#2A4DBD]'
        : 'text-[#747C8B] hover:bg-[#f7f9fc] hover:text-[#0C1732]'
    }`

  return (
    <div className="h-screen w-full overflow-hidden bg-[linear-gradient(180deg,#f8faff_0%,#f3f6fc_38%,#eef2f8_100%)] text-slate-900">
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden ${
          isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden={!isSidebarOpen}
      />

      <aside
        id="mobile-sidebar"
        className={`fixed left-0 top-0 z-50 h-screen w-[82vw] max-w-[320px] bg-white shadow-xl transition-transform duration-300 ease-out md:hidden ${
          isSidebarOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'
        }`}
        aria-hidden={!isSidebarOpen}
      >
        <Sidebar
          activeView="marketing"
          onSelectView={handleSidebarSelectView}
          collapsed={false}
          mobileMode
          mobileOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />
      </aside>

      <div className="h-screen overflow-y-auto">
        <header className="bg-white px-4 pb-2 pt-2 sm:px-6 md:px-0 md:pt-0 md:pb-3 lg:px-0">
          <div className="hidden h-[66px] w-full items-stretch border-y border-[#C9CFDD] bg-white md:grid md:grid-cols-[1fr_auto_1fr]">
          <div className="flex min-w-0 items-center gap-3 bg-white px-4">
            <img src="/Asset/unleash_logo.png" alt="Unleash logo" className="h-8 w-8 object-contain" />
            <p className="text-[13px] font-semibold leading-[1.08] text-[#0C1732]">
              <span className="block">Inventory Management</span>
              <span className="block">System</span>
            </p>
          </div>

          <nav aria-label="Desktop navigation" className="flex items-stretch justify-center gap-1">
            <button type="button" onClick={() => navigate('/market-centre')} className={topNavButtonClass(false)}>
              <svg width="15" height="15" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3 3H9V9H3V3ZM11 3H17V9H11V3ZM3 11H9V17H3V11ZM11 11H17V17H11V11Z"
                  fill="#9FB0D4"
                />
              </svg>
              <span>Dashboard</span>
            </button>

            <button type="button" onClick={() => navigate('/market-centre')} className={topNavButtonClass(false)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M7 17C5.343 17 4 18.343 4 20C4 21.657 5.343 23 7 23C8.657 23 10 21.657 10 20C10 18.343 8.657 17 7 17ZM17 17C15.343 17 14 18.343 14 20C14 21.657 15.343 23 17 23C18.657 23 20 21.657 20 20C20 18.343 18.657 17 17 17Z"
                  fill="#9FB0D4"
                />
                <path
                  d="M6 6H22L20 14H8L6 6Z"
                  stroke="#9FB0D4"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 6L4 2H1"
                  stroke="#9FB0D4"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              <span>Order Management</span>
            </button>

            <button type="button" onClick={() => navigate('/market-centre')} className={topNavButtonClass(false)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 20H20V4H4V20Z" stroke="#9FB0D4" strokeWidth="1.8" />
                <path d="M8 4V20M16 4V20M4 8H20M4 16H20" stroke="#9FB0D4" strokeWidth="1.2" />
              </svg>
              <span>Product Management</span>
            </button>

            <button type="button" onClick={() => navigate('/marketing-centre')} className={topNavButtonClass(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 10L12 5L20 10V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V10Z"
                  stroke="#2A4DBD"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path d="M9 13H15M9 16H14" stroke="#2A4DBD" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span>Marketing Centre</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#9FB0D4]"
              >
                <path
                  d="M4 7L10 13L16 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </nav>

          <div className="flex items-stretch justify-end gap-1 px-3">
            <button
              type="button"
              aria-label="Search"
              className="inline-flex h-full w-11 items-center justify-center rounded-md bg-white text-slate-600 transition hover:bg-slate-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M11 4C14.3137 4 17 6.68629 17 10C17 13.3137 14.3137 16 11 16C7.68629 16 5 13.3137 5 10C5 6.68629 7.68629 4 11 4Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path d="M20 20L16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>

            <button
              type="button"
              aria-label="Notifications"
              className="inline-flex h-full w-11 items-center justify-center rounded-md bg-white text-slate-600 transition hover:bg-slate-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6 10C6 6.68629 8.68629 4 12 4C15.3137 4 18 6.68629 18 10V13.5L20 16V17H4V16L6 13.5V10Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 19C10.4 20.2 11.2 21 12 21C12.8 21 13.6 20.2 14 19"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <button
              type="button"
              aria-label="Settings"
              className="inline-flex h-full w-11 items-center justify-center rounded-md bg-white text-slate-600 transition hover:bg-slate-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M19.4 15C19.535 15.302 19.605 15.629 19.605 15.96C19.605 16.291 19.535 16.618 19.4 16.92L19.34 17.06L20.11 17.83C20.89 18.61 20.89 19.87 20.11 20.65C19.33 21.43 18.07 21.43 17.29 20.65L16.52 19.88L16.38 19.94C16.078 20.075 15.751 20.145 15.42 20.145C15.089 20.145 14.762 20.075 14.46 19.94L14.32 19.88V20.97C14.32 22.09 13.41 23 12.29 23H11.71C10.59 23 9.68 22.09 9.68 20.97V19.88L9.54 19.94C9.238 20.075 8.911 20.145 8.58 20.145C8.249 20.145 7.922 20.075 7.62 19.94L7.48 19.88L6.71 20.65C5.93 21.43 4.67 21.43 3.89 20.65C3.11 19.87 3.11 18.61 3.89 17.83L4.66 17.06L4.6 16.92C4.465 16.618 4.395 16.291 4.395 15.96C4.395 15.629 4.465 15.302 4.6 15L4.66 14.86H3.57C2.45 14.86 1.54 13.95 1.54 12.83V11.25C1.54 10.13 2.45 9.22 3.57 9.22H4.66L4.6 9.08C4.465 8.778 4.395 8.451 4.395 8.12C4.395 7.789 4.465 7.462 4.6 7.16L4.66 7.02L3.89 6.25C3.11 5.47 3.11 4.21 3.89 3.43C4.67 2.65 5.93 2.65 6.71 3.43L7.48 4.2L7.62 4.14C7.922 4.005 8.249 3.935 8.58 3.935C8.911 3.935 9.238 4.005 9.54 4.14L9.68 4.2V3.11C9.68 1.99 10.59 1.08 11.71 1.08H12.29C13.41 1.08 14.32 1.99 14.32 3.11V4.2L14.46 4.14C14.762 4.005 15.089 3.935 15.42 3.935C15.751 3.935 16.078 4.005 16.38 4.14L16.52 4.2L17.29 3.43C18.07 2.65 19.33 2.65 20.11 3.43C20.89 4.21 20.89 5.47 20.11 6.25L19.34 7.02L19.4 7.16C19.535 7.462 19.605 7.789 19.605 8.12C19.605 8.451 19.535 8.778 19.4 9.08L19.34 9.22H20.43C21.55 9.22 22.46 10.13 22.46 11.25V12.83C22.46 13.95 21.55 14.86 20.43 14.86H19.34L19.4 15Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12.04" r="3.1" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>

            <button
              type="button"
              aria-label="User profile"
              className="inline-flex h-full w-11 items-center justify-center rounded-md bg-white text-slate-600 transition hover:bg-slate-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                  fill="currentColor"
                />
                <path
                  d="M4 22C4 18.6863 7.58172 16 12 16C16.4183 16 20 18.6863 20 22"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>

          <div className="mx-auto mt-1 w-full max-w-[1600px] px-2 md:hidden">
            <div className="flex h-12 items-center justify-between gap-3">
            <button
              ref={mobileMenuButtonRef}
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={isSidebarOpen}
              aria-controls="mobile-sidebar"
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700"
            >
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1H17M1 7H17M1 13H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            <img src="/unleash_banner.png" alt="Unleash" className="h-6 w-auto" />

            <button
              type="button"
              aria-label="Profile"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                  fill="currentColor"
                />
                <path
                  d="M4 22C4 18.6863 7.58172 16 12 16C16.4183 16 20 18.6863 20 22"
                  fill="currentColor"
                />
              </svg>
            </button>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1600px] px-4 pb-12 pt-5 sm:px-6 lg:px-8">
          <main className="min-w-0">
            <div className="hidden space-y-6 md:block">
              <DesktopBreadcrumbBar
                items={[
                  { label: 'Inventory Management System', onClick: () => navigate('/market-centre') },
                  { label: 'Marketing Centre', onClick: () => navigate('/marketing-centre') },
                  { label: 'Affiliate Marketing Solution' },
                ]}
                actionLabel="Back to Marketing Centre"
                onAction={() => navigate('/marketing-centre')}
              />
              <MarketplaceFilters
                filters={draftFilters}
                onChange={(next) => setDraftFilters((current) => ({ ...current, ...next }))}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
              />
              <MarketplaceToolbar
                resultCount={filteredCreators.length}
                activeFilters={activeFilters}
                onRemoveFilter={handleRemoveFilter}
                sortBy={sortBy}
                onSortChange={setSortBy}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />

              {filteredCreators.length === 0 ? (
                <EmptyState />
              ) : (
                <section className={`grid gap-5 ${viewMode === 'comfortable' ? 'xl:grid-cols-3' : 'lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'}`}>
                  {filteredCreators.map((creator) => (
                    <CreatorCard key={creator.id} creator={creator} />
                  ))}
                </section>
              )}
            </div>

            <div className="mx-auto max-w-[520px] space-y-4 md:hidden">
              <MobileMarketplaceHeader />
              <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex gap-2 pb-1">
                  <MobileQuickFilterChip
                    label="Recommended"
                    active={appliedFilters.recommendedOnly}
                    onClick={() => applyQuickFilter('recommended')}
                  />
                  <MobileQuickFilterChip
                    label="Home & Living"
                    active={appliedFilters.category === 'Home & Living'}
                    onClick={() => applyQuickFilter('home')}
                  />
                  <MobileQuickFilterChip
                    label="Beauty"
                    active={appliedFilters.category === 'Beauty'}
                    onClick={() => applyQuickFilter('beauty')}
                  />
                  <MobileQuickFilterChip
                    label="Tech"
                    active={appliedFilters.category === 'Technology & Electronics'}
                    onClick={() => applyQuickFilter('tech')}
                  />
                  <MobileQuickFilterChip
                    label="Low budget"
                    active={appliedFilters.priceBand === 'Under PHP 4k'}
                    onClick={() => applyQuickFilter('budget')}
                  />
                  <MobileQuickFilterChip
                    label="High engagement"
                    active={appliedFilters.engagementBand === '6%+'}
                    onClick={() => applyQuickFilter('engagement')}
                  />
                </div>
              </div>

              <MobileSearchBar
                value={draftFilters.keyword}
                onChange={(value) => setDraftFilters((current) => ({ ...current, keyword: value }))}
                onSubmit={handleApplyFilters}
                onOpenFilters={() => setIsFilterDrawerOpen(true)}
                activeFilterCount={activeFilters.length}
              />

              <div className="flex items-center justify-between px-1">
                <p className="text-sm font-semibold text-slate-900">
                  {filteredCreators.length} creator{filteredCreators.length === 1 ? '' : 's'}
                </p>
                <p className="text-xs text-slate-500">Updated for quick discovery</p>
              </div>

              <section className="space-y-3">
                {filteredCreators.length === 0 ? (
                  <EmptyState />
                ) : (
                  filteredCreators.map((creator) => (
                    <MobileCreatorCard key={`mobile-${creator.id}`} creator={creator} />
                  ))
                )}
              </section>
            </div>
          </main>
        </div>

        <MobileFilterDrawer
          open={isFilterDrawerOpen}
          filters={draftFilters}
          onChange={(next) => setDraftFilters((current) => ({ ...current, ...next }))}
          onClose={() => setIsFilterDrawerOpen(false)}
          onApply={() => {
            handleApplyFilters()
            setIsFilterDrawerOpen(false)
          }}
          onReset={() => {
            handleResetFilters()
            setIsFilterDrawerOpen(false)
          }}
        />
      </div>
    </div>
  )
}

export default AffiliateMarketplacePage
