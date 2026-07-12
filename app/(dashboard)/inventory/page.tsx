'use client'

import { useState, useEffect } from 'react'
import { Plus, Package, Trash2, AlertTriangle } from 'lucide-react'
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

type InventoryItem = {
  id: string
  name: string
  category: string
  unit: string
  current_quantity: number
  reorder_level: number
  unit_cost: number
  storage_location: string
  expiry_date: string
  user_id: string
}

const CATEGORIES = [
  'Seed', 'Fertiliser', 'Herbicide', 'Pesticide', 'Fungicide',
  'Fuel', 'Feed', 'Packaging', 'Tools', 'Spare Parts', 'Other',
]

const UNITS = ['kg', 'g', 'ton', 'litre', 'ml', 'bag', 'box', 'unit', 'roll', 'each']

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [open, setOpen] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [loading, setLoading] = useState(false)
  const [filterCategory, setFilterCategory] = useState('All')

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [unit, setUnit] = useState('')
  const [currentQuantity, setCurrentQuantity] = useState('')
  const [reorderLevel, setReorderLevel] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [storageLocation, setStorageLocation] = useState('')
  const [expiryDate, setExpiryDate] = useState('')

  const supabase = createClient()

  async function fetchItems() {
  setFetching(true)
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setItems([])
      setFetching(false)
      return
    }

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', user.id)  // 👈 ADD THIS!
      .order('created_at', { ascending: false })

    if (!error && data) setItems(data)
  } catch (err) {
    console.error('Inventory fetch error:', err)
  } finally {
    setFetching(false)
  }
}

  useEffect(() => { fetchItems() }, [])

  function isLowStock(item: InventoryItem) {
    return item.reorder_level > 0 && item.current_quantity <= item.reorder_level
  }

  const lowStockItems = items.filter(isLowStock)
  const filtered = filterCategory === 'All' ? items : items.filter((i) => i.category === filterCategory)
  const totalValue = items.reduce((sum, i) => {
  const qty = parseFloat(String(i.current_quantity)) || 0
  const cost = parseFloat(String(i.unit_cost)) || 0
  return sum + (qty * cost)
}, 0)

  async function handleAdd() {
    if (!name || !category || !unit) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('inventory_items')
      .insert([{
        name, 
        category, 
        unit,
        current_quantity: parseFloat(currentQuantity) || 0,
        reorder_level: parseFloat(reorderLevel) || 0,
        unit_cost: parseFloat(unitCost) || 0,
        storage_location: storageLocation,
        expiry_date: expiryDate || null,
        user_id: user?.id
      }])
      .select()
      .single()
    if (!error && data) {
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
    setLoading(false)
  }

  async function handleDelete(id: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)  // 👈 ADD THIS!

    if (!error) setItems(prev => prev.filter(i => i.id !== id))
  } catch (err) {
    console.error('Delete error:', err)
  }
}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">
            {items.length} item{items.length !== 1 ? 's' : ''}
            {lowStockItems.length > 0 && (
              <span className="text-orange-500 ml-2">· {lowStockItems.length} low stock</span>
            )}
          </p>
        </div>
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
                  onChange={(e) => setName((e.target as HTMLInputElement).value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(val) => setCategory(val ?? '')}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select value={unit} onValueChange={(val) => setUnit(val ?? '')}>
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
                    onChange={(e) => setCurrentQuantity((e.target as HTMLInputElement).value)} />
                </div>
                <div className="space-y-2">
                  <Label>Reorder Level</Label>
                  <Input type="number" placeholder="Alert when below..." value={reorderLevel}
                    onChange={(e) => setReorderLevel((e.target as HTMLInputElement).value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Unit Cost (ZAR)</Label>
                  <Input type="number" placeholder="0.00" value={unitCost}
                    onChange={(e) => setUnitCost((e.target as HTMLInputElement).value)} />
                </div>
                <div className="space-y-2">
                  <Label>Storage Location <span className="text-gray-400">(optional)</span></Label>
                  <Input placeholder="e.g. Store Room A" value={storageLocation}
                    onChange={(e) => setStorageLocation((e.target as HTMLInputElement).value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Expiry Date <span className="text-gray-400">(optional)</span></Label>
                <Input type="date" value={expiryDate}
                  onChange={(e) => setExpiryDate((e.target as HTMLInputElement).value)} />
              </div>
              <Button className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                onClick={handleAdd} disabled={loading || !name || !category || !unit}>
                {loading ? 'Saving...' : 'Save Item'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-[#2D6A4F]">{items.length}</p>
            <p className="text-xs text-gray-400 mt-1">Total Items</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{lowStockItems.length}</p>
            <p className="text-xs text-gray-400 mt-1">Low Stock</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-[#1B4332]">R{totalValue.toFixed(0)}</p>
            <p className="text-xs text-gray-400 mt-1">Total Value</p>
          </CardContent>
        </Card>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="shadow-sm border-orange-200 bg-orange-50">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle size={16} />
              <p className="text-sm font-medium">Low stock: {lowStockItems.map((i) => i.name).join(', ')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {items.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {['All', ...CATEGORIES].map((cat) => (
            <button key={cat} onClick={() => setFilterCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filterCategory === cat
                  ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-[#2D6A4F]'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {fetching ? (
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-center py-16 text-gray-400">
            <p className="text-sm">Loading inventory...</p>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No inventory items yet</p>
            <p className="text-xs mt-1">Click "Add Item" to track your first stock item</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {filtered.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isLowStock(item) ? 'bg-orange-50' : 'bg-[#D8F3DC]'}`}>
                      {isLowStock(item)
                        ? <AlertTriangle size={16} className="text-orange-400" />
                        : <Package size={16} className="text-[#2D6A4F]" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className="text-xs bg-gray-100 text-gray-600">{item.category}</Badge>
                        {item.storage_location && <span className="text-xs text-gray-400">{item.storage_location}</span>}
                        {item.expiry_date && <span className="text-xs text-gray-400">Exp: {item.expiry_date}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${isLowStock(item) ? 'text-orange-500' : 'text-gray-800'}`}>
                        {item.current_quantity} {item.unit}
                      </p>
                      {item.unit_cost > 0 && (
                        <p className="text-xs text-gray-400">R{(item.current_quantity * item.unit_cost).toFixed(0)} value</p>
                      )}
                    </div>
                    <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}