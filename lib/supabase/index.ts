// lib/supabase/index.ts

// ===== CLIENT-SIDE =====
export { 
  createClient, 
  getCurrentUserId, 
  isAuthenticated, 
  getCurrentUser 
} from './client'

// ===== SERVER-SIDE =====
export { 
  createClient as createServerClient,
  getCurrentUser as getServerUser,
  getCurrentUserId as getServerUserId,
  isAuthenticated as isServerAuthenticated,
  requireAuth,
  getUserWithRole
} from './server'

// ===== DATABASE HELPERS =====
export {
  // Basic CRUD
  getRecords,
  getRecordById,
  getRecordsWithFilters,
  createRecord,
  createRecords,
  updateRecord,
  updateRecords,
  deleteRecord,
  deleteRecords,
  countRecords,
  // Specific helpers
  getUserFarms,
  getActiveFarm,
  getUserSubscription,
  getItemsByFarm,
  getItemsByFarmLimited,
} from './db'

// ===== TYPES =====
export type {
  Farm,
  Subscription,
  Crop,
  Expense,
  Income,
  Task,
  Livestock,
  Equipment,
  InventoryItem,
  JournalEntry,
  Document,
  Supplier,
  HealthEvent,
  MaintenanceLog,
  CostSnapshot,
  TableName,
  TableRecord,
  TableRecordMap,
} from './types'