'use client'

import { useState } from 'react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
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
  const [activities, setActivities] = useState<Activity[]>([])
  const [open, setOpen] = useState(false)
  const [activityType, setActivityType] = useState<ActivityType>('Spraying')
  const [description, setDescription] = useState('')
  const [product, setProduct] = useState('')
  const [rate, setRate] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  function handleAddActivity() {
    if (!description || !date) return

    const newActivity: Activity = {
      id: crypto.randomUUID(),
      cropId: 'current',
      type: activityType,
      description,
      date,
      product,
      rate,
    }

    setActivities(prev => [newActivity, ...prev])
    setDescription('')
    setProduct('')
    setRate('')
    setDate(new Date().toISOString().split('T')[0])
    setOpen(false)
  }

  return (
    <div className="space-y-6">
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
              <DialogTrigger>
                <Button className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white">
                  <Plus size={16} className="mr-2" /> Log Activity
                </Button>
              </DialogTrigger>
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
                    disabled={!description || !date}
                  >
                    Save Activity
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
                    <div key={activity.id} className="flex items-start gap-4 px-6 py-4">
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