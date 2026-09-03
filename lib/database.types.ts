export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      budgets: {
        Row: {
          amount: number
          category: string
          created_at: string
          farm_id: string
          id: string
          month: number
          notes: string | null
          period: string | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          farm_id: string
          id?: string
          month: number
          notes?: string | null
          period?: string | null
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          farm_id?: string
          id?: string
          month?: number
          notes?: string | null
          period?: string | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_activities: {
        Row: {
          activity_date: string
          activity_type: string
          cost: number
          created_at: string
          crop_id: string
          date: string | null
          description: string | null
          farm_id: string
          id: string
          notes: string | null
          product: string | null
          rate: number | null
          user_id: string
        }
        Insert: {
          activity_date?: string
          activity_type: string
          cost?: number
          created_at?: string
          crop_id: string
          date?: string | null
          description?: string | null
          farm_id: string
          id?: string
          notes?: string | null
          product?: string | null
          rate?: number | null
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          cost?: number
          created_at?: string
          crop_id?: string
          date?: string | null
          description?: string | null
          farm_id?: string
          id?: string
          notes?: string | null
          product?: string | null
          rate?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crop_activities_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crop_activities_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      crops: {
        Row: {
          actual_harvest_date: string | null
          actual_yield_kg: number | null
          area_planted: number | null
          area_planted_ha: number | null
          created_at: string
          crop_name: string
          expected_harvest_date: string | null
          expected_yield_kg: number | null
          farm_id: string | null
          field_id: string | null
          field_name: string | null
          id: string
          notes: string | null
          planting_date: string | null
          season: string | null
          seed_source: string | null
          status: string
          updated_at: string
          user_id: string
          variety: string | null
          yield_unit: string | null
        }
        Insert: {
          actual_harvest_date?: string | null
          actual_yield_kg?: number | null
          area_planted?: number | null
          area_planted_ha?: number | null
          created_at?: string
          crop_name: string
          expected_harvest_date?: string | null
          expected_yield_kg?: number | null
          farm_id?: string | null
          field_id?: string | null
          field_name?: string | null
          id?: string
          notes?: string | null
          planting_date?: string | null
          season?: string | null
          seed_source?: string | null
          status?: string
          updated_at?: string
          user_id: string
          variety?: string | null
          yield_unit?: string | null
        }
        Update: {
          actual_harvest_date?: string | null
          actual_yield_kg?: number | null
          area_planted?: number | null
          area_planted_ha?: number | null
          created_at?: string
          crop_name?: string
          expected_harvest_date?: string | null
          expected_yield_kg?: number | null
          farm_id?: string | null
          field_id?: string | null
          field_name?: string | null
          id?: string
          notes?: string | null
          planting_date?: string | null
          season?: string | null
          seed_source?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          variety?: string | null
          yield_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crops_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crops_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          created_at: string
          description: string | null
          expiry_date: string | null
          farm_id: string
          file_name: string | null
          file_url: string | null
          id: string
          name: string
          updated_at: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          farm_id: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          name: string
          updated_at?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          farm_id?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          name?: string
          updated_at?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          category: string
          created_at: string
          current_hours: number
          farm_id: string
          id: string
          insurance_expiry: string | null
          make: string | null
          model: string | null
          name: string
          next_service_date: string | null
          next_service_hours: number
          notes: string | null
          purchase_date: string | null
          purchase_price: number
          serial_number: string | null
          updated_at: string
          user_id: string
          year: number | null
        }
        Insert: {
          category: string
          created_at?: string
          current_hours?: number
          farm_id: string
          id?: string
          insurance_expiry?: string | null
          make?: string | null
          model?: string | null
          name: string
          next_service_date?: string | null
          next_service_hours?: number
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number
          serial_number?: string | null
          updated_at?: string
          user_id: string
          year?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          current_hours?: number
          farm_id?: string
          id?: string
          insurance_expiry?: string | null
          make?: string | null
          model?: string | null
          name?: string
          next_service_date?: string | null
          next_service_hours?: number
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number
          serial_number?: string | null
          updated_at?: string
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          crop_id: string | null
          currency: string
          date: string
          deleted_at: string | null
          description: string
          farm_id: string
          field_id: string | null
          id: string
          notes: string | null
          payment_method: string | null
          receipt_url: string | null
          reference_number: string | null
          supplier_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          crop_id?: string | null
          currency?: string
          date?: string
          deleted_at?: string | null
          description: string
          farm_id: string
          field_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          supplier_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          crop_id?: string | null
          currency?: string
          date?: string
          deleted_at?: string | null
          description?: string
          farm_id?: string
          field_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          supplier_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          created_at: string
          farm_type: string | null
          id: string
          is_active: boolean
          name: string
          province: string | null
          total_hectares: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          farm_type?: string | null
          id?: string
          is_active?: boolean
          name: string
          province?: string | null
          total_hectares?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          farm_type?: string | null
          id?: string
          is_active?: boolean
          name?: string
          province?: string | null
          total_hectares?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fields: {
        Row: {
          area_hectares: number | null
          created_at: string
          farm_id: string
          id: string
          irrigation_type: string | null
          name: string
          notes: string | null
          soil_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          area_hectares?: number | null
          created_at?: string
          farm_id: string
          id?: string
          irrigation_type?: string | null
          name: string
          notes?: string | null
          soil_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          area_hectares?: number | null
          created_at?: string
          farm_id?: string
          id?: string
          irrigation_type?: string | null
          name?: string
          notes?: string | null
          soil_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fields_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      harvests: {
        Row: {
          buyer_name: string | null
          created_at: string
          crop_id: string
          farm_id: string
          harvest_date: string
          id: string
          moisture_percent: number | null
          notes: string | null
          price_per_unit: number | null
          quality_grade: string | null
          quantity: number | null
          total_value: number | null
          unit: string | null
          user_id: string
        }
        Insert: {
          buyer_name?: string | null
          created_at?: string
          crop_id: string
          farm_id: string
          harvest_date: string
          id?: string
          moisture_percent?: number | null
          notes?: string | null
          price_per_unit?: number | null
          quality_grade?: string | null
          quantity?: number | null
          total_value?: number | null
          unit?: string | null
          user_id: string
        }
        Update: {
          buyer_name?: string | null
          created_at?: string
          crop_id?: string
          farm_id?: string
          harvest_date?: string
          id?: string
          moisture_percent?: number | null
          notes?: string | null
          price_per_unit?: number | null
          quality_grade?: string | null
          quantity?: number | null
          total_value?: number | null
          unit?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "harvests_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "harvests_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      health_events: {
        Row: {
          animal_id: string | null
          animal_tag: string | null
          cost: number
          created_at: string
          date: string | null
          description: string | null
          event_date: string
          event_type: string
          farm_id: string
          id: string
          livestock_id: string
          product: string | null
          user_id: string
          veterinarian: string | null
        }
        Insert: {
          animal_id?: string | null
          animal_tag?: string | null
          cost?: number
          created_at?: string
          date?: string | null
          description?: string | null
          event_date?: string
          event_type: string
          farm_id: string
          id?: string
          livestock_id: string
          product?: string | null
          user_id: string
          veterinarian?: string | null
        }
        Update: {
          animal_id?: string | null
          animal_tag?: string | null
          cost?: number
          created_at?: string
          date?: string | null
          description?: string | null
          event_date?: string
          event_type?: string
          farm_id?: string
          id?: string
          livestock_id?: string
          product?: string | null
          user_id?: string
          veterinarian?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_events_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_events_livestock_id_fkey"
            columns: ["livestock_id"]
            isOneToOne: false
            referencedRelation: "livestock"
            referencedColumns: ["id"]
          },
        ]
      }
      income: {
        Row: {
          amount: number
          buyer_name: string | null
          category: string
          created_at: string
          currency: string
          date: string
          deleted_at: string | null
          description: string
          farm_id: string
          harvest_id: string | null
          id: string
          invoice_number: string | null
          invoice_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          buyer_name?: string | null
          category: string
          created_at?: string
          currency?: string
          date?: string
          deleted_at?: string | null
          description: string
          farm_id: string
          harvest_id?: string | null
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          buyer_name?: string | null
          category?: string
          created_at?: string
          currency?: string
          date?: string
          deleted_at?: string | null
          description?: string
          farm_id?: string
          harvest_id?: string | null
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_harvest_id_fkey"
            columns: ["harvest_id"]
            isOneToOne: false
            referencedRelation: "harvests"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string
          created_at: string
          current_quantity: number
          expiry_date: string | null
          farm_id: string
          id: string
          name: string
          reorder_level: number
          storage_location: string | null
          unit: string
          unit_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          current_quantity?: number
          expiry_date?: string | null
          farm_id: string
          id?: string
          name: string
          reorder_level?: number
          storage_location?: string | null
          unit: string
          unit_cost?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          current_quantity?: number
          expiry_date?: string | null
          farm_id?: string
          id?: string
          name?: string
          reorder_level?: number
          storage_location?: string | null
          unit?: string
          unit_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          farm_id: string
          id: string
          invited_by: string
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          farm_id: string
          id?: string
          invited_by: string
          role?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          farm_id?: string
          id?: string
          invited_by?: string
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          crop_id: string | null
          crop_name: string | null
          entry_date: string
          entry_type: string | null
          farm_id: string
          field_id: string | null
          field_name: string | null
          id: string
          photos: Json
          tags: string[]
          temperature: number | null
          title: string | null
          updated_at: string
          user_id: string
          weather_conditions: string | null
        }
        Insert: {
          content: string
          created_at?: string
          crop_id?: string | null
          crop_name?: string | null
          entry_date?: string
          entry_type?: string | null
          farm_id: string
          field_id?: string | null
          field_name?: string | null
          id?: string
          photos?: Json
          tags?: string[]
          temperature?: number | null
          title?: string | null
          updated_at?: string
          user_id: string
          weather_conditions?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          crop_id?: string | null
          crop_name?: string | null
          entry_date?: string
          entry_type?: string | null
          farm_id?: string
          field_id?: string | null
          field_name?: string | null
          id?: string
          photos?: Json
          tags?: string[]
          temperature?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string
          weather_conditions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      livestock: {
        Row: {
          breed: string | null
          created_at: string
          current_weight: number | null
          current_weight_kg: number | null
          date_of_birth: string | null
          farm_id: string
          id: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          sex: string | null
          species: string
          status: string
          tag_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          breed?: string | null
          created_at?: string
          current_weight?: number | null
          current_weight_kg?: number | null
          date_of_birth?: string | null
          farm_id: string
          id?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          sex?: string | null
          species: string
          status?: string
          tag_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          breed?: string | null
          created_at?: string
          current_weight?: number | null
          current_weight_kg?: number | null
          date_of_birth?: string | null
          farm_id?: string
          id?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          sex?: string | null
          species?: string
          status?: string
          tag_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "livestock_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_logs: {
        Row: {
          cost: number
          created_at: string
          date: string
          description: string | null
          equipment_id: string
          equipment_name: string | null
          farm_id: string | null
          hours_at_service: number
          id: string
          service_type: string | null
          user_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          date?: string
          description?: string | null
          equipment_id: string
          equipment_name?: string | null
          farm_id?: string | null
          hours_at_service?: number
          id?: string
          service_type?: string | null
          user_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          date?: string
          description?: string | null
          equipment_id?: string
          equipment_name?: string | null
          farm_id?: string | null
          hours_at_service?: number
          id?: string
          service_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_logs_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_farm_id: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          phone: string | null
          plan: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_farm_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          plan?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_farm_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          phone?: string | null
          plan?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_farm_fk"
            columns: ["active_farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_transactions: {
        Row: {
          amount: number
          buyer_name: string | null
          category: string
          created_at: string
          description: string
          end_date: string | null
          farm_id: string
          frequency: string
          id: string
          is_active: boolean
          next_date: string
          notes: string | null
          start_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          buyer_name?: string | null
          category: string
          created_at?: string
          description: string
          end_date?: string | null
          farm_id: string
          frequency: string
          id?: string
          is_active?: boolean
          next_date: string
          notes?: string | null
          start_date: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          buyer_name?: string | null
          category?: string
          created_at?: string
          description?: string
          end_date?: string | null
          farm_id?: string
          frequency?: string
          id?: string
          is_active?: boolean
          next_date?: string
          notes?: string | null
          start_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          date: string
          farm_id: string
          id: string
          inventory_item_id: string
          quantity: number
          reason: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          farm_id: string
          id?: string
          inventory_item_id: string
          quantity: number
          reason: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          farm_id?: string
          id?: string
          inventory_item_id?: string
          quantity?: number
          reason?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          payment_id: string | null
          plan: string
          status: string
          updated_at: string
          user_email: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          plan: string
          status?: string
          updated_at?: string
          user_email: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          plan?: string
          status?: string
          updated_at?: string
          user_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          category: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          farm_id: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          category?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          farm_id: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          category?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          farm_id?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          created_at: string
          id: string
          is_internal: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_internal?: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_internal?: boolean
          message?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string
          description: string
          farm_id: string
          id: string
          is_priority: boolean
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          farm_id: string
          id?: string
          is_priority?: boolean
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          farm_id?: string
          id?: string
          is_priority?: boolean
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          category: string | null
          completed_at: string | null
          created_at: string
          crop_id: string | null
          description: string | null
          due_date: string | null
          equipment_id: string | null
          farm_id: string
          field_id: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignee_id?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          crop_id?: string | null
          description?: string | null
          due_date?: string | null
          equipment_id?: string | null
          farm_id: string
          field_id?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignee_id?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          crop_id?: string | null
          description?: string | null
          due_date?: string | null
          equipment_id?: string | null
          farm_id?: string
          field_id?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          email: string
          farm_id: string
          id: string
          invited_by: string | null
          role: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          farm_id: string
          id?: string
          invited_by?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          farm_id?: string
          id?: string
          invited_by?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_alerts: {
        Row: {
          created_at: string
          date: string
          description: string
          farm_id: string
          id: string
          is_read: boolean
          severity: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          description: string
          farm_id: string
          id?: string
          is_read?: boolean
          severity?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          farm_id?: string
          id?: string
          is_read?: boolean
          severity?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weather_alerts_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_inventory_with_movement: {
        Args: {
          p_farm_id: string
          p_item_id: string
          p_quantity: number
          p_reason: string
          p_type: string
          p_user_id: string
        }
        Returns: Json
      }
      user_has_farm_access: {
        Args: { target_farm_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

