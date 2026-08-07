// lib/notification-service.ts

import { createClient } from '@/lib/supabase/client'

export async function getNotificationCount(farmId: string, userId: string): Promise<number> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const expiryDate = thirtyDaysFromNow.toISOString().split('T')[0]

  try {
    // Run all queries in parallel
    const [
      overdueResult,
      lowStockResult,
      docResult,
      alertResult
    ] = await Promise.all([
      // Overdue tasks
      supabase
        .from('tasks')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('farm_id', farmId)
        .eq('status', 'todo')
        .lt('due_date', today),
      
      // Low stock items
      supabase
        .from('inventory_items')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('farm_id', farmId)
        .gt('reorder_level', 0)
        .lte('current_quantity', 'reorder_level'),
      
      // Expiring documents
      supabase
        .from('documents')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('farm_id', farmId)
        .gte('expiry_date', today)
        .lte('expiry_date', expiryDate),
      
      // Unread weather alerts
      supabase
        .from('weather_alerts')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('farm_id', farmId)
        .eq('is_read', false),
    ])

    const total = (overdueResult.count || 0) + 
                  (lowStockResult.count || 0) + 
                  (docResult.count || 0) + 
                  (alertResult.count || 0)
    
    return total
  } catch (err) {
    console.error('Notification count error:', err)
    return 0
  }
}