// lib/services/inventory-service.ts

import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'
import { toast } from 'sonner'

type InventoryItem = Database['public']['Tables']['inventory_items']['Row']
type StockMovement = Database['public']['Tables']['stock_movements']['Insert']

export class InventoryService {
  private supabase = createClient()

  // ===== READ OPERATIONS =====

  /**
   * Get all inventory items for a farm
   */
  async getInventoryItems(farmId: string) {
    try {
      const { data, error } = await this.supabase
        .from('inventory_items')
        .select('*')
        .eq('farm_id', farmId)
        .order('name', { ascending: true })

      if (error) throw new Error(error.message)
      return data || []
    } catch (error) {
      console.error('Error fetching inventory items:', error)
      throw error
    }
  }

  /**
   * Get a single inventory item by ID
   */
  async getInventoryItem(itemId: string) {
    try {
      const { data, error } = await this.supabase
        .from('inventory_items')
        .select('*')
        .eq('id', itemId)
        .single()

      if (error) throw new Error(error.message)
      return data
    } catch (error) {
      console.error('Error fetching inventory item:', error)
      throw error
    }
  }

  /**
   * Get low stock items (current quantity <= reorder level)
   */
  async getLowStockItems(farmId: string) {
    try {
      const { data, error } = await this.supabase
        .from('inventory_items')
        .select('*')
        .eq('farm_id', farmId)
      const lowStockItems = (data || []).filter(item => item.current_quantity <= item.reorder_level)

      if (error) throw new Error(error.message)
      return lowStockItems
    } catch (error) {
      console.error('Error fetching low stock items:', error)
      throw error
    }
  }

  /**
   * Get stock movement history for an item
   */
  async getStockMovements(itemId: string) {
    try {
      const { data, error } = await this.supabase
        .from('stock_movements')
        .select('*')
        .eq('inventory_item_id', itemId)
        .order('date', { ascending: false })

      if (error) throw new Error(error.message)
      return data || []
    } catch (error) {
      console.error('Error fetching stock movements:', error)
      throw error
    }
  }

  // ===== CREATE OPERATIONS =====

  /**
   * Create a new inventory item
   */
  async createItem(
    item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>
  ) {
    try {
      const { data, error } = await this.supabase
        .from('inventory_items')
        .insert([item])
        .select()
        .single()

      if (error) throw new Error(error.message)
      toast.success(`Created ${item.name}`)
      return data
    } catch (error) {
      console.error('Error creating inventory item:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to create item'
      )
      throw error
    }
  }

  /**
   * Record a stock movement (add stock)
   */
  async addStock(
    itemId: string,
    quantity: number,
    reason: string,
    farmId: string,
    userId: string
  ) {
    try {
      // Get current item
      const item = await this.getInventoryItem(itemId)
      if (!item) throw new Error('Item not found')

      // Update inventory
      const newQuantity = (item.current_quantity || 0) + quantity
      await this.updateItem(itemId, { current_quantity: newQuantity })

      // Record movement
      const { error: movementError } = await this.supabase
        .from('stock_movements')
        .insert([
          {
            inventory_item_id: itemId,
            type: 'in',
            quantity,
            reason,
            date: new Date().toISOString(),
            user_id: userId,
            farm_id: farmId,
          } as any,
        ])

      if (movementError) throw new Error(movementError.message)

      toast.success(`Added ${quantity} ${item.unit} to ${item.name}`)
      return { success: true }
    } catch (error) {
      console.error('Error adding stock:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to add stock'
      )
      throw error
    }
  }

  /**
   * Record a stock movement (remove stock)
   */
  async removeStock(
    itemId: string,
    quantity: number,
    reason: string,
    farmId: string,
    userId: string
  ) {
    try {
      // Get current item
      const item = await this.getInventoryItem(itemId)
      if (!item) throw new Error('Item not found')

      // Check if there's enough stock
      if ((item.current_quantity || 0) < quantity) {
        throw new Error('Insufficient stock available')
      }

      // Update inventory
      const newQuantity = (item.current_quantity || 0) - quantity
      await this.updateItem(itemId, { current_quantity: newQuantity })

      // Record movement
      const { error: movementError } = await this.supabase
        .from('stock_movements')
        .insert([
          {
            inventory_item_id: itemId,
            type: 'out',
            quantity,
            reason,
            date: new Date().toISOString(),
            user_id: userId,
            farm_id: farmId,
          } as any,
        ])

      if (movementError) throw new Error(movementError.message)

      toast.success(`Removed ${quantity} ${item.unit} from ${item.name}`)
      return { success: true }
    } catch (error) {
      console.error('Error removing stock:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to remove stock'
      )
      throw error
    }
  }

  // ===== UPDATE OPERATIONS =====

  /**
   * Update an inventory item
   */
  async updateItem(
    itemId: string,
    updates: Partial<InventoryItem>
  ) {
    try {
      const { data, error } = await this.supabase
        .from('inventory_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    } catch (error) {
      console.error('Error updating inventory item:', error)
      throw error
    }
  }

  // ===== DELETE OPERATIONS =====

  /**
   * Delete an inventory item
   */
  async deleteItem(itemId: string) {
    try {
      const { error } = await this.supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId)

      if (error) throw new Error(error.message)
      toast.success('Item deleted successfully')
      return true
    } catch (error) {
      console.error('Error deleting inventory item:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete item'
      )
      throw error
    }
  }

  // ===== UTILITY FUNCTIONS =====

  /**
   * Calculate total inventory value
   */
  calculateTotalValue(items: InventoryItem[]): number {
    return items.reduce((sum, item) => {
      const qty = item.current_quantity || 0
      const cost = item.unit_cost || 0
      return sum + qty * cost
    }, 0)
  }

  /**
   * Check if item is low stock
   */
  isLowStock(item: InventoryItem): boolean {
    return (
      item.reorder_level > 0 &&
      (item.current_quantity || 0) <= item.reorder_level
    )
  }

  /**
   * Check if item is expiring soon (within 30 days)
   */
  isExpiringSoon(item: InventoryItem): boolean {
    if (!item.expiry_date) return false
    const days = Math.ceil(
      (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return days <= 30 && days >= 0
  }

  /**
   * Get expiry status for an item
   */
  getExpiryStatus(item: InventoryItem): 'expired' | 'expiring_soon' | 'ok' | 'no_date' {
    if (!item.expiry_date) return 'no_date'
    const days = Math.ceil(
      (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    if (days < 0) return 'expired'
    if (days <= 30) return 'expiring_soon'
    return 'ok'
  }
}

// Export singleton instance
export const inventoryService = new InventoryService()
