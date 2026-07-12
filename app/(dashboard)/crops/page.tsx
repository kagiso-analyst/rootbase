'use client'

import { useState, useEffect } from 'react'
import { Plus, Leaf, Calendar, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type CropStatus = 'planned' | 'active' | 'harvested' | 'failed'

type Crop = {
  id: string
  crop_name: string
  variety: string
  field_name: string
  season: string
  planting_date: string
  expected_harvest_date: string
  area_planted_ha: number
  status: CropStatus
  notes: string
  created_at: string
}

const STATUS_COLOURS: Record<CropStatus, string> = {
  planned:   'bg-blue-100 text-blue-700',
  active:    'bg-green-100 text-green-700',
  harvested: 'bg-purple-100 text-purple-700',
  failed:    'bg-red-100 text-red-700',
}

const COMMON_CROPS = [
  'Maize', 'Wheat', 'Soya', 'Sunflower', 'Tomatoes', 'Potatoes',
  'Onions', 'Cabbage', 'Spinach', 'Butternut', 'Peppers', 'Beans',
  'Peas', 'Carrots', 'Beetroot', 'Lettuce', 'Broccoli', 'Cauliflower',
  'Sweet Corn', 'Pumpkin', 'Cucumber', 'Cotton', 'Sugarcane',
  'Groundnuts', 'Lucerne', 'Barley', 'Sorghum', 'Other',
]

function daysToHarvest(expectedDate: string): number {
  return Math.ceil((new Date(expectedDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function progressPercent(plantingDate: string, expectedDate: string): number {
  const start = new Date(plantingDate).getTime()
  const end = new Date(expectedDate).getTime()
  const now = Date.now()
  return Math.min(Math.max(Math.round(((now - start) / (end - start)) * 100), 0), 100)
}

export default function CropsPage() {
  const [crops, setCrops] = useState<Crop[]>([])
  const [open, setOpen] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [loading, setLoading] = useState(false)

  const [cropName, setCropName] = useState('')
  const [variety, setVariety] = useState('')
  const [fieldName, setFieldName] = useState('')
  const [season, setSeason] = useState('')
  const [plantingDate, setPlantingDate] = useState('')
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('')
  const [areaPlantedHa, setAreaPlantedHa] = useState('')
  const [status, setStatus] = useState<CropStatus>('active')
  const [notes, setNotes] = useState('')

  const supabase = createClient()

  async function fetchCrops() {
  setFetching(true)
  try {
    const { data, error } = await supabase
     .from('crops')
     .select('*')
     .eq('user_id', user?.id)
     .order('created_at', { ascending: false })
    if (error) console.error('Crops error:', error)
    if (data) setCrops(data)
  } catch (err) {
    console.error('Crops crash:', err)
  } finally {
    setFetching(false)
  }
}

  async function handleAdd() {
  if (!cropName || !plantingDate || !expectedHarvestDate) return
  setLoading(true)

  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('crops')
    .insert([{
      crop_name: cropName,
      variety,
      field_name: fieldName,
      season,
      planting_date: plantingDate,
      expected_harvest_date: expectedHarvestDate,
      area_planted_ha: parseFloat(areaPlantedHa) || 0,
      status,
      notes,
      user_id: user?.id
    }])
    .select()
    .single()

  if (!error && data) {
    setCrops((prev) => [data, ...prev])
    setCropName('')
    setVariety('')
    setFieldName('')
    setSeason('')
    setPlantingDate('')
    setExpectedHarvestDate('')
    setAreaPlantedHa('')
    setStatus('active')
    setNotes('')
    setOpen(false)
  }
  setLoading(false)
}

  const activeCrops = crops.filter((c) => c.status === 'active').length
  const plannedCrops = crops.filter((c) => c.status === 'planned').length
  const harvestedCrops = crops.filter((c) => c.status === 'harvested').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Crops</h1>
          <p className="text-gray-500 text-sm mt-1">
            {activeCrops} active · {plannedCrops} planned · {harvestedCrops} harvested
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <Button
            className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
            onClick={() => setOpen(true)}
          >
            <Plus size={16} className="mr-2" /> Add Crop
          </Button>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add New Crop</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Crop</Label>
                <Select value={cropName} onValueChange={(val) => setCropName(val ?? '')}>
                  <SelectTrigger><SelectValue placeholder="Select crop" /></SelectTrigger>
                  <SelectContent>
                    {COMMON_CROPS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Variety <span className="text-gray-400">(optional)</span></Label>
                <Input placeholder="e.g. Star 9001" value={variety}
                  onChange={(e) => setVariety((e.target as HTMLInputElement).value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Field / Block</Label>
                  <Input placeholder="e.g. Field A" value={fieldName}
                    onChange={(e) => setFieldName((e.target as HTMLInputElement).value)} />
                </div>
                <div className="space-y-2">
                  <Label>Season</Label>
                  <Input placeholder="e.g. 2025/26" value={season}
                    onChange={(e) => setSeason((e.target as HTMLInputElement).value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Planting Date</Label>
                  <Input type="date" value={plantingDate}
                    onChange={(e) => setPlantingDate((e.target as HTMLInputElement).value)} />
                </div>
                <div className="space-y-2">
                  <Label>Expected Harvest</Label>
                  <Input type="date" value={expectedHarvestDate}
                    onChange={(e) => setExpectedHarvestDate((e.target as HTMLInputElement).value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Area (hectares)</Label>
                  <Input type="number" placeholder="0.0" value={areaPlantedHa}
                    onChange={(e) => setAreaPlantedHa((e.target as HTMLInputElement).value)} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(val) => setStatus((val ?? 'active') as CropStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="harvested">Harvested</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes <span className="text-gray-400">(optional)</span></Label>
                <Input placeholder="Any additional notes..." value={notes}
                  onChange={(e) => setNotes((e.target as HTMLInputElement).value)} />
              </div>

              <Button
                className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                onClick={handleAdd}
                disabled={loading || !cropName || !plantingDate || !expectedHarvestDate}
              >
                {loading ? 'Saving...' : 'Save Crop'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {fetching ? (
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-center py-16 text-gray-400">
            <p className="text-sm">Loading crops...</p>
          </CardContent>
        </Card>
      ) : crops.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Leaf size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No crops recorded yet</p>
            <p className="text-xs mt-1">Click "Add Crop" to record your first planting</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {crops.map((crop) => {
            const days = daysToHarvest(crop.expected_harvest_date)
            const progress = progressPercent(crop.planting_date, crop.expected_harvest_date)
            return (
              <Link key={crop.id} href={`/crops/${crop.id}`}>
                <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#D8F3DC] flex items-center justify-center">
                          <Leaf size={15} className="text-[#2D6A4F]" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold text-gray-800">
                            {crop.crop_name}
                          </CardTitle>
                          {crop.variety && <p className="text-xs text-gray-400">{crop.variety}</p>}
                        </div>
                      </div>
                      <Badge className={`text-xs ${STATUS_COLOURS[crop.status]}`}>
                        {crop.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {crop.field_name && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin size={12} /> {crop.field_name}
                        {crop.area_planted_ha > 0 && ` · ${crop.area_planted_ha} ha`}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar size={12} /> Planted {crop.planting_date}
                    </div>
                    {crop.status === 'active' && (
                      <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{days > 0 ? `${days} days to harvest` : 'Ready!'}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-[#52B788] h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}