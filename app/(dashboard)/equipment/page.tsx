// app/(dashboard)/equipment/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Plus, Wrench, Trash2, AlertTriangle, Calendar, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context' // 👈 ADD THIS
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
import Link from 'next/link'

type Equipment = {
  id: string
  name: string
  category: string
  make: string | null
  model: string | null
  year: string | null
  serialNumber: string | null
  purchaseDate: string | null
  purchasePrice: number
  currentHours: number
  nextServiceDate: string | null
  nextServiceHours: number
  insuranceExpiry: string | null
  notes: string | null
  user_id: string
  farm_id: string | null
}

type MaintenanceLog = {
  id: string
  equipmentId: string
  equipmentName: string | null
  serviceType: string | null
  description: string | null
  cost: number
  date: string | null
  hoursAtService: number
  user_id: string
  farm_id: string | null
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
  // ===== STATE =====
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([])
  const [equipOpen, setEquipOpen] = useState(false)
  const [serviceOpen, setServiceOpen] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // 👇 GET CURRENT FARM
  const { currentFarm, loading: farmLoading } = useFarm()

  // Equipment form
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

  // Service form
  const [selectedEquipId, setSelectedEquipId] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [serviceDesc, setServiceDesc] = useState('')
  const [serviceCost, setServiceCost] = useState('')
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0])
  const [serviceHours, setServiceHours] = useState('')

  const supabase = createClient()
  const dueSoon = equipment.filter(isServiceDue)

  // ===== FETCH ALL DATA =====
  async function fetchAll() {
    // 👇 CHECK IF FARM IS SELECTED
    if (!currentFarm) {
      setEquipment([])
      setMaintenanceLogs([])
      setFetching(false)
      return
    }

    setFetching(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUser(null)
        setEquipment([])
        setMaintenanceLogs([])
        setFetching(false)
        return
      }
      
      setUser(user)

      const [equipRes, logsRes] = await Promise.all([
        supabase
          .from('equipment')
          .select('*')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id) // 👈 FILTER BY FARM
          .order('created_at', { ascending: false }),
        supabase
          .from('maintenance_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('farm_id', currentFarm.id) // 👈 FILTER BY FARM
          .order('date', { ascending: false }),
      ])

      if (equipRes.error) throw new Error('Failed to fetch equipment: ' + equipRes.error.message)
      if (logsRes.error) throw new Error('Failed to fetch maintenance logs: ' + logsRes.error.message)

      if (equipRes.data) {
        const mappedEquipment = equipRes.data.map((item: any) => ({
          ...item,
          purchasePrice: parseFloat(String(item.purchase_price)) || 0,
          currentHours: parseFloat(String(item.current_hours)) || 0,
          nextServiceHours: parseFloat(String(item.next_service_hours)) || 0,
        }))
        setEquipment(mappedEquipment)
      }

      if (logsRes.data) {
        const mappedLogs = logsRes.data.map((item: any) => ({
          ...item,
          equipmentId: item.equipment_id,
          equipmentName: item.equipment_name,
          serviceType: item.service_type,
          hoursAtService: parseFloat(String(item.hours_at_service)) || 0,
          cost: parseFloat(String(item.cost)) || 0,
        }))
        setMaintenanceLogs(mappedLogs)
      }
      
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load equipment. Please refresh the page.')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [currentFarm]) // 👈 REFETCH WHEN FARM CHANGES

  // ===== ADD EQUIPMENT =====
  async function handleAddEquipment() {
    if (!name || !category) return
    if (!currentFarm) {
      setError('Please select a farm first')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to add equipment')
        setLoading(false)
        return
      }
      
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
          user_id: user.id,
          farm_id: currentFarm.id // 👈 ADD farm_id
        }])
        .select()
        .single()
      
      if (error) throw new Error('Failed to save equipment: ' + error.message)
      
      if (data) {
        const newEquipment = {
          ...data,
          purchasePrice: parseFloat(String(data.purchase_price)) || 0,
          currentHours: parseFloat(String(data.current_hours)) || 0,
          nextServiceHours: parseFloat(String(data.next_service_hours)) || 0,
        }
        setEquipment((prev) => [newEquipment, ...prev])
        // Reset form
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
      console.error('Equipment save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save equipment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ===== ADD SERVICE =====
  async function handleAddService() {
    if (!selectedEquipId || !serviceType || !serviceDesc) return
    if (!currentFarm) return
    
    setLoading(true)
    setError(null)
    
    const equip = equipment.find((e) => e.id === selectedEquipId)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to log services')
        setLoading(false)
        return
      }
      
      const { data, error } = await supabase
        .from('maintenance_logs')
        .insert([{
          equipment_id: selectedEquipId,
          equipment_name: equip?.name || 'Unknown',
          service_type: serviceType,
          description: serviceDesc,
          cost: parseFloat(serviceCost) || 0,
          date: serviceDate,
          hours_at_service: parseFloat(serviceHours) || 0,
          user_id: user.id,
          farm_id: currentFarm.id // 👈 ADD farm_id
        }])
        .select()
        .single()
      
      if (error) throw new Error('Failed to save service: ' + error.message)
      
      if (data) {
        const newLog = {
          ...data,
          equipmentId: data.equipment_id,
          equipmentName: data.equipment_name,
          serviceType: data.service_type,
          hoursAtService: parseFloat(String(data.hours_at_service)) || 0,
          cost: parseFloat(String(data.cost)) || 0,
        }
        setMaintenanceLogs((prev) => [newLog, ...prev])
        // Reset form
        setSelectedEquipId('')
        setServiceType('')
        setServiceDesc('')
        setServiceCost('')
        setServiceHours('')
        setServiceDate(new Date().toISOString().split('T')[0])
        setServiceOpen(false)
      }
      
    } catch (err) {
      console.error('Service save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save service. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ===== DELETE EQUIPMENT =====
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this equipment and all its service logs?')) return
    if (!currentFarm) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to delete equipment')
        return
      }

      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id) // 👈 FILTER BY FARM

      if (error) throw new Error('Failed to delete equipment: ' + error.message)

      setEquipment(prev => prev.filter(e => e.id !== id))
      // Also delete associated maintenance logs
      await supabase
        .from('maintenance_logs')
        .delete()
        .eq('equipment_id', id)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id) // 👈 FILTER BY FARM
      setMaintenanceLogs(prev => prev.filter(log => log.equipmentId !== id))
      
    } catch (err) {
      console.error('Delete error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete equipment')
    }
  }

  // ===== DELETE SERVICE LOG =====
  async function handleDeleteLog(id: string) {
    if (!confirm('Are you sure you want to delete this service log?')) return
    if (!currentFarm) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to delete service logs')
        return
      }

      const { error } = await supabase
        .from('maintenance_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id) // 👈 FILTER BY FARM

      if (error) throw new Error('Failed to delete service log: ' + error.message)

      setMaintenanceLogs(prev => prev.filter(log => log.id !== id))
      
    } catch (err) {
      console.error('Delete log error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete service log')
    }
  }

  const totalValue = equipment.reduce((sum, e) => {
    const price = parseFloat(String(e.purchasePrice)) || 0
    return sum + price
  }, 0)

  // ===== LOADING STATE =====
  if (farmLoading || fetching) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">{farmLoading ? 'Loading farms...' : 'Loading equipment...'}</p>
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
        <p className="text-sm text-gray-500">You need to be logged in to manage your equipment.</p>
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
        <p className="text-sm text-gray-500">Please select a farm to manage your equipment.</p>
        <Link href="/settings">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Settings
          </Button>
        </Link>
      </div>
    )
  }

  // ===== ACTUAL PAGE =====
  return (
    <div className="space-y-6 px-4 sm:px-0">
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

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1B4332]">Equipment</h1>
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
              🔧 {currentFarm.name}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {equipment.length} item{equipment.length !== 1 ? 's' : ''}
            {dueSoon.length > 0 && (
              <span className="text-orange-500 ml-2">· {dueSoon.length} service due</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Service Dialog */}
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
                  disabled={!selectedEquipId || !serviceType || !serviceDesc || loading}
                >
                  {loading ? 'Saving...' : 'Save Service Log'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Equipment Dialog */}
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
                  disabled={!name || !category || loading}
                >
                  {loading ? 'Saving...' : 'Save Equipment'}
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
            <p className="text-2xl font-bold text-[#2D6A4F]">{equipment.length}</p>
            <p className="text-xs text-gray-400 mt-1">Total Items</p>
          </CardContent>
        </Card>
        <Card className={`shadow-sm border-0 ${dueSoon.length > 0 ? 'bg-gradient-to-br from-orange-50 to-white' : 'bg-white'}`}>
          <CardContent className="pt-4 pb-4 text-center">
            <p className={`text-2xl font-bold ${dueSoon.length > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
              {dueSoon.length}
            </p>
            <p className="text-xs text-gray-400 mt-1">Service Due</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-0 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-[#1B4332]">
              R{isNaN(totalValue) ? '0' : totalValue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">Total Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Service due alert */}
      {dueSoon.length > 0 && (
        <Card className="shadow-sm border-orange-200 bg-gradient-to-br from-orange-50 to-white">
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

      {/* Equipment list */}
      {equipment.length === 0 ? (
        <Card className="shadow-sm border-0 bg-gradient-to-br from-[#D8F3DC]/20 to-white">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-[#D8F3DC] flex items-center justify-center mb-4">
              <Wrench size={32} className="text-[#2D6A4F] opacity-30" />
            </div>
            <p className="text-sm font-medium text-gray-600">No equipment added yet</p>
            <p className="text-xs text-gray-400 mt-1">Click "Add Equipment" to track your first item</p>
            <Button 
              variant="outline" 
              className="mt-4 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
              onClick={() => setEquipOpen(true)}
            >
              <Plus size={14} className="mr-2" /> Add Your First Equipment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-sm text-gray-500">Equipment List</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {equipment.map((equip) => {
                  const due = isServiceDue(equip)
                  return (
                    <div key={equip.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors group">
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
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {equip.currentHours > 0 && (
                              <span className="text-xs text-gray-400">{equip.currentHours}h</span>
                            )}
                            {equip.nextServiceDate && (
                              <span className={`flex items-center gap-1 text-xs ${due ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
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
                            R{Number(equip.purchasePrice).toLocaleString()}
                          </span>
                        )}
                        <button
                          onClick={() => handleDelete(equip.id)}
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

          {/* Maintenance History */}
          {maintenanceLogs.length > 0 && (
            <Card className="shadow-sm border-0">
              <CardHeader>
                <CardTitle className="text-sm text-gray-500">
                  Maintenance History ({maintenanceLogs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {maintenanceLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-[#D8F3DC] flex items-center justify-center flex-shrink-0">
                        <Wrench size={14} className="text-[#2D6A4F]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{log.description}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <Badge className="text-xs bg-gray-100 text-gray-600">{log.serviceType}</Badge>
                          <span className="text-xs text-gray-400">{log.equipmentName}</span>
                          <span className="text-xs text-gray-400">· {log.date}</span>
                          {log.hoursAtService > 0 && (
                            <span className="text-xs text-gray-400">· {log.hoursAtService}h</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {log.cost > 0 && (
                          <span className="text-sm font-medium text-red-500">
                            R{log.cost.toFixed(0)}
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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