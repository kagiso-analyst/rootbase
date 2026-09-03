// Auto-generated database types from Supabase schema
// Generated: 2026-09-03

export type Database = {
  public: {
    Tables: {
      farms: {
        Row: {
          id: string
          name: string
          farm_type: string | null
          province: string | null
          total_hectares: number
          is_active: boolean
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          farm_type?: string | null
          province?: string | null
          total_hectares?: number
          is_active?: boolean
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          farm_type?: string | null
          province?: string | null
          total_hectares?: number
          is_active?: boolean
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          name: string
          category: string
          unit: string
          current_quantity: number
          reorder_level: number
          unit_cost: number
          storage_location: string | null
          expiry_date: string | null
          user_id: string
          farm_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          unit: string
          current_quantity?: number
          reorder_level?: number
          unit_cost?: number
          storage_location?: string | null
          expiry_date?: string | null
          user_id: string
          farm_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          unit?: string
          current_quantity?: number
          reorder_level?: number
          unit_cost?: number
          storage_location?: string | null
          expiry_date?: string | null
          user_id?: string
          farm_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stock_movements: {
        Row: {
          id: string
          inventory_item_id: string
          type: 'in' | 'out'
          quantity: number
          reason: string
          date: string
          user_id: string
          farm_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          inventory_item_id: string
          type: 'in' | 'out'
          quantity: number
          reason: string
          date?: string
          user_id: string
          farm_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          inventory_item_id?: string
          type?: 'in' | 'out'
          quantity?: number
          reason?: string
          date?: string
          user_id?: string
          farm_id?: string | null
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_email: string
          plan: string
          status: 'active' | 'inactive' | 'cancelled'
          payment_id: string | null
          created_at: string
          updated_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_email: string
          plan: string
          status?: 'active' | 'inactive' | 'cancelled'
          payment_id?: string | null
          created_at?: string
          updated_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_email?: string
          plan?: string
          status?: 'active' | 'inactive' | 'cancelled'
          payment_id?: string | null
          created_at?: string
          updated_at?: string
          expires_at?: string | null
        }
      }
      crops: {
        Row: {
          id: string
          crop_name: string
          variety: string | null
          field_name: string | null
          farm_id: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          crop_name: string
          variety?: string | null
          field_name?: string | null
          farm_id?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          crop_name?: string
          variety?: string | null
          field_name?: string | null
          farm_id?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
