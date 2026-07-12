// lib/supabase/db.ts

import { createClient } from './client'
import { createClient as createServerClient } from './server'
import { SupabaseClient } from '@supabase/supabase-js'

type DbOptions = {
  server?: boolean
}

// ===== GET CLIENT =====
async function getClient(options: DbOptions = {}): Promise<SupabaseClient> {
  return options.server ? await createServerClient() : createClient()
}

// ===== GENERIC CRUD OPERATIONS =====

// Get all records
export async function getRecords<T>(
  table: string,
  filters?: Record<string, any>,
  options: DbOptions = {}
): Promise<T[]> {
  const supabase = await getClient(options)
  let query = supabase.from(table).select('*')
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value)
    })
  }
  
  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`)
  return data || []
}

// Get single record by ID
export async function getRecordById<T>(
  table: string,
  id: string,
  options: DbOptions = {}
): Promise<T | null> {
  const supabase = await getClient(options)
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch ${table}: ${error.message}`)
  }
  return data || null
}

// Get records with custom filters (more flexible)
export async function getRecordsWithFilters<T>(
  table: string,
  filters: Array<{ column: string; operator: string; value: any }>,
  options: DbOptions = {}
): Promise<T[]> {
  const supabase = await getClient(options)
  let query = supabase.from(table).select('*')
  
  filters.forEach(({ column, operator, value }) => {
    switch (operator) {
      case 'eq':
        query = query.eq(column, value)
        break
      case 'neq':
        query = query.neq(column, value)
        break
      case 'gt':
        query = query.gt(column, value)
        break
      case 'gte':
        query = query.gte(column, value)
        break
      case 'lt':
        query = query.lt(column, value)
        break
      case 'lte':
        query = query.lte(column, value)
        break
      case 'like':
        query = query.like(column, `%${value}%`)
        break
      default:
        query = query.eq(column, value)
    }
  })
  
  const { data, error } = await query
  if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`)
  return data || []
}

// Create record
export async function createRecord<T>(
  table: string,
  data: Record<string, any>,
  options: DbOptions = {}
): Promise<T> {
  const supabase = await getClient(options)
  const { data: result, error } = await supabase
    .from(table)
    .insert([data])
    .select()
    .single()
  
  if (error) throw new Error(`Failed to create ${table}: ${error.message}`)
  return result
}

// Create multiple records
export async function createRecords<T>(
  table: string,
  data: Record<string, any>[],
  options: DbOptions = {}
): Promise<T[]> {
  const supabase = await getClient(options)
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
  
  if (error) throw new Error(`Failed to create ${table}: ${error.message}`)
  return result || []
}

// Update record
export async function updateRecord<T>(
  table: string,
  id: string,
  data: Record<string, any>,
  options: DbOptions = {}
): Promise<T> {
  const supabase = await getClient(options)
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw new Error(`Failed to update ${table}: ${error.message}`)
  return result
}

// Update records with filter
export async function updateRecords<T>(
  table: string,
  filters: Record<string, any>,
  data: Record<string, any>,
  options: DbOptions = {}
): Promise<T[]> {
  const supabase = await getClient(options)
  let query = supabase.from(table).update(data)
  
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value)
  })
  
  const { data: result, error } = await query.select()
  
  if (error) throw new Error(`Failed to update ${table}: ${error.message}`)
  return result || []
}

// Delete record
export async function deleteRecord(
  table: string,
  id: string,
  options: DbOptions = {}
): Promise<void> {
  const supabase = await getClient(options)
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
  
  if (error) throw new Error(`Failed to delete ${table}: ${error.message}`)
}

// Delete records with filter
export async function deleteRecords(
  table: string,
  filters: Record<string, any>,
  options: DbOptions = {}
): Promise<void> {
  const supabase = await getClient(options)
  let query = supabase.from(table).delete()
  
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value)
  })
  
  const { error } = await query
  if (error) throw new Error(`Failed to delete ${table}: ${error.message}`)
}

// ===== COUNT RECORDS =====
export async function countRecords(
  table: string,
  filters?: Record<string, any>,
  options: DbOptions = {}
): Promise<number> {
  const supabase = await getClient(options)
  let query = supabase.from(table).select('*', { count: 'exact', head: true })
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value)
    })
  }
  
  const { count, error } = await query
  if (error) throw new Error(`Failed to count ${table}: ${error.message}`)
  return count || 0
}

// ===== SPECIFIC HELPERS =====

// Get user's farms
export async function getUserFarms(userId: string, options: DbOptions = {}) {
  const supabase = await getClient(options)
  const { data, error } = await supabase
    .from('farms')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  
  if (error) throw new Error(`Failed to fetch farms: ${error.message}`)
  return data || []
}

// Get user's active farm
export async function getActiveFarm(userId: string, options: DbOptions = {}) {
  const supabase = await getClient(options)
  const { data, error } = await supabase
    .from('farms')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle()
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch active farm: ${error.message}`)
  }
  return data || null
}

// Get user's subscription
export async function getUserSubscription(email: string, options: DbOptions = {}) {
  const supabase = await getClient(options)
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_email', email)
    .eq('status', 'active')
    .maybeSingle()
  
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch subscription: ${error.message}`)
  }
  return data || null
}

// Get items by farm
export async function getItemsByFarm<T>(
  table: string,
  farmId: string,
  userId: string,
  options: DbOptions = {}
): Promise<T[]> {
  const supabase = await getClient(options)
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false })
  
  if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`)
  return data || []
}

// Get items by farm with limit
export async function getItemsByFarmLimited<T>(
  table: string,
  farmId: string,
  userId: string,
  limit: number = 10,
  options: DbOptions = {}
): Promise<T[]> {
  const supabase = await getClient(options)
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`)
  return data || []
}