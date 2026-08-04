// app/(dashboard)/crops/[id]/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Plus, Leaf, Droplets, Sprout, Eye, Scissors, Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useFarm } from '@/lib/farm-context'
import { cn } from '@/lib/utils'
import type { Activity, ActivityType } from '@/types/crops'


const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  Spraying:    <Droplets size={14} className="text-blue-500" />,
  Fertilising: <Sprout size={14} className="text-green-500" />,
  Irrigation:  <Droplets size={14} className="text-cyan-500" />,
  Scouting:    <Eye size={14} className="text-purple-500" />,
  Weeding:     <Scissors size={14} className="text-orange-500" />,
  Pruning:     <Scissors size={14} className="text-pink-500" />,
  Other:       <Leaf size={14} className="text-gray-400" />,
}

export default function CropDetailPage() {
  // ===== AUTH STATE =====
  const [user, setUser] = useState<any>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const supabase = createClient()

  // ===== ROUTE PARAMS =====
  const params = useParams()
  const cropId = params.id as string

  // ===== FARM CONTEXT =====
  const { currentFarm, loading: farmLoading } = useFarm()

  // ===== DATA STATE =====
  const [activities, setActivities] = useState<Activity[]>([])
  const [crop, setCrop] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [open, setOpen] = useState(false)
  const [activityType, setActivityType] = useState<ActivityType>('Spraying')
  const [description, setDescription] = useState('')
  const [product, setProduct] = useState('')
  const [rate, setRate] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

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

  // ===== FETCH CROP AND ACTIVITIES =====
  const fetchData = useCallback(async () => {
    if (!currentFarm || !user) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Fetch crop details
      const { data: cropData, error: cropError } = await supabase
        .from('crops')
        .select('*')
        .eq('id', cropId)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)
        .single()

      if (cropError && cropError.code !== 'PGRST116') {
        throw new Error('Failed to fetch crop: ' + cropError.message)
      }
      
      setCrop(cropData)

      // Fetch activities from database
      const { data, error } = await supabase
        .from('crop_activities')
        .select('*')
        .eq('crop_id', cropId)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)
        .order('date', { ascending: false })

      if (error) throw new Error('Failed to fetch activities: ' + error.message)
      
      const mappedActivities: Activity[] = (data || []).map(item => ({
        id: item.id,
        cropId: item.crop_id,
        type: item.activity_type as ActivityType,
        description: item.description,
        date: item.date,
        product: item.product || '',
        rate: item.rate || '',
      }))
      
      setActivities(mappedActivities)
      
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [cropId, currentFarm, user, supabase])

  useEffect(() => {
    if (authChecked && user && cropId) {
      fetchData()
    }
  }, [authChecked, user, cropId, fetchData])

  // ===== ADD ACTIVITY =====
  async function handleAddActivity() {
    if (!description || !date) return
    if (!currentFarm || !user) {
      setError('Please select a farm first')
      return
    }
    
    setSaving(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('crop_activities')
        .insert([{
          crop_id: cropId,
          activity_type: activityType,
          description,
          product: product || null,
          rate: rate || null,
          date,
          user_id: user.id,
          farm_id: currentFarm.id,
        }])
        .select()
        .single()

      if (error) throw new Error('Failed to save activity: ' + error.message)

      const newActivity: Activity = {
        id: data.id,
        cropId: data.crop_id,
        type: data.activity_type as ActivityType,
        description: data.description,
        date: data.date,
        product: data.product || '',
        rate: data.rate || '',
      }

      setActivities(prev => [newActivity, ...prev])
      setDescription('')
      setProduct('')
      setRate('')
      setDate(new Date().toISOString().split('T')[0])
      setOpen(false)
      
    } catch (err) {
      console.error('Error saving activity:', err)
      setError(err instanceof Error ? err.message : 'Failed to save activity')
    } finally {
      setSaving(false)
    }
  }

  // ===== DELETE ACTIVITY =====
  async function handleDeleteActivity(id: string) {
    if (!confirm('Are you sure you want to delete this activity?')) return
    if (!currentFarm || !user) return
    
    try {
      const { error } = await supabase
        .from('crop_activities')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('farm_id', currentFarm.id)

      if (error) throw new Error('Failed to delete activity: ' + error.message)
      
      setActivities(prev => prev.filter(a => a.id !== id))
      
    } catch (err) {
      console.error('Error deleting activity:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete activity')
    }
  }

  // ===== LOADING STATE =====
  if (!authChecked || farmLoading || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">
            {!authChecked ? 'Checking authentication...' : 
             farmLoading ? 'Loading farms...' : 'Loading crop details...'}
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
        <p className="text-sm text-gray-500">You need to be logged in to manage crop activities.</p>
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
        <p className="text-sm text-gray-500">Please select a farm to manage crop activities.</p>
        <Link href="/settings">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Go to Settings
          </Button>
        </Link>
      </div>
    )
  }

  // ===== CROP NOT FOUND =====
  if (!crop) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🌱</div>
        <h2 className="text-xl font-semibold text-[#1B4332] mb-2">Crop Not Found</h2>
        <p className="text-sm text-gray-500">This crop may have been deleted or you don't have access to it.</p>
        <Link href="/crops">
          <Button className="mt-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
            Back to Crops
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
            <h1 className="text-2xl font-bold text-[#1B4332]">Crop Details</h1>
            <p className="text-gray-500 text-sm mt-1">Manage crop activities and information</p>
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
  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/crops">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-[#1B4332]">
                {crop.crop_name}
              </h1>
              <Badge className={cn(
                "text-xs",
                crop.status === 'active' ? 'bg-green-100 text-green-700' :
                crop.status === 'planned' ? 'bg-blue-100 text-blue-700' :
                crop.status === 'harvested' ? 'bg-purple-100 text-purple-700' :
                'bg-red-100 text-red-700'
              )}>
                {crop.status}
              </Badge>
              <Badge className="bg-[#D8F3DC] text-[#2D6A4F] text-xs font-medium">
                🌱 {currentFarm.name}
              </Badge>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              {crop.variety && `${crop.variety} · `}
              {crop.field_name && `Field: ${crop.field_name}`}
              {crop.area_planted_ha > 0 && ` · ${crop.area_planted_ha} ha`}
            </p>
          </div>
        </div>
      </div>

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

      <Tabs defaultValue="activities">
        <TabsList className="bg-[#D8F3DC]">
          <TabsTrigger value="activities" className="data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white">
            Activity Log
          </TabsTrigger>
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white">
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="space-y-4 mt-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <p className="text-sm text-gray-500">
              {activities.length} activit{activities.length !== 1 ? 'ies' : 'y'} logged
            </p>
            <Dialog open={open} onOpenChange={setOpen}>
              <Button
                className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                onClick={() => setOpen(true)}
              >
                <Plus size={16} className="mr-2" /> Log Activity
              </Button>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Log Activity</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Activity Type</Label>
                    <Select
                      value={activityType}
                      onValueChange={(val) => setActivityType((val ?? 'Spraying') as ActivityType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(['Spraying','Fertilising','Irrigation','Scouting','Weeding','Pruning','Other'] as ActivityType[]).map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="e.g. Applied Mancozeb for early blight"
                      value={description}
                      onChange={(e) => setDescription((e.target as HTMLInputElement).value)}
                    />
                  </div>

                  {(activityType === 'Spraying' || activityType === 'Fertilising') && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Product</Label>
                        <Input
                          placeholder="e.g. Mancozeb"
                          value={product}
                          onChange={(e) => setProduct((e.target as HTMLInputElement).value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rate</Label>
                        <Input
                          placeholder="e.g. 2kg/ha"
                          value={rate}
                          onChange={(e) => setRate((e.target as HTMLInputElement).value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate((e.target as HTMLInputElement).value)}
                    />
                  </div>

                  <Button
                    className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white"
                    onClick={handleAddActivity}
                    disabled={!description || !date || saving}
                  >
                    {saving ? 'Saving...' : 'Save Activity'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {activities.length === 0 ? (
            <Card className="shadow-sm border-0 bg-gradient-to-br from-[#D8F3DC]/20 to-white">
              <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
                <div className="w-12 h-12 rounded-full bg-[#D8F3DC] flex items-center justify-center mb-3">
                  <Leaf size={24} className="text-[#2D6A4F] opacity-30" />
                </div>
                <p className="text-sm font-medium text-gray-600">No activities logged yet</p>
                <p className="text-xs text-gray-400 mt-1">Log spraying, fertilising, irrigation and more</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-3 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"
                  onClick={() => setOpen(true)}
                >
                  <Plus size={12} className="mr-2" /> Log First Activity
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-0">
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mt-0.5 flex-shrink-0">
                        {ACTIVITY_ICONS[activity.type]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-800">
                            {activity.description}
                          </p>
                          <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                            {activity.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-gray-400">{activity.date}</p>
                          {activity.product && (
                            <p className="text-xs text-gray-400">· {activity.product}</p>
                          )}
                          {activity.rate && (
                            <p className="text-xs text-gray-400">· {activity.rate}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors mt-1 opacity-0 group-hover:opacity-100"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="overview" className="mt-4">
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-base">Crop Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Crop Name</p>
                  <p className="text-sm font-medium text-gray-800">{crop.crop_name}</p>
                </div>
                {crop.variety && (
                  <div>
                    <p className="text-xs text-gray-400">Variety</p>
                    <p className="text-sm font-medium text-gray-800">{crop.variety}</p>
                  </div>
                )}
                {crop.field_name && (
                  <div>
                    <p className="text-xs text-gray-400">Field / Block</p>
                    <p className="text-sm font-medium text-gray-800">{crop.field_name}</p>
                  </div>
                )}
                {crop.season && (
                  <div>
                    <p className="text-xs text-gray-400">Season</p>
                    <p className="text-sm font-medium text-gray-800">{crop.season}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400">Planting Date</p>
                  <p className="text-sm font-medium text-gray-800">{crop.planting_date}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Expected Harvest</p>
                  <p className="text-sm font-medium text-gray-800">{crop.expected_harvest_date}</p>
                </div>
                {crop.area_planted_ha > 0 && (
                  <div>
                    <p className="text-xs text-gray-400">Area Planted</p>
                    <p className="text-sm font-medium text-gray-800">{crop.area_planted_ha} ha</p>
                  </div>
                )}
              </div>
              {crop.notes && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">Notes</p>
                  <p className="text-sm text-gray-600 mt-1">{crop.notes}</p>
                </div>
              )}
              <div className="pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                <Sparkles size={12} />
                <span>Created {new Date(crop.created_at).toLocaleDateString('en-ZA', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}