// app/(dashboard)/inventory/[id]/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  ArrowLeft, Package, Trash2, TrendingUp, TrendingDown, 
  Clock, RefreshCw, Edit, Save, X, AlertTriangle,
  Plus, Calendar, MapPin, DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// ===== CONSTANTS =====
const CATEGORIES = [
  'Seed', 'Fertiliser', 'Herbicide', 'Pesticide', 'Fungicide',
  'Fuel', 'Feed', 'Packaging', 'Tools', 'Spare Parts', 'Other',
]

const UNITS = ['kg', 'g', 'ton', 'litre', 'ml', 'bag', 'box', 'unit', 'roll', 'each']

type StockMovement = {
  id: string
  inventory_item_id: string
  quantity: number
  type: 'in' | 'out'
  reason: string
  date: string
  created_at: string
}

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

export default function InventoryDetailPage() {
  // ===== AUTH STATE =====
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const supabase = createClient()

  // ===== ROUTE PARAMS =====
  const params = useParams()
  const itemId = params.id as string

  // ===== FARM CONTEXT =====
  const { currentFarm, loading: farmLoading } = useFarm()

  // ===== DATA STATE =====
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(false)

  // Movement form
  const [quantity, setQuantity] = useState('')
  const [type, setType] = useState<'in' | 'out'>('in')
  const [reason, setReason] = useState('')

  // Edit form
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [editReorderLevel, setEditReorderLevel] = useState('')
  const [editUnitCost, setEditUnitCost] = useState('')
  const [editStorageLocation, setEditStorageLocation] = useState('')
  const [editExpiryDate, setEditExpiryDate] = useState('')

  // ===== CHECK AUTH =====
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (err) {
        console.error('Auth check error:', err)
        setError('Failed to authenticate. Please refresh the page.')
      } finally {
        setAuthChecked(true)
      }
    }
    checkAuth()
  }, [supabase])

  // ===== FETCH DATA =====
  const fetchData = useCallback(async () => {
    if (!currentFarm || !user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Fetch item details
      const { data: itemData, error: itemError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', itemId)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)
        .single()

      if (itemError) throw itemError
      setItem(itemData)

      // Fetch stock movements
      const { data: movementData, error: movementError } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('inventory_item_id', itemId)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)
        .order('date', { ascending: false })
        .limit(50)

      if (movementError) throw movementError
      setMovements(movementData || [])
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [itemId, currentFarm, user, supabase])

  useEffect(() => {
    if (authChecked && user) {
      fetchData()
    }
  }, [authChecked, user, fetchData])

  // ===== ADD MOVEMENT =====
  async function handleAddMovement() {
    if (!quantity || !reason) return
    if (!currentFarm || !user) return

    setSaving(true)
    setError(null)

    try {
      const quantityNum = parseFloat(quantity)
      const newQuantity = type === 'in' 
        ? (item?.current_quantity || 0) + quantityNum
        : (item?.current_quantity || 0) - quantityNum

      if (type === 'out' && newQuantity < 0) {
        setError('Insufficient stock')
        setSaving(false)
        return
      }

      // Start transaction
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert([{
          inventory_item_id: itemId,
          user_id: user.id,
          farm_id: currentFarm.id,
          quantity: quantityNum,
          type,
          reason,
          date: new Date().toISOString(),
        }])

      if (movementError) throw movementError

      // Update inventory quantity
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ 
          current_quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)

      if (updateError) throw updateError

      // Refresh data
      await fetchData()
      setOpen(false)
      setQuantity('')
      setReason('')
      setType('in')
    } catch (err) {
      console.error('Movement error:', err)
      setError('Failed to record movement')
    } finally {
      setSaving(false)
    }
  }

  // ===== DELETE MOVEMENT =====
  async function handleDeleteMovement(id: string) {
    if (!confirm('Are you sure you want to delete this movement?')) return
    if (!currentFarm || !user) return

    try {
      const movement = movements.find(m => m.id === id)
      if (!movement) return

      const quantityNum = movement.type === 'in' ? -movement.quantity : movement.quantity
      const newQuantity = (item?.current_quantity || 0) + quantityNum

      const { error: deleteError } = await supabase
        .from('stock_movements')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)

      if (deleteError) throw deleteError

      // Update inventory quantity
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ 
          current_quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)

      if (updateError) throw updateError

      await fetchData()
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete movement')
    }
  }

  // ===== UPDATE ITEM =====
  async function handleUpdateItem() {
    if (!editName || !editCategory || !editUnit) return
    if (!currentFarm || !user) return

    setSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('inventory_items')
        .update({
          name: editName,
          category: editCategory,
          unit: editUnit,
          reorder_level: parseFloat(editReorderLevel) || 0,
          unit_cost: parseFloat(editUnitCost) || 0,
          storage_location: editStorageLocation || null,
          expiry_date: editExpiryDate || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)

      if (error) throw error

      await fetchData()
      setEditingItem(false)
    } catch (err) {
      console.error('Update error:', err)
      setError('Failed to update item')
    } finally {
      setSaving(false)
    }
  }

  // ===== LOADING STATE =====
  if (!authChecked || farmLoading || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading inventory details...</p>
        </div>
      </div>
    )
  }

  // ===== NOT LOGGED IN =====
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">Please Log In</h2>
        <p className="text-sm text-gray-500">You need to be logged in to manage inventory.</p>
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
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="text-5xl mb-4">🏠</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">No Farm Selected</h2>
        <p className="text-sm text-gray-500">Please select a farm to manage inventory.</p>
        <Link href="/settings">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Settings
          </Button>
        </Link>
      </div>
    )
  }

  // ===== ITEM NOT FOUND =====
  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">📦</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">Item Not Found</h2>
        <p className="text-sm text-gray-500">This inventory item may have been deleted.</p>
        <Link href="/inventory">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Back to Inventory
          </Button>
        </Link>
      </div>
    )
  }

  // ===== ERROR STATE =====
  if (error) {
    return (
      <div className="space-y-6 px-4 sm:px-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/inventory">
              <Button variant="ghost" size="icon">
                <ArrowLeft size={18} />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-[#1B4332]">Inventory Item</h1>
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
              onClick={() => {
                setError(null)
                fetchData()
              }}
            >
              <RefreshCw size={14} className="mr-2" /> Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ===== ACTUAL PAGE =====
  const isLowStock = item.reorder_level > 0 && item.current_quantity <= item.reorder_level
  const isExpiring = item.expiry_date && Math.ceil(
    (new Date(item.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ) <= 30

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/inventory">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-[#1B4332]">{item.name}</h1>
              <Badge className="bg-gray-100 text-gray-600 text-xs">{item.category}</Badge>
              {isLowStock && (
                <Badge className="bg-orange-100 text-orange-700 text-xs">Low Stock</Badge>
              )}
              {isExpiring && (
                <Badge className="bg-red-100 text-red-700 text-xs">Expiring Soon</Badge>
              )}
              <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
                {currentFarm.name}
              </Badge>
            </div>
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <Package size={14} className="text-gray-400" />
                {item.current_quantity} {item.unit} in stock
              </span>
              {item.storage_location && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} className="text-gray-400" />
                  {item.storage_location}
                </span>
              )}
              {item.unit_cost > 0 && (
                <span className="flex items-center gap-1">
                  <DollarSign size={14} className="text-gray-400" />
                  R{item.unit_cost.toFixed(2)} / {item.unit}
                </span>
              )}
              {item.expiry_date && (
                <span className="flex items-center gap-1 text-red-500">
                  <Calendar size={14} />
                  Expires: {item.expiry_date}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
            onClick={() => {
              setEditingItem(true)
              setEditName(item.name)
              setEditCategory(item.category)
              setEditUnit(item.unit)
              setEditReorderLevel(String(item.reorder_level))
              setEditUnitCost(String(item.unit_cost))
              setEditStorageLocation(item.storage_location || '')
              setEditExpiryDate(item.expiry_date || '')
            }}
          >
            <Edit size={16} className="mr-2" /> Edit
          </Button>
          <Button
            className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
            onClick={() => setOpen(true)}
          >
            <Plus size={16} className="mr-2" /> Record Movement
          </Button>
        </div>
      </div>

      {/* Error message */}
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

      {/* Edit Item Dialog */}
      <Dialog open={editingItem} onOpenChange={setEditingItem}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={editCategory} onValueChange={(val) => setEditCategory(val || '')}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Select value={editUnit} onValueChange={(val) => setEditUnit(val || '')}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Reorder Level</Label>
                <Input type="number" value={editReorderLevel} onChange={(e) => setEditReorderLevel(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Unit Cost (ZAR)</Label>
                <Input type="number" value={editUnitCost} onChange={(e) => setEditUnitCost(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Storage Location <span className="text-gray-400">(optional)</span></Label>
              <Input value={editStorageLocation} onChange={(e) => setEditStorageLocation(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Expiry Date <span className="text-gray-400">(optional)</span></Label>
              <Input type="date" value={editExpiryDate} onChange={(e) => setEditExpiryDate(e.target.value)} />
            </div>
            <Button
              className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
              onClick={handleUpdateItem}
              disabled={saving || !editName || !editCategory || !editUnit}
            >
              {saving ? 'Saving...' : 'Update Item'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Movement Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Stock Movement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-3">
                <button
                  onClick={() => setType('in')}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 text-center transition-all ${
                    type === 'in'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <TrendingUp size={16} className="mx-auto mb-1" />
                  Stock In
                </button>
                <button
                  onClick={() => setType('out')}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 text-center transition-all ${
                    type === 'out'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <TrendingDown size={16} className="mx-auto mb-1" />
                  Stock Out
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Quantity ({item.unit})</Label>
              <Input
                type="number"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={reason} onValueChange={(val) => setReason(val || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Purchase">Purchase</SelectItem>
                  <SelectItem value="Usage">Usage</SelectItem>
                  <SelectItem value="Adjustment">Adjustment</SelectItem>
                  <SelectItem value="Return">Return</SelectItem>
                  <SelectItem value="Waste">Waste</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
              onClick={handleAddMovement}
              disabled={!quantity || !reason || saving}
            >
              {saving ? 'Saving...' : 'Record Movement'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Movement History */}
      <Card className="shadow-sm border-0">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock size={16} className="text-[#2D6A4F]" />
            Movement History ({movements.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Package size={32} className="mb-3 opacity-30" />
              <p className="text-sm font-medium text-gray-600">No movements recorded</p>
              <p className="text-xs text-gray-400 mt-1">Click "Record Movement" to track stock changes</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {movements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      movement.type === 'in' ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      {movement.type === 'in' 
                        ? <TrendingUp size={16} className="text-green-500" />
                        : <TrendingDown size={16} className="text-red-500" />
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          movement.type === 'in' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {movement.type === 'in' ? '+' : '-'}{movement.quantity} {item.unit}
                        </span>
                        <Badge className="text-xs bg-gray-100 text-gray-600">
                          {movement.reason}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400">{new Date(movement.date).toLocaleString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteMovement(movement.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}