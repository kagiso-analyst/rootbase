'use client'

import { useState } from 'react'
import { Plus, Wrench, Trash2, AlertTriangle, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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

type Equipment = {
  id: string
  name: string
  category: string
  make: string
  model: string
  year: string
  serialNumber: string
  purchaseDate: string
  purchasePrice: number
  currentHours: number
  nextServiceDate: string
  nextServiceHours: number
  insuranceExpiry: string
  notes: string
}

type MaintenanceLog = {
  id: string
  equipmentId: string
  equipmentName: string
  serviceType: string
  description: string
  cost: number
  date: string
  hoursAtService: number
}

const CATEGORIES = [
  'Tractor',
  'Harvester',
  'Planter',
  'Sprayer',
  'Irrigation',
  'Tillage',
  'Transport',
  'Power Tools',
  'Hand Tools',
  'Other',
]

const SERVICE_TYPES = [
  'Oil Change',
  'Filter Service',
  'Full Service',
  'Tyre Replacement',
  'Brake Service',
  'Electrical',
  'Hydraulic',
  'Repairs',
  'Inspection',
  'Other',
]

function isServiceDue(equipment: Equipment): boolean {
  if (equipment.nextServiceDate) {
    const serviceDate = new Date(equipment.nextServiceDate)
    const today = new Date()
    const daysUntil = Math.ceil(
      (serviceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysUntil <= 14) return true
  }
  if (equipment.nextServiceHours && equipment.currentHours) {
    if (equipment.currentHours >= equipment.nextServiceHours - 20) return true
  }
  return false
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([])
  const [equipOpen, setEquipOpen] = useState(false)
  const [serviceOpen, setServiceOpen] = useState(false)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [currentHours, setCurrentHours] = useState('')
  const [nextServiceDate, setNextServiceDate] = useState('')
  const [nextServiceHours, setNextServiceHours] = useState('')
  const [insuranceExpiry, setInsuranceExpiry] = useState('')
  const [notes, setNotes] = useState('')

  const [selectedEquipId, setSelectedEquipId] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [serviceDesc, setServiceDesc] = useState('')
  const [serviceCost, setServiceCost] = useState('')
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0])
  const [serviceHours, setServiceHours] = useState('')
  const [loading, setLoading] = useState(false)

  const dueSoon = equipment.filter(isServiceDue)
  const supabase = createClient()

  async function handleAddEquipment() {
    if (!name || !category) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('equipment')
        .insert([{
          name,
          category,
          make: make || null,
          model: model || null,
          year: year || null,
          serial_number: serialNumber || null,
          purchase_date: purchaseDate || null,
          purchase_price: parseFloat(purchasePrice) || 0,
          current_hours: parseFloat(currentHours) || 0,
          next_service_date: nextServiceDate || null,
          next_service_hours: parseFloat(nextServiceHours) || 0,
          insurance_expiry: insuranceExpiry || null,
          notes: notes || null,
        }])
        .select()
        .single()
      if (error) {
        console.error('Equipment insert error:', error)
      } else if (data) {
        setEquipment((prev) => [data, ...prev])
        setName('')
        setCategory('')
        setMake('')
        setModel('')
        setYear('')
        setSerialNumber('')
        setPurchaseDate('')
        setPurchasePrice('')
        setCurrentHours('')
        setNextServiceDate('')
        setNextServiceHours('')
        setInsuranceExpiry('')
        setNotes('')
        setEquipOpen(false)
      }
    } catch (err) {
      console.error('Equipment crash:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleAddService() {
    if (!selectedEquipId || !serviceType || !serviceDesc) return
    const equip = equipment.find((e) => e.id === selectedEquipId)
    const newLog: MaintenanceLog = {
      id: crypto.randomUUID(),
      equipmentId: selectedEquipId,
      equipmentName: equip?.name || 'Unknown',
      serviceType,
      description: serviceDesc,
      cost: parseFloat(serviceCost) || 0,
      date: serviceDate,
      hoursAtService: parseFloat(serviceHours) || 0,
    }
    setMaintenanceLogs((prev) => [newLog, ...prev])
    setSelectedEquipId('')
    setServiceType('')
    setServiceDesc('')
    setServiceCost('')
    setServiceHours('')
    setServiceDate(new Date().toISOString().split('T')[0])
    setServiceOpen(false)
  }

  function handleDelete(id: string) {
    setEquipment((prev) => prev.filter((e) => e.id !== id))
  }

  const totalValue = equipment.reduce((sum, e) => sum + e.purchasePrice, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Equipment</h1>
          <p className="text-gray-500 text-sm mt-1">
            {equipment.length} item{equipment.length !== 1 ? 's' : ''}
            {dueSoon.length > 0 && (
              <span className="text-orange-500 ml-2">· {dueSoon.length} service due</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={serviceOpen} onOpenChange={setServiceOpen}>
            <Button
              variant="outline"
              className="border-[#2D6A4F] text-[#2D6A4F]"
              onClick={() => setServiceOpen(true)}
            >
              <Wrench size={16} className="mr-2" /> Log Service
            </Button>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Log Maintenance</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Equipment</Label>
                  <Select value={selectedEquipId} onValueChange={(val) => setSelectedEquipId(val ?? '')}>
                    <SelectTrigger><SelectValue placeholder="Select equipment..." /></SelectTrigger>
                    <SelectContent>
                      {equipment.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <Select value={serviceType} onValueChange={(val) => setServiceType(val ?? '')}>
                    <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="e.g. Changed engine oil and filters"
                    value={serviceDesc}
                    onChange={(e) => setServiceDesc((e.target as HTMLInputElement).value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Cost (ZAR)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={serviceCost}
                      onChange={(e) => setServiceCost((e.target as HTMLInputElement).value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hours at Service</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={serviceHours}
                      onChange={(e) => setServiceHours((e.target as HTMLInputElement).value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate((e.target as HTMLInputElement).value)}
                  />
                </div>
                <Button
                  className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                  onClick={handleAddService}
                  disabled={!selectedEquipId || !serviceType || !serviceDesc}
                >
                  Save Service Log
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={equipOpen} onOpenChange={setEquipOpen}>
            <Button
              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
              onClick={() => setEquipOpen(true)}
            >
              <Plus size={16} className="mr-2" /> Add Equipment
            </Button>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Equipment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="e.g. John Deere 6110"
                      value={name}
                      onChange={(e) => setName((e.target as HTMLInputElement).value)}
                    />
                  </div>
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
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Make</Label>
                    <Input placeholder="e.g. John Deere" value={make}
                      onChange={(e) => setMake((e.target as HTMLInputElement).value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input placeholder="e.g. 6110M" value={model}
                      onChange={(e) => setModel((e.target as HTMLInputElement).value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input placeholder="e.g. 2019" value={year}
                      onChange={(e) => setYear((e.target as HTMLInputElement).value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Serial Number</Label>
                    <Input placeholder="Optional" value={serialNumber}
                      onChange={(e) => setSerialNumber((e.target as HTMLInputElement).value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Purchase Price (ZAR)</Label>
                    <Input type="number" placeholder="0.00" value={purchasePrice}
                      onChange={(e) => setPurchasePrice((e.target as HTMLInputElement).value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Current Hours</Label>
                    <Input type="number" placeholder="0" value={currentHours}
                      onChange={(e) => setCurrentHours((e.target as HTMLInputElement).value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Next Service Hours</Label>
                    <Input type="number" placeholder="0" value={nextServiceHours}
                      onChange={(e) => setNextServiceHours((e.target as HTMLInputElement).value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Next Service Date</Label>
                    <Input type="date" value={nextServiceDate}
                      onChange={(e) => setNextServiceDate((e.target as HTMLInputElement).value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Insurance Expiry</Label>
                    <Input type="date" value={insuranceExpiry}
                      onChange={(e) => setInsuranceExpiry((e.target as HTMLInputElement).value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes <span className="text-gray-400">(optional)</span></Label>
                  <Input placeholder="Any notes..." value={notes}
                    onChange={(e) => setNotes((e.target as HTMLInputElement).value)} />
                </div>

                <Button
                  className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                  onClick={handleAddEquipment}
                  disabled={!name || !category}
                >
                  Save Equipment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-[#2D6A4F]">{equipment.length}</p>
            <p className="text-xs text-gray-400 mt-1">Total Items</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{dueSoon.length}</p>
            <p className="text-xs text-gray-400 mt-1">Service Due</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-[#1B4332]">
              R{totalValue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">Total Value</p>
          </CardContent>
        </Card>
      </div>

      {dueSoon.length > 0 && (
        <Card className="shadow-sm border-orange-200 bg-orange-50">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle size={16} />
              <p className="text-sm font-medium">
                Service due: {dueSoon.map((e) => e.name).join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {equipment.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Wrench size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No equipment added yet</p>
            <p className="text-xs mt-1">Click "Add Equipment" to track your first item</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm text-gray-500">Equipment List</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {equipment.map((equip) => {
                  const due = isServiceDue(equip)
                  return (
                    <div key={equip.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center
                          ${due ? 'bg-orange-50' : 'bg-[#D8F3DC]'}`}>
                          {due
                            ? <AlertTriangle size={16} className="text-orange-400" />
                            : <Wrench size={16} className="text-[#2D6A4F]" />
                          }
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{equip.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge className="text-xs bg-gray-100 text-gray-600">{equip.category}</Badge>
                            {equip.make && <span className="text-xs text-gray-400">{equip.make} {equip.model}</span>}
                            {equip.year && <span className="text-xs text-gray-400">{equip.year}</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            {equip.currentHours > 0 && (
                              <span className="text-xs text-gray-400">{equip.currentHours}h</span>
                            )}
                            {equip.nextServiceDate && (
                              <span className={`flex items-center gap-1 text-xs ${due ? 'text-orange-500' : 'text-gray-400'}`}>
                                <Calendar size={11} /> Service: {equip.nextServiceDate}
                              </span>
                            )}
                            {equip.insuranceExpiry && (
                              <span className="text-xs text-gray-400">
                                Insurance: {equip.insuranceExpiry}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {equip.purchasePrice > 0 && (
                          <span className="text-sm text-gray-500">
                            R{equip.purchasePrice.toLocaleString()}
                          </span>
                        )}
                        <button
                          onClick={() => handleDelete(equip.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors"
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

          {maintenanceLogs.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm text-gray-500">
                  Maintenance History ({maintenanceLogs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {maintenanceLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 px-6 py-4">
                      <div className="w-8 h-8 rounded-full bg-[#D8F3DC] flex items-center justify-center flex-shrink-0">
                        <Wrench size={14} className="text-[#2D6A4F]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{log.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge className="text-xs bg-gray-100 text-gray-600">{log.serviceType}</Badge>
                          <span className="text-xs text-gray-400">{log.equipmentName}</span>
                          <span className="text-xs text-gray-400">· {log.date}</span>
                          {log.hoursAtService > 0 && (
                            <span className="text-xs text-gray-400">· {log.hoursAtService}h</span>
                          )}
                        </div>
                      </div>
                      {log.cost > 0 && (
                        <span className="text-sm font-medium text-red-500">
                          R{log.cost.toFixed(0)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}