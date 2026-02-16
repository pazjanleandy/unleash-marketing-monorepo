export type IconName =
  | 'voucher'
  | 'discount'
  | 'bundle'
  | 'addon'
  | 'shipping'
  | 'game'
  | 'follow'
  | 'live'
  | 'ads'
  | 'top'

export type ToolTone = 'blue' | 'mint' | 'amber'

export type ToolCard = {
  id?: string
  title: string
  description: string
  icon: IconName
  tone: ToolTone
}

export type ToolSection = {
  title: string
  tools: ToolCard[]
}
