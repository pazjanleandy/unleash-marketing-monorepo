import type { ToolSection, ToolTone } from './types'

export const toolSections: ToolSection[] = [
  {
    title: 'Promotion Tools',
    description: 'Launch conversion campaigns fast.',
    tools: [
      {
        id: 'discount',
        title: 'Discount',
        description: 'Raise conversion with price drops.',
        icon: 'discount',
        tone: 'blue',
        status: '2 active',
        priority: 'primary',
        hasActiveCampaigns: true,
      },
      {
        id: 'flash-deals',
        title: "My Shop's Flash Deals",
        description: 'Create urgency with short-window promos.',
        icon: 'flash-deals',
        tone: 'blue',
        status: 'Ends soon',
        priority: 'primary',
        hasActiveCampaigns: true,
      },
      {
        id: 'vouchers',
        title: 'Vouchers',
        description: 'Checkout savings with shareable codes.',
        icon: 'voucher',
        tone: 'blue',
        status: '1 active',
        priority: 'primary',
        hasActiveCampaigns: true,
      },
    ],
  },
  {
    title: 'Growth Tools',
    description: 'Acquire traffic and increase visibility.',
    tools: [
      {
        id: 'ads',
        title: 'Unleash Ads',
        description: 'Promote products in high-traffic spots.',
        icon: 'ads',
        tone: 'amber',
        status: 'No active campaigns',
        priority: 'secondary',
        hasActiveCampaigns: false,
      },
      {
        id: 'affiliate',
        title: 'Affiliate Marketing Solution',
        description: 'Extend reach via affiliate partners.',
        icon: 'affiliate',
        tone: 'amber',
        status: 'Ready to launch',
        priority: 'secondary',
        hasActiveCampaigns: false,
      },
      {
        id: 'live-streaming',
        title: 'Live Streaming',
        description: 'Host live sessions and convert fast.',
        icon: 'live',
        tone: 'amber',
        status: 'Schedule session',
        priority: 'secondary',
        hasActiveCampaigns: false,
      },
    ],
  },
  {
    title: 'Engagement Tools',
    description: 'Retain and re-engage existing buyers.',
    tools: [
      {
        title: 'Review Prize',
        description: 'Reward reviews to boost quality.',
        icon: 'review-prize',
        tone: 'mint',
        status: 'Low usage',
        priority: 'tertiary',
        hasActiveCampaigns: false,
        isOptional: true,
      },
      {
        title: 'Seller Coins',
        description: 'Coins incentives to drive actions.',
        icon: 'seller-coins',
        tone: 'mint',
        status: 'Optional setup',
        priority: 'tertiary',
        hasActiveCampaigns: false,
        isOptional: true,
      },
      {
        title: 'Shop Prize',
        description: 'Prizes that build loyalty.',
        icon: 'shop-prize',
        tone: 'mint',
        status: 'No active campaigns',
        priority: 'tertiary',
        hasActiveCampaigns: false,
        isOptional: true,
      },
    ],
  },
]

export const toneClasses: Record<
  ToolTone,
  {
    icon: string
    badge: string
    status: string
    sectionMarker: string
    sectionLine: string
    hoverTint: string
    action: string
    focusRing: string
  }
> = {
  blue: {
    icon: 'bg-slate-100 text-[#335ab8] ring-[#dde7fb] shadow-none',
    badge: 'border-[#dbe6fb] bg-[#f5f8ff] text-[#4765ad]',
    status: 'border-[#e2e9f7] bg-[#f7f9fd] text-[#4765ad]',
    sectionMarker: 'bg-blue-100 text-blue-800',
    sectionLine: 'bg-[#bfd3f8]',
    hoverTint:
      'hover:border-[#cadbf4] hover:bg-[#fafcff] hover:shadow-[0_14px_26px_-24px_rgba(51,90,184,0.22)]',
    action: 'text-slate-600 group-hover:text-slate-800',
    focusRing: 'focus-visible:ring-blue-600',
  },
  amber: {
    icon: 'bg-[#fff5ea] text-[#c77422] ring-[#f8dfc5] shadow-none',
    badge: 'border-[#f4deca] bg-[#fff8f1] text-[#b86a1f]',
    status: 'border-[#f6e4d2] bg-[#fffaf4] text-[#b86a1f]',
    sectionMarker: 'bg-orange-100 text-orange-700',
    sectionLine: 'bg-orange-200',
    hoverTint:
      'hover:border-[#e7d6c3] hover:bg-[#fffdfa] hover:shadow-[0_14px_26px_-24px_rgba(199,116,34,0.18)]',
    action: 'text-slate-600 group-hover:text-slate-800',
    focusRing: 'focus-visible:ring-orange-500',
  },
  mint: {
    icon: 'bg-slate-100 text-slate-600 ring-slate-200 shadow-none',
    badge: 'border-slate-200 bg-slate-50 text-slate-600',
    status: 'border-slate-200 bg-slate-50 text-slate-500',
    sectionMarker: 'bg-slate-100 text-slate-700',
    sectionLine: 'bg-slate-200',
    hoverTint:
      'hover:border-slate-200 hover:bg-slate-50/90 hover:shadow-[0_14px_26px_-24px_rgba(15,23,42,0.16)]',
    action: 'text-slate-600 group-hover:text-slate-800',
    focusRing: 'focus-visible:ring-slate-500',
  },
}
