'use client'

import { useState, useEffect } from 'react' // 👈 ADD useEffect
import { ArrowLeft, Plus, Leaf, Droplets, Sprout, Eye, Scissors } from 'lucide-react'
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
import { createClient } from '@/lib/supabase/client' // 👈 ADD THIS
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
  // ===== STATE =====
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true) // 👈 ADD THIS
  const [error, setError] = useState<string | null>(null) // 👈 ADD THIS
  const [user, setUser] = useState<any>(null) // 👈 ADD THIS
  const [saving, setSaving] = useState(false) // 👈 ADD THIS
  
  // Form state
  const [open, setOpen] = useState(false)
  const [activityType, setActivityType] = useState<ActivityType>('Spraying')
  const [description, setDescription] = useState('')
  const [product, setProduct] = useState('')
  const [rate, setRate] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const supabase = createClient() // 👈 ADD THIS

  // ===== FETCH ACTIVITIES =====
  async function fetchActivities() {
    setLoading(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setUser(null)
        setActivities([])
        setLoading(false)
        return
      }
      
      setUser(user)

      // 👇 Fetch activities from database
      const { data, error } = await supabase
        .from('crop_activities') // 👈 Change this to your actual table name
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) throw new Error('Failed to fetch activities: ' + error.message)
      
      // 👇 Map database data to your Activity type
      const mappedActivities: Activity[] = (data || []).map(item => ({
        id: item.id,
        cropId: item.crop_id || 'current',
        type: item.activity_type as ActivityType,
        description: item.description,
        date: item.date,
        product: item.product || '',
        rate: item.rate || '',
      }))
      
      setActivities(mappedActivities)
      
    } catch (err) {
      console.error('Error fetching activities:', err)
      setError(err instanceof Error ? err.message : 'Failed to load activities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [])

  // ===== ADD ACTIVITY =====
  async function handleAddActivity() {
    if (!description || !date) return
    
    setSaving(true)
    setError(null)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to save activities')
        setSaving(false)
        return
      }

      // 👇 Save to database
      const { data, error } = await supabase
        .from('crop_activities') // 👈 Change this to your actual table name
        .insert([{
          crop_id: 'current', // 👈 Change this to the actual crop ID
          activity_type: activityType,
          description,
          product: product || null,
          rate: rate || null,
          date,
          user_id: user.id,
        }])
        .select()
        .single()

      if (error) throw new Error('Failed to save activity: ' + error.message)

      // 👇 Add to local state
      const newActivity: Activity = {
        id: data.id,
        cropId: data.crop_id || 'current',
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
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to delete activities')
        return
      }

      const { error } = await supabase
        .from('crop_activities')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw new Error('Failed to delete activity: ' + error.message)
      
      setActivities(prev => prev.filter(a => a.id !== id))
      
    } catch (err) {
      console.error('Error deleting activity:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete activity')
    }
  }

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#2D6A4F] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading activities...</p>
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

  // ===== ACTUAL PAGE =====
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/crops">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Crop Detail</h1>
          <p className="text-gray-500 text-sm">Activity log and overview</p>
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
          <div className="flex justify-between items-center">
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
            <Card className="shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Leaf size={36} className="mb-3 opacity-30" />
                <p className="text-sm">No activities logged yet</p>
                <p className="text-xs mt-1">Log spraying, fertilising, irrigation and more</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center mt-0.5 flex-shrink-0">
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
                      {/* 👇 ADD DELETE BUTTON */}
                      <button
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors mt-1"
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
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Crop Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Select a crop from the crops list to see its details here.
                This page will show full crop information once connected to the database.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}