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
        badge: 'Primary',
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
        badge: 'Primary',
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
        badge: 'Primary',
        hasActiveCampaigns: true,
      },
    ],
  },
  {
    title: 'Growth Tools',
    description: 'Acquire traffic and increase visibility.',
    tools: [
      {
        title: 'Unleash Ads',
        description: 'Promote products in high-traffic spots.',
        icon: 'ads',
        tone: 'amber',
        status: 'No active campaigns',
        priority: 'secondary',
        hasActiveCampaigns: false,
      },
      {
        title: 'Affiliate Marketing Solution',
        description: "Extend reach via affiliate partners.",
        icon: 'affiliate',
        tone: 'amber',
        status: 'Ready to launch',
        priority: 'secondary',
        hasActiveCampaigns: false,
      },
      {
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
  blue: { // Primary
    icon: 'bg-blue-50 text-blue-700 ring-[#bfd3f8] shadow-none',
    badge: 'border-[#bfd3f8] bg-blue-50 text-blue-800',
    status: 'border-blue-100 bg-blue-50/50 text-blue-700',
    sectionMarker: 'bg-blue-100 text-blue-800',
    sectionLine: 'bg-[#bfd3f8]',
    hoverTint: 'hover:bg-blue-50/30',
    action: 'text-blue-700 group-hover:text-blue-800',
    focusRing: 'focus-visible:ring-blue-600',
  },
  amber: { // Secondary (Orange)
    icon: 'bg-orange-50 text-orange-600 ring-orange-200 shadow-none',
    badge: 'border-orange-200 bg-orange-50 text-orange-700',
    status: 'border-orange-100 bg-orange-50/50 text-orange-600',
    sectionMarker: 'bg-orange-100 text-orange-700',
    sectionLine: 'bg-orange-200',
    hoverTint: 'hover:bg-orange-50/30',
    action: 'text-orange-600 group-hover:text-orange-700',
    focusRing: 'focus-visible:ring-orange-500',
  },
  mint: { // Tertiary (Slate)
    icon: 'bg-slate-50 text-slate-600 ring-slate-200 shadow-none',
    badge: 'border-slate-200 bg-slate-50 text-slate-700',
    status: 'border-slate-100 bg-slate-50/50 text-slate-600',
    sectionMarker: 'bg-slate-100 text-slate-700',
    sectionLine: 'bg-slate-200',
    hoverTint: 'hover:bg-slate-50/30',
    action: 'text-slate-600 group-hover:text-slate-700',
    focusRing: 'focus-visible:ring-slate-500',
  },
}
