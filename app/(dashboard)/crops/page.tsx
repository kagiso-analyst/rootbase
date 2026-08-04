// app/(dashboard)/crops/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { useFarm } from '@/lib/farm-context'
import { cn, getSeasonalGreeting } from '@/lib/utils'
// Add RefreshCw to the import
import { Plus, Leaf, Calendar, MapPin, Sparkles, Image, RefreshCw } from 'lucide-react'

type CropStatus = 'planned' | 'active' | 'harvested' | 'failed'

type Crop = {
  id: string
  crop_name: string
  variety: string | null
  field_name: string | null
  season: string | null
  planting_date: string
  expected_harvest_date: string
  area_planted_ha: number
  status: CropStatus
  notes: string | null
  created_at: string
  user_id: string
  farm_id: string
}

const STATUS_COLOURS: Record<CropStatus, string> = {
  planned:   'bg-blue-100 text-blue-700 border-blue-200',
  active:    'bg-green-100 text-green-700 border-green-200',
  harvested: 'bg-purple-100 text-purple-700 border-purple-200',
  failed:    'bg-red-100 text-red-700 border-red-200',
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
  // ===== AUTH STATE =====
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const supabase = createClient()

  // ===== FARM CONTEXT =====
  const { currentFarm, loading: farmLoading } = useFarm()

  // ===== DATA STATE =====
  const [crops, setCrops] = useState<Crop[]>([])
  const [open, setOpen] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [greeting, setGreeting] = useState('')

  // Form state
  const [cropName, setCropName] = useState('')
  const [variety, setVariety] = useState('')
  const [fieldName, setFieldName] = useState('')
  const [season, setSeason] = useState('')
  const [plantingDate, setPlantingDate] = useState('')
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('')
  const [areaPlantedHa, setAreaPlantedHa] = useState('')
  const [status, setStatus] = useState<CropStatus>('active')
  const [notes, setNotes] = useState('')

  // ===== CHECK AUTH =====
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (user) {
          const seasonal = getSeasonalGreeting(
            user.user_metadata?.full_name?.split(' ')[0] || 'Farmer'
          )
          setGreeting(seasonal.greeting)
        }
      } catch (err) {
        console.error('Auth check error:', err)
        setAuthError('Failed to authenticate. Please refresh the page.')
      } finally {
        setAuthChecked(true)
      }
    }
    checkAuth()
  }, [supabase])

  // ===== FETCH CROPS =====
  const fetchCrops = useCallback(async () => {
    if (!currentFarm || !user) {
      setCrops([])
      setFetching(false)
      return
    }

    setFetching(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('crops')
        .select('*')
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)
        .order('created_at', { ascending: false })
      
      if (error) throw new Error('Failed to fetch crops: ' + error.message)
      if (data) setCrops(data)
      
    } catch (err) {
      console.error('Crops error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load crops. Please refresh the page.')
    } finally {
      setFetching(false)
    }
  }, [currentFarm, user, supabase])

  useEffect(() => {
    if (authChecked && user) {
      fetchCrops()
    }
  }, [authChecked, user, fetchCrops])

  // ===== ADD CROP =====
  async function handleAdd() {
    if (!cropName || !plantingDate || !expectedHarvestDate) return
    if (!currentFarm || !user) {
      setError('Please select a farm first')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('crops')
        .insert([{
          crop_name: cropName,
          variety: variety || null,
          field_name: fieldName || null,
          season: season || null,
          planting_date: plantingDate,
          expected_harvest_date: expectedHarvestDate,
          area_planted_ha: parseFloat(areaPlantedHa) || 0,
          status,
          notes: notes || null,
          user_id: user.id,
          farm_id: currentFarm.id
        }])
        .select()
        .single()

      if (error) throw new Error('Failed to save crop: ' + error.message)

      if (data) {
        setCrops((prev) => [data, ...prev])
        // Reset form
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
      
    } catch (err) {
      console.error('Crop save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save crop. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ===== DELETE CROP =====
  async function handleDeleteCrop(id: string) {
    if (!confirm('Are you sure you want to delete this crop?')) return
    if (!currentFarm || !user) return
    
    try {
      const { error } = await supabase
        .from('crops')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)

      if (error) throw new Error('Failed to delete crop: ' + error.message)
      
      setCrops(prev => prev.filter(c => c.id !== id))
      
    } catch (err) {
      console.error('Delete error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete crop')
    }
  }

  const activeCrops = crops.filter((c) => c.status === 'active').length
  const plannedCrops = crops.filter((c) => c.status === 'planned').length
  const harvestedCrops = crops.filter((c) => c.status === 'harvested').length

  // ===== LOADING STATE =====
  if (!authChecked || farmLoading || (fetching)) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">
            {!authChecked ? 'Checking authentication...' : 
             farmLoading ? 'Loading farms...' : 'Loading crops...'}
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
        <p className="text-sm text-gray-500">You need to be logged in to manage your crops.</p>
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
        <p className="text-sm text-gray-500">Please select or create a farm to manage your crops.</p>
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
            <h1 className="text-2xl font-bold text-[#1B4332]">Crops</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your crops and planting records</p>
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
                fetchCrops()
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

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#1B4332]">Crops</h1>
            <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
              🌱 {currentFarm.name}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            {greeting || '🌱'}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-400">
              {activeCrops} active · {plannedCrops} planned · {harvestedCrops} harvested
            </span>
          </div>
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

      {crops.length === 0 ? (
        <Card className="shadow-sm border-0 bg-gradient-to-br from-[#D8F3DC]/20 to-white">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-[#D8F3DC] flex items-center justify-center mb-4">
              <Leaf size={32} className="text-[#2D6A4F] opacity-30" />
            </div>
            <p className="text-sm font-medium text-gray-600">No crops recorded yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Your fields are ready, {user?.user_metadata?.full_name?.split(' ')[0] || 'Farmer'}. 
              Plant your first crop record.
            </p>
            <Button 
              variant="outline" 
              className="mt-4 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
              onClick={() => setOpen(true)}
            >
              <Plus size={14} className="mr-2" /> Plant Your First Crop
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {crops.map((crop) => {
            const days = daysToHarvest(crop.expected_harvest_date)
            const progress = progressPercent(crop.planting_date, crop.expected_harvest_date)
            return (
              <div key={crop.id} className="relative group">
                <Link href={`/crops/${crop.id}`}>
                  <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full border-l-4 hover:border-l-[#2D6A4F]">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center",
                            crop.status === 'active' ? 'bg-[#D8F3DC]' :
                            crop.status === 'planned' ? 'bg-blue-50' :
                            crop.status === 'harvested' ? 'bg-purple-50' : 'bg-red-50'
                          )}>
                            <Leaf size={15} className={cn(
                              crop.status === 'active' ? 'text-[#2D6A4F]' :
                              crop.status === 'planned' ? 'text-blue-500' :
                              crop.status === 'harvested' ? 'text-purple-500' : 'text-red-500'
                            )} />
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
                            <div className="bg-[#52B788] h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
                {/* Delete button */}
                <button
                  onClick={() => handleDeleteCrop(crop.id)}
                  className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                  title="Delete crop"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 hover:text-red-500">
                    <path d="M3 6h18" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}