// app/(dashboard)/inventory/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Package, Trash2, AlertTriangle, RefreshCw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context'
import Link from 'next/link'

type InventoryItem = {
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
}

const CATEGORIES = [
  'Seed', 'Fertiliser', 'Herbicide', 'Pesticide', 'Fungicide',
  'Fuel', 'Feed', 'Packaging', 'Tools', 'Spare Parts', 'Other',
]

const UNITS = ['kg', 'g', 'ton', 'litre', 'ml', 'bag', 'box', 'unit', 'roll', 'each']

export default function InventoryPage() {
  // ===== AUTH STATE =====
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const supabase = createClient()

  // ===== FARM CONTEXT =====
  const { currentFarm, loading: farmLoading } = useFarm()

  // ===== DATA STATE =====
  const [items, setItems] = useState<InventoryItem[]>([])
  const [open, setOpen] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [unit, setUnit] = useState('')
  const [currentQuantity, setCurrentQuantity] = useState('')
  const [reorderLevel, setReorderLevel] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [storageLocation, setStorageLocation] = useState('')
  const [expiryDate, setExpiryDate] = useState('')

  // ===== CHECK AUTH =====
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (err) {
        console.error('Auth check error:', err)
        setAuthError('Failed to authenticate. Please refresh the page.')
      } finally {
        setAuthChecked(true)
      }
    }
    checkAuth()
  }, [supabase])

  // ===== FETCH ITEMS =====
  const fetchItems = useCallback(async () => {
    if (!currentFarm || !user) {
      setItems([])
      setFetching(false)
      return
    }

    setFetching(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)
        .order('created_at', { ascending: false })

      if (error) throw new Error('Failed to fetch inventory: ' + error.message)
      if (data) {
        const mappedItems = data.map((item: any) => ({
          ...item,
          current_quantity: Number(item.current_quantity) || 0,
          reorder_level: Number(item.reorder_level) || 0,
          unit_cost: Number(item.unit_cost) || 0,
          storage_location: item.storage_location ?? null,
          expiry_date: item.expiry_date ?? null,
        })) as InventoryItem[]
        setItems(mappedItems)
      }
      
    } catch (err) {
      console.error('Inventory fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load inventory. Please refresh the page.')
    } finally {
      setFetching(false)
      setIsRefreshing(false)
    }
  }, [currentFarm, user, supabase])

  useEffect(() => {
    if (authChecked && user) {
      fetchItems()
    }
  }, [authChecked, user, fetchItems])

  // ===== REFRESH HANDLER =====
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchItems()
  }

  function isLowStock(item: InventoryItem) {
    return item.reorder_level > 0 && item.current_quantity <= item.reorder_level
  }

  function isExpiringSoon(item: InventoryItem) {
    if (!item.expiry_date) return false
    const days = Math.ceil(
      (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return days <= 30 && days >= 0
  }

  const lowStockItems = items.filter(isLowStock)
  const expiringItems = items.filter(isExpiringSoon)
  
  const filtered = items.filter((i) => {
    const matchesCategory = filterCategory === 'All' ? true : i.category === filterCategory
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          i.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const totalValue = items.reduce((sum, i) => {
    const qty = parseFloat(String(i.current_quantity)) || 0
    const cost = parseFloat(String(i.unit_cost)) || 0
    return sum + (qty * cost)
  }, 0)

  // ===== ADD ITEM =====
  async function handleAdd() {
    if (!name || !category || !unit) return
    if (!currentFarm || !user) {
      setError('Please select a farm first')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([{
          name, 
          category, 
          unit,
          current_quantity: parseFloat(currentQuantity) || 0,
          reorder_level: parseFloat(reorderLevel) || 0,
          unit_cost: parseFloat(unitCost) || 0,
          storage_location: storageLocation || null,
          expiry_date: expiryDate || null,
          user_id: user.id,
          farm_id: currentFarm.id
        }])
        .select()
        .single()

      if (error) throw new Error('Failed to save item: ' + error.message)

      if (data) {
        setItems((prev) => [data, ...prev])
        setName('')
        setCategory('')
        setUnit('')
        setCurrentQuantity('')
        setReorderLevel('')
        setUnitCost('')
        setStorageLocation('')
        setExpiryDate('')
        setOpen(false)
      }
      
    } catch (err) {
      console.error('Inventory save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save item. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ===== DELETE ITEM =====
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this item?')) return
    if (!currentFarm || !user) return
    
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)

      if (error) throw new Error('Failed to delete item: ' + error.message)

      setItems(prev => prev.filter(i => i.id !== id))
      
    } catch (err) {
      console.error('Delete error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete item')
    }
  }

  // ===== LOADING STATE =====
  if (!authChecked || farmLoading || (fetching && !isRefreshing)) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">
            {!authChecked ? 'Checking authentication...' : 
             farmLoading ? 'Loading farms...' : 'Loading inventory...'}
          </p>
        </div>
      </div>
    )
  }

  // ===== NOT LOGGED IN =====
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">Please Log In</h2>
        <p className="text-sm text-gray-500">You need to be logged in to manage your inventory.</p>
        <Link href="/login">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Login
          </Button>
        </Link>
      </div>
    )
  }

  // ===== NO FARM SELECTED =====
  if (!currentFarm) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🏠</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">No Farm Selected</h2>
        <p className="text-sm text-gray-500">Please select a farm to manage your inventory.</p>
        <Link href="/settings">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Settings
          </Button>
        </Link>
      </div>
    )
  }

  // ===== ERROR STATE =====
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1B4332]">Inventory</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your farm inventory</p>
          </div>
        </div>
        <Card className="shadow-sm border-red-200 bg-red-50">
          <CardContent className="py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-500 text-lg">⚠️</span>
              </div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleRefresh}
            >
              <RefreshCw size={14} className="mr-2" /> Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ===== ACTUAL PAGE =====
  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Error message inline */}
      {error && (
        <Card className="shadow-sm border-red-200 bg-red-50">
          <CardContent className="py-3 px-4 flex items-center justify-between">
            <p className="text-sm text-red-700">❌ {error}</p>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setError(null)}
              className="text-red-700 hover:bg-red-100"
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Header with refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1B4332]">Inventory</h1>
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
              📦 {currentFarm.name}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {items.length} item{items.length !== 1 ? 's' : ''}
            {lowStockItems.length > 0 && (
              <span className="text-orange-500 ml-2">· {lowStockItems.length} low stock</span>
            )}
            {expiringItems.length > 0 && (
              <span className="text-red-500 ml-2">· {expiringItems.length} expiring soon</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <Button
              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
              onClick={() => setOpen(true)}
            >
              <Plus size={16} className="mr-2" /> Add Item
            </Button>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input placeholder="e.g. LAN Fertiliser 28%" value={name}
                    onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={(val) => setCategory(val || '')}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Select value={unit} onValueChange={(val) => setUnit(val || '')}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Current Quantity</Label>
                    <Input type="number" placeholder="0" value={currentQuantity}
                      onChange={(e) => setCurrentQuantity(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Reorder Level</Label>
                    <Input type="number" placeholder="Alert when below..." value={reorderLevel}
                      onChange={(e) => setReorderLevel(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Unit Cost (ZAR)</Label>
                    <Input type="number" placeholder="0.00" value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Storage Location <span className="text-gray-400">(optional)</span></Label>
                    <Input placeholder="e.g. Store Room A" value={storageLocation}
                      onChange={(e) => setStorageLocation(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date <span className="text-gray-400">(optional)</span></Label>
                  <Input type="date" value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)} />
                </div>
                <Button className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                  onClick={handleAdd} disabled={loading || !name || !category || !unit}>
                  {loading ? 'Saving...' : 'Save Item'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm border-0 bg-gradient-to-br from-[#D8F3DC] to-white">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-3xl font-bold text-[#2D6A4F]">{items.length}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Total Items</p>
          </CardContent>
        </Card>
        <Card className={`shadow-sm border-0 ${lowStockItems.length > 0 ? 'bg-gradient-to-br from-orange-50 to-white' : 'bg-white'}`}>
          <CardContent className="pt-4 pb-4 text-center">
            <p className={`text-3xl font-bold ${lowStockItems.length > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
              {lowStockItems.length}
            </p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Low Stock</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-3xl font-bold text-[#1B4332]">R{totalValue.toFixed(0)}</p>
            <p className="text-xs text-gray-400 mt-1 font-medium">Total Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="shadow-sm border-orange-200 bg-orange-50">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle size={16} />
              <p className="text-sm font-medium">
                Low stock: {lowStockItems.map((i) => i.name).join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {expiringItems.length > 0 && (
        <Card className="shadow-sm border-red-200 bg-red-50">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle size={16} />
              <p className="text-sm font-medium">
                Expiring soon: {expiringItems.map((i) => `${i.name} (${i.expiry_date})`).join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2 flex-wrap">
            {['All', ...CATEGORIES].map((cat) => (
              <button key={cat} onClick={() => setFilterCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                  filterCategory === cat
                    ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-sm'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-[#2D6A4F] hover:text-[#2D6A4F]'
                }`}>
                {cat}
              </button>
            ))}
          </div>
          
          {/* Search */}
          <div className="relative ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-8 w-48 border-gray-200 focus:border-[#2D6A4F] focus:ring-[#2D6A4F]"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Items list */}
      {items.length === 0 ? (
        <Card className="shadow-sm border-0 bg-gradient-to-br from-[#D8F3DC]/20 to-white">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-[#D8F3DC] flex items-center justify-center mb-4">
              <Package size={32} className="text-[#2D6A4F] opacity-30" />
            </div>
            <p className="text-sm font-medium text-gray-600">No inventory items yet</p>
            <p className="text-xs text-gray-400 mt-1">Click "Add Item" to track your first stock item</p>
            <Button 
              variant="outline" 
              className="mt-4 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
              onClick={() => setOpen(true)}
            >
              <Plus size={14} className="mr-2" /> Add Your First Item
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Package size={32} className="mb-3 opacity-30" />
            <p className="text-sm">No items match your filters</p>
            <p className="text-xs mt-1">Try adjusting your search or filter</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-0">
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {filtered.map((item) => {
                const lowStock = isLowStock(item)
                const expiring = isExpiringSoon(item)
                return (
                  <div key={item.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                        ${lowStock ? 'bg-orange-50' : expiring ? 'bg-red-50' : 'bg-[#D8F3DC]'}`}>
                        {lowStock
                          ? <AlertTriangle size={18} className="text-orange-400" />
                          : expiring
                            ? <AlertTriangle size={18} className="text-red-400" />
                            : <Package size={18} className="text-[#2D6A4F]" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <Badge className="text-xs bg-gray-100 text-gray-600 font-medium">{item.category}</Badge>
                          {item.storage_location && (
                            <span className="text-xs text-gray-400">📍 {item.storage_location}</span>
                          )}
                          {item.expiry_date && (
                            <span className={`text-xs ${expiring ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                              {expiring ? '⚠️ ' : ''}Exp: {item.expiry_date}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${lowStock ? 'text-orange-500' : expiring ? 'text-red-500' : 'text-gray-800'}`}>
                          {item.current_quantity} {item.unit}
                        </p>
                        {item.unit_cost > 0 && (
                          <p className="text-xs text-gray-400">R{(item.current_quantity * item.unit_cost).toFixed(0)} value</p>
                        )}
                        {item.reorder_level > 0 && (
                          <p className="text-xs text-gray-400">Reorder at {item.reorder_level} {item.unit}</p>
                        )}
                      </div>
                      <button 
                        onClick={() => handleDelete(item.id)} 
                        className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}