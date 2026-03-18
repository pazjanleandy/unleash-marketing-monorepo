export type IconName =
  | 'voucher'
  | 'discount'
  | 'flash-deals'
  | 'bundle'
  | 'addon'
  | 'affiliate'
  | 'shipping'
  | 'review-prize'
  | 'seller-coins'
  | 'shop-prize'
  | 'game'
  | 'follow'
  | 'live'
  | 'ads'
  | 'top'

export type ToolTone = 'blue' | 'mint' | 'amber'
export type ToolPriority = 'primary' | 'secondary' | 'tertiary'

export type ToolCard = {
  id?: string
  title: string
  description: string
  icon: IconName
  tone: ToolTone
  status?: string
  priority?: ToolPriority
  badge?: string
  hasActiveCampaigns?: boolean
  isOptional?: boolean
}

export type ToolSection = {
  title: string
  description?: string
  tools: ToolCard[]
}
