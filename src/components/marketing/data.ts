import type { ToolSection, ToolTone } from './types'

export const toolSections: ToolSection[] = [
  {
    title: 'Boost Sales with Promotion',
    tools: [
      {
        id: 'vouchers',
        title: 'Vouchers',
        description:
          'Increase orders by offering buyers reduced prices at checkout with vouchers.',
        icon: 'voucher',
        tone: 'blue',
      },
      {
        title: 'Discount Promotions',
        description:
          'Set discounts on your products to boost sales and speed up conversion.',
        icon: 'discount',
        tone: 'blue',
      },
      {
        title: 'Bundle Deal',
        description:
          'Increase average spending per order by offering product bundle discounts.',
        icon: 'bundle',
        tone: 'blue',
      },
      {
        title: 'Add-on Deal',
        description:
          'Sell more products by offering add-ons or free gifts with minimum spend.',
        icon: 'addon',
        tone: 'blue',
      },
      {
        title: 'Shipping Fee Promotion',
        description:
          'Set shipping fee discounts to attract shoppers and reduce drop-off at checkout.',
        icon: 'shipping',
        tone: 'blue',
      },
    ],
  },
  {
    title: 'Engage with Your Shoppers',
    tools: [
      {
        title: 'Shop Game',
        description:
          'Create your own games to attract buyers to your shop and reward participation.',
        icon: 'game',
        tone: 'mint',
      },
      {
        title: 'Follow Prize',
        description:
          'Encourage shoppers to follow your shop by rewarding new followers.',
        icon: 'follow',
        tone: 'mint',
      },
      {
        title: 'Live Streaming',
        description:
          'Connect live with your audience and answer shopper questions in real time.',
        icon: 'live',
        tone: 'mint',
      },
    ],
  },
  {
    title: 'Increase Your Shop Traffic',
    tools: [
      {
        title: 'Unleash Ads',
        description:
          'Increase exposure and drive sales in high-traffic areas with promoted listings.',
        icon: 'ads',
        tone: 'amber',
      },
      {
        title: 'Top Picks',
        description:
          'Drive traffic to selected products by featuring them on key product pages.',
        icon: 'top',
        tone: 'amber',
      },
    ],
  },
]

export const toneClasses: Record<ToolTone, string> = {
  blue: 'bg-[#e9f0ff] text-[#2f70db] ring-[#d2e2ff]',
  mint: 'bg-[#e5f8f1] text-[#1f9a76] ring-[#c6eddc]',
  amber: 'bg-[#fff4de] text-[#c7850c] ring-[#f7e6b9]',
}
