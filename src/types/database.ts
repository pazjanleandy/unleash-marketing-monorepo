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
          description: string | null
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          min_spend: number | null
          max_discount: number | null
          usage_limit: number | null
          used_count: number | null
          start_at: string
          end_at: string
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          shop_id: string
          code: string
          description?: string | null
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          min_spend?: number | null
          max_discount?: number | null
          usage_limit?: number | null
          used_count?: number | null
          start_at: string
          end_at: string
          is_active?: boolean
        }
        Update: {
          code?: string
          description?: string | null
          discount_type?: 'percentage' | 'fixed'
          discount_value?: number
          min_spend?: number | null
          max_discount?: number | null
          usage_limit?: number | null
          start_at?: string
          end_at?: string
          is_active?: boolean
          updated_at?: string
        }
      }
    }
  }
}
