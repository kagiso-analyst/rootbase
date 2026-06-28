'use client'

import { useState } from 'react'
import { Plus, Package, Trash2, AlertTriangle } from 'lucide-react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type InventoryItem = {
  id: string
  name: string
  category: string
  unit: string
  currentQuantity: number
  reorderLevel: number
  unitCost: number
  storageLocation: string
  expiryDate: string
}

const CATEGORIES = [
  'Seed',
  'Fertiliser',
  'Herbicide',
  'Pesticide',
  'Fungicide',
  'Fuel',
  'Feed',
  'Packaging',
  'Tools',
  'Spare Parts',
  'Other',
]

const UNITS = [
  'kg', 'g', 'ton', 'litre', 'ml',
  'bag', 'box', 'unit', 'roll', 'each',
]

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [open, setOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState('All')

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [unit, setUnit] = useState('')
  const [currentQuantity, setCurrentQuantity] = useState('')
  const [reorderLevel, setReorderLevel] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [storageLocation, setStorageLocation] = useState('')
  const [expiryDate, setExpiryDate] = useState('')

  const lowStockItems = items.filter(
    (i) => i.reorderLevel > 0 && i.currentQuantity <= i.reorderLevel
  )

  const filtered =
    filterCategory === 'All'
      ? items
      : items.filter((i) => i.category === filterCategory)

  function handleAdd() {
    if (!name || !category || !unit) return

    const newItem: InventoryItem = {
      id: crypto.randomUUID(),
      name,
      category,
      unit,
      currentQuantity: parseFloat(currentQuantity) || 0,
      reorderLevel: parseFloat(reorderLevel) || 0,
      unitCost: parseFloat(unitCost) || 0,
      storageLocation,
      expiryDate,
    }

    setItems((prev) => [newItem, ...prev])
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

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function isLowStock(item: InventoryItem) {
    return item.reorderLevel > 0 && item.currentQuantity <= item.reorderLevel
  }

  const totalValue = items.reduce(
    (sum, i) => sum + i.currentQuantity * i.unitCost,
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">
            {items.length} item{items.length !== 1 ? 's' : ''}
            {lowStockItems.length > 0 && (
              <span className="text-orange-500 ml-2">
                · {lowStockItems.length} low stock
              </span>
            )}
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
              <Plus size={16} className="mr-2" /> Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">

              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input
                  placeholder="e.g. LAN Fertiliser 28%"
                  value={name}
                  onChange={(e) => setName((e.target as HTMLInputElement).value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(val) => setCategory(val ?? '')}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select value={unit} onValueChange={(val) => setUnit(val ?? '')}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Current Quantity</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity((e.target as HTMLInputElement).value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reorder Level</Label>
                  <Input
                    type="number"
                    placeholder="Alert when below..."
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel((e.target as HTMLInputElement).value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Unit Cost (ZAR)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={unitCost}
                    onChange={(e) => setUnitCost((e.target as HTMLInputElement).value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Storage Location <span className="text-gray-400">(optional)</span></Label>
                  <Input
                    placeholder="e.g. Store Room A"
                    value={storageLocation}
                    onChange={(e) => setStorageLocation((e.target as HTMLInputElement).value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Expiry Date <span className="text-gray-400">(optional)</span></Label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate((e.target as HTMLInputElement).value)}
                />
              </div>

              <Button
                className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                onClick={handleAdd}
                disabled={!name || !category || !unit}
              >
                Save Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
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

      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <Card className="shadow-sm border-orange-200 bg-orange-50">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle size={16} />
              <p className="text-sm font-medium">
                Low stock alert: {lowStockItems.map((i) => i.name).join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      {items.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {['All', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filterCategory === cat
                  ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-[#2D6A4F]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Items list */}
      {items.length === 0 ? (
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
                <div
                  key={item.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center
                      ${isLowStock(item) ? 'bg-orange-50' : 'bg-[#D8F3DC]'}`}>
                      {isLowStock(item)
                        ? <AlertTriangle size={16} className="text-orange-400" />
                        : <Package size={16} className="text-[#2D6A4F]" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className="text-xs bg-gray-100 text-gray-600">{item.category}</Badge>
                        {item.storageLocation && (
                          <span className="text-xs text-gray-400">{item.storageLocation}</span>
                        )}
                        {item.expiryDate && (
                          <span className="text-xs text-gray-400">Exp: {item.expiryDate}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${isLowStock(item) ? 'text-orange-500' : 'text-gray-800'}`}>
                        {item.currentQuantity} {item.unit}
                      </p>
                      {item.unitCost > 0 && (
                        <p className="text-xs text-gray-400">
                          R{(item.currentQuantity * item.unitCost).toFixed(0)} value
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
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