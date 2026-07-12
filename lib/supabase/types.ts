// lib/supabase/types.ts

export type Farm = {
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

export type Subscription = {
  id: string
  user_email: string
  plan: string
  status: 'active' | 'inactive' | 'cancelled'
  payment_id: string | null
  created_at: string
  updated_at: string
  expires_at: string | null
}

export type Crop = {
  id: string
  crop_name: string
  variety: string | null
  field_name: string | null
  season: string | null
  planting_date: string
  expected_harvest_date: string
  area_planted_ha: number
  status: 'planned' | 'active' | 'harvested' | 'failed'
  notes: string | null
  user_id: string
  farm_id: string
  created_at: string
}

export type Expense = {
  id: string
  category: string
  description: string
  amount: number
  date: string
  user_id: string
  farm_id: string
  created_at: string
}

export type Income = {
  id: string
  category: string
  description: string
  amount: number
  date: string
  buyer_name: string | null
  user_id: string
  farm_id: string
  created_at: string
}

export type Task = {
  id: string
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'done'
  due_date: string | null
  category: string | null
  user_id: string
  farm_id: string
  created_at: string
}

export type Livestock = {
  id: string
  tag_number: string | null
  species: string
  breed: string | null
  sex: string | null
  date_of_birth: string | null
  purchase_date: string | null
  purchase_price: number
  current_weight_kg: number
  status: 'active' | 'sold' | 'deceased' | 'culled'
  notes: string | null
  user_id: string
  farm_id: string
  created_at: string
}

export type Equipment = {
  id: string
  name: string
  category: string
  make: string | null
  model: string | null
  year: string | null
  serial_number: string | null
  purchase_date: string | null
  purchase_price: number
  current_hours: number
  next_service_date: string | null
  next_service_hours: number
  insurance_expiry: string | null
  notes: string | null
  user_id: string
  farm_id: string
  created_at: string
}

export type InventoryItem = {
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
  farm_id: string
  created_at: string
}

export type JournalEntry = {
  id: string
  title: string | null
  content: string
  entry_type: string
  field_name: string | null
  crop_name: string | null
  weather_conditions: string | null
  tags: string[]
  entry_date: string
  user_id: string
  farm_id: string
  created_at: string
}

export type Document = {
  id: string
  name: string
  category: string
  description: string | null
  file_url: string | null
  file_name: string | null
  uploaded_at: string
  expiry_date: string | null
  user_id: string
  farm_id: string
  created_at: string
}

export type Supplier = {
  id: string
  name: string
  category: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  user_id: string
  farm_id: string
  created_at: string
}

export type HealthEvent = {
  id: string
  animal_id: string
  animal_tag: string | null
  event_type: string
  description: string
  product: string | null
  date: string
  user_id: string
  farm_id: string
  created_at: string
}

export type MaintenanceLog = {
  id: string
  equipment_id: string
  equipment_name: string
  service_type: string
  description: string
  cost: number
  date: string
  hours_at_service: number
  user_id: string
  farm_id: string
  created_at: string
}

export type CostSnapshot = {
  id: string
  week_start: string
  infra_total: number
  production_total: number
  weekly_total: number
  monthly_estimate: number
  annual_estimate: number
  user_id: string
  farm_id: string
  created_at: string
}

// ===== UTILITY TYPES =====
export type TableName = 
  | 'farms'
  | 'subscriptions'
  | 'crops'
  | 'expenses'
  | 'income'
  | 'tasks'
  | 'livestock'
  | 'equipment'
  | 'inventory_items'
  | 'journal_entries'
  | 'documents'
  | 'suppliers'
  | 'health_events'
  | 'maintenance_logs'
  | 'cost_snapshots'

export type TableRecordMap = {
  farms: Farm
  subscriptions: Subscription
  crops: Crop
  expenses: Expense
  income: Income
  tasks: Task
  livestock: Livestock
  equipment: Equipment
  inventory_items: InventoryItem
  journal_entries: JournalEntry
  documents: Document
  suppliers: Supplier
  health_events: HealthEvent
  maintenance_logs: MaintenanceLog
  cost_snapshots: CostSnapshot
}

export type TableRecord<T extends TableName> = TableRecordMap[T]