export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {
      shops: {
        Row: {
          id: string
          owner_id: string | null
          name: string
          slug: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
      }
      vouchers: {
        Row: {
          id: string
          shop_id: string
          code: string
          name: string | null
          voucher_type: string | null
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          discount_amount: number | null
          min_spend: number | null
          max_discount: number | null
          usage_limit: number | null
          usage_quantity: number | null
          usage_per_user: number | null
          used_count: number | null
          total_used: number | null
          start_at: string
          end_at: string
          claim_start_at: string | null
          claim_end_at: string | null
          is_active: boolean | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          shop_id: string
          code: string
          name?: string | null
          voucher_type?: string | null
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          discount_amount?: number | null
          min_spend?: number | null
          max_discount?: number | null
          usage_limit?: number | null
          usage_quantity?: number | null
          usage_per_user?: number | null
          used_count?: number | null
          total_used?: number | null
          start_at: string
          end_at: string
          claim_start_at?: string | null
          claim_end_at?: string | null
          is_active?: boolean
          metadata?: Json | null
        }
        Update: {
          code?: string
          name?: string | null
          voucher_type?: string | null
          discount_type?: 'percentage' | 'fixed'
          discount_value?: number
          discount_amount?: number | null
          min_spend?: number | null
          max_discount?: number | null
          usage_limit?: number | null
          usage_quantity?: number | null
          usage_per_user?: number | null
          used_count?: number | null
          total_used?: number | null
          start_at?: string
          end_at?: string
          claim_start_at?: string | null
          claim_end_at?: string | null
          is_active?: boolean
          metadata?: Json | null
          updated_at?: string
        }
      }
      voucher_usages: {
        Row: {
          id: string
          voucher_id: string
          user_id: string
          order_id: string | null
          used_at: string | null
        }
        Insert: {
          voucher_id: string
          user_id: string
          order_id?: string | null
          used_at?: string | null
        }
        Update: {
          order_id?: string | null
          used_at?: string | null
        }
      }
      voucher_products: {
        Row: {
          id: string
          voucher_id: string
          product_id: string
        }
        Insert: {
          voucher_id: string
          product_id: string
        }
        Update: {
          product_id?: string
        }
      }
      discount_promotions: {
        Row: {
          id: string
          shop_id: string
          name: string
          start_at: string
          end_at: string
          max_uses: number | null
          used_count: number
          is_active: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          shop_id: string
          name: string
          start_at: string
          end_at: string
          max_uses?: number | null
          used_count?: number
          is_active?: boolean
        }
        Update: {
          name?: string
          start_at?: string
          end_at?: string
          max_uses?: number | null
          used_count?: number
          is_active?: boolean
          updated_at?: string
        }
      }
      product_discounts: {
        Row: {
          id: string
          promotion_id: string
          product_id: string
          shop_id: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          start_at: string
          end_at: string
          max_uses: number | null
          used_count: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          promotion_id: string
          product_id: string
          shop_id: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          start_at: string
          end_at: string
          max_uses?: number | null
          used_count?: number | null
          is_active?: boolean
        }
        Update: {
          discount_type?: 'percentage' | 'fixed'
          discount_value?: number
          start_at?: string
          end_at?: string
          max_uses?: number | null
          used_count?: number | null
          is_active?: boolean
          updated_at?: string
        }
      }
      bundle_deals: {
        Row: {
          id: string
          shop_id: string
          name: string
          discount_type: 'percentage' | 'fixed' | 'bundle_price'
          discount_value: number
          start_at: string
          end_at: string
          max_uses: number | null
          used_count: number
          is_active: boolean
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          shop_id: string
          name: string
          discount_type: 'percentage' | 'fixed' | 'bundle_price'
          discount_value: number
          start_at: string
          end_at: string
          max_uses?: number | null
          used_count?: number
          is_active?: boolean
          metadata?: Json | null
        }
        Update: {
          name?: string
          discount_type?: 'percentage' | 'fixed' | 'bundle_price'
          discount_value?: number
          start_at?: string
          end_at?: string
          max_uses?: number | null
          used_count?: number
          is_active?: boolean
          metadata?: Json | null
          updated_at?: string
        }
      }
      bundle_deal_items: {
        Row: {
          id: string
          bundle_deal_id: string
          product_id: string
          required_quantity: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          bundle_deal_id: string
          product_id: string
          required_quantity?: number
        }
        Update: {
          required_quantity?: number
          updated_at?: string
        }
      }
      addon_deals: {
        Row: {
          id: string
          shop_id: string
          name: string
          trigger_product_id: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          start_at: string
          end_at: string
          max_uses: number | null
          used_count: number
          is_active: boolean
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          shop_id: string
          name: string
          trigger_product_id: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          start_at: string
          end_at: string
          max_uses?: number | null
          used_count?: number
          is_active?: boolean
          metadata?: Json | null
        }
        Update: {
          name?: string
          trigger_product_id?: string
          discount_type?: 'percentage' | 'fixed'
          discount_value?: number
          start_at?: string
          end_at?: string
          max_uses?: number | null
          used_count?: number
          is_active?: boolean
          metadata?: Json | null
          updated_at?: string
        }
      }
      addon_deal_items: {
        Row: {
          id: string
          addon_deal_id: string
          product_id: string
          required_quantity: number
          max_addon_quantity: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          addon_deal_id: string
          product_id: string
          required_quantity?: number
          max_addon_quantity?: number | null
        }
        Update: {
          required_quantity?: number
          max_addon_quantity?: number | null
          updated_at?: string
        }
      }
    }
  }
}
