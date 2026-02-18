import type { ToolSection, ToolTone } from './types'

export const toolSections: ToolSection[] = [
  {
    title: 'Boost Sales',
    tools: [
      {
        id: 'discount',
        title: 'Discount',
        description: 'Set discounts on your products to boost sales.',
        icon: 'discount',
        tone: 'blue',
      },
      {
        id: 'flash-deals',
        title: "My Shop's Flash Deals",
        description:
          'Boost product sales by creating limited-time discount offers in your shop.',
        icon: 'flash-deals',
        tone: 'blue',
      },
      {
        id: 'vouchers',
        title: 'Vouchers',
        description:
          'Increase orders by offering buyers reduced prices at checkout with vouchers.',
        icon: 'voucher',
        tone: 'blue',
      },
    ],
  },
  {
    title: 'Increase Traffic',
    tools: [
      {
        title: 'Unleash Ads',
        description:
          'Increase exposure and drive sales in high traffic areas on Unleash with ads.',
        icon: 'ads',
        tone: 'amber',
      },
      {
        title: 'Affiliate Marketing Solution',
        description:
          "Leverage Unleash's affiliate partner network to boost your store promotion.",
        icon: 'affiliate',
        tone: 'amber',
      },
      {
        title: 'Live Streaming',
        description:
          'Connect live with your audience and answer shopper questions easily.',
        icon: 'live',
        tone: 'amber',
      },
    ],
  },
  {
    title: 'Improve Engagement',
    tools: [
      {
        title: 'Review Prize',
        description:
          'Attract customers to leave better reviews by rewarding coins.',
        icon: 'review-prize',
        tone: 'mint',
      },
      {
        title: 'Seller Coins',
        description:
          'Top up seller coins as a reward to encourage shoppers to join shop activities.',
        icon: 'seller-coins',
        tone: 'mint',
      },
      {
        title: 'Shop Prize',
        description:
          'Create your own Shop Prize to attract buyers to your shop and to win prizes.',
        icon: 'shop-prize',
        tone: 'mint',
      },
    ],
  },
]

export const toneClasses: Record<ToolTone, string> = {
  blue: 'bg-[#eaf2ff] text-[#2563EB] ring-[#c7dcff]',
  mint: 'bg-[#eaf2ff] text-[#2563EB] ring-[#c7dcff]',
  amber: 'bg-[#eaf2ff] text-[#2563EB] ring-[#c7dcff]',
}
